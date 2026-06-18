# Proximo Chat - VFX Premium e Estabilidade

Use este documento como contexto inicial do proximo chat. O app real que o usuario testa e sempre:

`C:\RPG FUSHI\RPG-FUSHI\06_TOOLS\fushi-tabletop\release\win-unpacked\RPG FUSHI.exe`

Sempre que alterar o app, rodar `npm.cmd run electron:build` em `C:\RPG FUSHI\RPG-FUSHI\06_TOOLS\fushi-tabletop` e validar no `release\win-unpacked`.

## Estado Atual

- Objetos 3D GLB estao bem mais estaveis.
- Animações colocaveis ja entram pela aba `Animacoes`.
- VFX no 2D agora ficam como proxy tecnico invisivel/stage-backed, sem mini-canvas e sem label tipo `FOL`.
- O 3D GM ja carrega floor/mapa e waterSurface no Alto Mar.
- A agua/VFX atuais ainda sao placeholders bons para prototipo, mas nao sao o nivel final desejado.

## Bugs/Detalhes Ainda Observados

1. A animacao do dado `1d20` nao faz mais a mesa sumir infinitamente, mas ainda trava/buga o 3D. Sair e entrar no `3D GM` restaura imediatamente.
2. Em edicao 3D, `Esc` existe, mas falta `Enter` para confirmar/soltar o objeto atual. Comportamento desejado: `Enter` limpa selecao do objeto, solta o gizmo e deixa o item como "fixado aqui"; `Esc` continua para cancelar/parar fluxo.
3. Ha pequenos fallbacks/reloads visuais do tabuleiro sumindo e voltando brevemente.
4. Trocar rapido entre abas `Objetos` e `Animacoes` pode fazer o mapa desaparecer por um instante e voltar.
5. No 2D, VFX de chuva/raio ficam aceitaveis como topdown, mas a escolha dos assets finais precisa considerar leitura de cima e camera 3D obliqua.

## Primeira Prioridade do Proximo Chat

Antes de buscar VFX bonitos, estabilizar estes pontos:

- Isolar totalmente o impacto do dado 3D (`boardImpact`) da cena principal do tabuleiro.
- Garantir que impacto critico/triumph nao remonte o renderer, nao dispose o floor/water, nao zere `runtimeObjectNodes`, e nao trave o loop de render.
- Adicionar `Enter` no editor 3D para confirmar objeto:
  - `Enter`: detach do `TransformControls`, limpar `selectedObjectId`, manter objeto no local.
  - `Esc`: cancelar placement/edicao como ja faz hoje, sem quebrar selecao normal.
- Auditar `getObjectRuntimeKey` e fluxo de tabs para evitar rebuild de objetos/renderer quando apenas seleciona, muda aba, abre painel ou alterna UI.
- Criar smoke test no exe:
  - entrar mesa;
  - colocar chuva + raio;
  - entrar `3D GM`;
  - rolar `1d20` com resultado 1 e 20 via estado/test hook ou simulacao;
  - verificar `floorTexture=loaded`, `waterSurface=loaded`, frame loop continua, sem console error;
  - alternar `Objetos`/`Animacoes` 20 vezes e confirmar que imagem/canvas nao somem.

## Caminho Certo Para VFX Realmente Bons

Nao tentar desenhar tudo na mao com CSS/SVG/shader gigante. O usuario quer grafico real/premium, entao a abordagem deve ser por assets e engines:

1. **2D Topdown**
   - Usar flipbooks/spritesheets reais com alpha para chuva, splash, nevoa, folhas, brasas, lava e raios.
   - Usar PixiJS para animar atlas/flipbook e particulas leves.
   - Cada VFX deve ter uma versao topdown propria quando a leitura de cima ficar ruim.

