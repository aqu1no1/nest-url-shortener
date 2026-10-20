# Testes

| Tipo       | Local                               | Docker? | Finalidade                                                      |
| ---------- | ----------------------------------- | ------- | --------------------------------------------------------------- |
| Unitário   | `src/**/*.spec.ts`                  | Não     | Regras do service, gerador de códigos e mocks                   |
| Integração | `test/integration/**/*.int-spec.ts` | Sim     | Prisma real, constraints, migrations e operações no banco       |
| E2E        | `test/e2e/**/*.e2e-spec.ts`         | Sim     | API HTTP real, status, contratos, validação e dados persistidos |

## Comandos

```bash
pnpm test:unit                    # unitários, sem Docker
pnpm test:unit:watch
pnpm test:cov                     # cobertura dos unitários
pnpm test:docker                  # integração + E2E com Docker, 4 workers
pnpm test:docker 2                # 2 workers (1 a 4)
pnpm test:integration:docker 2    # só integração
pnpm test:e2e:docker 1            # só E2E
pnpm test:docker 2 -t "shortCode" # argumentos extras vão para o Vitest
```

O `test:docker` (`test/support/setup/run-test-suite.mjs`):

1. cria o `.env.test` a partir do `.env.test.example`, se ele não existir;
2. sobe o `docker-compose.test.yml` e espera o healthcheck;
3. cria `url_shortener_test_1..N` e aplica as migrations (`prepare-test-dbs.mjs N`);
4. roda o Vitest com `--maxWorkers N`, então cada worker tem o seu banco;
5. executa `docker compose down -v` **sempre**: com sucesso, com falha nos testes ou com Ctrl+C/SIGTERM (exit 130/143);
6. sai com o código do Vitest.

Passo a passo manual, para depurar com o banco de pé:

```bash
pnpm db:test:up
pnpm db:test:prepare 4
pnpm test:integration             # ou: pnpm vitest --project integration --maxWorkers 2 (com 2 bancos)
pnpm db:test:down
```

> No modo manual, prepare tantos bancos quanto workers (o Vitest usa até 4).

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
│   ├── migrations.int-spec.ts      # migrations aplicadas, colunas, defaults (UUIDv7), UNIQUE, limpeza
│   ├── test-database.int-spec.ts   # guarda contra banco que não é de teste
│   └── urls.int-spec.ts            # UrlsService com PostgreSQL real: colisão, contagem atômica, 404
├── e2e/
│   ├── health.e2e-spec.ts          # GET /health sem envelope
│   ├── swagger.e2e-spec.ts         # /docs e /docs/openapi.json (envelope, Problem Details, limites, versão)
│   ├── throttle.e2e-spec.ts        # 429 em Problem Details, Retry-After, /health fora do limite
│   └── urls.e2e-spec.ts            # HTTP real: cinco endpoints, envelope, 204, timestamps, Problem Details, i18n, limites
└── support/
    ├── database/
    │   ├── client.ts               # createTestPrismaClient()
    │   └── cleanup.ts              # truncateAllTables(prisma)
    ├── factories/                  # vazia por enquanto (.gitkeep)
    ├── helpers/
    │   ├── create-test-app.ts      # app a partir do AppModule; { swagger: true } monta o Swagger, { throttle } troca o rate limit
    │   └── uuid.ts                 # UUID_V7_PATTERN
    └── setup/
        ├── test-database.mjs       # guarda, .env.test e URL por worker
        ├── prepare-test-dbs.mjs    # cria 1–4 bancos e aplica migrations
        ├── run-test-suite.mjs      # runner do test:docker (up → prepare → vitest → down)
        └── worker-database.ts      # setupFile: DATABASE_URL = <base>_<VITEST_POOL_ID>
