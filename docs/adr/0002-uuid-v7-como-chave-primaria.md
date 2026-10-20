# 0002. UUIDv7 como chave primária de `urls`

- **Status:** Aceita
- **Data:** 2026-10-20

## Contexto

A tabela `urls` nasceu com `id SERIAL` (inteiro sequencial). O `id` aparece na resposta pública da API. Um inteiro sequencial revela quantas URLs existem e em que ordem foram criadas, e permite enumerar registros. Um UUIDv4 resolveria isso, mas é totalmente aleatório: espalha as inserções pelo índice B-tree da chave primária e não carrega a ordem de criação.

O PostgreSQL usado no projeto é o 17, que não tem a função `uuidv7()` nativa (ela chegou no 18).

## Decisão

- `Url.id` passa a ser `UUID`, no formato **UUIDv7** (RFC 9562): 48 bits de timestamp em milissegundos seguidos de bits aleatórios.
- O valor é gerado pelo **Prisma Client**, com `@default(uuid(7)) @db.Uuid`. O banco não tem `DEFAULT` na coluna.
- A migration `use_uuid_v7_for_url_id` troca `SERIAL` por `UUID` e preenche as linhas existentes com UUIDv7 derivado de `created_at`, para manter a ordem cronológica.
- O `shortCode` continua sendo o identificador usado nas rotas; o `id` só aparece nas respostas.

## Consequências

- O `id` não revela volume nem permite enumeração, e continua ordenável por tempo de criação.
- Inserções ficam próximas no índice, como acontecia com o `SERIAL`.
- Inserts feitos fora do Prisma Client (SQL cru, scripts, outro serviço) precisam informar o `id`. Ao migrar para o PostgreSQL 18, dá para mover a geração para o banco com `DEFAULT uuidv7()` em uma nova migration.
- A coluna `id` ficou na última posição da tabela, porque a migration usa `ADD COLUMN`. Isso não tem efeito funcional.
