import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import os from 'node:os';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

export interface LanInterface {
  name: string;
  address: string;
  family: string;
  recommendedUrl: string;
}

export interface NetworkDiagnosticsResponse {
  hostname: string;
  platform: string;
  serverAddresses: LanInterface[];
  client: {
    ip: string;
    protocol: string;
    isSecure: boolean;
    hostHeader: string | undefined;
    xForwardedFor: string | string[] | undefined;
    xForwardedProto: string | string[] | undefined;
  };
  security: {
    databaseExposedToLan: boolean;
    directBackendPortExposed: boolean;
    cookieSecure: boolean;
  };
  lanInstructions: {
    recommendedPort: number;
    firewallRule: string;
    deviceAccessUrl: string;
  };
}

@ApiTags('system')
@Controller('v1/system')
export class NetworkController {
  @UseGuards(JwtAuthGuard)
  @Get('network-diagnostics')
  getNetworkDiagnostics(@Req() req: Request): NetworkDiagnosticsResponse {
    const interfaces = os.networkInterfaces();
    const serverAddresses: LanInterface[] = [];
    const proto =
      req.secure || req.headers['x-forwarded-proto'] === 'https'
        ? 'https'
        : 'http';
    const webPort = 1995;

    for (const [name, netList] of Object.entries(interfaces)) {
      if (!netList) continue;
      for (const net of netList) {
        // Skip loopback and IPv6 non-routable
        if (net.internal || net.family !== 'IPv4') continue;

        serverAddresses.push({
          name,
          address: net.address,
          family: net.family,
          recommendedUrl: `${proto}://${net.address}:${webPort}`,
        });
      }
    }

    const primaryLan =
      serverAddresses[0]?.recommendedUrl ?? `${proto}://localhost:${webPort}`;

    return {
      hostname: os.hostname(),
      platform: `${os.type()} ${os.release()}`,
      serverAddresses,
      client: {
        ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
        protocol: proto,
        isSecure: proto === 'https',
        hostHeader: req.headers.host,
        xForwardedFor: req.headers['x-forwarded-for'],
        xForwardedProto: req.headers['x-forwarded-proto'],
      },
      security: {
        databaseExposedToLan: false, // Database is strictly localhost / internal Docker network only
        directBackendPortExposed: false, // Backend is strictly accessed via Next.js proxy rewrite on port 1995
        cookieSecure: proto === 'https' || process.env.COOKIE_SECURE === 'true',
      },
      lanInstructions: {
        recommendedPort: webPort,
        firewallRule: 'Allow Inbound TCP Port 1995 (DaxabitHMS Web)',
        deviceAccessUrl: primaryLan,
      },
    };
  }
}
