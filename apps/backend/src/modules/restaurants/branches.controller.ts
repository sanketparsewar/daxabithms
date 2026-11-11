import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UsePipes,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  createBranchSchema,
  branchSettingsSchema,
  type CreateBranchDto,
  type BranchSettingsDto,
  type SessionUser,
} from '@daxabithms/types';
import { AuditAction } from '../../audit/audit-action';
import { Auth } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PrismaService } from '../../prisma/prisma.service';

// Roles that run the whole restaurant see every branch of it; everyone else
// sees only the branches they were assigned to (UserBranch).
const ALL_BRANCH_ROLES = ['OWNER', 'ADMINISTRATOR'];

@ApiTags('branches')
@Controller('v1/branches')
export class BranchesController {
  constructor(private readonly prisma: PrismaService) {}

  @Auth()
  @Get()
  listBranches(@CurrentUser() user: SessionUser) {
    const sees = ALL_BRANCH_ROLES.includes(user.roleName)
      ? {}
      : { users: { some: { userId: user.id } } };
    return this.prisma.branch.findMany({
      where: { restaurantId: user.restaurantId, isActive: true, ...sees },
      orderBy: { name: 'asc' },
    });
  }

  @Auth()
  @Get(':id')
  async getBranch(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
  ) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, restaurantId: user.restaurantId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    if (!ALL_BRANCH_ROLES.includes(user.roleName)) {
      const assigned = await this.prisma.userBranch.findUnique({
        where: { userId_branchId: { userId: user.id, branchId: id } },
      });
      if (!assigned) {
        throw new ForbiddenException('No access to this branch');
      }
    }
    return branch;
  }

  @Auth('settings.manage')
  @AuditAction('branch.created', 'Branch')
  @Post()
  @UsePipes(new ZodValidationPipe(createBranchSchema))
  async createBranch(
    @CurrentUser() user: SessionUser,
    @Body() dto: CreateBranchDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({
        data: {
          restaurantId: user.restaurantId,
          name: dto.name,
          address: dto.address ?? null,
          phone: dto.phone ?? null,
          gstNumber: dto.gstNumber ?? null,
          country: dto.country ?? 'IN',
          taxRegime: dto.taxRegime ?? 'INDIA_GST',
          taxMode: dto.taxMode ?? 'INCLUSIVE',
          taxLabel: dto.taxLabel ?? null,
          taxId: dto.taxId ?? null,
        },
      });

      // Initialize default floor and default kitchen station so POS/tables/KDS work immediately
      await tx.floor.create({
        data: {
          branchId: branch.id,
          name: 'Main Floor',
        },
      });

      await tx.kitchenStation.create({
        data: {
          branchId: branch.id,
          name: 'Main Kitchen',
        },
      });

      // If creator is not an owner/admin, explicitly associate them with the new branch
      if (!ALL_BRANCH_ROLES.includes(user.roleName)) {
        await tx.userBranch.create({
          data: {
            userId: user.id,
            branchId: branch.id,
          },
        });
      }

      return branch;
    });
  }

  @Auth('settings.manage')
  @AuditAction('branch.updated', 'Branch')
  @Patch(':id')
  @UsePipes(new ZodValidationPipe(branchSettingsSchema))
  async updateBranch(
    @CurrentUser() user: SessionUser,
    @Param('id') id: string,
    @Body() dto: BranchSettingsDto,
  ) {
    const existing = await this.prisma.branch.findFirst({
      where: { id, restaurantId: user.restaurantId },
    });
    if (!existing) {
      throw new NotFoundException('Branch not found');
    }

    return this.prisma.branch.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.gstNumber !== undefined && { gstNumber: dto.gstNumber }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.taxRegime !== undefined && { taxRegime: dto.taxRegime }),
        ...(dto.taxMode !== undefined && { taxMode: dto.taxMode }),
        ...(dto.taxLabel !== undefined && { taxLabel: dto.taxLabel }),
        ...(dto.taxId !== undefined && { taxId: dto.taxId }),
        ...(dto.autoConfirmOrders !== undefined && {
          autoConfirmOrders: dto.autoConfirmOrders,
        }),
        ...(dto.autoConfirmReservations !== undefined && {
          autoConfirmReservations: dto.autoConfirmReservations,
        }),
        ...(dto.kioskDineInEnabled !== undefined && {
          kioskDineInEnabled: dto.kioskDineInEnabled,
        }),
        ...(dto.kioskTakeawayEnabled !== undefined && {
          kioskTakeawayEnabled: dto.kioskTakeawayEnabled,
        }),
        ...(dto.printerPaperWidthMm !== undefined && {
          printerPaperWidthMm: dto.printerPaperWidthMm,
        }),
        ...(dto.printerCodepage !== undefined && {
          printerCodepage: dto.printerCodepage,
        }),
        ...(dto.printerColumns !== undefined && {
          printerColumns: dto.printerColumns,
        }),
        ...(dto.printerConnection !== undefined && {
          printerConnection: dto.printerConnection,
        }),
        ...(dto.printerHost !== undefined && {
          printerHost: dto.printerHost,
        }),
        ...(dto.printerPort !== undefined && {
          printerPort: dto.printerPort,
        }),
      },
    });
  }
}
