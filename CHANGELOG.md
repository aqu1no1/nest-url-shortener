# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adota o [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added

- Esqueleto do `UrlsModule` (`UrlsController` em `/shorten` com a tag `URLs` e `UrlsService` com `PrismaService`), ainda sem endpoints.
- DTOs `CreateUrlDto` / `UpdateUrlDto` com validação de URL http(s).
- Responses `UrlResponse` / `UrlStatsResponse` com documentação no Swagger e conversão a partir do model.
- `generateShortCode()` (base62, `crypto.randomInt`).
- Endpoints `POST /shorten`, `GET /shorten/:code`, `PUT /shorten/:code`, `DELETE /shorten/:code` e `GET /shorten/:code/stats`, com documentação Swagger.
- Contagem de acessos atômica no `GET /shorten/:code` (sem alterar `updatedAt`); colisões de código tratadas com novas tentativas.
- Testes unitários do `UrlsService` e testes de integração com PostgreSQL.
- Envelope `{ data }` nas respostas de sucesso (`ResponseEnvelopeInterceptor`, `@SkipResponseEnvelope()`), preservando 204 e respostas `{ data, meta }`.
- Erros no formato RFC 9457 (`application/problem+json`) com `ProblemDetailsFilter`, incluindo `errors` por campo na validação e mensagem genérica em 5xx.
- i18n com `nestjs-i18n`: pt-BR (padrão) e en, via `Accept-Language` ou `?lang=`, para validação, erros e Problem Details.
- `@ApiDataResponse()` e `@ApiProblemResponse()` documentando envelope e Problem Details no Swagger.
- Testes E2E (Supertest) do contrato HTTP.
- `GET /health`: verifica a app e o PostgreSQL (`SELECT 1` com timeout de 3 s), sem envelope; responde 503 em Problem Details quando o banco está indisponível.

## [0.2.0] - 2026-10-19

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

[Unreleased]: https://github.com/aqu1no1/nest-url-shortener/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/aqu1no1/nest-url-shortener/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/aqu1no1/nest-url-shortener/releases/tag/v0.1.0
