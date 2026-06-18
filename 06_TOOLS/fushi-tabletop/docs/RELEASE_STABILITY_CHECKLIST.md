# Release Stability Checklist

Objetivo atual: estabilizar o app empacotado antes de adicionar conteudo ou funcoes novas.

## Regra De Build

- O alvo real e `release/win-unpacked/RPG FUSHI.exe`.
- Toda mudanca importante precisa passar pelo app empacotado, nao so pelo dev server.
- Multiplayer e gate obrigatorio: Mestre -> Jogador e Jogador -> Mestre precisam continuar confiaveis.
- Jogador nao move token; apenas Mestre move tokens.
- Testes de release devem usar storage isolado (`FUSHI_APPDATA_ROOT`) para nao depender do perfil real do usuario.

## Gate Curto

Use quando a mudanca nao mexe em renderizacao pesada, multiplayer, assets ou empacotamento:

```bash
npm run lint -- --max-warnings=999
npm run smoke:ui
npm run smoke:multiplayer
```

## Gate De Release

Use antes de chamar uma build de estavel:

```bash
npm run lint -- --max-warnings=999
npm run base:diagnose
npm run asset:audit -- --top=12
npm audit --json
npm run release:installer
npm run release:assets
npm run smoke:release
npm run perf:release
```

## Gate Profundo

Use quando mexer em Mesa, 2D/3D, dados, VFX, objetos, DiceBox, asset resolver ou empacotamento:

```bash
npm run smoke:release:deep
```

Este gate abre o exe empacotado com CDP, storage temporario e probes em `scripts/release-deep-smokes/`.
Os screenshots ficam em `.codex-dev/release-deep/`.
Ele falha se algum smoke retornar `stable: false`, registrar erro de runtime ou perder asset/canvas esperado.

## Soak Multiplayer

Use antes de liberar uma build para teste real de Mestre/Jogador:

```bash
npm run smoke:multiplayer:soak
```

O soak repete o smoke multiplayer completo em processos isolados, com storage temporario,
portas dinamicas e relatorio em `.codex-dev/multiplayer-soak/`.
Ele nao substitui um teste LAN/tunel com pessoas reais, mas pega regressao de teardown,
ACK/idempotencia, fila de dados, aceite/recusa/expulsao e ficha remota em repeticao.

Para ajustar o tempo:

```bash
npm run smoke:multiplayer:soak -- --loops=8 --timeout-ms=90000
```

## Performance De Release

Use quando mexer em assets, Mesa, 3D, VFX ou readiness:

```bash
npm run perf:release
```

O diagnostico abre `release/win-unpacked/RPG FUSHI.exe` em `low`, `balanced` e `ultra`,
com storage isolado, mede readiness da mesa, readiness do 3D GM, FPS do overlay, heap JS,
working set do processo e salva screenshots em `.codex-dev/perf-release/`.

Para rodar so um smoke profundo:

```bash
npm run smoke:release:deep -- --only=3d-d20-impact
```

Para listar os nomes:

```bash
npm run smoke:release:deep -- --list
```

## Sequencia Das Proximas Builds

1. `0.1.0-alpha.83`: consolidar pipeline de estabilidade, scripts e checklist.
2. `0.1.0-alpha.84`: reduzir peso da release separando assets core de packs de campanha.
3. `0.1.0-alpha.85`: fazer soak multiplayer com reconexao, aceite/recusa/expulsao, ficha, dados e latencia.

## Travas Para Nao Aceitar Falso Positivo

- Nao aceitar smoke que imprime `stable: false` e sai `0`.
- Nao aceitar release que dependa de asset presente so em `public/` ou `dist/`.
- Topdowns grandes de Base ficam fora do core; o release deve conter os 24 WebPs equivalentes em `resources/assets/_optimized/`.
- GLBs pesados opcionais (`ship_pinnace`, `corrupted_dark_forest_ent`, `procedural_city_3`) ficam fora do core; pedra e espada continuam obrigatorios.
- O gate `release:assets` tambem protege o tamanho de `resources/assets` com orcamento core de 700 MB.
- O smoke profundo `optional-glb-presets` precisa confirmar que presets opcionais ausentes nao aparecem na biblioteca de OBJ.
- Nao aceitar teste que usa `%APPDATA%/FUSHI` real sem isolamento.
- Nao aceitar sucesso se houver `console.error`, `pageerror` ou request 4xx/asset ausente nao explicado.
- Nao adicionar conteudo novo enquanto o gate de release estiver vermelho.
