# Architecture Decision Records (ADRs)

Registro das decisões arquiteturais importantes. Cada ADR é um arquivo `NNNN-titulo-curto.md` nesta pasta.

## Índice

| #                                                        | Decisão                                                               | Status |
| -------------------------------------------------------- | --------------------------------------------------------------------- | ------ |
| [0001](0001-prisma-7-driver-adapter.md)                  | Prisma ORM 7 com driver adapter `pg` e client CJS                     | Aceita |
| [0002](0002-uuid-v7-como-chave-primaria.md)              | UUIDv7 como chave primária de `urls`                                  | Aceita |
| [0003](0003-contrato-http-envelope-e-problem-details.md) | Contrato HTTP: envelope `{ data }`, Problem Details (RFC 9457) e i18n | Aceita |
| [0004](0004-limites-de-abuso.md)                         | Limites de abuso: rate limit em memória e validação de entrada        | Aceita |

## Template

```markdown
# NNNN. Título da decisão

- **Status:** Proposta | Aceita | Substituída por NNNN | Descontinuada
- **Data:** AAAA-MM-DD

## Contexto

Qual problema ou força motivou a decisão?

## Decisão

O que foi decidido.

## Consequências

Impactos positivos, negativos e trade-offs.
```
