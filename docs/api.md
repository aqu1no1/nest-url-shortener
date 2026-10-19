# API

- Swagger UI: **`/docs`** · OpenAPI JSON: **`/docs/openapi.json`** (quando `SWAGGER_ENABLED=true`).
- Tag OpenAPI dos endpoints: **`URLs`**.
- Sucesso JSON: `{ "data": ... }`. Erros: RFC 9457 (`application/problem+json`).

## Endpoints

| Método   | Endpoint               | Sucesso          | Erros principais |
| -------- | ---------------------- | ---------------- | ---------------- |
| `POST`   | `/shorten`             | `201 Created`    | `400`            |
| `GET`    | `/shorten/:code`       | `200 OK`         | `404`            |
| `PUT`    | `/shorten/:code`       | `200 OK`         | `400`, `404`     |
| `DELETE` | `/shorten/:code`       | `204 No Content` | `404`            |
| `GET`    | `/shorten/:code/stats` | `200 OK`         | `404`            |

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
  "detail": "A URL não foi encontrada.",
  "instance": "/shorten/nao-existe"
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
│   ├── url-shortener.postman_collection.json
│   └── local.postman_environment.json
└── bruno/
    ├── bruno.json
    ├── environments/local.bru
    └── docs/openapi-json.bru
```

- Variáveis: `baseUrl` (`http://localhost:3000`) e `shortCode`.
- Hoje há apenas o request `Docs / OpenAPI JSON`. Cada endpoint entra na pasta `URLs` junto com a sua issue (URL-13 a URL-17), com exemplos de 201/200/204/400/404.
- Nenhum segredo real é versionado.
