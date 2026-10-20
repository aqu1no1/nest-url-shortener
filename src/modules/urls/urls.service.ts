import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { generateShortCode } from '@/common/utils/generate-short-code';
import type { Url } from '@/generated/prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';
import type { CreateUrlDto } from '@/modules/urls/dto/create-url.dto';
import type { UpdateUrlDto } from '@/modules/urls/dto/update-url.dto';
import { UrlResponseDto } from '@/modules/urls/dto/url-response.dto';
import { UrlStatsResponseDto } from '@/modules/urls/dto/url-stats-response.dto';

export const MAX_SHORT_CODE_ATTEMPTS = 5;

@Injectable()
export class UrlsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create({ dto }: { dto: CreateUrlDto }): Promise<UrlResponseDto> {
    for (let attempt = 1; attempt <= MAX_SHORT_CODE_ATTEMPTS; attempt++) {
      const [created] = await this.prisma.url.createManyAndReturn({
        data: { url: dto.url, shortCode: generateShortCode() },
        skipDuplicates: true,
      });

      if (created) {
        return UrlResponseDto.fromEntity(created);
      }
    }

    throw new InternalServerErrorException(
      this.i18n.t('errors.GENERATION_FAILED', {
        args: { entity: this.i18n.t('entities.SHORT_CODE') },
      }),
    );
  }

  async findByCode({ shortCode }: { shortCode: string }): Promise<UrlResponseDto> {
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
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: this.i18n.t('entities.URL') },
        }),
      );
    }

    return UrlResponseDto.fromEntity(url);
  }

  async update({
    shortCode,
    dto,
  }: {
    shortCode: string;
    dto: UpdateUrlDto;
  }): Promise<UrlResponseDto> {
    const [updated] = await this.prisma.url.updateManyAndReturn({
      where: { shortCode },
      data: { url: dto.url },
    });

    if (!updated) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: this.i18n.t('entities.URL') },
        }),
      );
    }

    return UrlResponseDto.fromEntity(updated);
  }

  async remove({ shortCode }: { shortCode: string }): Promise<void> {
    const { count } = await this.prisma.url.deleteMany({ where: { shortCode } });

    if (count === 0) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: this.i18n.t('entities.URL') },
        }),
      );
    }
  }

  async getStats({ shortCode }: { shortCode: string }): Promise<UrlStatsResponseDto> {
    const url = await this.prisma.url.findUnique({ where: { shortCode } });

    if (!url) {
      throw new NotFoundException(
        this.i18n.t('errors.NOT_FOUND', {
          args: { entity: this.i18n.t('entities.URL') },
        }),
      );
    }

    return UrlStatsResponseDto.fromEntity(url);
  }
}
