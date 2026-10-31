import { NetworkController } from './network.controller';

describe('NetworkController', () => {
  let controller: NetworkController;

  beforeEach(() => {
    controller = new NetworkController();
  });

  it('returns valid network diagnostics and LAN URLs', () => {
    const mockReq = {
      ip: '192.168.1.45',
      secure: false,
      headers: {
        host: '192.168.1.100:1995',
        'x-forwarded-for': '192.168.1.45',
        'x-forwarded-proto': 'http',
      },
      socket: {
        remoteAddress: '192.168.1.45',
      },
    } as never;

    const res = controller.getNetworkDiagnostics(mockReq);

    expect(res).toBeDefined();
    expect(res.hostname).toBeDefined();
    expect(res.client.ip).toBe('192.168.1.45');
    expect(res.client.protocol).toBe('http');
    expect(res.client.isSecure).toBe(false);
    expect(res.security.databaseExposedToLan).toBe(false);
    expect(res.lanInstructions.recommendedPort).toBe(1995);
    expect(res.lanInstructions.firewallRule).toContain('1995');
    expect(Array.isArray(res.serverAddresses)).toBe(true);
  });

  it('detects secure HTTPS when x-forwarded-proto is https', () => {
    const mockReq = {
      ip: '203.0.113.195',
      secure: false,
      headers: {
        host: 'pos.myrestaurant.com',
        'x-forwarded-for': '203.0.113.195',
        'x-forwarded-proto': 'https',
      },
      socket: {
        remoteAddress: '127.0.0.1',
      },
    } as never;

    const res = controller.getNetworkDiagnostics(mockReq);

    expect(res.client.protocol).toBe('https');
    expect(res.client.isSecure).toBe(true);
    expect(res.security.cookieSecure).toBe(true);
  });
});

