import type { PrismaClient } from '@/generated/prisma/client';
import { assertTestDatabase } from '../setup/test-database.mjs';

export async function truncateAllTables(prisma: PrismaClient): Promise<void> {
  assertTestDatabase(process.env.DATABASE_URL);

  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}
