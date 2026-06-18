# Content Readiness - Fonte De Verdade

Data: 2026-06-16

Este arquivo aponta para os artefatos que devem guiar o trabalho de estabilidade,
otimizacao e conteudo novo do FUSHI Tabletop.

## Arquivos principais

| Arquivo | Uso |
| --- | --- |
| `docs/planejamento/campanha-controle.json` | Modelo editavel e simples de producao da campanha: app, lore, protagonistas, NPCs, mobs, bosses, biomas, audio, VFX e protocolos. |
| `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx` | Planilha principal para ver o que esta estavel, o que falta e como testar. |
| `.codex-dev/content-readiness-audit.json` | Snapshot tecnico gerado por `npm run content:audit`. |
| `.codex-dev/content-readiness-actions.csv` | Backlog operacional resumido. |
| `.codex-dev/content-map-status.csv` | Tabela por mapa da biblioteca/MUN. |
| `.codex-dev/content-heavy-originals.csv` | Lista de originais pesados cobertos por WebP. |
| `.codex-dev/mun-interludes-audit.json` | Auditoria tecnica de interludios automaticos do MUN. |
| `.codex-dev/mun-interlude-thumbnails/*` | Folhas de contato para revisar thumbs visualmente. |
| `release-codex/baselines/alpha83-stable-20260616/baseline-manifest.json` | Manifesto do backup da alpha.83 estavel. |

## Resultado atual da auditoria

| Medida | Valor |
| --- | ---: |
| Mapas na biblioteca | 123 |
| Locais MUN | 68 |
| Submapas MUN | 56 |
| Interludios automaticos | 119 |
| Issues tecnicas MUN | 0 |
| Thumbs MUN validas | 119 / 119 |
| Thumbs pretas/vazias | 0 |
| Gaps core/library | 24 |
| Pack campanha atual | 4366 MiB |
| Originais pesados cobertos por WebP | 101 / 101 |
| Economia potencial estimada | 3074.1 MiB |
| Slots de tema de personagem vazios | 5 / 5 |
| Personagens do workspace real | 51 |
| Pastas de lore lidas | 53 |
| Protagonistas reais | 7 |
| Fichas avancadas/boss em foco | 15 |
| Boss Cataclisma | 9 |
| Biomas MUN | 8 |

## Leitura correta dos gaps

Os 24 gaps core/library nao significam que o app esta quebrado. Eles indicam
que algumas thumbs sao fornecidas pelo core do app em vez da biblioteca local.
Isso e aceitavel para alpha.83, mas deve virar decisao explicita no alpha.84:
ou permanecem no core, ou entram no pack obrigatorio com garantia de instalacao.

## Regra para conteudo novo

Todo conteudo novo deve entrar com:

1. asset original, se existir, separado do runtime quando for pesado;
2. thumb 640 valida;
3. derivado leve WebP/video otimizado quando aplicavel;
4. entrada em manifest;
5. fallback para low/balanced quando existir 3D/VFX/video;
6. smoke ou auditoria que rode no release empacotado;
7. licenca/fonte registrada quando for audio, VFX, imagem ou modelo externo.

## Comando para atualizar a fonte de verdade

```powershell
npm run mun:interludes:audit
npm run content:audit
```

Depois desses comandos, regerar a planilha:

```powershell
& "C:\Users\danie\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".codex-dev\artifact-work\build-alpha84-control-workbook.mjs"
```

## Como usar a planilha

- `Controle`: painel simples de producao da campanha; clique nas frentes para ir direto para a aba.
- `App_Base`: checklist do app estavel que nao pode regredir.
- `Campanha_Checklist`: checklist simples de lore, mobs, boss, mundo, audio, VFX e mapas.
- `Protagonistas_Controle`: app + corpo real + corpo da Vila + premissa sem misturar segredo de lore com ficha visivel.
- `NPCs_Mobs`: separa NPC, mob, boss e placeholder/teste.
- `Bosses_Rituais`: painel de producao para Boss Cataclisma, rituais, fases, mapas, VFX, audio e estado.
- `Biomas_Mapas`: painel por bioma/MUN para decidir lore, mapa, interludio, evento e destaque visual.
- `Audio_VFX`: backlog de trilhas, SFX, VFX, habilidades lendarias, dominio e topdown animado.
- `Painel`: visao mais visual do que esta OK, em foco ou critico.
- `Resumo`: leitura executiva do estado atual.
- `Backlog`: o que fazer por prioridade.
- `Core_vs_Pack`: decisao de empacotamento para alpha.84.
- `MUN_Assets`: linha por mapa/thumb/asset.
- `Peso_Assets`: originais pesados candidatos ao split.
- `Checklist_Teste`: roteiro de teste fisico.
- `NPC_Mecanicas`: quadro geral de personagens reais vindos do workspace persistido, com lore, habilidades, animacoes, token e encaixe de mesa.
- `Protagonistas`: somente personagens tipo `player`; nomes repetidos em NPC nao entram aqui.
- `Bosses_Fases`: ficha avancada, boss e Cataclisma; deve explicitar fases, mapas, aparencias, VFX/3D, interludios e controle de estado.
- `Faccoes`: visao por faccao, cruzando app/workspace/lore.
- `Mundo_Biomas`: visao por bioma do MUN para decidir mapas, interludios, riscos, faccoes e conteudo pendente.
- `Conteudo_Futuro`: como entrar com audio, VFX, topdown animado e novos sistemas sem retrabalho.

## Regra dos personagens

- Fonte aceita: `%APPDATA%\FUSHI\workspace.json`, ou o workspace isolado por `FUSHI_APPDATA_ROOT`.
- Fonte de lore aceita: `C:\RPG FUSHI\RPG-FUSHI\01_LORE\npcs\Facções`.
- Fonte proibida como verdade de campanha: `src/data/mock/characters.ts`, backups antigos, seeds e repros de `.codex-dev`.
- Se a fonte nao for `workspace real`, a planilha deve marcar critico e pedir correcao de origem.
- `OK ficha basica` significa que a ficha existe no workspace real com dados estruturados e lore rastreada; nao significa que arte, animacao, interludio ou lore final ja foram aprovadas.
- `FOCO - ficha avancada` significa que o personagem precisa de requisito extra: tema, imagem de lore, video, VFX/dominio, interludio ou regra especial.
- `FOCO - boss cataclisma` significa que a entidade precisa de planejamento completo antes de programar: fases, mapas, aparencias, VFX/3D, audio, interludios e estado de fase.

## Regra visual

- Verde: estavel/ok; nao precisa ser foco imediato.
- Amarelo: atencao/foco atual; planejar ou completar antes de crescer conteudo.
- Vermelho: critico; placeholder, falta estruturar ou bloqueia qualidade.

## Regra para todo chat/agente

Antes de concluir build relevante, rodada de estabilizacao ou entrada grande de
conteudo, atualizar esta fonte de verdade:

```powershell
npm run content:audit
& "C:\Users\danie\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".codex-dev\artifact-work\build-alpha84-control-workbook.mjs"
```

O resumo final da build deve citar se a planilha foi atualizada ou explicar por
que nao foi.
