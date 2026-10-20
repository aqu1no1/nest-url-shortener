# 0004. Limites de abuso: rate limit em memória e validação de entrada

- **Status:** Aceita
- **Data:** 2026-10-20

## Contexto

A API é pública e sem autenticação. A revisão da v1.0.0 (URL-23) encontrou entradas que geravam `500`:

- byte nulo no `:code` (`/shorten/%00`) chegava ao PostgreSQL, que rejeita o caractere;
- byte nulo dentro da `url` passava pelo `@IsUrl` e também quebrava no banco;
- um corpo acima do limite do Express (100 kB) gerava um `PayloadTooLargeError`, que o filtro tratava como erro interno.

Também não havia limite de requisições, então um único cliente podia criar URLs sem parar. O MVP exclui Redis e cache distribuído ([Requisitos](../requisitos.md)).

## Decisão

- **Rate limit** com `@nestjs/throttler`, guard global (`APP_GUARD`) e armazenamento em memória: `THROTTLE_LIMIT` requisições a cada `THROTTLE_TTL` segundos por IP (padrão: 100 a cada 60 s). Acima disso, `429` em Problem Details com `Retry-After`; as respostas trazem `X-RateLimit-*`. O `/health` fica fora (`@SkipThrottle()`), para não derrubar health checks.
- **`:code`** validado pelo `ShortCodePipe`: precisa ser base62 com 1 a 12 caracteres. Fora disso, responde `404` sem consultar o banco, já que um código nesse formato nunca existe.
- **`url`** com no máximo 2048 caracteres (`@MaxLength`) e sem caracteres de controle.
- **Corpo grande:** o filtro respeita o status de erros 4xx do Express (pacote `http-errors`, com `expose: true`) e responde `413` traduzido.
- **`X-Powered-By`** desligado no `main.ts`.

## Consequências

- Os casos acima respondem `4xx` em vez de `500`, e um cliente sozinho não consegue sobrecarregar a API.
- O contador vive na memória do processo: com mais de uma instância, cada uma conta separadamente, e o limite reinicia quando a app reinicia. Escalar horizontalmente exigirá um storage compartilhado (ex.: Redis) e uma nova ADR.
- O IP usado é o da conexão. Atrás de um proxy reverso, todos os clientes compartilhariam o IP do proxy; nesse caso é preciso configurar o `trust proxy` do Express antes de publicar.
- Testes E2E que fazem muitas requisições devem considerar o limite. O `createTestApp({ throttle })` permite usar um limite próprio em um teste.
