# Placeholder / Template Audit

Auditoria de onde o app cria dados default, templates ou placeholders.

| Local | O que faz | Seguro? | Risco | Correcao |
|---|---|---|---|---|
| `src/lib/masterWorkspace.ts` | `createDefaultMasterWorkspace` cria campanha/personagens base quando nao existe workspace salvo | sim para instalacao nova | se workspace importado for invalido, pode cair no mock/base | mantido; nao deve sobrescrever workspace valido |
| `src/lib/tabletopSession.ts` | `createLegacyScene` cria cena de compatibilidade quando sessao antiga nao tem cenas | sim | pode parecer placeholder se export estiver incompleto | mantido para compatibilidade |
| `src/components/campaigns/*` | initials quando nao existe capa | sim | fallback visual apenas | nao persiste dado |
| `src/components/characters/*` | initials quando nao existe retrato | sim | fallback visual apenas | nao persiste dado |
| `src/components/tabletop/TabletopBoard.tsx` | fallback de token sem imagem | sim | fallback visual apenas | nao persiste dado |
| `src/components/tabletop/TabletopMapLibrary.tsx` | placeholder visual de mapa/transicao sem thumbnail | sim | fallback visual apenas | nao persiste dado |
| `src/components/tabletop/TabletopCinematic*` | placeholder visual quando cinematica nao tem preview | sim | fallback visual apenas | nao persiste dado |
| `src/components/tabletop/TabletopWorldMundiPanel.tsx` | `ensureLocationMap` / `ensureAllLocationMaps` gera placeholders MAP | seguro quando mestre clica em criar/sincronizar | pode poluir se disparado por "Ver no MAP" | corrigido: `openLocationMap` nao cria placeholder automaticamente |
| `src/pages/TablePage.tsx` | ao ativar/preparar mapa cria cena vazia se nao existir cena para aquele mapa | sim | cena real de mesa, nao template de asset | mantido |
| `src/data/mock/*` | dados base para app fresco | sim | aparecem quando nao ha workspace/storage real | nao devem ser aplicados por cima de campanha importada |

## Regra atual

- Campanha importada ou existente no storage nao deve receber placeholders persistidos automaticamente.
- Fallback visual e permitido na UI.
- Criacao de placeholder MAP so deve ocorrer por acao explicita como "Criar mapa local" ou "Gerar placeholders".
- Se asset falhar, o diagnostico registra; o app nao substitui por asset falso permanente.

## Correcao aplicada nesta rodada

`openLocationMap` deixou de gerar placeholder automaticamente quando o local do MUN nao tem `mapId`. Agora informa o mestre para usar "Criar mapa local" se realmente quiser gerar um placeholder.

