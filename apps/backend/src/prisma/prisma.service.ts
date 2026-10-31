import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const rawUrl = process.env.DATABASE_URL;
    let formattedUrl = rawUrl;
    if (rawUrl) {
      try {
        const parsed = new URL(rawUrl);
        if (!parsed.searchParams.has('connection_limit')) {
          parsed.searchParams.set(
            'connection_limit',
            process.env.DATABASE_CONNECTION_LIMIT || '50',
          );
        }
        if (!parsed.searchParams.has('pool_timeout')) {
          parsed.searchParams.set(
            'pool_timeout',
            process.env.DATABASE_POOL_TIMEOUT || '30',
          );
        }
        formattedUrl = parsed.toString();
      } catch {
        formattedUrl = rawUrl;
      }
    }

    super({
      datasources: formattedUrl
        ? {
            db: {
              url: formattedUrl,
            },
          }
        : undefined,
      transactionOptions: {
        maxWait: 15000,
        timeout: 60000,
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
