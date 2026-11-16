import {
  Controller,
  Get,
  Param,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Response } from 'express';
import { DownloadsService } from './downloads.service';

// Deliberately unauthenticated and public — these are the marketing site's
// "Download" / "Get started" buttons. No @Auth() here on purpose.
@ApiTags('downloads')
@Controller('v1/downloads')
export class DownloadsController {
  constructor(private readonly downloads: DownloadsService) {}

  // A public, honest counter — never pre-seeded, only ever incremented by
  // a real click through /go/:channel below. See docs/COMPLIANCE-INDIA.md
  // for why this deliberately avoids the "fake urgency / fabricated social
  // proof" dark pattern the CCPA's 2023 guidelines prohibit.
  @Get('stats')
  stats() {
    return this.downloads.stats();
  }

  // Fetch the whitelisted release asset on the server so the public website
  // keeps its own URL and does not send visitors to an external release page.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('go/:channel')
  async go(@Param('channel') channel: string, @Res() res: Response) {
    const url = this.downloads.resolveChannel(channel);
    let upstream: globalThis.Response;
    try {
      upstream = await fetch(url);
    } catch {
      throw new ServiceUnavailableException(
        'The desktop download is temporarily unavailable.',
      );
    }

    if (!upstream.ok || !upstream.body) {
      throw new ServiceUnavailableException(
        'The desktop download is temporarily unavailable.',
      );
    }

    await this.downloads.recordAndResolve(channel);
    const filename =
      new URL(url).pathname.split('/').at(-1) ?? 'daxabit-desktop-package';
    res.status(200);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    try {
      await pipeline(Readable.fromWeb(upstream.body as never), res);
    } catch (error) {
      if (!res.destroyed) res.destroy(error as Error);
    }
  }
}
