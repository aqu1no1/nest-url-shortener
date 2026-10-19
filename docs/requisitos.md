# Requisitos

> Desafio de referência: [roadmap.sh — URL Shortening Service](https://roadmap.sh/projects/url-shortening-service)

## Objetivo

API REST para encurtar URLs com **NestJS, TypeScript, Prisma e PostgreSQL**, priorizando uma estrutura simples de compreender e evoluir.

## Endpoints obrigatórios

| Método   | Endpoint               | Sucesso          | Erros principais |
| -------- | ---------------------- | ---------------- | ---------------- |
| `POST`   | `/shorten`             | `201 Created`    | `400`            |
| `GET`    | `/shorten/:code`       | `200 OK`         | `404`            |
| `PUT`    | `/shorten/:code`       | `200 OK`         | `400`, `404`     |
| `DELETE` | `/shorten/:code`       | `204 No Content` | `404`            |
| `GET`    | `/shorten/:code/stats` | `200 OK`         | `404`            |

## Regras

- O código curto (`shortCode`) é único e gerado aleatoriamente.
- `accessCount` começa em 0 e é incrementado de forma **atômica**.
- Enquanto não houver redirecionamento, o acesso é contado no `GET /shorten/:code` bem-sucedido, **não** no `/stats`.
- Opcionais: `GET /:code` (redirecionamento) e `GET /health` (técnico; não conta como endpoint do desafio).
- Não adicionar `GET /shorten` (listagem) sem uma nova decisão.

## Fora do MVP

- Autenticação, roles ou cadastro de usuários.
- Endpoint de listagem geral `GET /shorten`.
- Histórico individual de visitas ou gráficos temporais.
- Arquitetura hexagonal completa ou Repository Pattern genérico.
- Redis, filas, cache distribuído ou pagamentos.
- Deploy automático ou publicação automática de releases.

## Definição de pronto

Uma issue só fica **Done** com comportamento implementado, testes pertinentes aprovados, documentação atualizada e CI passando.
