import { ApiProperty } from '@nestjs/swagger';
import type { Url } from '@/generated/prisma/client';

export class UrlResponseDto {
  @ApiProperty({ format: 'uuid', example: '019a01b2-3c4d-7e5f-8a9b-0c1d2e3f4a5b' })
  id: string;

  @ApiProperty({ example: 'https://www.example.com/some/long/url' })
  url: string;

  @ApiProperty({ example: 'abc123' })
  shortCode: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-10-19T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-10-19T12:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: Url): UrlResponseDto {
    return Object.assign(new UrlResponseDto(), {
      id: entity.id,
      url: entity.url,
      shortCode: entity.shortCode,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
