import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { assertTestDatabase } from '@test/support/setup/test-database.mjs';

export function createTestPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  assertTestDatabase(url);

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}
