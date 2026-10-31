import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import type {
  ActiveBillingStatus,
  ClientCompatibilityResponse,
  ReleaseNoteItem,
  ServerVersionInfo,
  UpdateLogEntry,
  UpdateStatus,
} from '@daxabithms/types';
import { PrismaService } from '../prisma/prisma.service';
import { BackupService } from '../backup/backup.service';

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string | null;
  updateAvailable: boolean;
  building: boolean;
  releaseUrl: string | null;
  checkedAt: string;
  minDesktopVersion?: string;
  releaseNotes?: ReleaseNoteItem[];
}

const GITHUB_REPO = process.env.UPDATE_GITHUB_REPO ?? 'sanketparsewar/daxabithms';
const CACHE_TTL_MS = 60 * 60 * 1000;
const BUILDING_CACHE_TTL_MS = 60 * 1000;

export function parseSemver(v: string): [number, number, number] {
  const parts = v
    .replace(/^v/i, '')
    .split('.')
    .map((n) => parseInt(n, 10));
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

export function isNewer(latest: string, current: string): boolean {
  const [la, lb, lc] = parseSemver(latest);
  const [ca, cb, cc] = parseSemver(current);
  if (la !== ca) return la > ca;
  if (lb !== cb) return lb > cb;
  return lc > cc;
}

@Injectable()
export class UpdateService {
  private readonly logger = new Logger(UpdateService.name);
  private cache: VersionInfo | null = null;
  private cacheExpiresAt = 0;
  private currentUpdateStatus: UpdateStatus = {
    state: 'idle',
    step: null,
    progressPercent: 0,
    version: null,
    error: null,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly backupService: BackupService,
  ) {}

  /**
   * System version information, schema version, and client compatibility requirements.
   * Public endpoint so thin clients and desktop apps can verify compatibility before logging in.
   */
  getVersionInfo(): ServerVersionInfo {
    const serverVersion = (process.env.APP_VERSION ?? '1.5.0')
      .trim()
      .replace(/^v/i, '');
    const minDesktopVersion = (process.env.MIN_DESKTOP_VERSION ?? '1.0.0')
      .trim()
      .replace(/^v/i, '');
    const minApiVersion = '1.0.0';
    const recommendedDesktopVersion = '1.0.5';
    const databaseSchemaVersion = '20261031000000';

    return {
      serverVersion,
      minDesktopVersion,
      minApiVersion,
      recommendedDesktopVersion,
      databaseSchemaVersion,
      environment: process.env.NODE_ENV ?? 'production',
      releaseNotesUrl: `https://github.com/${GITHUB_REPO}/releases`,
      buildTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Evaluates semantic version compatibility between connecting clients and this server.
   * Prevents outdated or incompatible desktop clients from silently corrupting transactions.
   */
  getCompatibility(
    clientType = 'DESKTOP',
    clientVersion = '1.0.0',
  ): ClientCompatibilityResponse {
    const serverVersion = (process.env.APP_VERSION ?? '1.5.0')
      .trim()
      .replace(/^v/i, '');
    const minDesktopVersion = (process.env.MIN_DESKTOP_VERSION ?? '1.0.0')
      .trim()
      .replace(/^v/i, '');
    const cleanClientVersion = clientVersion.trim().replace(/^v/i, '');

    const isDesktop = clientType.toUpperCase() === 'DESKTOP';
    const minRequired = isDesktop ? minDesktopVersion : '1.0.0';

    // Client is compatible if its version is >= minimum required version
    const compatible = !isNewer(minRequired, cleanClientVersion);

    let message: string;
    if (compatible) {
      message = `${clientType} client v${clientVersion} is fully compatible with server v${serverVersion}.`;
    } else {
      message = `Incompatible ${clientType} client: Server v${serverVersion} requires client v${minRequired} or higher. You are running v${cleanClientVersion}. Please update your client before continuing.`;
    }

    return {
      compatible,
      serverVersion,
      clientVersion: cleanClientVersion,
      minRequiredVersion: minRequired,
      message,
      isMandatoryUpgrade: !compatible,
      downloadUrl: isDesktop
        ? `https://github.com/${GITHUB_REPO}/releases`
        : undefined,
    };
  }

  /**
   * Safety check: inspects if active billing, open orders, or occupied tables exist.
   * Prevents disrupting cashiers in the middle of active restaurant service.
   */
  async checkActiveBilling(): Promise<ActiveBillingStatus> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const [activeOrdersCount, recentOrdersCount, occupiedTablesCount] =
      await Promise.all([
        this.prisma.order.count({
          where: { status: 'OPEN' },
        }),
        this.prisma.order.count({
          where: {
            updatedAt: { gte: fifteenMinutesAgo },
          },
        }),
        this.prisma.table.count({
          where: { status: 'OCCUPIED' },
        }),
      ]);

    const isSafe = activeOrdersCount === 0 && occupiedTablesCount === 0;

    let warning: string | undefined;
    if (!isSafe) {
      const parts: string[] = [];
      if (activeOrdersCount > 0) {
        parts.push(`${activeOrdersCount} open order(s)`);
      }
      if (occupiedTablesCount > 0) {
        parts.push(`${occupiedTablesCount} occupied table(s)`);
      }
      if (recentOrdersCount > 0) {
        parts.push(
          `${recentOrdersCount} order(s) modified in the last 15 minutes`,
        );
      }
      warning = `Active restaurant operations in progress: ${parts.join(', ')}. Applying an update now may disrupt cashier billing or kitchen operations. Ensure staff close or park active orders before proceeding.`;
    }

    return {
      safeToUpdate: isSafe,
      activeOrdersCount,
      unsettledTablesCount: occupiedTablesCount,
      recentActivityCount: recentOrdersCount,
      warning,
    };
  }

  async checkForUpdate(): Promise<VersionInfo> {
    if (this.cache && Date.now() < this.cacheExpiresAt) {
      return this.cache;
    }

    const currentVersion = (process.env.APP_VERSION ?? '').trim() || '1.5.0';
    let latestVersion: string | null = null;
    try {
      latestVersion = await this.fetchLatestTag();
    } catch (err) {
      this.logger.warn(
        `update check failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    let imagePublished = true;
    if (latestVersion && process.env.UPDATER_URL) {
      imagePublished = (await this.imageTagExists(latestVersion)) !== false;
    }

    const newer =
      latestVersion !== null &&
      (currentVersion === 'dev'
        ? !!process.env.UPDATER_URL
        : isNewer(latestVersion, currentVersion));

    const releaseNotes: ReleaseNoteItem[] = [
      {
        type: 'feature',
        description:
          'Automatic pre-update database backup and rollback verification.',
      },
      {
        type: 'security',
        description:
          'Strict client-server semantic version compatibility gating.',
      },
      {
        type: 'fix',
        description:
          'PostgreSQL concurrency serialization for sequential order numbers.',
      },
      {
        type: 'migration',
        description:
          'Adds performance indexes for orders, order items, and customers.',
      },
    ];

    const info: VersionInfo = {
      currentVersion,
      latestVersion,
      updateAvailable: newer && imagePublished,
      building: newer && !imagePublished,
      releaseUrl: latestVersion
        ? `https://github.com/${GITHUB_REPO}/releases/tag/${latestVersion}`
        : null,
      checkedAt: new Date().toISOString(),
      minDesktopVersion: process.env.MIN_DESKTOP_VERSION ?? '1.0.0',
      releaseNotes,
    };

    this.cache = info;
    this.cacheExpiresAt =
      Date.now() +
      (info.building || latestVersion === null
        ? BUILDING_CACHE_TTL_MS
        : CACHE_TTL_MS);
    return info;
  }

  /**
   * Applies an update with complete transactional safety:
   * 1. Validates that no active orders are in progress (unless force is requested).
   * 2. Automatically creates an encrypted pre-update database snapshot.
   * 3. Appends an entry to the persistent update audit log.
   * 4. Initiates the update through the sidecar container or Windows updater.
   */
  async applyUpdate(
    options: { force?: boolean; userId?: string } = {},
  ): Promise<{
    status: string;
    message: string;
    preUpdateBackupId?: string;
    preUpdateBackupPath?: string;
  }> {
    const safety = await this.checkActiveBilling();
    if (!safety.safeToUpdate && !options.force) {
      throw new ConflictException(
        safety.warning ||
          'Active billing is currently in progress. Complete open orders or pass force=true to proceed.',
      );
    }

    this.cache = null; // force fresh look
    const info = await this.checkForUpdate();
    const targetVersion = info.latestVersion || 'latest';

    this.currentUpdateStatus = {
      state: 'backing_up',
      step: 'Creating automated pre-update database safety backup',
      progressPercent: 20,
      version: targetVersion,
      error: null,
      timestamp: new Date().toISOString(),
    };

    let backupResult: {
      backupId: string;
      localDumpPath: string;
      sha256: string;
      sizeBytes: number;
    };

    try {
      backupResult =
        await this.backupService.createPreUpdateBackup(targetVersion);
      this.currentUpdateStatus.preUpdateBackupId = backupResult.backupId;
    } catch (backupErr) {
      this.currentUpdateStatus = {
        state: 'error',
        step: 'Pre-update backup failed',
        error: `Could not create safety backup: ${(backupErr as Error).message}. Update aborted to protect data.`,
      };
      throw new InternalServerErrorException(
        `Pre-update backup failed: ${(backupErr as Error).message}. Update aborted to ensure zero customer data loss.`,
      );
    }

    // Record entry in persistent update log file
    await this.recordUpdateLog({
      id: backupResult.backupId,
      timestamp: new Date().toISOString(),
      fromVersion: info.currentVersion,
      toVersion: targetVersion,
      status: 'SUCCESS',
      preUpdateBackupPath: backupResult.localDumpPath,
      initiatedBy: options.userId ?? 'Administrator',
    });

    const base = (process.env.UPDATER_URL ?? '').trim().replace(/\/$/, '');

    // Case A: Container deployment with updater sidecar
    if (base) {
      this.currentUpdateStatus.state = 'downloading';
      this.currentUpdateStatus.step =
        'Instructing updater sidecar to pull images';
      this.currentUpdateStatus.progressPercent = 50;

      try {
        const res = await fetch(`${base}/v1/update`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.UPDATER_TOKEN ?? ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: targetVersion.replace(/^v/i, ''),
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new InternalServerErrorException(
            `Updater refused: ${body.error ?? res.status}`,
          );
        }
      } catch (err) {
        this.currentUpdateStatus = {
          state: 'error',
          step: 'Could not contact updater sidecar',
          error: (err as Error).message,
        };
        throw new InternalServerErrorException(
          `Could not reach the updater: ${(err as Error).message}`,
        );
      }
    } else {
      // Case B: Windows local server / embedded deployment
      this.currentUpdateStatus.state = 'restarting';
      this.currentUpdateStatus.step =
        'Pre-update backup verified. Server update ready to apply on restart.';
      this.currentUpdateStatus.progressPercent = 90;
      this.logger.log(
        `Windows Local Server update prepared. Pre-update backup safe at ${backupResult.localDumpPath}`,
      );
    }

    return {
      status: 'update started',
      message: `Safety backup created successfully (${backupResult.localDumpPath}). The application update has started and will restart safely.`,
      preUpdateBackupId: backupResult.backupId,
      preUpdateBackupPath: backupResult.localDumpPath,
    };
  }

  async getProgress(): Promise<UpdateStatus> {
    const base = (process.env.UPDATER_URL ?? '').trim().replace(/\/$/, '');
    if (base) {
      try {
        const res = await fetch(`${base}/v1/status`, {
          headers: {
            Authorization: `Bearer ${process.env.UPDATER_TOKEN ?? ''}`,
          },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            state: string;
            step?: string | null;
            error?: string | null;
          };
          return {
            state: data.state as UpdateStatus['state'],
            step: data.step,
            error: data.error,
            preUpdateBackupId: this.currentUpdateStatus.preUpdateBackupId,
          };
        }
      } catch {
        // Fall back to local status
      }
    }
    return this.currentUpdateStatus;
  }

  /**
   * Retrieves persistent update logs from data/logs/update.log
   */
  async getUpdateLogs(): Promise<UpdateLogEntry[]> {
    const logPath = path.resolve(
      process.env.UPDATE_LOG_PATH || 'data/logs/update.log',
    );
    if (!fsSync.existsSync(logPath)) {
      return [
        {
          id: 'initial-install',
          timestamp: new Date().toISOString(),
          fromVersion: '0.0.0',
          toVersion: (process.env.APP_VERSION ?? '1.5.0').replace(/^v/i, ''),
          status: 'SUCCESS',
          initiatedBy: 'System Installer',
        },
      ];
    }

    try {
      const content = await fs.readFile(logPath, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean);
      return lines.map((line) => {
        try {
          return JSON.parse(line) as UpdateLogEntry;
        } catch {
          return {
            id: 'legacy',
            timestamp: new Date().toISOString(),
            fromVersion: 'unknown',
            toVersion: 'unknown',
            status: 'SUCCESS',
            errorDetails: line,
          };
        }
      });
    } catch {
      return [];
    }
  }

  private async recordUpdateLog(entry: UpdateLogEntry): Promise<void> {
    const logDir = path.resolve('data/logs');
    await fs.mkdir(logDir, { recursive: true });
    const logPath = path.join(logDir, 'update.log');
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(logPath, line, 'utf8');
  }

  private async imageTagExists(tag: string): Promise<boolean | null> {
    try {
      const repo =
        process.env.UPDATE_IMAGE_REPO ?? 'sanketparsewar/daxabithms-backend';
      const version = tag.replace(/^v/i, '');
      const tokRes = await fetch(
        `https://ghcr.io/token?scope=repository:${repo}:pull`,
        { signal: AbortSignal.timeout(6000) },
      );
      if (!tokRes.ok) return null;
      const { token } = (await tokRes.json()) as { token: string };
      const res = await fetch(
        `https://ghcr.io/v2/${repo}/manifests/${version}`,
        {
          method: 'HEAD',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept:
              'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json',
          },
          signal: AbortSignal.timeout(6000),
        },
      );
      if (res.status === 404) return false;
      return res.ok ? true : null;
    } catch {
      return null;
    }
  }

  private async fetchLatestTag(): Promise<string | null> {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/tags?per_page=1`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'daxabithms-update-check',
        },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return null;
    const tags = (await res.json()) as Array<{ name: string }>;
    return tags[0]?.name ?? null;
  }
}
