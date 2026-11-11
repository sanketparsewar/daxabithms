import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { BranchesController } from './branches.controller';

@Module({
  imports: [AuditModule],
  controllers: [BranchesController],
})
export class RestaurantsModule {}
