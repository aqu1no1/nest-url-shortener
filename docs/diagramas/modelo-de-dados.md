# Modelo de dados

A única tabela **de negócio** do MVP é `urls` (além da técnica `_prisma_migrations`).

```mermaid
erDiagram
    urls {
        uuid id PK "UUIDv7"
        text url "URL original"
        varchar(12) short_code UK "gerado aleatoriamente"
        int access_count "default 0"
        timestamptz created_at "default now()"
        timestamptz updated_at "@updatedAt"
    }
```

| Campo Prisma/API | Coluna SQL     | Observação                                      |
| ---------------- | -------------- | ----------------------------------------------- |
| `id`             | `id`           | Chave primária UUIDv7 gerada pelo Prisma Client |
| `url`            | `url`          | URL original, `text`                            |
| `shortCode`      | `short_code`   | Único, gerado aleatoriamente                    |
| `accessCount`    | `access_count` | Começa em 0                                     |
| `createdAt`      | `created_at`   | Timestamp de criação                            |
| `updatedAt`      | `updated_at`   | Timestamp de atualização                        |

```prisma
model Url {
  id          String   @id @default(uuid(7)) @db.Uuid
  url         String   @db.Text
  shortCode   String   @unique @map("short_code") @db.VarChar(12)
  accessCount Int      @default(0) @map("access_count")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@map("urls")
}
```

## Migrations

- **Prisma Migrate** é o único mecanismo de migrations do repositório.
- Migration inicial: `prisma/migrations/20261019183145_create_urls_table/migration.sql` (tabela `urls`, `urls_pkey` e índice único `urls_short_code_key`).
- `20261020113749_use_uuid_v7_for_url_id`: troca `id` de `SERIAL` para `UUID`, preenchendo linhas existentes com UUIDv7 derivado de `created_at`.
- O UUIDv7 é gerado pelo Prisma Client (`@default(uuid(7))`), pois o PostgreSQL 17 não tem `uuidv7()` nativo; inserts via SQL cru precisam informar o `id`.
- Criar uma nova: `pnpm db:migrate --name <nome>`. Aplicar em outro banco: `pnpm db:migrate:deploy`.
- Não há `UP`/`DOWN` simétrico: para desfazer em ambientes compartilhados, criar uma migration corretiva.
- O incremento de `access_count` deve ser **atômico** (`{ increment: 1 }`).
