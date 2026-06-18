# FUSHI DT Audit - 2026-05-27

Objetivo: registrar todos os pontos encontrados com DT explicita e migrar a escala para a nova matematica.

## Escala oficial

| DT | Uso |
| --- | --- |
| 10 | rotina sob pressao |
| 15 | comum treinado |
| 20 | dificil Basico |
| 25 | dificil Avancado |
| 30 | dificil Ascensao |
| 32 | cataclismico inicial |
| 35 | teto sem item forte |
| 40+ | exige item, ritual, ajuda, condicao ou evento |

## DTs encontradas no app/docs

### MUN - encontrar local/rota

Antes:

- Local oficial: `dtEncontrar = 12` para quase todos os pontos.
- Exploracao livre temporaria: `dtEncontrar = 8`.
- Fallback tecnico de local/rota: `10`.

Agora:

- Ponto baixo risco: DT 15.
- Ponto medio/medio-alto: DT 20.
- Ponto alto: DT 25.
- Ponto cataclismico: DT 32.
- Fallback tecnico de local/rota: DT 20.
- Ponto 1, Caverna do Primeiro Corpo: DT 0, porque e inicio da campanha.

Arquivos ajustados:

- `src/lib/worldMundiState.ts`
- `src/components/tabletop/TabletopWorldMundiPanel.tsx`

Observacao: campanhas ja persistidas podem manter DT antiga ate passarem por reset/migracao ou edicao manual no MUN.

### Reencarnacao de sessao 1

Antes:

- `docs/SESSION_1_MASTER_RUNBOOK_2026-05-30.md` usava DT 15.

Agora:

- Tutorial de sessao 1 usa DT 20.
- Regra completa usa a tabela de reencarnacao no documento central.

### Rituais

Antes:

- Formula antiga: `DT ritual = 12 + nivel_antigo_ritual*3 + distorcao_local - preparo`.

Agora:

- Basico: DT 20.
- Avancado: DT 25.
- Ascensao: DT 30.
- Cataclisma: DT 32+.
- Preparo, local correto, BASE, item e ajuda podem reduzir DT.

## O que ainda precisa varredura manual

- Fichas antigas podem ter habilidades com texto solto de DT que nao aparece como campo estruturado.
- Puzzles no texto dos mapas ainda sao descritivos; precisam virar fichas mecanicas com DT oficial.
- Bosses canonicos nao devem ser editados automaticamente; primeiro criar fichas mecanicas separadas de fase/boss.

## Regra de uso para novos conteudos

- Se o personagem especializado tem +10, DT 20 e pressao comum/dificil Basico.
- Se o personagem especializado tem +15, DT 25 e dificil real; DT 30 exige dado alto.
- DT 35 e o teto natural sem item/habilidade forte.
- DT 40+ so deve existir quando a cena oferece caminho de preparo.
