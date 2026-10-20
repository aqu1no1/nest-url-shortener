import { Controller, Get, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { I18nService } from 'nestjs-i18n';
import { ApiProblemResponse } from '@/common/decorators/api-problem-response.decorator';
import { SkipResponseEnvelope } from '@/common/decorators/skip-response-envelope.decorator';
import type { HealthStatus } from '@/common/interfaces/health-status.interface';
import { PrismaService } from '@/modules/prisma/prisma.service';

export const DATABASE_CHECK_TIMEOUT_MS = 3000;

@ApiTags('Health')
@Controller('health')
@SkipResponseEnvelope()
@SkipThrottle()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verifica se a aplicação e o PostgreSQL estão disponíveis' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        database: { type: 'string', example: 'up' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiProblemResponse(HttpStatus.SERVICE_UNAVAILABLE, 'O banco de dados está indisponível.')
  async check(): Promise<HealthStatus> {
    try {
      await this.pingDatabase();
    } catch {
      throw new ServiceUnavailableException(this.i18n.t('errors.DATABASE_UNAVAILABLE'));
    }

    return { status: 'ok', database: 'up', timestamp: new Date().toISOString() };
  }

  private async pingDatabase(): Promise<void> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), DATABASE_CHECK_TIMEOUT_MS);
    });

    try {
      await Promise.race([this.prisma.$queryRaw`SELECT 1`, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