```

| Peça                      | Como funciona                                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.test.yml` | Projeto `url-shortener-test`, separado do dev; porta `${POSTGRES_PORT:-5433}`; dados em `tmpfs`; `fsync`/`synchronous_commit`/`full_page_writes` desligados |
| Banco por worker          | A `DATABASE_URL` do `.env.test` é a base (`url_shortener_test`); cada worker usa `url_shortener_test_<VITEST_POOL_ID>`                                      |
| Guarda                    | Exige `NODE_ENV=test` e banco com nome terminado em `_test` ou `_test_N`; vale no prepare, no setup dos workers, no client e na limpeza                     |
| Limpeza                   | `truncateAllTables` faz `TRUNCATE ... RESTART IDENTITY CASCADE` em todas as tabelas, exceto `_prisma_migrations`; chame no `beforeEach`                     |
| Teardown                  | Automático no `test:docker` (inclusive em falha/sinal); manual com `pnpm db:test:down` (`down -v`)                                                          |

- Use **no máximo 4 workers** (definido em `vitest.config.mts`).
- Vitest usa `unplugin-swc` para emitir metadados de decorators (DI do NestJS).
- `fixtures/` e `mocks/` em `test/support/` são criadas quando necessárias.

## Fluxo de integração e E2E

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
- O runner define `NODE_ENV=test`, e a guarda recusa bancos de desenvolvimento/produção.
- Dados são limpos **entre testes do mesmo worker**.
- Containers e volumes são encerrados mesmo quando os testes falham.
- Mesma estratégia localmente e no GitHub Actions.

## Matriz de testes

**U** = unitário, **I** = integração (PostgreSQL), **E** = E2E (HTTP).

| Endpoint                   | Cenário                                                          | U   | I   | E   |
| -------------------------- | ---------------------------------------------------------------- | --- | --- | --- |
| `POST /shorten`            | `201` com `{ data }`, `id` UUIDv7 e `shortCode` base62           | ✓   | ✓   | ✓   |
|                            | Código sorteado já existe: tenta outro (até 5 vezes)             | ✓   | ✓   |     |
|                            | `400`: url ausente, não texto, sem http/https, campo extra       | ✓   |     | ✓   |
|                            | `400`: url acima de 2048 caracteres ou com caractere de controle | ✓   |     | ✓   |
|                            | `413`: corpo acima de 100 kB                                     | ✓   |     | ✓   |
| `GET /shorten/:code`       | `200` e conta um acesso por chamada, sem alterar `updatedAt`     | ✓   | ✓   | ✓   |
|                            | 25 acessos concorrentes contados de forma atômica                |     | ✓   |     |
|                            | `404` para código inexistente, em pt-BR e en                     | ✓   | ✓   | ✓   |
|                            | `404` para código fora do formato (byte nulo, longo, não base62) | ✓   |     | ✓   |
| `PUT /shorten/:code`       | `200`, mantém o código, avança `updatedAt` e mantém `createdAt`  | ✓   | ✓   | ✓   |
|                            | `400` para url inválida, sem alterar o registro                  | ✓   |     | ✓   |
|                            | `404` para código inexistente ou fora do formato                 | ✓   | ✓   | ✓   |
| `DELETE /shorten/:code`    | `204` sem corpo; depois, `GET` responde `404`                    | ✓   | ✓   | ✓   |
|                            | `404` para código inexistente ou fora do formato                 | ✓   | ✓   | ✓   |
| `GET /shorten/:code/stats` | `200` com `accessCount`, sem incrementar                         | ✓   | ✓   | ✓   |
|                            | `404` para código inexistente ou fora do formato                 | ✓   | ✓   | ✓   |
| Todas as rotas `/shorten`  | `429` em Problem Details com `Retry-After` (pt-BR e en)          |     |     | ✓   |
|                            | Headers `X-RateLimit-*`                                          |     |     | ✓   |
| `GET /health`              | `200` sem envelope; fora do rate limit                           |     |     | ✓   |
| Swagger                    | UI, OpenAPI, envelope, Problem Details, 413/429, versão          |     |     | ✓   |

Peças transversais com testes unitários: `ResponseEnvelopeInterceptor`, `ProblemDetailsFilter` (tradução, validação com argumentos, `http-errors`, 5xx), `generateShortCode`, `ShortCodePipe`, `envValidationSchema` e `UrlResponseDto`/`UrlStatsResponseDto`. As migrations são testadas em banco limpo (`migrations.int-spec.ts`).
