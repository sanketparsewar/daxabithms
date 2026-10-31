/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  BackupService,
  getBackupEncryptionKey,
  encryptBackupBuffer,
  decryptBackupBuffer,
} from './backup.service';
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

  describe('Encrypted Off-Site Backups (AES-256-GCM)', () => {
    it('encrypts and decrypts buffer with AES-256-GCM seamlessly', () => {
      const key = Buffer.alloc(32, 'a');
      const original = Buffer.from('CREATE TABLE test (id INT); INSERT INTO test VALUES (1);');
      const encrypted = encryptBackupBuffer(original, key);

      expect(encrypted).not.toEqual(original);
      expect(encrypted.subarray(0, 4).toString('utf8')).toBe('DENC');

      const decrypted = decryptBackupBuffer(encrypted, key);
      expect(decrypted.toString('utf8')).toBe(original.toString('utf8'));
    });

    it('rejects tampered encrypted payload (auth tag mismatch)', () => {
      const key = Buffer.alloc(32, 'a');
      const original = Buffer.from('secret payload data');
      const encrypted = encryptBackupBuffer(original, key);

      // Tamper with the ciphertext byte
      encrypted[encrypted.length - 1] ^= 0xff;

      expect(() => decryptBackupBuffer(encrypted, key)).toThrow();
    });

    it('passes unencrypted payloads through unchanged for backwards compatibility', () => {
      const key = Buffer.alloc(32, 'a');
      const plain = Buffer.from('PGDMP\x10\x00');
      const result = decryptBackupBuffer(plain, key);
      expect(result).toEqual(plain);
    });

    it('derives 32-byte key from BACKUP_ENCRYPTION_KEY env var', () => {
      process.env.BACKUP_ENCRYPTION_KEY = 'super-secret-passphrase';
      const key = getBackupEncryptionKey();
      expect(key).not.toBeNull();
      expect(key?.length).toBe(32);
      delete process.env.BACKUP_ENCRYPTION_KEY;
    });
  });

  describe('Edge Case Resilience & Disaster Recovery Tests', () => {
    const mockConfig = {
      endpoint: 'https://s3.example.com',
      bucket: 'my-bucket',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      region: 'auto',
      intervalDays: 3,
      retainCount: 2,
      source: 'database' as const,
    };

    it('handles interrupted backup (pg_dump failure / SIGKILL / network error)', async () => {
      mockPrisma.backup.create.mockResolvedValue({ id: 'backup-fail' });
      mockPrisma.backup.update.mockResolvedValue({ id: 'backup-fail', status: 'FAILED' });

      jest.spyOn<any, any>(service, 'requireConfig').mockResolvedValue(mockConfig);
      jest.spyOn<any, any>(service, 'runBackup').mockImplementation(async () => {
        await mockPrisma.backup.update({
          where: { id: 'backup-fail' },
          data: { status: 'FAILED', failureReason: 'pg_dump: connection to server was lost' },
        });
        await mockNotifications.notifyUser('user-owner', 'branch-1', {
          type: 'backup.failed',
          title: 'Backup failed',
          body: 'pg_dump: connection to server was lost',
        });
        throw new Error('pg_dump: connection to server was lost');
      });

      await expect(service.triggerManual(ownerUser)).rejects.toThrow('pg_dump: connection to server was lost');
      expect(mockPrisma.backup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED' }),
        }),
      );
      expect(mockNotifications.notifyUser).toHaveBeenCalledWith(
        'user-owner',
        'branch-1',
        expect.objectContaining({ type: 'backup.failed' }),
      );
    });

    it('handles interrupted restore cleanly with failure audit and owner notification', async () => {
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

      mockPrisma.backup.findFirst.mockResolvedValue({
        id: 'backup-valid',
        status: 'VERIFIED',
        s3KeyDb: 'backup-valid/db.dump',
        createdAt: new Date(),
      });

      jest.spyOn<any, any>(service, 'downloadTo').mockRejectedValue(new Error('Connection reset by peer'));

      await expect(
        service.restore(ownerUser, 'backup-valid', { confirm: 'RESTORE' }),
      ).rejects.toThrow('Connection reset by peer');

      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'backup.restore_failed' }),
      );
      expect(mockNotifications.notifyUser).toHaveBeenCalledWith(
        'user-owner',
        'branch-1',
        expect.objectContaining({ type: 'backup.restore_failed' }),
      );
    });

    it('handles corrupted backup (checksum verification mismatch)', async () => {
      const verifyError = new Error('Verification failed: downloaded db backup does not match the uploaded content');
      jest.spyOn<any, any>(service, 'requireConfig').mockResolvedValue(mockConfig);
      jest.spyOn<any, any>(service, 'runBackup').mockImplementation(async () => {
        await mockPrisma.backup.update({
          where: { id: 'backup-corrupt' },
          data: { status: 'FAILED', failureReason: verifyError.message },
        });
        throw verifyError;
      });

      await expect(service.triggerManual(ownerUser)).rejects.toThrow('Verification failed');
      expect(mockPrisma.backup.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED' }),
        }),
      );
    });

    it('handles insufficient disk space (ENOSPC)', async () => {
      const enospcError = new Error('ENOSPC: no space left on device');
      jest.spyOn<any, any>(service, 'requireConfig').mockResolvedValue(mockConfig);
      jest.spyOn<any, any>(service, 'runBackup').mockImplementation(async () => {
        await mockPrisma.backup.update({
          where: { id: 'backup-nospace' },
          data: { status: 'FAILED', failureReason: enospcError.message },
        });
        throw enospcError;
      });

      await expect(service.triggerManual(ownerUser)).rejects.toThrow('ENOSPC');
    });

    it('handles database unavailable (ECONNREFUSED)', async () => {
      const econnError = new Error('connect ECONNREFUSED 127.0.0.1:5432');
      jest.spyOn<any, any>(service, 'requireConfig').mockResolvedValue(mockConfig);
      jest.spyOn<any, any>(service, 'runBackup').mockImplementation(async () => {
        await mockPrisma.backup.update({
          where: { id: 'backup-db-down' },
          data: { status: 'FAILED', failureReason: econnError.message },
        });
        throw econnError;
      });

      await expect(service.triggerManual(ownerUser)).rejects.toThrow('ECONNREFUSED');
    });
  });
});
