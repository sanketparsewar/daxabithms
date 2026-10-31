import { Module } from '@nestjs/common';
import { BackupModule } from '../backup/backup.module';
import { NetworkController } from './network.controller';
import { UpdateController } from './update.controller';
import { UpdateService } from './update.service';

@Module({
  imports: [BackupModule],
  controllers: [UpdateController, NetworkController],
  providers: [UpdateService],
  exports: [UpdateService],
})
export class SystemModule {}
