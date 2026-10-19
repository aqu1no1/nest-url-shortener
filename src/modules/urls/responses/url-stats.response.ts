import { ApiProperty } from '@nestjs/swagger';
import type { Url } from '@/generated/prisma/client';
import { UrlResponse } from '@/modules/urls/responses/url.response';

export class UrlStatsResponse extends UrlResponse {
  @ApiProperty({ example: 10 })
  accessCount: number;

  static override fromEntity(entity: Url): UrlStatsResponse {
    return Object.assign(new UrlStatsResponse(), UrlResponse.fromEntity(entity), {
      accessCount: entity.accessCount,
    });
  }
}
