import { Module } from '@nestjs/common';
import { NetworkController } from './network.controller';
import { UpdateController } from './update.controller';
import { UpdateService } from './update.service';

@Module({
  controllers: [UpdateController, NetworkController],
  providers: [UpdateService],
})
export class SystemModule {}
