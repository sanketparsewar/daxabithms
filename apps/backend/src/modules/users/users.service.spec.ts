/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let audit: any;

  beforeEach(() => {
    prisma = {
      role: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: 'role-1', restaurantId: 'rest-1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      branch: {
        count: jest.fn().mockResolvedValue(1),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(async ({ data, select }) => {
          return {
            id: 'user-1',
            name: data.name,
            email: data.email,
            phone: data.phone,
            roleId: data.roleId,
            isActive: true,
            createdAt: new Date(),
            pinHash: data.pinHash,
            role: { id: data.roleId, name: 'CASHIER', label: 'Cashier' },
            branches: [{ branch: { id: 'branch-1', name: 'Main' } }],
          };
        }),
        update: jest
          .fn()
          .mockImplementation(async ({ where, data, select }) => {
            return {
              id: where.id,
              name: data.name ?? 'Staff',
              email: data.email ?? 'staff@example.com',
              phone: data.phone,
              roleId: data.roleId ?? 'role-1',
              isActive: data.isActive ?? true,
              createdAt: new Date(),
              pinHash:
                data.pinHash !== undefined ? data.pinHash : 'existing-hash',
              role: { id: 'role-1', name: 'CASHIER', label: 'Cashier' },
              branches: [{ branch: { id: 'branch-1', name: 'Main' } }],
            };
          }),
        delete: jest.fn().mockResolvedValue({ id: 'user-1' }),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    audit = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    service = new UsersService(prisma as never, audit as never);
  });

  describe('create', () => {
    it('hashes password and pin when provided, returning hasPin: true without leaking hash', async () => {
      const res = await service.create('rest-1', 'actor-1', {
        name: 'Alice',
        email: 'alice@example.com',
        password: 'password123',
        pin: '1234',
        roleId: 'role-1',
        branchIds: ['branch-1'],
      });

      expect(res.hasPin).toBe(true);
      expect((res as any).pinHash).toBeUndefined();
      expect(prisma.user.create).toHaveBeenCalled();
      const callData = prisma.user.create.mock.calls[0][0].data;
      expect(callData.pinHash).toBeTruthy();
      expect(await bcrypt.compare('1234', callData.pinHash)).toBe(true);
      expect(await bcrypt.compare('password123', callData.passwordHash)).toBe(
        true,
      );
    });

    it('sets pinHash: null and returns hasPin: false when pin is omitted', async () => {
      const res = await service.create('rest-1', 'actor-1', {
        name: 'Bob',
        email: 'bob@example.com',
        password: 'password123',
        roleId: 'role-1',
        branchIds: ['branch-1'],
      });

      expect(res.hasPin).toBe(false);
      expect((res as any).pinHash).toBeUndefined();
      const callData = prisma.user.create.mock.calls[0][0].data;
      expect(callData.pinHash).toBeNull();
    });
  });

  describe('update', () => {
    it('hashes updated pin when provided', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        restaurantId: 'rest-1',
        role: { name: 'CASHIER' },
      });

      const res = await service.update('rest-1', 'actor-1', 'user-1', {
        pin: '5678',
      });

      expect(res.hasPin).toBe(true);
      expect((res as any).pinHash).toBeUndefined();
      const callData = prisma.user.update.mock.calls[0][0].data;
      expect(await bcrypt.compare('5678', callData.pinHash)).toBe(true);
    });

    it('clears pinHash to null when pin is null', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        restaurantId: 'rest-1',
        role: { name: 'CASHIER' },
      });

      prisma.user.update.mockResolvedValueOnce({
        id: 'user-1',
        name: 'Staff',
        pinHash: null,
        role: { id: 'role-1', name: 'CASHIER', label: 'Cashier' },
        branches: [],
      });

      const res = await service.update('rest-1', 'actor-1', 'user-1', {
        pin: null,
      });

      expect(res.hasPin).toBe(false);
      const callData = prisma.user.update.mock.calls[0][0].data;
      expect(callData.pinHash).toBeNull();
    });
  });

  describe('list', () => {
    it('maps pinHash to hasPin boolean and strips pinHash', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'u1', name: 'Alice', pinHash: 'hashed_val' },
        { id: 'u2', name: 'Bob', pinHash: null },
      ]);

      const list = await service.list('rest-1');
      expect(list).toEqual([
        { id: 'u1', name: 'Alice', hasPin: true },
        { id: 'u2', name: 'Bob', hasPin: false },
      ]);
    });
  });
});
