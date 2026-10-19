# API

- Swagger UI: **`/docs`** · OpenAPI JSON: **`/docs/openapi.json`** (quando `SWAGGER_ENABLED=true`).
- Tag OpenAPI dos endpoints: **`URLs`**.
- Sucesso JSON: `{ "data": ... }`. Erros: RFC 9457 (`application/problem+json`).

- Idioma das mensagens: **pt-BR** por padrão; **en** com `Accept-Language: en` ou `?lang=en` (veja [Arquitetura → i18n](arquitetura.md#internacionalização-i18n)).

> **Contagem de acessos:** cada `GET /shorten/:code` bem-sucedido incrementa `accessCount` de forma atômica; `GET /shorten/:code/stats` não incrementa. A resposta de `GET /shorten/:code` não inclui `accessCount`; ele aparece só em `/stats`.

## Endpoints

| Método   | Endpoint               | Sucesso          | Erros principais |
| -------- | ---------------------- | ---------------- | ---------------- |
| `POST`   | `/shorten`             | `201 Created`    | `400`            |
| `GET`    | `/shorten/:code`       | `200 OK`         | `404`            |
| `PUT`    | `/shorten/:code`       | `200 OK`         | `400`, `404`     |
| `DELETE` | `/shorten/:code`       | `204 No Content` | `404`            |
| `GET`    | `/shorten/:code/stats` | `200 OK`         | `404`            |

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
    "id": "1",
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
