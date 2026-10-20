# 0003. Contrato HTTP: envelope `{ data }`, Problem Details (RFC 9457) e i18n

- **Status:** Aceita
- **Data:** 2026-10-19

## Contexto

Os cinco endpoints do desafio precisam de um formato de resposta previsível para sucesso e erro. Sem um padrão, cada rota tenderia a devolver formatos diferentes, e os erros do NestJS (`{ statusCode, message, error }`) não seguem nenhuma especificação. As mensagens também precisam sair em português por padrão, com opção de inglês.

## Decisão

- **Sucesso JSON:** o recurso vai dentro de `{ "data": ... }`, aplicado pelo `ResponseEnvelopeInterceptor` (`APP_INTERCEPTOR`). `204` não tem corpo. Rotas técnicas como `/health` dispensam o envelope com `@SkipResponseEnvelope()`.
- **Erro:** todo erro vira `application/problem+json` no formato do [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) (`type`, `title`, `status`, `detail`, `instance`), pelo `ProblemDetailsFilter` (`@Catch()`, `APP_FILTER`). Erros de validação acrescentam `errors: [{ field, messages }]`.
- **Erros inesperados** (que não são `HttpException` nem erro 4xx do Express) respondem 500 com mensagem genérica e são registrados no log, sem expor detalhes internos.
- **i18n** com `nestjs-i18n`: pt-BR por padrão e en via `?lang=` ou `Accept-Language`. O filtro traduz `title` e `detail`, e as mensagens de validação vêm de chaves `namespace.CHAVE`.
- O Swagger documenta o envelope e o Problem Details explicitamente (`@ApiDataResponse`, `@ApiProblemResponse`), porque o interceptor e o filtro não alteram o OpenAPI.

## Consequências

- Clientes tratam sucesso e erro de um jeito só em todas as rotas, e o formato de erro segue um padrão conhecido.
- Pipe, interceptor e filtro são registrados no `AppModule`, então valem igual na app e nos testes E2E.
- Toda chave de tradução nova precisa existir em todos os idiomas.
- Respostas com outro formato (ex.: listagens paginadas) devem usar `{ data, meta }`, que o interceptor não envolve de novo.
