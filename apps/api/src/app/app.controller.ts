import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  // Real health check for deploy scripts / monitoring — verifies the DB
  // connection actually works, not just that the process is up.
  @SkipThrottle()
  @Get('health')
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'connected' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'unreachable' });
    }
  }
}
