import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  BulkTableCreateDto,
  FloorDto,
  FloorUpdateDto,
  TableDto,
  TableLayoutUpdateDto,
  TableStatusDto,
  TableUpdateDto,
} from '@daxabithms/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

function isTableOverlapping(
  boxA: { posX: number; posY: number; width: number; height: number },
  boxB: { posX: number; posY: number; width: number; height: number },
  padding = 10,
): boolean {
  return !(
    boxA.posX + boxA.width + padding <= boxB.posX ||
    boxA.posX >= boxB.posX + boxB.width + padding ||
    boxA.posY + boxA.height + padding <= boxB.posY ||
    boxA.posY >= boxB.posY + boxB.height + padding
  );
}

function findNextSlot(
  occupied: Array<{
    posX: number;
    posY: number;
    width: number;
    height: number;
  }>,
  width = 80,
  height = 80,
  cols = 5,
  startX = 20,
  startY = 20,
  gap = 40,
): { posX: number; posY: number } {
  const stepX = width + gap;
  const stepY = height + gap;

  for (let slot = 0; slot < 500; slot++) {
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const candidate = {
      posX: startX + col * stepX,
      posY: startY + row * stepY,
      width,
      height,
    };
    const collides = occupied.some((t) => isTableOverlapping(candidate, t, 10));
    if (!collides) {
      return { posX: candidate.posX, posY: candidate.posY };
    }
  }

  const maxBottom = occupied.reduce(
    (max, t) => Math.max(max, t.posY + t.height),
    startY,
  );
  return { posX: startX, posY: maxBottom + gap };
}

@Injectable()
export class TablesService {
  private readonly floorsCache = new Map<
    string,
    { data: unknown; expiresAt: number }
  >();
  private readonly FLOORS_CACHE_TTL_MS = 10_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private invalidateFloorsCache(branchId: string) {
    this.floorsCache.delete(branchId);
  }

  async listFloors(branchId: string) {
    const now = Date.now();
    const cached = this.floorsCache.get(branchId);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const floors = await this.prisma.floor.findMany({
      where: { branchId },
      orderBy: { sortOrder: 'asc' },
      include: {
        tables: {
          orderBy: [{ posY: 'asc' }, { posX: 'asc' }],
          include: { assignedWaiter: { select: { id: true, name: true } } },
        },
      },
    });

    this.floorsCache.set(branchId, {
      data: floors,
      expiresAt: now + this.FLOORS_CACHE_TTL_MS,
    });

    return floors;
  }

  async createFloor(branchId: string, dto: FloorDto) {
    this.invalidateFloorsCache(branchId);
    return this.prisma.floor.create({ data: { ...dto, branchId } });
  }

  async updateFloor(branchId: string, id: string, dto: FloorUpdateDto) {
    await this.assertFloorInBranch(branchId, id);
    this.invalidateFloorsCache(branchId);
    return this.prisma.floor.update({ where: { id }, data: dto });
  }

  async createTable(branchId: string, dto: TableDto) {
    await this.assertFloorInBranch(branchId, dto.floorId);

    const existing = await this.prisma.table.findMany({
      where: { floorId: dto.floorId },
      select: { posX: true, posY: true, width: true, height: true },
    });

    let { posX, posY } = dto;
    const width = dto.width || 80;
    const height = dto.height || 80;

    const collides = existing.some((t) =>
      isTableOverlapping({ posX, posY, width, height }, t, 10),
    );

    if (collides || (posX === 0 && posY === 0)) {
      const free = findNextSlot(existing, width, height);
      posX = free.posX;
      posY = free.posY;
    }

    const table = await this.prisma.table.create({
      data: { ...dto, posX, posY },
    });
    this.invalidateFloorsCache(branchId);
    this.realtime.emitToBranch(branchId, 'table.updated', table);
    return table;
  }

  async createTables(branchId: string, dto: BulkTableCreateDto) {
    await this.assertFloorInBranch(branchId, dto.floorId);

    const numbers = dto.numbers.map((n) => n.trim()).filter(Boolean);
    const duplicatesInBatch = numbers.filter(
      (n, i) => numbers.indexOf(n) !== i,
    );
    if (duplicatesInBatch.length > 0) {
      throw new BadRequestException(
        `Table numbers must be unique: ${[...new Set(duplicatesInBatch)].join(', ')} ${duplicatesInBatch.length > 1 ? 'are' : 'is'} repeated.`,
      );
    }

    const existing = await this.prisma.table.findMany({
      where: { floorId: dto.floorId },
      select: {
        number: true,
        posX: true,
        posY: true,
        width: true,
        height: true,
      },
    });
    const clashes = existing
      .filter((t) => numbers.includes(t.number))
      .map((t) => t.number);
    if (clashes.length > 0) {
      throw new BadRequestException(
        `These table numbers already exist on this floor: ${clashes.join(', ')}. Choose different numbers.`,
      );
    }

    const occupied = existing.map((t) => ({
      posX: t.posX,
      posY: t.posY,
      width: t.width,
      height: t.height,
    }));

    const tablesData = numbers.map((number) => {
      const { posX, posY } = findNextSlot(occupied, 80, 80);
      occupied.push({ posX, posY, width: 80, height: 80 });
      return {
        floorId: dto.floorId,
        number,
        capacity: dto.capacity,
        shape: dto.shape,
        color: dto.color,
        posX,
        posY,
        width: 80,
        height: 80,
      };
    });

    const tables = await this.prisma.$transaction(
      tablesData.map((data) => this.prisma.table.create({ data })),
    );
    this.invalidateFloorsCache(branchId);
    tables.forEach((table) =>
      this.realtime.emitToBranch(branchId, 'table.updated', table),
    );
    return tables;
  }

