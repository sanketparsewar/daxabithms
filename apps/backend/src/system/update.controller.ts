import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type {
  ActiveBillingStatus,
  ClientCompatibilityResponse,
  ServerVersionInfo,
  UpdateLogEntry,
  UpdateStatus,
} from '@daxabithms/types';
import { Auth } from '../common/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { SessionUser } from '@daxabithms/types';
import { UpdateService, type VersionInfo } from './update.service';

@ApiTags('system')
@Controller('v1/system')
export class UpdateController {
  constructor(private readonly updateService: UpdateService) {}

  /**
   * Public system version information for clients and administrators.
   */
  @Get('version')
  version(): ServerVersionInfo {
    return this.updateService.getVersionInfo();
  }

  /**
   * Public client-server version compatibility check.
   * Desktop, mobile, and web terminals call this to ensure their client version
   * meets server compatibility standards before opening POS / cashier screens.
   */
  @Get('compatibility')
  compatibility(
    @Query('client') client = 'DESKTOP',
    @Query('version') version = '1.0.0',
  ): ClientCompatibilityResponse {
    return this.updateService.getCompatibility(client, version);
  }

  /**
   * Pre-update safety check: verifies whether active billing or open orders exist.
   */
  @Auth('system.update')
  @Get('update/safety')
  safetyCheck(): Promise<ActiveBillingStatus> {
    return this.updateService.checkActiveBilling();
  }

  @Auth('system.update')
  @Get('update/check')
  check(): Promise<VersionInfo> {
    return this.updateService.checkForUpdate();
  }

  @Auth('system.update')
  @Get('update/progress')
  progress(): Promise<UpdateStatus> {
    return this.updateService.getProgress();
  }

  @Auth('system.update')
  @Post('update/apply')
  apply(
    @CurrentUser() user: SessionUser,
    @Body() body: { force?: boolean } = {},
  ) {
    return this.updateService.applyUpdate({
      force: body.force,
      userId: user.id,
    });
  }

  @Auth('system.update')
  @Get('update/logs')
  logs(): Promise<UpdateLogEntry[]> {
    return this.updateService.getUpdateLogs();
  }
}
