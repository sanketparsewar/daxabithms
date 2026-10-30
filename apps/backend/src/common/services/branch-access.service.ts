import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Phase 1 tenancy check: a branch belongs to exactly one restaurant, and a
// user belongs to exactly one restaurant — this confirms the branchId a
// request references actually belongs to the caller's restaurant. It does
// NOT yet enforce per-branch staff assignment (UserBranch is populated but
// not checked here); that's a deliberate Phase-later tightening once
// multi-branch staff scoping is actually needed, tracked in ROADMAP.md.
@Injectable()
export class BranchAccessService {
  private readonly verifiedCache = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  async assertAccess(restaurantId: string, branchId: string): Promise<void> {
    const key = `${restaurantId}:${branchId}`;
    const now = Date.now();
    const expiry = this.verifiedCache.get(key);
    if (expiry && expiry > now) {
      return;
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, restaurantId },
      select: { id: true },
    });
    if (!branch) {
      throw new ForbiddenException('Branch not found or not accessible');
    }
    this.verifiedCache.set(key, now + 60_000);
  }
}
