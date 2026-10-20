-- AlterTable
ALTER TABLE "urls" DROP CONSTRAINT "urls_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID;

-- Backfill
UPDATE "urls"
SET "id" = encode(
  set_bit(
    set_bit(
      overlay(
        uuid_send(gen_random_uuid())
        PLACING substring(int8send(floor(extract(epoch FROM "created_at") * 1000)::bigint) FROM 3)
        FROM 1 FOR 6
      ),
      52, 1
    ),
    53, 1
  ),
  'hex'
)::uuid;

-- AlterTable
ALTER TABLE "urls" ALTER COLUMN "id" SET NOT NULL,
ADD CONSTRAINT "urls_pkey" PRIMARY KEY ("id");
