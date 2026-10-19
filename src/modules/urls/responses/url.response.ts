import { ApiProperty } from '@nestjs/swagger';
import type { Url } from '@/generated/prisma/client';

export class UrlResponse {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: 'https://www.example.com/some/long/url' })
  url: string;

  @ApiProperty({ example: 'abc123' })
  shortCode: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-10-19T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time', example: '2026-10-19T12:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: Url): UrlResponse {
    return Object.assign(new UrlResponse(), {
      id: String(entity.id),
      url: entity.url,
      shortCode: entity.shortCode,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
