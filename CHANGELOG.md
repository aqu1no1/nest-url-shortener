# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota o [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- PostgreSQL de desenvolvimento via `docker-compose.yml`, configurado pelas variáveis `POSTGRES_*` do `.env`, e scripts `db:up` / `db:down`.
- Prisma ORM 7 com `@prisma/adapter-pg`, `prisma.config.ts`, `PrismaModule` e `PrismaService` (falha no startup sem banco).
- Tabela `urls` e primeira migration (`create_urls_table`).
- Scripts `prisma:generate`, `db:migrate`, `db:migrate:deploy`, `db:migrate:reset` e `db:studio`.
- PostgreSQL de testes isolado (`docker-compose.test.yml`), um banco por worker (1–4) com migrations, guarda contra banco que não é de teste, limpeza entre testes e scripts `db:test:up` / `db:test:prepare` / `db:test:down`.
- Testes de integração das migrations e da guarda do banco de testes.
- Runner `test:docker [1-4]` (+ `test:integration:docker` e `test:e2e:docker`): sobe o Compose de testes, prepara os bancos, roda o Vitest com N workers e faz teardown mesmo em falha ou sinal.
- GitHub Actions: `ci.yml` (qualidade + `test:docker 4`) e `release.yml` (manual).

## [0.1.0] - 2026-10-19

### Added

- Esqueleto NestJS com pnpm e TypeScript (alias `@/`).
- Configuração com `@nestjs/config`, `ConfigService` tipado e validação Joi.
- Swagger UI em `/docs` e OpenAPI JSON em `/docs/openapi.json`.
- `ValidationPipe` global e shutdown hooks.
- Oxlint e Oxfmt; configurações de VS Code e Zed.
- Estrutura de testes com Vitest + SWC: um `vitest.config.mts` com os projetos `unit`, `integration` e `e2e` e pastas `test/`.
- Tag `URLs` no OpenAPI.
- Collections Postman e Bruno com environment `local` (`baseUrl`, `shortCode`).
- Documentação em `docs/`.

[Unreleased]: https://github.com/aqu1no1/nest-url-shortener/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/aqu1no1/nest-url-shortener/releases/tag/v0.1.0
