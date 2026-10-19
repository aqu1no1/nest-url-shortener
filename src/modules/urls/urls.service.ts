import { Injectable, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { MAX_SHORT_CODE_ATTEMPTS } from '@/common/constants/short-code.constants';
import { generateShortCode } from '@/common/utils/generate-short-code';
import type { Url } from '@/generated/prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';
import type { CreateUrlDto } from '@/modules/urls/dto/create-url.dto';
import type { UpdateUrlDto } from '@/modules/urls/dto/update-url.dto';
import { UrlStatsResponse } from '@/modules/urls/responses/url-stats.response';
import { UrlResponse } from '@/modules/urls/responses/url.response';

@Injectable()
export class UrlsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create({ dto }: { dto: CreateUrlDto }): Promise<UrlResponse> {
    for (let attempt = 1; attempt <= MAX_SHORT_CODE_ATTEMPTS; attempt++) {
      const [created] = await this.prisma.url.createManyAndReturn({
        data: { url: dto.url, shortCode: generateShortCode() },
        skipDuplicates: true,
      });

      if (created) {
        return UrlResponse.fromEntity(created);
      }
    }

    throw new Error('Não foi possível gerar um código curto único.');
  }

  async findByCode({ shortCode }: { shortCode: string }): Promise<UrlResponse> {
    const [url] = await this.prisma.$queryRaw<Url[]>`
      UPDATE urls
      SET access_count = access_count + 1
      WHERE short_code = ${shortCode}
      RETURNING
        id,
        url,
        short_code AS "shortCode",
        access_count AS "accessCount",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    if (!url) {
      throw this.notFound();
    }

    return UrlResponse.fromEntity(url);
  }

  async update({ shortCode, dto }: { shortCode: string; dto: UpdateUrlDto }): Promise<UrlResponse> {
    const [updated] = await this.prisma.url.updateManyAndReturn({
      where: { shortCode },
      data: { url: dto.url },
    });

    if (!updated) {
      throw this.notFound();
    }

    return UrlResponse.fromEntity(updated);
  }

  async remove({ shortCode }: { shortCode: string }): Promise<void> {
    const { count } = await this.prisma.url.deleteMany({ where: { shortCode } });

    if (count === 0) {
      throw this.notFound();
    }
  }

  async getStats({ shortCode }: { shortCode: string }): Promise<UrlStatsResponse> {
    const url = await this.prisma.url.findUnique({ where: { shortCode } });

    if (!url) {
      throw this.notFound();
    }

    return UrlStatsResponse.fromEntity(url);
  }

  private notFound(): NotFoundException {
    return new NotFoundException(
      this.i18n.t('errors.NOT_FOUND', { args: { entity: this.i18n.t('entities.URL') } }),
    );
  }
}
