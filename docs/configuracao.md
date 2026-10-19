# Configuração

## Variáveis de ambiente

| Variável          | Obrigatória | Padrão        | Descrição                             |
| ----------------- | ----------- | ------------- | ------------------------------------- |
| `NODE_ENV`        | não         | `development` | `development`, `test` ou `production` |
| `PORT`            | não         | `3000`        | Porta HTTP                            |
| `DATABASE_URL`    | **sim**     | —             | URL `postgres://` / `postgresql://`   |
| `SWAGGER_ENABLED` | não         | `true`        | Expõe `/docs` e `/docs/openapi.json`  |

Variáveis usadas apenas pelo `docker-compose.yml` (a app não as lê):

| Variável            | Padrão          |
| ------------------- | --------------- |
| `POSTGRES_USER`     | `postgres`      |
| `POSTGRES_PASSWORD` | `postgres`      |
| `POSTGRES_DB`       | `url_shortener` |
| `POSTGRES_PORT`     | `5432`          |

A `DATABASE_URL` deve refletir esses valores:

```
postgresql://POSTGRES_USER:POSTGRES_PASSWORD@localhost:POSTGRES_PORT/POSTGRES_DB
```

```bash
cp .env.example .env
cp .env.test.example .env.test   # para testes de integração/E2E
```

Nunca versionar `.env` nem `.env.test`, apenas os arquivos `.example`.

## Como funciona

| Arquivo                        | Função                                                                  |
| ------------------------------ | ----------------------------------------------------------------------- |
| `src/config/env.validation.ts` | Schema Joi. Falha no startup se algo obrigatório faltar ou for inválido |
| `src/config/configuration.ts`  | Organiza as variáveis em namespaces (`app`, `database`, `swagger`)      |
| `src/config/swagger.ts`        | Configuração do OpenAPI e da Swagger UI                                 |

- `ConfigModule` é global (`isGlobal: true`) e carrega `.env.test` quando `NODE_ENV=test` (o Vitest define isso por padrão); nos demais casos, `.env`.
- Leitura tipada: `ConfigService<AppConfig, true>` + `config.get('app.port', { infer: true })`.

## Prisma

| Arquivo                                | Função                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `prisma/schema.prisma`                 | Generator `prisma-client` (CJS) e models                                 |
| `prisma.config.ts`                     | Configuração do Prisma CLI: schema, pasta de migrations e `DATABASE_URL` |
| `src/generated/prisma/`                | Client gerado (não versionado, não editar)                               |
| `src/modules/prisma/prisma.service.ts` | `PrismaClient` + `@prisma/adapter-pg` com a URL vinda do `ConfigService` |

- O **Prisma CLI** não passa pelo `ConfigModule`: o `prisma.config.ts` carrega o `.env` com `dotenv/config` e lê `process.env.DATABASE_URL`. Uma variável já exportada no shell tem prioridade sobre o `.env`.
- A **app** lê a URL pelo `ConfigService` (`database.url`).
- O client é gerado automaticamente no `pnpm install` (`postinstall`) e com `pnpm prisma:generate`.
- No startup, o `PrismaService` executa `SELECT 1`: com o driver adapter, o `$connect()` não abre conexão, então sem essa consulta a app subiria mesmo sem banco.

```bash
pnpm db:migrate --name <nome>   # prisma migrate dev: cria e aplica migration (dev)
pnpm db:migrate:deploy          # aplica migrations pendentes (CI / outros ambientes)
pnpm db:migrate:reset           # recria o banco de dev e reaplica tudo
pnpm db:studio                  # Prisma Studio
```

Sempre crie migrations com `pnpm db:migrate --name ...`; nunca escreva a pasta/SQL à mão.

## Banco de desenvolvimento

```bash
pnpm db:up     # docker compose up -d --wait
pnpm db:down   # docker compose down (mantém o volume)
```

- O Compose lê o `.env` da raiz automaticamente e usa os `POSTGRES_*`; sem eles, aplica os padrões da tabela acima.
- Os dados ficam no volume `url-shortener_postgres-data`. Para apagar: `docker compose down -v`.
- Valores padrão **apenas para desenvolvimento local**.
- Banco de testes: `docker-compose.test.yml` + `.env.test` (`POSTGRES_PORT=5433`, `url_shortener_test`). Veja [Testes](testes.md).