2. **3D GM**
   - Usar `three.quarks` ou `EffekseerForWebGL` para particulas 3D reais.
   - GLB/FBX/flipbook de VFX deve ser carregado sob demanda, nao tudo junto.
   - Chuva, raio, nevoa e folhas devem ser efeitos ancorados no tabuleiro, nao overlay preso na tela.

3. **Agua/Lava/Vento**
   - Agua final deve ter assets dedicados: normal maps, flipbooks de espuma/splash/cachoeira e, se possivel, shader leve so para deslocamento/reflexo.
   - A agua nao pode apagar o mapa topdown; ela deve ficar em volta, nas bordas, ou como objeto removivel em cima do mapa quando for intencional.
   - Lava segue o mesmo modelo: base visual real + glow/particulas + opcional shader leve.

4. **Biblioteca de Animacoes**
   - Criar metadados por VFX:
     - `id`
     - `name`
     - `biomeTags`
     - `topdownRenderer`
     - `threeRenderer`
     - `assetUrls`
     - `qualityCost`
     - `defaultScale`
     - `defaultHeight`
     - `loop`
     - `visibility`
   - VFX deve poder ser selecionada, movida, duplicada, removida e escondida como objeto 3D.
   - No 2D, proxy invisivel/barreira tecnica; no 3D, efeito real.

## Assets/Repos Para Pesquisar

Pesquisar primeiro assets gratuitos/CC0/MIT e registrar licenca antes de importar:

- Kenney: bom para prototipo, nao suficiente para final premium.
- Poly Haven / ambientCG: texturas, normals, HDRI, materiais.
- `three.quarks`: particulas 3D em Three.js.
- `EffekseerForWebGL`: efeitos prontos exportaveis para WebGL.
- OpenGameArt / itch.io free VFX packs: procurar flipbooks/spritesheets com licenca clara.
- Sketchfab/Fab/CGTrader: usar apenas assets com licenca adequada e preferir GLB 1k/2k otimizavel.

## Nao Fazer

- Nao colocar PNG-sheet inteiro voando como particula.
- Nao mostrar label/nome em cima da VFX no tabuleiro.
- Nao fazer a VFX apagar o mapa.
- Nao prender VFX em grid visual agressivo.
- Nao carregar todos os assets pesados na abertura da mesa.
- Nao substituir a logica de objetos atual sem primeiro entender onde ela sincroniza multiplayer/sessao.

## Prompt Curto Para Colar No Proximo Chat

Continue a build do FUSHI Tabletop em `C:\RPG FUSHI\RPG-FUSHI\06_TOOLS\fushi-tabletop`. Leia primeiro `docs/NEXT_CHAT_CONTEXT.md`, `docs/NEXT_CHAT_VFX_HANDOFF.md`, `docs/VFX_LIBRARY_RESEARCH.md` e `docs/MAQUETE_3D_TABLETOP_CONTEXT.md`. O app real que eu testo e `release\win-unpacked\RPG FUSHI.exe`, entao toda alteracao precisa rodar `npm.cmd run electron:build`.

Prioridade 1: corrigir o bug do impacto do dado `1d20` no modo `3D GM`, que ainda trava/buga o 3D ate eu sair e entrar. O impacto nao pode remontar renderer, dispose floor/water, nem travar render loop. Adicione smoke test no exe para d20 critico/falha com `3D GM` ativo.

Prioridade 2: adicionar `Enter` para confirmar/soltar objeto no editor 3D, limpando selecao e detachando gizmo sem cancelar tudo como `Esc`.

Prioridade 3: remover mini fallback/reload do tabuleiro ao alternar rapido `Objetos`/`Animacoes` e ao trocar UI. Audite runtime keys/rebuilds para a UI nao reconstruir mapa/renderer sem necessidade.

Depois disso, comece a arquitetura de VFX premium: substituir placeholders por assets reais/flipbooks/three.quarks/Effekseer, com versao topdown e versao 3D para cada efeito, carregamento sob demanda, licencas registradas e sem apagar o mapa.
