import { ApiProperty } from '@nestjs/swagger';
import type { Url } from '@/generated/prisma/client';
import { UrlResponseDto } from '@/modules/urls/dto/url-response.dto';

export class UrlStatsResponseDto extends UrlResponseDto {
  @ApiProperty({ example: 10 })
  accessCount: number;

  static override fromEntity(entity: Url): UrlStatsResponseDto {
    return Object.assign(new UrlStatsResponseDto(), UrlResponseDto.fromEntity(entity), {
      accessCount: entity.accessCount,
    });
  }
}
