# Diagramas de sequência

Fluxos principais da API. Toda requisição às rotas `/shorten` passa antes pelo `ThrottlerGuard` (rate limit por IP); erros em qualquer etapa viram Problem Details no `ProblemDetailsFilter`.

## Encurtar uma URL — `POST /shorten`

```mermaid
sequenceDiagram
    participant Cliente
    participant Guard as ThrottlerGuard
    participant Pipe as ValidationPipe
    participant Service as UrlsService
    participant Banco as PostgreSQL
    Cliente->>Guard: POST /shorten { url }
    Guard->>Pipe: dentro do limite
    Pipe->>Service: CreateUrlDto válido
    loop até 5 tentativas
        Service->>Service: generateShortCode()
        Service->>Banco: INSERT ... ON CONFLICT DO NOTHING RETURNING
        Banco-->>Service: linha criada ou vazio (código já existe)
    end
    Service-->>Cliente: 201 { data }
    Note over Pipe,Cliente: url inválida → 400 com errors por campo
    Note over Service,Cliente: 5 colisões seguidas → 500 traduzido
```

## Recuperar e contar acesso — `GET /shorten/:code`

```mermaid
sequenceDiagram
    participant Cliente
    participant Guard as ThrottlerGuard
    participant Pipe as ShortCodePipe
    participant Service as UrlsService
    participant Banco as PostgreSQL
    Cliente->>Guard: GET /shorten/abc123
    Guard->>Pipe: dentro do limite
    Pipe->>Service: código no formato base62 (1–12)
    Service->>Banco: UPDATE ... SET access_count = access_count + 1 RETURNING
    Banco-->>Service: URL atualizada ou nenhuma linha
    Service-->>Cliente: 200 { data } ou 404
    Note over Pipe,Cliente: código fora do formato → 404 sem consultar o banco
```

O incremento é atômico porque acontece em uma única consulta. `GET /shorten/:code/stats` só lê (`SELECT`) e não conta acesso.

## Atualizar ou excluir — `PUT` / `DELETE /shorten/:code`

```mermaid
sequenceDiagram
    participant Cliente
    participant Service as UrlsService
    participant Banco as PostgreSQL
    Cliente->>Service: PUT { url } ou DELETE (após guard e pipes)
    Service->>Banco: UPDATE ... RETURNING / DELETE pelo short_code
    Banco-->>Service: linhas afetadas
    alt nenhuma linha
        Service-->>Cliente: 404 Problem Details
    else PUT
        Service-->>Cliente: 200 { data } com updatedAt novo
    else DELETE
        Service-->>Cliente: 204 sem corpo
    end
```

## Rate limit

```mermaid
sequenceDiagram
    participant Cliente
    participant Guard as ThrottlerGuard
    participant Filtro as ProblemDetailsFilter
    Cliente->>Guard: requisição acima de THROTTLE_LIMIT na janela
    Guard->>Filtro: ThrottlerException (common.TOO_MANY_REQUESTS)
    Filtro-->>Cliente: 429 Problem Details + Retry-After
```
