# Stack

| Área               | Tecnologia                                          | Onde                                             |
| ------------------ | --------------------------------------------------- | ------------------------------------------------ |
| Runtime            | Node.js 24+                                         | —                                                |
| Gerenciador        | pnpm                                                | `package.json`, `pnpm-lock.yaml`                 |
| Linguagem          | TypeScript 6                                        | `tsconfig*.json`                                 |
| Framework          | NestJS (controllers, services, DI)                  | `src/`                                           |
| Configuração       | `@nestjs/config` + Joi                              | `src/config/`                                    |
| Validação de input | `class-validator` + `class-transformer`             | `ValidationPipe` global em `main.ts`             |
| Documentação HTTP  | Swagger / OpenAPI (`@nestjs/swagger`)               | `src/config/swagger.ts`                          |
| Persistência       | Prisma ORM 7 + `@prisma/adapter-pg` + PostgreSQL 17 | `prisma/`, `src/modules/prisma/`                 |
| Migrations         | Prisma Migrate                                      | `prisma/migrations/`                             |
| Testes             | Vitest (+ SWC) e Supertest                          | `vitest.config.mts`, `src/**/*.spec.ts`, `test/` |
| Lint / formatação  | Oxlint e Oxfmt                                      | `.oxlintrc.json`, `.oxfmtrc.json`                |
| Editores           | VS Code e Zed                                       | `.vscode/`, `.zed/`                              |
| Clientes HTTP      | Postman e Bruno _(v0.5.0)_                          | `collections/`                                   |
| CI / Release       | GitHub Actions _(v0.5.0)_                           | `.github/workflows/`                             |
| Versões            | SemVer, tags Git, GitHub Releases, CHANGELOG        | `CHANGELOG.md`                                   |

> As versões exatas instaladas estão no `package.json`.

## Observações

- **TypeScript 6** (não 7): `@nestjs/swagger` ainda declara peer `^5.5 || ^6`.
- **Prisma 7 (não 8)**: a tag `latest` do npm aponta para `8.0.0-rc`, que muda o fluxo para contract-first. Ver [ADR 0001](adr/0001-prisma-7-driver-adapter.md).
- **Vitest + `unplugin-swc`**: o esbuild não emite `emitDecoratorMetadata`, necessário para a DI do NestJS; o SWC emite.
