/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BackupService } from './backup.service';
import type { SessionUser } from '@daxabithms/types';

describe('BackupService', () => {
  let service: BackupService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockNotifications: any;

  const ownerUser: SessionUser = {
    id: 'user-owner',
    restaurantId: 'rest-1',
    name: 'Owner Alice',
    roleId: 'role-owner',
    roleName: 'OWNER',
    permissions: ['backup.manage'],
  };

  const staffUser: SessionUser = {
    id: 'user-waiter',
    restaurantId: 'rest-1',
    name: 'Waiter Bob',
    roleId: 'role-waiter',
    roleName: 'WAITER',
    permissions: ['backup.manage'],
  };

  beforeEach(() => {
    mockPrisma = {
      backupConfig: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      backup: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'user-owner',
            branches: [{ branchId: 'branch-1' }],
          },
        ]),
      },
    };

    mockAudit = { record: jest.fn().mockResolvedValue(undefined) };
    mockNotifications = { notifyUser: jest.fn().mockResolvedValue(undefined) };

    service = new BackupService(mockPrisma, mockAudit, mockNotifications);
  });

  describe('Configuration & Status', () => {
    it('returns unconfigured status when no DB or env config exists', async () => {
      mockPrisma.backupConfig.findUnique.mockResolvedValue(null);
      delete process.env.S3_BACKUP_ENDPOINT;

      const status = await service.status();
      expect(status.configured).toBe(false);
      expect(status.endpoint).toBeNull();
      expect(status.accessKeyIdMasked).toBeNull();
    });

    it('masks S3 access key in status response', async () => {
      mockPrisma.backupConfig.findUnique.mockResolvedValue({
        id: 'singleton',
        endpoint: 'https://s3.example.com',
        bucket: 'my-bucket',
        accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
        secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        region: 'us-east-1',
        intervalDays: 3,
        retainCount: 5,
      });

      const status = await service.status();
      expect(status.configured).toBe(true);
      expect(status.accessKeyIdMasked).toBe('****MPLE');
      expect((status as any).secretAccessKey).toBeUndefined();
    });
  });

  describe('Restore Authorization & Safety Controls', () => {
    it('rejects restore requests from non-OWNER roles even with backup.manage permission', async () => {
      await expect(
        service.restore(staffUser, 'backup-1', { confirm: 'RESTORE' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects restore if confirm string is missing or not RESTORE', async () => {
      await expect(
        service.restore(ownerUser, 'backup-1', { confirm: 'yes' as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects restore if target backup is not found or not in VERIFIED status', async () => {
      mockPrisma.backupConfig.findUnique.mockResolvedValue({
        id: 'singleton',
        endpoint: 'https://s3.example.com',
        bucket: 'my-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        region: 'auto',
        intervalDays: 3,
        retainCount: 2,
      });

      // Target backup has FAILED status
      mockPrisma.backup.findFirst.mockResolvedValue(null);

      await expect(
        service.restore(ownerUser, 'backup-1', { confirm: 'RESTORE' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Retention Enforcement', () => {
    it('prunes verified backups older than retainCount', async () => {
      const config = {
        endpoint: 'https://s3.example.com',
        bucket: 'my-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        region: 'auto',
        intervalDays: 3,
        retainCount: 2,
        source: 'database' as const,
      };

      const backups = [
        {
          id: 'b1',
          status: 'VERIFIED',
          s3KeyDb: 'b1/db.dump',
          s3KeyUploads: null,
          verifiedAt: new Date(3000),
        },
        {
          id: 'b2',
          status: 'VERIFIED',
          s3KeyDb: 'b2/db.dump',
          s3KeyUploads: null,
          verifiedAt: new Date(2000),
        },
        {
          id: 'b3',
          status: 'VERIFIED',
          s3KeyDb: 'b3/db.dump',
          s3KeyUploads: null,
          verifiedAt: new Date(1000),
        },
      ];

      mockPrisma.backup.findMany.mockResolvedValue(backups);
      mockPrisma.backup.delete.mockResolvedValue({ id: 'b3' });

      // Mock s3Client send
      jest.spyOn<any, any>(service, 's3Client').mockReturnValue({
        send: jest.fn().mockResolvedValue({}),
      });

      await (service as any).enforceRetention(config);

      // b3 is beyond retainCount of 2 and must be deleted
      expect(mockPrisma.backup.delete).toHaveBeenCalledWith({
        where: { id: 'b3' },
      });
      expect(mockPrisma.backup.delete).not.toHaveBeenCalledWith({
        where: { id: 'b1' },
      });
      expect(mockPrisma.backup.delete).not.toHaveBeenCalledWith({
        where: { id: 'b2' },
      });
    });
  });

  describe('Automated Schedule Check', () => {
    it('triggers backup when due based on intervalDays', async () => {
      mockPrisma.backupConfig.findUnique.mockResolvedValue({
        id: 'singleton',
        endpoint: 'https://s3.example.com',
        bucket: 'my-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        region: 'auto',
        intervalDays: 1,
        retainCount: 2,
      });

      // Last backup verified 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      mockPrisma.backup.findFirst.mockResolvedValue({
        id: 'b-old',
        status: 'VERIFIED',
        verifiedAt: twoDaysAgo,
      });

      const runBackupSpy = jest
        .spyOn<any, any>(service, 'runBackup')
        .mockResolvedValue({});

      await service.checkSchedule();

      expect(runBackupSpy).toHaveBeenCalled();
    });

    it('skips backup when interval has not elapsed', async () => {
      mockPrisma.backupConfig.findUnique.mockResolvedValue({
        id: 'singleton',
        endpoint: 'https://s3.example.com',
        bucket: 'my-bucket',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        region: 'auto',
        intervalDays: 3,
        retainCount: 2,
      });

      // Last backup was 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      mockPrisma.backup.findFirst.mockResolvedValue({
        id: 'b-recent',
        status: 'VERIFIED',
        verifiedAt: oneHourAgo,
      });

      const runBackupSpy = jest.spyOn<any, any>(service, 'runBackup');

      await service.checkSchedule();

      expect(runBackupSpy).not.toHaveBeenCalled();
    });
  });
});
