# Testes

| Tipo       | Local                               | Docker? | Finalidade                                                      |
| ---------- | ----------------------------------- | ------- | --------------------------------------------------------------- |
| Unitário   | `src/**/*.spec.ts`                  | Não     | Regras do service, gerador de códigos e mocks                   |
| Integração | `test/integration/**/*.int-spec.ts` | Sim     | Prisma real, constraints, migrations e operações no banco       |
| E2E        | `test/e2e/**/*.e2e-spec.ts`         | Sim     | API HTTP real, status, contratos, validação e dados persistidos |

## Comandos

Disponíveis agora:

```bash
pnpm test               # todos os projetos
pnpm test:unit
pnpm test:unit:watch
pnpm test:cov
pnpm test:integration   # precisa dos bancos de teste (abaixo)
pnpm test:e2e           # precisa dos bancos de teste; passa sem testes
```

Banco de testes (integração e E2E):

```bash
cp .env.test.example .env.test   # uma vez
pnpm db:test:up                  # sobe o docker-compose.test.yml (porta 5433, dados em tmpfs)
pnpm db:test:prepare 4           # cria url_shortener_test_1..4 e aplica as migrations (1 a 4)
pnpm test:integration
pnpm db:test:down                # remove container e volumes
```

> Prepare tantos bancos quanto workers. O Vitest usa até 4 (`maxWorkers`), então, se preparar menos, rode com `--maxWorkers <n>`. O runner `test:docker` (URL-20) vai alinhar isso e fazer o teardown automaticamente, inclusive em falha.

Planejados (URL-20, v0.5.0):

```bash
pnpm test:docker                 # integração + E2E, até 4 workers
pnpm test:docker 1               # 1 worker
pnpm test:integration:docker 2
pnpm test:e2e:docker 1
```

## Estrutura

Um único `vitest.config.mts` com [projetos](https://vitest.dev/guide/projects) (`test.projects`):

| Projeto       | Arquivos                            | Script                  |
| ------------- | ----------------------------------- | ----------------------- |
| `unit`        | `src/**/*.spec.ts`                  | `pnpm test:unit`        |
| `integration` | `test/integration/**/*.int-spec.ts` | `pnpm test:integration` |
| `e2e`         | `test/e2e/**/*.e2e-spec.ts`         | `pnpm test:e2e`         |

- Plugin SWC, alias `@`, `environment: 'node'` e `maxWorkers: 4` ficam na raiz e são herdados pelos projetos (`extends: true` é o padrão no Vitest 5).
- `coverage` só pode ser configurado na raiz.
- Rodar um projeto: `pnpm vitest --project unit`; excluir: `--project '!e2e'`.
- `--passWithNoTests` está só em `test:e2e`; `unit` e `integration` falham se não encontrarem testes.
- `integration` e `e2e` usam `setupFiles: ['./test/support/setup/worker-database.ts']`.

```text
test/
├── integration/
│   ├── migrations.int-spec.ts      # migration aplicada, colunas, defaults, UNIQUE, limpeza
│   └── test-database.int-spec.ts   # guarda contra banco que não é de teste
├── e2e/
└── support/
    ├── database/
    │   ├── client.ts               # createTestPrismaClient()
    │   └── cleanup.ts              # truncateAllTables(prisma)
    ├── factories/                  # url.factory.ts (v0.3.0)
    ├── helpers/                    # create-test-app.ts (v0.3.0)
    └── setup/
        ├── test-database.mjs       # guarda, .env.test e URL por worker
        ├── prepare-test-dbs.mjs    # cria 1–4 bancos e aplica migrations
        └── worker-database.ts      # setupFile: DATABASE_URL = <base>_<VITEST_POOL_ID>
```

| Peça                      | Como funciona                                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.test.yml` | Projeto `url-shortener-test`, separado do dev; porta `${POSTGRES_PORT:-5433}`; dados em `tmpfs`; `fsync`/`synchronous_commit`/`full_page_writes` desligados |
| Banco por worker          | A `DATABASE_URL` do `.env.test` é a base (`url_shortener_test`); cada worker usa `url_shortener_test_<VITEST_POOL_ID>`                                      |
| Guarda                    | Exige `NODE_ENV=test` e banco com nome terminado em `_test` ou `_test_N`; vale no prepare, no setup dos workers, no client e na limpeza                     |
| Limpeza                   | `truncateAllTables` faz `TRUNCATE ... RESTART IDENTITY CASCADE` em todas as tabelas, exceto `_prisma_migrations`; chame no `beforeEach`                     |
| Teardown                  | `pnpm db:test:down` (`down -v`)                                                                                                                             |

- Use **no máximo 4 workers** (definido em `vitest.config.mts`).
- Vitest usa `unplugin-swc` para emitir metadados de decorators (DI do NestJS).
- `fixtures/` e `mocks/` em `test/support/` são criadas quando necessárias.
- Runners Docker (`test:docker [1..4]`, teardown automático): URL-20 (v0.5.0).

## Fluxo de integração e E2E _(runner automático na URL-20)_

```mermaid
flowchart TD
    A[pnpm test:docker 2] --> B[Iniciar docker-compose.test.yml]
    B --> C[Criar bancos test_1 e test_2]
    C --> D[Executar Prisma Migrate em cada banco]
    D --> E[Vitest com 2 workers]
    E --> F[Limpeza dos dados]
    F --> G[Encerrar containers e remover volumes]
```

### Isolamento

- Docker de testes separado do de desenvolvimento.
- 1 a 4 workers (4 por padrão); cada worker tem seu próprio banco.
- `test/support/setup/prepare-test-dbs.mjs` prepara bancos e aplica migrations.
- O runner verifica `NODE_ENV=test` e recusa limpar bancos de desenvolvimento/produção.
- Dados são limpos **entre testes do mesmo worker**.
- Containers e volumes são encerrados mesmo quando os testes falham.
- Mesma estratégia localmente e no GitHub Actions.

## Critérios mínimos por endpoint

| Endpoint                   | Testes mínimos                                        |
| -------------------------- | ----------------------------------------------------- |
| `POST /shorten`            | URL válida/inválida, 201/400, código único e colisões |
| `GET /shorten/:code`       | Existe/não existe, 200/404 e política de contagem     |
| `PUT /shorten/:code`       | Atualização válida/inválida, timestamps, 200/400/404  |
| `DELETE /shorten/:code`    | Remover, 204 sem corpo, 404                           |
| `GET /shorten/:code/stats` | `accessCount`, 200/404, sem incremento acidental      |

Também testar envelope `{ data }`, erros RFC 9457, `ValidationPipe`, URLs do Swagger e migrations em banco limpo.
