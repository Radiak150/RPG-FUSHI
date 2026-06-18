# Direcao visual FUSHI

Este documento registra a linha visual atual para manter o app coeso enquanto o MUN, MAP, fichas, audio e multiplayer evoluem.

## Regra principal

O app deve parecer uma mesa viva de RPG FUSHI, nao um painel tecnico. A interface precisa ser escura, limpa, legivel e cinematografica, mas sem esconder controles importantes do mestre.

## Qualidade visual

Preferencia local:

- `Low`: reduz animacoes, brilhos e blur para PCs fracos.
- `Equilibrado`: padrao atual, com brilho e movimento moderados.
- `Ultra`: ativa glows, pulso de rotas e efeitos mais expressivos.

## Uso de assets

Assets que o Codex pode criar com seguranca:

- selos vetoriais;
- marcadores SVG;
- texturas procedurais leves;
- overlays, brilhos e molduras;
- microinteracoes de UI.

Assets que devem vir do mestre para manter qualidade:

- mapas painterly finais;
- topdowns de locais;
- retratos principais;
- artes de biomas;
- tokens finais de NPCs importantes;
- assets de som reais.

## MUN

- Mapa geral usa a arte `mun_base_ilha_sem_labels.png` como realidade geografica.
- Contornos devem seguir a divisao manual de biomas sempre que possivel.
- Pontos de interesse devem parecer selos/marcadores de mapa, nao bolinhas genericas.
- Informacao de mestre fica em popovers e paineis discretos.
- Dados tecnicos/editoriais devem ficar no Editor, nao no fluxo Mestre.

## MAP

- MAP usa assets reais quando existirem.
- Efeitos de alcance, aura, rota, selecao e impacto podem ser programaticos.
- PixiJS/WebGL ficam reservados para camada visual 2D avancada quando a mesa estiver estavel.

## Dados e logs

- Rolagem publica deve ter impacto visual claro.
- Log/chat deve continuar legivel e funcional antes de ser decorativo.
- Logs tecnicos nunca devem poluir a mesa dos jogadores.

## Proximos passos visuais

1. Substituir marcadores temporarios do MUN pelos assets numerados finais.
2. Criar overlays por bioma com bordas mais precisas.
3. Criar tratamento visual de ficha/personagem para players.
4. Polir MAP com modo Ultra/Low e efeitos de token.
5. Integrar audio real por cena/bioma quando os loops estiverem prontos.

## Salto VFX registrado

O plano detalhado do salto visual esta registrado em:

- `docs/VFX_RENDERING_ARCHITECTURE.md`
- `docs/VFX_ASSET_SHOPPING_LIST.md`
- `docs/VFX_LIBRARY_RESEARCH.md`
- `docs/THREE_D_ASSET_RESEARCH.md`

Resumo operacional:

- React continua sendo a camada de app/interface.
- PixiJS sera usado para efeitos 2D vivos no MAP/MUN.
- Three.js sera usado para dados 3D, dominios e cinematicas especiais.
- Howler.js sera usado para audio real.
- Assets painterly finais devem vir do mestre e entrar pela `VFX_ASSETS_INBOX`.
