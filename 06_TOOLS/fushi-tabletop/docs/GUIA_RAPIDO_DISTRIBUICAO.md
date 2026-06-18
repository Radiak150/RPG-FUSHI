# Guia rapido: instalador e updates

## Para mandar agora para amigos

Para primeira instalacao simples, mande o instalador completo em `release/`:

- `RPG-FUSHI-Setup-0.1.0-alpha.39-x64.exe`

Ele ja contem o app core completo. O jogador baixa, abre e instala.

Se quiser usar o instalador web, mande os tres arquivos em `release/nsis-web/` juntos:

- `RPG-FUSHI-Web-Setup-0.1.0-alpha.39-x64.exe`
- `fushi-tabletop-0.1.0-alpha.39-x64.nsis.7z`
- `latest.yml`

Isso instala o App Core. Os dados do jogador/mestre e a biblioteca pesada ficam fora da pasta do app e nao devem ser apagados por updates.

## Pacote da campanha

O pacote atual da mesa e `FUSHI-KZT3KA`.

1. Mestre roda:
   - `npm run campaign-pack:build -- --code=FUSHI-KZT3KA`
   - `npm run updates:serve-tunnel`
2. Jogador cola a URL do canal de updates no Launcher.
3. Jogador informa `FUSHI-KZT3KA` em `Pacote da campanha` e clica `Baixar pacote`.

Isso baixa os assets pesados para `%APPDATA%\FUSHI\library\assets`; durante a mesa, o app usa o asset local e so pede ao mestre o que ainda nao existe ou foi improvisado.

## Para preparar o PC do mestre com a campanha FUSHI atual

No seu PC de mestre, rode:

- `npm run content:install-local`

Isso copia mapas, MUNDI, objetos, videos e biomas para `%APPDATA%\FUSHI\library\assets`.
O jogador nao precisa ter essa biblioteca para entrar na mesa; o multiplayer serve os assets do mestre sob demanda.

## Para update gratis usando seu PC

1. Rode:
   - `npm run updates:serve-tunnel`
2. Copie a URL `https://...trycloudflare.com` que aparecer.
3. Envie essa URL aos amigos.
4. No hub do app, eles colam no campo `Canal de updates`, clicam `Salvar`, depois `Atualizar`.

Deixe seu PC e o terminal abertos enquanto eles estiverem baixando.

## Para virar update remoto fixo de verdade

1. Crie uma pasta publica HTTPS para updates.
   - Exemplo: `https://updates.seudominio.com/rpg-fushi/win`
2. Configure a URL:
   - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/configure-update-feed.ps1 -Url "https://updates.seudominio.com/rpg-fushi/win"`
3. Gere a build:
   - `npm run release:installer`
4. Suba para essa URL publica os tres arquivos de `release/nsis-web/`.
5. Agora voce pode mandar so o `.exe` para instalar; ele baixa o pacote core da URL.

## Quando quiser atualizar todo mundo

1. Aumente a versao em `package.json`.
   - Exemplo: `0.1.0-alpha.2` para `0.1.0-alpha.3`
2. Rode:
   - `npm run release:installer`
3. Suba de novo os tres arquivos de `release/nsis-web/` para a mesma URL publica ou deixe o tunnel ativo.
4. Quem ja instalou abre o hub e clica:
   - `Atualizar`
   - `Baixar update`
   - `Instalar update`

## Antes de enviar uma build

Rode:

- `npm run build`
- `npm run smoke:multiplayer`
- `npm run release:installer`

O `npm run lint` ainda aponta problemas antigos fora do instalador/multiplayer. Nao use ele como bloqueio ate corrigirmos esses pontos.
