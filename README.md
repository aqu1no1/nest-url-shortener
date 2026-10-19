# nest-url-shortener

A URL shortening REST API built with NestJS, Prisma, and PostgreSQL, featuring database migrations, automated testing, and CI/CD.

> Desafio de referência: [roadmap.sh — URL Shortening Service](https://roadmap.sh/projects/url-shortening-service)

## Requisitos

- Node.js 24+
- pnpm 12+
- Docker (PostgreSQL)

## Como rodar

```bash
pnpm install
cp .env.example .env
pnpm db:up                  # PostgreSQL de desenvolvimento
pnpm start:dev
```

Swagger UI: <http://localhost:3000/docs> · OpenAPI: <http://localhost:3000/docs/openapi.json>

## Scripts

| Comando                 | Descrição                                          |
| ----------------------- | -------------------------------------------------- |
| `pnpm start:dev`        | Inicia em modo watch                               |
| `pnpm build`            | Compila para `dist/`                               |
| `pnpm start:prod`       | Executa o build                                    |
| `pnpm db:up`            | Sobe o PostgreSQL de desenvolvimento               |
| `pnpm db:down`          | Para o PostgreSQL de desenvolvimento               |
| `pnpm typecheck`        | Verifica tipos                                     |
| `pnpm lint`             | Oxlint                                             |
| `pnpm format`           | Formata com Oxfmt                                  |
| `pnpm format:check`     | Verifica formatação                                |
| `pnpm test`             | Todos os testes (projetos unit, integration e e2e) |
| `pnpm test:unit`        | Testes unitários (Vitest)                          |
| `pnpm test:unit:watch`  | Testes unitários em watch                          |
| `pnpm test:integration` | Testes de integração                               |
| `pnpm test:e2e`         | Testes E2E                                         |
| `pnpm test:cov`         | Cobertura dos testes unitários                     |

## Documentação

| Página                                               | O que contém                                           |
| ---------------------------------------------------- | ------------------------------------------------------ |
| [Requisitos](docs/requisitos.md)                     | Escopo e regras do desafio                             |
| [Stack](docs/stack.md)                               | Tecnologias, versões e onde são utilizadas             |
| [Arquitetura](docs/arquitetura.md)                   | Módulos, DI e fluxo entre controller, service e Prisma |
| [Configuração](docs/configuracao.md)                 | Variáveis de ambiente, Joi e Prisma CLI                |
| [API](docs/api.md)                                   | Rotas, contratos, Swagger e exemplos                   |
| [Testes](docs/testes.md)                             | Vitest, comandos, banco isolado e workers              |
| [CI e releases](docs/CI.md)                          | Workflows, tags, changelog e release manual            |
| [Modelo de dados](docs/diagramas/modelo-de-dados.md) | Tabela `urls` e diagrama                               |
| [ADRs](docs/adr/README.md)                           | Registro de decisões importantes                       |

## Referências

- [NestJS — Modules](https://docs.nestjs.com/modules)
- [NestJS — Providers](https://docs.nestjs.com/providers)
- [NestJS — Configuration](https://docs.nestjs.com/techniques/configuration)
- [NestJS — OpenAPI / Swagger](https://docs.nestjs.com/openapi/introduction)
- [NestJS — Testing](https://docs.nestjs.com/fundamentals/testing)
- [NestJS — Interceptors](https://docs.nestjs.com/interceptors)
- [NestJS — Exception filters](https://docs.nestjs.com/exception-filters)
- [Prisma — Documentation](https://www.prisma.io/docs)
- [Prisma — NestJS guide](https://www.prisma.io/docs/guides/nestjs)
- [Prisma — Migrate](https://www.prisma.io/docs/orm/prisma-migrate)
- [PostgreSQL — Documentation](https://www.postgresql.org/docs/)
- [Vitest — Guide](https://vitest.dev/guide/)
- [Oxc — Linter](https://oxc.rs/docs/guide/usage/linter.html)
- [GitHub Actions — Manually running a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
- [RFC 9457 — Problem Details](https://www.rfc-editor.org/rfc/rfc9457)

### Planejamento

- [Projeto no Linear](https://linear.app/url-shortener-pj/project/nestjs-url-shortener-6a6d5cc95155)
