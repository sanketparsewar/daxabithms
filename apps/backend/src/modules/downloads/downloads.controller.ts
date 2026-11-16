import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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

  // Redirect to the whitelisted GitHub asset. Let the visitor's browser fetch
  // the package so the API does not depend on server-side GitHub connectivity.
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get('go/:channel')
  async go(@Param('channel') channel: string, @Res() res: Response) {
    const localPackage = this.downloads.resolveLocalPackage(channel);
    if (localPackage) {
      await this.downloads.recordAndResolve(channel);
      return res.download(localPackage);
    }

    const url = await this.downloads.resolvePublishedChannel(channel);
    await this.downloads.recordAndResolve(channel);
    return res.redirect(302, url);
  }
}
