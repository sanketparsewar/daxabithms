import { Logger } from '@nestjs/common';

const logger = new Logger('CorsConfig');

/**
 * Returns true if the hostname is a loopback or local host address.
 */
function isLoopback(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

/**
 * Returns true if the hostname belongs to an RFC 1918 private IPv4 range.
 * - 10.0.0.0/8
 * - 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
 * - 192.168.0.0/16
 */
function isPrivateLan(hostname: string): boolean {
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    return true;
  }
  return false;
}

/**
 * Returns true if the hostname belongs to the Tailscale CGNAT subnet (100.64.0.0/10).
 * Range: 100.64.0.0 - 100.127.255.255
 */
function isTailscaleVpn(hostname: string): boolean {
  return /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(hostname);
}

/**
 * Returns true if the hostname is a local mDNS / Zeroconf name (e.g., pos-server.local).
 */
function isMdnsLocal(hostname: string): boolean {
  return hostname.endsWith('.local');
}

/**
 * Validates whether an incoming HTTP request or Socket.IO connection origin
 * is permitted by DaxabitHMS CORS security policy.
 *
 * Permitted origins include:
 * 1. Undefined / null origin (same-origin browser fetches, native webviews, CLI/curl, server-to-server)
 * 2. Any origin explicitly listed in CORS_ORIGIN (supports comma-separated origins)
 * 3. Wildcard `*` in CORS_ORIGIN
 * 4. Local loopback origins (localhost, 127.0.0.1, [::1])
 * 5. Private LAN subnets (RFC 1918: 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
 * 6. Tailscale / WireGuard CGNAT VPN addresses (100.64.0.0/10)
 * 7. mDNS local domain names (*.local)
 */
export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    // Missing origin header is typical for same-origin navigation, server-to-server,
    // native desktop WebView2, and curl/diagnostic requests. Always allow.
    return true;
  }

  const rawEnv = process.env.CORS_ORIGIN ?? '';
  const configuredOrigins = rawEnv
    .split(',')
    .map((o) => o.trim().toLowerCase())
    .filter(Boolean);

  const normalizedOrigin = origin.trim().toLowerCase();

  // 1. Check if wildcard is configured
  if (configuredOrigins.includes('*')) {
    return true;
  }

  // 2. Check against explicit CORS_ORIGIN entries
  if (configuredOrigins.includes(normalizedOrigin)) {
    return true;
  }

  // 3. Parse URL and check hostname characteristics
  try {
    const parsed = new URL(normalizedOrigin);
    const hostname = parsed.hostname;

    if (isLoopback(hostname)) {
      return true;
    }

    if (isPrivateLan(hostname)) {
      return true;
    }

    if (isTailscaleVpn(hostname)) {
      return true;
    }

    if (isMdnsLocal(hostname)) {
      return true;
    }
  } catch {
    // If URL cannot be parsed, reject
    return false;
  }

  return false;
}

/**
 * Delegate callback for Express cors middleware and Socket.IO engine.io cors.
 */
export function corsOriginDelegate(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean | string) => void,
): void {
  if (isAllowedOrigin(origin)) {
    // Reflecting the valid origin with credentials
    callback(null, true);
  } else {
    logger.warn(`Blocked cross-origin request from untrusted origin: ${origin}`);
    callback(null, false);
  }
}

