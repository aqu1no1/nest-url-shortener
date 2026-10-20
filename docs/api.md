# API

- Swagger UI: **`/docs`** · OpenAPI JSON: **`/docs/openapi.json`** (quando `SWAGGER_ENABLED=true`).
- Tag OpenAPI dos endpoints: **`URLs`**.
- Sucesso JSON: `{ "data": ... }`. Erros: RFC 9457 (`application/problem+json`). Decisão no [ADR 0003](adr/0003-contrato-http-envelope-e-problem-details.md).
- O `id` dos recursos é um UUIDv7 ([ADR 0002](adr/0002-uuid-v7-como-chave-primaria.md)); as rotas usam o `shortCode`.

- Idioma das mensagens: **pt-BR** por padrão; **en** com `Accept-Language: en` ou `?lang=en` (veja [Arquitetura → i18n](arquitetura.md#internacionalização-i18n)).

> **Contagem de acessos:** cada `GET /shorten/:code` bem-sucedido incrementa `accessCount` de forma atômica; `GET /shorten/:code/stats` não incrementa. A resposta de `GET /shorten/:code` não inclui `accessCount`; ele aparece só em `/stats`.

## Endpoints

| Método   | Endpoint               | Sucesso          | Erros principais           |
| -------- | ---------------------- | ---------------- | -------------------------- |
| `POST`   | `/shorten`             | `201 Created`    | `400`, `413`, `429`        |
| `GET`    | `/shorten/:code`       | `200 OK`         | `404`, `429`               |
| `PUT`    | `/shorten/:code`       | `200 OK`         | `400`, `404`, `413`, `429` |
| `DELETE` | `/shorten/:code`       | `204 No Content` | `404`, `429`               |
| `GET`    | `/shorten/:code/stats` | `200 OK`         | `404`, `429`               |

## Limites

Decisão registrada no [ADR 0004](adr/0004-limites-de-abuso.md).

| Limite              | Regra                                                                                        | Resposta fora do limite              |
| ------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| Rate limit          | `THROTTLE_LIMIT` requisições a cada `THROTTLE_TTL` segundos por IP (padrão: 100 a cada 60 s) | `429`, com `Retry-After` em segundos |
| `url`               | `http`/`https`, até 2048 caracteres, sem caracteres de controle                              | `400` com `errors` por campo         |
| `:code`             | Base62 (`0-9`, `A-Z`, `a-z`), de 1 a 12 caracteres                                           | `404`, sem consultar o banco         |
| Corpo da requisição | Até 100 kB (padrão do Express)                                                               | `413`                                |

- Toda resposta das rotas `/shorten` traz `X-RateLimit-Limit`, `X-RateLimit-Remaining` e `X-RateLimit-Reset`.
- `GET /health` não entra no rate limit.
- O contador fica na memória do processo: com mais de uma instância, cada uma conta separadamente. Atrás de um proxy reverso, configure o `trust proxy` do Express antes de publicar, ou todos os clientes vão compartilhar o IP do proxy.

## Health check

`GET /health` (tag `Health`) é técnico e **não conta** como endpoint do desafio. Ele não usa o envelope `{ data }` (`@SkipResponseEnvelope()`).

| Situação                                      | Resposta                                                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| App e PostgreSQL ok                           | `200` `{ "status": "ok", "database": "up", "timestamp": "2026-10-19T20:12:15.305Z" }`                                  |
| PostgreSQL fora do ar ou sem responder em 3 s | `503` Problem Details, com `detail` traduzido ("O banco de dados está indisponível." / "The database is unavailable.") |

## Exemplos

Sucesso:

```json
{
  "data": {
    "id": "019a01b2-3c4d-7e5f-8a9b-0c1d2e3f4a5b",
    "url": "https://example.com/alguma-url",
    "shortCode": "abc123",
    "createdAt": "2026-10-19T12:00:00Z",
    "updatedAt": "2026-10-19T12:00:00Z"
  }
}
```

Erro (`Content-Type: application/problem+json`):

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "Não foi possível encontrar a URL.",
  "instance": "/shorten/nao-existe"
}
```

Rate limit (`429`, com header `Retry-After`):

```json
{
  "type": "about:blank",
  "title": "Muitas requisições",
  "status": 429,
  "detail": "Muitas requisições. Tente novamente em instantes.",
  "instance": "/shorten"
}
```

Erro de validação (`?lang=en`):

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "The request contains invalid fields.",
  "instance": "/shorten?lang=en",
  "errors": [
    { "field": "extra", "messages": ["The property extra is not allowed."] },
    { "field": "url", "messages": ["url must be a valid http or https URL."] }
  ]
}
```

## Regras de documentação

- Cada controller documenta endpoint, DTO, código HTTP, exemplos e formatos reais de resposta (`data` e Problem Details).
- O interceptor **não** altera a especificação OpenAPI automaticamente: documentar o envelope explicitamente.
- Respostas `204` não têm corpo.

## Collections

```text
collections/
├── postman/
│   ├── url-shortener.postman_collection.json   # URLs, Health, Docs (com testes e exemplos)
│   └── local.postman_environment.json          # baseUrl, shortCode, lang
└── bruno/
    ├── bruno.json
    ├── environments/local.bru                  # baseUrl, shortCode, lang
    ├── urls/
    │   ├── create-url.bru                      # 1. POST   /shorten (salva o shortCode)
    │   ├── get-url.bru                         # 2. GET    /shorten/:code
    │   ├── update-url.bru                      # 3. PUT    /shorten/:code
    │   ├── get-url-stats.bru                   # 4. GET    /shorten/:code/stats
    │   └── delete-url.bru                      # 5. DELETE /shorten/:code
    ├── health/health.bru                       # GET /health
    └── docs/openapi-json.bru                   # GET /docs/openapi.json
```

- Variáveis: `baseUrl` (`http://localhost:3000`), `shortCode` (preenchida pelo `Criar URL`) e `lang` (`pt-BR` ou `en`, enviada no `Accept-Language`).
- A pasta `URLs` roda em ordem: criar → recuperar → atualizar → estatísticas → excluir. Rodar a collection inteira exercita o fluxo completo.
- Cada request tem testes/asserções. Os exemplos de 201/200/204/400/404 (e 503 no health) ficam salvos no Postman (_Examples_) e na aba _Docs_ do Bruno.
- Rodar pela linha de comando, com a app de pé:

  ```bash
  npx newman run collections/postman/url-shortener.postman_collection.json -e collections/postman/local.postman_environment.json
  cd collections/bruno && npx @usebruno/cli run --env local
  ```

- Nenhum segredo real é versionado.
