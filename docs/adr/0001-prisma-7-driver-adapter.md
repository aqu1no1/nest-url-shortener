# 0001. Prisma ORM 7 com driver adapter `pg` e client CJS

- **Status:** Aceita
- **Data:** 2026-10-19

## Contexto

O projeto usa Prisma com PostgreSQL (URL-10). Em outubro de 2026, a tag `latest` do pacote `prisma` no npm aponta para `8.0.0-rc`, um release candidate com fluxo contract-first (`contract.prisma`), diferente do desenho planejado (`schema.prisma` + Prisma Migrate). O NestJS do projeto compila para CommonJS.

## Decisão

- Usar o **Prisma ORM 7** estável (`prisma`, `@prisma/client` e `@prisma/adapter-pg` `^7.10`).
- Generator `prisma-client` com `moduleFormat = "cjs"` e saída em `src/generated/prisma` (não versionado; gerado no `postinstall`).
- Conexão via **driver adapter** `PrismaPg`, recebendo a `DATABASE_URL` do `ConfigService`.
- `prisma.config.ts` para o CLI, lendo `process.env.DATABASE_URL` (com `dotenv/config`) e sem depender do `ConfigModule`.
- `SELECT 1` no `onModuleInit` para falhar no startup quando o banco não está acessível.

## Consequências

- Versões estáveis e alinhadas com a documentação do projeto.
- Migrar para o Prisma 8 exigirá uma nova ADR e uma revisão do schema e do fluxo de migrations.
- Com `pnpm install`, os scripts de build de `prisma` e `@prisma/engines` precisam estar liberados em `pnpm-workspace.yaml` (`allowBuilds`).
