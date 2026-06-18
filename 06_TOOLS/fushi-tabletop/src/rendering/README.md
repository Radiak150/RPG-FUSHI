# Rendering

Camada visual avancada do FUSHI Tabletop.

Regras:

- Esta pasta nao deve guardar regra de campanha.
- Efeitos nao podem alterar estado de jogo diretamente.
- MAP/MUN continuam controlados por React/providers.
- PixiJS entra como camada 2D viva.
- Three.js fica para cenas 3D especiais.
- Qualidade visual deve respeitar `VisualQualityMode`.

Arquivos atuais:

- `biomeVisualPresets.ts`: identidade visual por bioma.
- `pixi/TabletopFxStage.tsx`: primeira camada Pixi nao interativa sobre o MAP.

