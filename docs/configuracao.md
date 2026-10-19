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

## Prisma CLI _(v0.2.0)_

O Prisma CLI (`migrate`, `generate`) obtém `DATABASE_URL` em `prisma.config.ts`, independentemente do bootstrap do `ConfigModule`.

## Banco de desenvolvimento

```bash
pnpm db:up     # docker compose up -d --wait
pnpm db:down   # docker compose down (mantém o volume)
```

- O Compose lê o `.env` da raiz automaticamente e usa os `POSTGRES_*`; sem eles, aplica os padrões da tabela acima.
- Os dados ficam no volume `url-shortener_postgres-data`. Para apagar: `docker compose down -v`.
- Valores padrão **apenas para desenvolvimento local**.
- O banco de testes (`docker-compose.test.yml`) é da URL-12.
