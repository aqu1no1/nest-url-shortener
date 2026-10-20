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
pnpm db:migrate:deploy      # aplica as migrations
pnpm start:dev
```

Swagger UI: <http://localhost:3000/docs> · OpenAPI: <http://localhost:3000/docs/openapi.json>

## API

| Método   | Endpoint               | Descrição                                       |
| -------- | ---------------------- | ----------------------------------------------- |
| `POST`   | `/shorten`             | Encurta uma URL (`201`)                         |
| `GET`    | `/shorten/:code`       | Recupera a URL original e conta um acesso       |
| `PUT`    | `/shorten/:code`       | Atualiza a URL mantendo o código                |
| `DELETE` | `/shorten/:code`       | Exclui a URL (`204`)                            |
| `GET`    | `/shorten/:code/stats` | Estatísticas (`accessCount`), sem contar acesso |
| `GET`    | `/health`              | App e PostgreSQL                                |

- Sucesso em `{ "data": ... }`; erros em Problem Details (RFC 9457), em pt-BR ou en (`?lang=en` / `Accept-Language`).
- Rate limit de 100 requisições por minuto por IP (configurável), `url` com até 2048 caracteres e corpo com até 100 kB. Detalhes em [API → Limites](docs/api.md#limites).
- Collections prontas em `collections/` (Postman e Bruno).

## Scripts

| Comando                              | Descrição                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `pnpm start:dev`                     | Inicia em modo watch                                                      |
| `pnpm build`                         | Compila para `dist/`                                                      |
| `pnpm start:prod`                    | Executa o build                                                           |
| `pnpm db:up`                         | Sobe o PostgreSQL de desenvolvimento                                      |
| `pnpm db:down`                       | Para o PostgreSQL de desenvolvimento                                      |
| `pnpm db:migrate`                    | Cria/aplica migration em dev (`--name <nome>`)                            |
| `pnpm db:migrate:deploy`             | Aplica migrations pendentes                                               |
| `pnpm db:migrate:reset`              | Recria o banco de dev                                                     |
| `pnpm db:studio`                     | Prisma Studio                                                             |
| `pnpm db:test:up`                    | Sobe o PostgreSQL de testes (`docker-compose.test.yml`)                   |
| `pnpm db:test:prepare [1-4]`         | Cria os bancos por worker e aplica migrations                             |
| `pnpm db:test:down`                  | Remove o PostgreSQL de testes e volumes                                   |
| `pnpm prisma:generate`               | Gera o Prisma Client                                                      |
| `pnpm typecheck`                     | Verifica tipos                                                            |
| `pnpm lint`                          | Oxlint                                                                    |
| `pnpm format`                        | Formata com Oxfmt                                                         |
| `pnpm format:check`                  | Verifica formatação                                                       |
| `pnpm test`                          | Todos os testes (projetos unit, integration e e2e)                        |
| `pnpm test:unit`                     | Testes unitários (Vitest)                                                 |
| `pnpm test:unit:watch`               | Testes unitários em watch                                                 |
| `pnpm test:integration`              | Testes de integração                                                      |
| `pnpm test:e2e`                      | Testes E2E                                                                |
| `pnpm test:docker [1-4]`             | Integração + E2E com PostgreSQL em Docker (sobe, prepara, roda e derruba) |
| `pnpm test:integration:docker [1-4]` | Só integração, com Docker                                                 |
| `pnpm test:e2e:docker [1-4]`         | Só E2E, com Docker                                                        |
| `pnpm test:cov`                      | Cobertura dos testes unitários                                            |

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