  async updateTable(branchId: string, id: string, dto: TableUpdateDto) {
    await this.assertTableInBranch(branchId, id);
    const table = await this.prisma.table.update({ where: { id }, data: dto });
    this.invalidateFloorsCache(branchId);
    this.realtime.emitToBranch(branchId, 'table.updated', table);
    return table;
  }

  async updateTableLayout(branchId: string, updates: TableLayoutUpdateDto[]) {
    const owned = await this.prisma.table.findMany({
      where: { id: { in: updates.map((u) => u.id) }, floor: { branchId } },
      select: { id: true },
    });
    if (owned.length !== updates.length) {
      throw new BadRequestException(
        'One or more tables are invalid for this branch',
      );
    }

    const results = await this.prisma.$transaction(
      updates.map(({ id, ...rest }) =>
        this.prisma.table.update({ where: { id }, data: rest }),
      ),
    );
    this.invalidateFloorsCache(branchId);
    this.realtime.emitToBranch(branchId, 'table.layout.updated', results);
    return results;
  }

  async updateTableStatus(
    branchId: string,
    id: string,
    status: TableStatusDto,
    assignedWaiterId?: string,
  ) {
    await this.assertTableInBranch(branchId, id);
    // A table with an unpaid bill cannot be marked free/reserved/cleaning by
    // hand - that is how a live order ended up hidden behind an "Available"
    // tile. Pay or cancel the bill first (both release the table themselves).
    if (status !== 'OCCUPIED') {
      const open = await this.prisma.order.findFirst({
        where: { tableId: id, status: 'OPEN' },
        select: { orderNumber: true },
      });
      if (open) {
        throw new ConflictException(
          `This table has an open bill (#${open.orderNumber}) - pay or cancel it first`,
        );
      }
    }
    const table = await this.prisma.table.update({
      where: { id },
      data: {
        status,
        statusSince: new Date(),
        ...(assignedWaiterId ? { assignedWaiterId } : {}),
      },
    });
    this.invalidateFloorsCache(branchId);
    this.realtime.emitToBranch(branchId, 'table.updated', table);
    return table;
  }

  async deleteTable(branchId: string, id: string) {
    await this.assertTableInBranch(branchId, id);
    await this.prisma.table.delete({ where: { id } });
    this.invalidateFloorsCache(branchId);
    this.realtime.emitToBranch(branchId, 'table.deleted', { id });
    return { ok: true };
  }

  async rotateQrToken(branchId: string, id: string) {
    const table = await this.prisma.table.findFirst({
      where: { id, floor: { branchId } },
    });
    if (!table) throw new NotFoundException('Table not found');

    // opaque, unguessable token — not the table's own id, so a leaked QR
    // image can't be used to enumerate other tables' ids/data
    const qrToken = randomBytes(16).toString('hex');
    const updated = await this.prisma.table.update({
      where: { id },
      data: { qrToken },
    });
    this.invalidateFloorsCache(branchId);
    return updated;
  }

  private async assertFloorInBranch(branchId: string, floorId: string) {
    const floor = await this.prisma.floor.findFirst({
      where: { id: floorId, branchId },
    });
    if (!floor) throw new NotFoundException('Floor not found');
  }

  private async assertTableInBranch(branchId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, floor: { branchId } },
    });
    if (!table) throw new NotFoundException('Table not found');
  }

  /** Open guest requests (call waiter / bring bill) for a branch. */
  listOpenRequests(branchId: string) {
    return this.prisma.tableRequest.findMany({
      where: { branchId, resolvedAt: null },
      include: { table: { select: { id: true, number: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async resolveRequest(branchId: string, id: string) {
    const request = await this.prisma.tableRequest.findFirst({
      where: { id, branchId },
    });
    if (!request) throw new NotFoundException('Request not found');
    const updated = await this.prisma.tableRequest.update({
      where: { id },
      data: { resolvedAt: new Date() },
    });
    this.realtime.emitToBranch(branchId, 'table.request', { id });
    return updated;
  }
}
