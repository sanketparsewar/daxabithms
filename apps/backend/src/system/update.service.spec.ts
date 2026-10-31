import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BackupService } from '../backup/backup.service';
import { PrismaService } from '../prisma/prisma.service';
import { isNewer, parseSemver, UpdateService } from './update.service';

describe('UpdateService & Semantic Version Management', () => {
  let service: UpdateService;
  let prisma: {
    order: { count: jest.Mock };
    table: { count: jest.Mock };
  };
  let backupService: {
    createPreUpdateBackup: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      order: { count: jest.fn() },
      table: { count: jest.fn() },
    };

    backupService = {
      createPreUpdateBackup: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateService,
        { provide: PrismaService, useValue: prisma },
        { provide: BackupService, useValue: backupService },
      ],
    }).compile();

    service = module.get<UpdateService>(UpdateService);
    process.env.APP_VERSION = '1.5.0';
    process.env.MIN_DESKTOP_VERSION = '1.0.0';
  });

  describe('SemVer parsing and comparison', () => {
    it('correctly parses semver strings with or without v prefix', () => {
      expect(parseSemver('1.2.3')).toEqual([1, 2, 3]);
      expect(parseSemver('v1.5.0')).toEqual([1, 5, 0]);
      expect(parseSemver('2.0')).toEqual([2, 0, 0]);
      expect(parseSemver('v0.9.8')).toEqual([0, 9, 8]);
    });

    it('correctly compares semantic versions using isNewer', () => {
      expect(isNewer('1.5.1', '1.5.0')).toBe(true);
      expect(isNewer('2.0.0', '1.9.9')).toBe(true);
      expect(isNewer('1.5.0', '1.5.0')).toBe(false);
      expect(isNewer('1.4.9', '1.5.0')).toBe(false);
      expect(isNewer('1.0.0', '0.9.5')).toBe(true);
    });
  });

  describe('Server Version Information', () => {
    it('returns server version and minimum client requirements', () => {
      const info = service.getVersionInfo();
      expect(info.serverVersion).toBe('1.5.0');
      expect(info.minDesktopVersion).toBe('1.0.0');
      expect(info.databaseSchemaVersion).toBeDefined();
      expect(info.environment).toBeDefined();
    });
  });

  describe('Client Compatibility Gating', () => {
    it('allows compatible desktop client version', () => {
      const result = service.getCompatibility('DESKTOP', '1.0.5');
      expect(result.compatible).toBe(true);
      expect(result.isMandatoryUpgrade).toBe(false);
      expect(result.clientVersion).toBe('1.0.5');
      expect(result.serverVersion).toBe('1.5.0');
    });

    it('blocks incompatible/outdated desktop client version', () => {
      const result = service.getCompatibility('DESKTOP', '0.9.0');
      expect(result.compatible).toBe(false);
      expect(result.isMandatoryUpgrade).toBe(true);
      expect(result.message).toContain('Incompatible DESKTOP client');
      expect(result.minRequiredVersion).toBe('1.0.0');
    });
  });

  describe('Active Billing Safety Checks', () => {
    it('reports safeToUpdate = true when no orders or tables are active', async () => {
      prisma.order.count.mockResolvedValueOnce(0); // open orders
      prisma.order.count.mockResolvedValueOnce(0); // recent orders
      prisma.table.count.mockResolvedValueOnce(0); // occupied tables

      const safety = await service.checkActiveBilling();
      expect(safety.safeToUpdate).toBe(true);
      expect(safety.activeOrdersCount).toBe(0);
      expect(safety.warning).toBeUndefined();
    });

    it('reports safeToUpdate = false with warning when active orders exist', async () => {
      prisma.order.count.mockResolvedValueOnce(4); // 4 open orders
      prisma.order.count.mockResolvedValueOnce(2); // 2 recent orders
      prisma.table.count.mockResolvedValueOnce(3); // 3 occupied tables

      const safety = await service.checkActiveBilling();
      expect(safety.safeToUpdate).toBe(false);
      expect(safety.activeOrdersCount).toBe(4);
      expect(safety.unsettledTablesCount).toBe(3);
      expect(safety.warning).toContain(
        'Active restaurant operations in progress',
      );
    });
  });

  describe('Safe Pre-Update Backup & Application', () => {
    it('rejects update if active billing is in progress and force is false', async () => {
      prisma.order.count.mockResolvedValueOnce(2);
      prisma.order.count.mockResolvedValueOnce(1);
      prisma.table.count.mockResolvedValueOnce(1);

      await expect(service.applyUpdate({ force: false })).rejects.toThrow(
        ConflictException,
      );
      expect(backupService.createPreUpdateBackup).not.toHaveBeenCalled();
    });

    it('creates pre-update database backup and logs entry when update proceeds', async () => {
      prisma.order.count.mockResolvedValueOnce(0);
      prisma.order.count.mockResolvedValueOnce(0);
      prisma.table.count.mockResolvedValueOnce(0);

      backupService.createPreUpdateBackup.mockResolvedValueOnce({
        backupId: 'backup_test_123',
        localDumpPath: 'data/backups/pre-update/pre-update-v1.5.0.dump',
        sha256: 'a1b2c3d4e5f6',
        sizeBytes: 1048576,
      });

      const res = await service.applyUpdate();
      expect(res.status).toBe('update started');
      expect(res.preUpdateBackupId).toBe('backup_test_123');
      expect(backupService.createPreUpdateBackup).toHaveBeenCalled();

      const logs = await service.getUpdateLogs();
      expect(logs.length).toBeGreaterThan(0);
      const latest = logs[logs.length - 1];
      expect(latest.status).toBe('SUCCESS');
    });
  });
});
