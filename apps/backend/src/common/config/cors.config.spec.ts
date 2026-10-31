import { isAllowedOrigin, corsOriginDelegate } from './cors.config';

describe('CorsConfig', () => {
  const originalEnv = process.env.CORS_ORIGIN;

  afterEach(() => {
    process.env.CORS_ORIGIN = originalEnv;
  });

  describe('isAllowedOrigin', () => {
    it('allows undefined or empty origin (same-origin, native app, curl)', () => {
      expect(isAllowedOrigin(undefined)).toBe(true);
      expect(isAllowedOrigin('')).toBe(true);
    });

    it('allows loopback origins', () => {
      expect(isAllowedOrigin('http://localhost:1995')).toBe(true);
      expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
      expect(isAllowedOrigin('http://127.0.0.1:1995')).toBe(true);
      expect(isAllowedOrigin('http://[::1]:1995')).toBe(true);
    });

    it('allows RFC 1918 private LAN origins', () => {
      // 192.168.x.x
      expect(isAllowedOrigin('http://192.168.1.100:1995')).toBe(true);
      expect(isAllowedOrigin('http://192.168.0.25:1995')).toBe(true);

      // 10.x.x.x
      expect(isAllowedOrigin('http://10.0.0.5:1995')).toBe(true);
      expect(isAllowedOrigin('http://10.100.200.1:8080')).toBe(true);

      // 172.16.x.x - 172.31.x.x
      expect(isAllowedOrigin('http://172.16.0.1:1995')).toBe(true);
      expect(isAllowedOrigin('http://172.20.10.5:1995')).toBe(true);
      expect(isAllowedOrigin('http://172.31.255.254:1995')).toBe(true);
    });

    it('allows Tailscale / WireGuard CGNAT VPN origins (100.64.0.0/10)', () => {
      expect(isAllowedOrigin('http://100.85.20.5:1995')).toBe(true);
      expect(isAllowedOrigin('http://100.120.1.1:1995')).toBe(true);
    });

    it('allows mDNS Zeroconf local domains (*.local)', () => {
      expect(isAllowedOrigin('http://daxabit-server.local:1995')).toBe(true);
      expect(isAllowedOrigin('http://pos-terminal.local:3000')).toBe(true);
    });

    it('allows explicitly configured comma-separated origins', () => {
      process.env.CORS_ORIGIN =
        'https://pos.myrestaurant.com, https://admin.myrestaurant.com';
      expect(isAllowedOrigin('https://pos.myrestaurant.com')).toBe(true);
      expect(isAllowedOrigin('https://admin.myrestaurant.com')).toBe(true);
      expect(isAllowedOrigin('https://untrusted.other.com')).toBe(false);
    });

    it('allows any origin when CORS_ORIGIN is wildcard *', () => {
      process.env.CORS_ORIGIN = '*';
      expect(isAllowedOrigin('https://custom-pos-terminal.com')).toBe(true);
    });

    it('rejects untrusted external public origins by default', () => {
      delete process.env.CORS_ORIGIN;
      expect(isAllowedOrigin('https://evil-hacker.com')).toBe(false);
      expect(isAllowedOrigin('http://8.8.8.8:1995')).toBe(false);
      expect(isAllowedOrigin('not-a-valid-url')).toBe(false);
    });
  });

  describe('corsOriginDelegate', () => {
    it('calls callback with true for permitted origin', () => {
      const cb = jest.fn();
      corsOriginDelegate('http://192.168.1.100:1995', cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('calls callback with false for denied origin', () => {
      delete process.env.CORS_ORIGIN;
      const cb = jest.fn();
      corsOriginDelegate('https://malicious-website.com', cb);
      expect(cb).toHaveBeenCalledWith(null, false);
    });
  });
});

