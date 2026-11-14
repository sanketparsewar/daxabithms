import { compressionMiddleware } from './compression.middleware';
import type { Request, Response } from 'express';
import { gunzipSync } from 'node:zlib';

describe('compressionMiddleware', () => {
  it('should skip compression if accept-encoding is missing', () => {
    const req = { headers: {}, method: 'GET' } as Request;
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };
    const res = { send: jest.fn() } as unknown as Response;

    compressionMiddleware(req, res, next);
    expect(nextCalled).toBe(true);
  });

  it('should compress JSON payloads >= 1KB with gzip', () => {
    const req = {
      headers: { 'accept-encoding': 'gzip, deflate' },
      method: 'GET',
    } as unknown as Request;

    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    let sentBody: unknown = null;

    const res = {
      getHeader: (k: string) => headers[k.toLowerCase()],
      setHeader: (k: string, v: string) => {
        headers[k.toLowerCase()] = v;
      },
      removeHeader: (k: string) => {
        delete headers[k.toLowerCase()];
      },
      headersSent: false,
      send: (b: unknown) => {
        sentBody = b;
        return res;
      },
    } as unknown as Response;

    let nextCalled = false;
    compressionMiddleware(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);

    const largePayload = JSON.stringify({
      items: Array(100).fill({ id: 'item-1', name: 'Large Menu Item' }),
    });
    res.send(largePayload);

    expect(headers['content-encoding']).toBe('gzip');
    expect(Buffer.isBuffer(sentBody)).toBe(true);
    const decompressed = gunzipSync(sentBody as Buffer).toString('utf8');
    expect(decompressed).toBe(largePayload);
  });

  it('should not compress payloads < 1KB', () => {
    const req = {
      headers: { 'accept-encoding': 'gzip, deflate' },
      method: 'GET',
    } as unknown as Request;

    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };
    let sentBody: unknown = null;

    const res = {
      getHeader: (k: string) => headers[k.toLowerCase()],
      setHeader: (k: string, v: string) => {
        headers[k.toLowerCase()] = v;
      },
      removeHeader: jest.fn(),
      headersSent: false,
      send: (b: unknown) => {
        sentBody = b;
        return res;
      },
    } as unknown as Response;

    compressionMiddleware(req, res, () => {});
    const smallPayload = JSON.stringify({ ok: true });
    res.send(smallPayload);

    expect(headers['content-encoding']).toBeUndefined();
    expect(sentBody).toBe(smallPayload);
  });
});

