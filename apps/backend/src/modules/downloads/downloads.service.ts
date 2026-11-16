import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaService } from '../../prisma/prisma.service';

// Fixed, server-side whitelist: the ONLY URLs this endpoint will ever
// redirect to. The client sends a channel key (an enum-like string, never a
// URL), so this can never become an open redirect — see the security
// hardening report's "unsafe URL handling / open redirects" check, which
// this is deliberately built to keep passing.
const DOWNLOAD_CHANNELS: Record<string, string> = {
  'windows-desktop':
    'https://github.com/sanketparsewar/daxabithms/releases/latest/download/DaxabitHMS-Setup.exe',
  'linux-deb-amd64':
    'https://github.com/sanketparsewar/daxabithms/releases/latest/download/daxabithms-latest-amd64.deb',
  'linux-deb-arm64':
    'https://github.com/sanketparsewar/daxabithms/releases/latest/download/daxabithms-latest-arm64.deb',
};

export type DownloadChannel = keyof typeof DOWNLOAD_CHANNELS;

type ReleaseAsset = {
  name: string;
  state: string;
  browser_download_url: string;
};

@Injectable()
export class DownloadsService {
  constructor(private readonly prisma: PrismaService) {}

  resolveChannel(channel: string): string {
    const url = DOWNLOAD_CHANNELS[channel];
    if (!url) throw new NotFoundException('Unknown download channel');
    return url;
  }

  resolveLocalPackage(channel: string): string | undefined {
    const architecture =
      channel === 'linux-deb-amd64'
        ? 'amd64'
        : channel === 'linux-deb-arm64'
          ? 'arm64'
          : undefined;
    if (!architecture) return undefined;

    const packagePath = resolve(
      __dirname,
      '../../../../../dist',
      `daxabithms-latest-${architecture}.deb`,
    );
    return existsSync(packagePath) ? packagePath : undefined;
  }

  async resolvePublishedChannel(channel: string): Promise<string> {
    const fallbackUrl = this.resolveChannel(channel);
    const expectedName = new URL(fallbackUrl).pathname.split('/').at(-1);
    const architecture =
      channel === 'linux-deb-amd64'
        ? 'amd64'
        : channel === 'linux-deb-arm64'
          ? 'arm64'
          : undefined;

    try {
      const response = await fetch(
        'https://api.github.com/repos/sanketparsewar/daxabithms/releases/latest',
        { headers: { Accept: 'application/vnd.github+json' } },
      );
      if (response.status === 404) {
        throw new ServiceUnavailableException(
          'No published desktop release is available yet.',
        );
      }
      if (!response.ok) return fallbackUrl;

      const release = (await response.json()) as { assets?: ReleaseAsset[] };
      const assets = release.assets ?? [];
      const asset =
        assets.find(
          (candidate) =>
            candidate.state === 'uploaded' &&
            candidate.name === expectedName &&
            this.isGitHubDownloadUrl(candidate.browser_download_url),
        ) ??
        (architecture
          ? assets.find(
              (candidate) =>
                candidate.state === 'uploaded' &&
                new RegExp(
                  `^daxabithms_[0-9][0-9A-Za-z.+~-]*_${architecture}\\.deb$`,
                ).test(candidate.name) &&
                this.isGitHubDownloadUrl(candidate.browser_download_url),
            )
          : undefined);

      if (!asset) {
        throw new ServiceUnavailableException(
          'No installer for this platform is attached to the latest release.',
        );
      }
      return asset.browser_download_url;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      return fallbackUrl;
    }
  }

  private isGitHubDownloadUrl(value: string): boolean {
    try {
      return new URL(value).hostname === 'github.com';
    } catch {
      return false;
    }
  }

  async recordAndResolve(channel: string): Promise<string> {
    const url = this.resolveChannel(channel);
    await this.prisma.downloadStat.upsert({
      where: { channel },
      create: { channel, count: 1 },
      update: { count: { increment: 1 } },
    });
    return url;
  }

  async stats(): Promise<{ channel: string; count: number }[]> {
    const rows = await this.prisma.downloadStat.findMany({
      orderBy: { channel: 'asc' },
    });
    // Always report every known channel, even ones with zero clicks yet —
    // an honest, complete picture rather than only rows that happen to
    // exist in the DB.
    const byChannel = new Map(rows.map((r) => [r.channel, r.count]));
    return Object.keys(DOWNLOAD_CHANNELS).map((channel) => ({
      channel,
      count: byChannel.get(channel) ?? 0,
    }));
  }
}
