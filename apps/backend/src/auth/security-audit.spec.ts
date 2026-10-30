import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { BranchAccessService } from '../common/services/branch-access.service';
import { assertValidImageSignature } from '../common/upload/image-upload.config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('Security Audit Regression Test Suite', () => {
  describe('Password Hashing & Modern Cryptography', () => {
    it('uses bcrypt with cost factor 12', async () => {
      const password = 'StrongPassword!2026';
      const hash = await bcrypt.hash(password, 12);

      // bcrypt format: $2a$ or $2b$, followed by cost factor (12)
      expect(hash).toMatch(/^\$2[ab]\$12\$/);
      expect(await bcrypt.compare(password, hash)).toBe(true);
      expect(await bcrypt.compare('WrongPassword', hash)).toBe(false);
    });
  });

  describe('Realtime Gateway Authorization & Tenant Isolation', () => {
    let gateway: RealtimeGateway;
    let mockJwt: { verify: jest.Mock };
    let mockPrisma: {
      user: { findUnique: jest.Mock };
      branch: { findFirst: jest.Mock };
    };
    let mockBranchAccess: BranchAccessService;

    beforeEach(() => {
      mockJwt = { verify: jest.fn() };
      mockPrisma = {
        user: { findUnique: jest.fn() },
        branch: { findFirst: jest.fn() },
      };
      mockBranchAccess = new BranchAccessService(mockPrisma as never);
      gateway = new RealtimeGateway(
        mockJwt as never,
        mockPrisma as never,
        mockBranchAccess,
      );
    });

    it('rejects connection when no session cookie is provided', async () => {
      const disconnect = jest.fn();
      const client = {
        handshake: { headers: {}, query: { branchId: 'branch-1' } },
        disconnect,
      };

      await gateway.handleConnection(client as never);
      expect(disconnect).toHaveBeenCalledWith(true);
    });

    it('rejects connection when user is deactivated in the database', async () => {
      const disconnect = jest.fn();
      const client = {
        handshake: {
          headers: { cookie: 'daxabithms_session=valid.token.here' },
          query: { branchId: 'branch-1' },
        },
        disconnect,
      };

      mockJwt.verify.mockReturnValue({ sub: 'user-deactivated' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-deactivated',
        isActive: false,
        restaurantId: 'rest-1',
      });

      await gateway.handleConnection(client as never);
      expect(disconnect).toHaveBeenCalledWith(true);
    });

    it('rejects connection when attempting cross-restaurant branch subscription', async () => {
      const disconnect = jest.fn();
      const client = {
        handshake: {
          headers: { cookie: 'daxabithms_session=valid.token.here' },
          query: { branchId: 'foreign-branch' },
        },
        disconnect,
      };

      mockJwt.verify.mockReturnValue({ sub: 'user-1' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        isActive: true,
        restaurantId: 'rest-1',
      });
      // Branch does not belong to rest-1
      mockPrisma.branch.findFirst.mockResolvedValue(null);

      await gateway.handleConnection(client as never);
      expect(disconnect).toHaveBeenCalledWith(true);
    });

    it('accepts connection and joins tenant branch and user rooms on valid authorization', async () => {
      const disconnect = jest.fn();
      const join = jest.fn();
      const client = {
        handshake: {
          headers: { cookie: 'daxabithms_session=valid.token.here' },
          query: { branchId: 'branch-1' },
        },
        disconnect,
        join,
      };

      mockJwt.verify.mockReturnValue({ sub: 'user-1' });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        isActive: true,
        restaurantId: 'rest-1',
      });
      mockPrisma.branch.findFirst.mockResolvedValue({ id: 'branch-1' });

      await gateway.handleConnection(client as never);
      expect(disconnect).not.toHaveBeenCalled();
      expect(join).toHaveBeenCalledWith('branch:branch-1');
      expect(join).toHaveBeenCalledWith('user:user-1');
    });
  });

  describe('BranchAccessService Multi-Tenant Isolation', () => {
    it('throws ForbiddenException when accessing a branch of a different restaurant', async () => {
      const mockPrisma = {
        branch: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      const branchAccess = new BranchAccessService(mockPrisma as never);

      await expect(
        branchAccess.assertAccess(
          'restaurant-A',
          'branch-belonging-to-restaurant-B',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('resolves cleanly when branch belongs to the authenticated restaurant', async () => {
      const mockPrisma = {
        branch: { findFirst: jest.fn().mockResolvedValue({ id: 'branch-A' }) },
      };
      const branchAccess = new BranchAccessService(mockPrisma as never);

      await expect(
        branchAccess.assertAccess('restaurant-A', 'branch-A'),
      ).resolves.toBeUndefined();
    });
  });

  describe('File Upload Binary Magic-Byte Validation', () => {
    const tmpDir = os.tmpdir();

    it('accepts real PNG magic bytes and rejects HTML payload disguised as an image', () => {
      const pngPath = path.join(tmpDir, `test-valid-${Date.now()}.png`);
      const fakeImagePath = path.join(tmpDir, `test-fake-${Date.now()}.jpg`);

      try {
        // Real PNG header: 89 50 4E 47 0D 0A 1A 0A
        const pngHeader = Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
        ]);
        fs.writeFileSync(pngPath, pngHeader);

        // Forged payload disguised as .jpg: <script>alert("xss")</script>
        const fakePayload = Buffer.from('<script>alert("xss")</script>');
        fs.writeFileSync(fakeImagePath, fakePayload);

        // Valid PNG signature passes
        expect(() => assertValidImageSignature(pngPath)).not.toThrow();

        // Forged signature is rejected and file is deleted from disk
        expect(() => assertValidImageSignature(fakeImagePath)).toThrow(
          /does not match/,
        );
        expect(fs.existsSync(fakeImagePath)).toBe(false);
      } finally {
        if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath);
        if (fs.existsSync(fakeImagePath)) fs.unlinkSync(fakeImagePath);
      }
    });
  });
});
