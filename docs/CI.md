# CI e releases

```text
.github/
└── workflows/
    ├── ci.yml       # push e pull request na main; também reutilizado pelo release
    └── release.yml  # somente workflow_dispatch
```

## `ci.yml` — automático

```text
Push na main / Pull Request
              │
       ┌──────┴───────┐
       ▼              ▼
     Quality       Integration
       │              │
     Oxlint         Docker
     Oxfmt          PostgreSQL
     Typecheck      Migrations
     Build          Vitest Integration
     Unit Tests     Vitest E2E
       │              │
       └──────┬───────┘
              ▼
         CI aprovada
```

| Job           | Passos                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `quality`     | `pnpm install --frozen-lockfile`, `prisma:generate`, `lint`, `format:check`, `typecheck`, `build`, `test:unit` |
| `integration` | Service container `postgres:17-alpine` (porta 5433), `db:migrate:deploy`, `test:integration`, `test:e2e`       |

- O pnpm vem do `packageManager` do `package.json` (sem `version` no `pnpm/action-setup`).
- Hoje o job `integration` usa um service container do GitHub Actions. Na URL-20 ele passa a rodar `pnpm test:docker`, que sobe o `docker-compose.test.yml`, cria um banco por worker, aplica migrations e faz o teardown.
- Para as falhas bloquearem o merge, ative a branch protection da `main` exigindo os checks `quality` e `integration` (configuração do GitHub).

## `release.yml` — manual (**Run workflow**)

```text
Actions → Release → Run workflow
                 │
                 ▼
       Informar versão v0.1.0
                 │
                 ▼
       Validar branch e versão
       Conferir package.json
       Conferir CHANGELOG.md
       Verificar tag existente
                 │
                 ▼
          Executar CI inteira
                 │
          ┌──────┴──────┐
          ▼             ▼
        Falha         Sucesso
          │             │
          ▼             ▼
     Não publica    Criar tag Git
                    Publicar Release
```

Disparado apenas por `workflow_dispatch`, com entradas `version` (ex.: `v0.1.0`) e `prerelease` (boolean), e `concurrency: nestjs-manual-release`. Jobs: `validate_version` → `checks` (reusa o `ci.yml` via `workflow_call`) → `publish`.

> Antes de publicar uma versão, mova as entradas de `[Unreleased]` para uma seção `## [X.Y.Z]` no `CHANGELOG.md` e ajuste o `version` do `package.json`; o workflow recusa a publicação sem isso.

1. **Actions → Release → Run workflow** na branch `main`.
2. Validar que roda na `main` e que a versão segue SemVer.
3. Recusar se a tag já existir; comparar com `package.json` e exigir seção correspondente no `CHANGELOG.md`.
4. Executar os mesmos checks da CI.
5. Em caso de falha, **não** criar tag nem Release.
6. Com tudo verde, criar a tag no commit validado e a GitHub Release (`gh release create`, `GITHUB_TOKEN`, `contents: write`).
7. `pre-release` opcional; notas a partir do changelog ou geradas pelo GitHub.

Criar milestone no Linear ou dar merge na `main` **não** dispara release. Deploy não faz parte do projeto inicialmente.

## Versionamento

- [Semantic Versioning](https://semver.org/lang/pt-BR/): `MAJOR.MINOR.PATCH`.
- [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/): `CHANGELOG.md`.
- Tags `vX.Y.Z` e GitHub Releases somente após validação e comando manual.

## Milestones

| Versão   | Objetivo                                                                     |
| -------- | ---------------------------------------------------------------------------- |
| `v0.1.0` | Inicialização, pnpm, OXC, editores, configuração, Swagger e esqueleto Vitest |
| `v0.2.0` | PostgreSQL, Prisma, migrations e bancos de testes                            |
| `v0.3.0` | CRUD (`POST`, `GET`, `PUT`, `DELETE`) e testes                               |
| `v0.4.0` | Estatísticas, contagem, interceptors e Problem Details                       |
| `v0.5.0` | Integração/E2E, 1–4 workers, collections e GitHub Actions                    |
| `v1.0.0` | API revisada, testes verdes, documentação e release estável                  |
