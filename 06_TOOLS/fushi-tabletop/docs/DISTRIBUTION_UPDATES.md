# Distribuicao e updates remotos

Este app usa `electron-builder` com instalador `nsis-web` e `electron-updater`.
O App Core deve ficar separado da biblioteca de conteudo. Mapas, MUNDI, objetos 3D, videos e interludios pesados ficam fora do instalador principal.

Veja tambem `docs/CONTENT_ARCHITECTURE.md`.

## Uma vez antes do primeiro release publico

1. Escolha um host HTTPS estatico para os updates.
   - Exemplos: Cloudflare R2/Pages, S3, servidor proprio, GitHub Releases com provider proprio.
   - O host precisa servir arquivos comuns por URL publica, sem login.
2. Troque a URL em `electron-builder.json`.
   - Atual: `https://updates.example.invalid/rpg-fushi/win`
   - Exemplo final: `https://updates.seudominio.com/rpg-fushi/win`
   - Comando recomendado:
     - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/configure-update-feed.ps1 -Url "https://updates.seudominio.com/rpg-fushi/win"`
3. Gere e instale uma build de teste:
   - `npm run release:installer`
   - Instalador gerado em `release/nsis-web/`.
4. Para distribuicao publica, assine o executavel com certificado de code signing.
   - Sem assinatura o app ainda instala, mas o Windows SmartScreen pode bloquear ou assustar usuarios.

## Publicar uma nova versao

1. Feche qualquer `RPG FUSHI.exe` aberto a partir de `release/win-unpacked`.
2. Aumente `version` em `package.json`.
   - Use sempre uma versao maior que a anterior.
   - Exemplo: `0.1.0-alpha.2` -> `0.1.0-alpha.3`.
3. Rode:
   - `npm run release:installer`
4. Envie para a mesma pasta publica do canal de update:
   - `release/nsis-web/latest.yml`
   - `release/nsis-web/RPG-FUSHI-Web-Setup-<versao>-x64.exe`
   - `release/nsis-web/fushi-tabletop-<versao>-x64.nsis.7z`
5. Nao apague os artefatos antigos imediatamente.
   - O update diferencial pode precisar consultar metadados/pacotes anteriores.
   - Mantenha pelo menos as ultimas versoes publicadas.
6. Teste atualizacao real:
   - Instale a versao antiga pelo instalador.
   - Publique a versao nova no host.
   - Abra o app antigo e use o hub: `Atualizar` -> `Baixar update` -> `Instalar update`.

## Preparar biblioteca local do mestre

Rode:

- `npm run content:install-local`

Isso copia `public/assets` para `%APPDATA%\FUSHI\library\assets`. O App Core busca assets nesse local antes de tentar os assets empacotados.

## Publicar por HTTPS com Cloudflare R2

Este e o caminho recomendado para o pacote atual porque o arquivo `.nsis.7z` passa de 3 GB.

1. Crie um bucket no Cloudflare R2, por exemplo `rpg-fushi-updates`.
2. Configure um dominio/subdominio publico HTTPS apontando para o bucket.
   - Exemplo: `https://updates.seudominio.com`.
3. Faca login no Wrangler uma vez nesta maquina:
   - `npx --yes wrangler@latest login`
4. Configure o feed final no app:
   - `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/configure-update-feed.ps1 -Url "https://updates.seudominio.com/rpg-fushi/win"`
5. Gere e publique:
   - `npm run release:installer`
   - `npm run updates:publish-r2 -- -Bucket rpg-fushi-updates -Prefix rpg-fushi/win`

O script publica o pacote `.7z` e o instalador primeiro, e envia `latest.yml` por ultimo para evitar que o app encontre uma versao antes de todos os arquivos estarem no ar.

Se quiser fazer tudo em um comando depois que a URL estiver configurada:

- `npm run updates:publish-r2 -- -Bucket rpg-fushi-updates -Prefix rpg-fushi/win -Build`

## Enviar para amigos antes do servidor remoto

Enquanto a URL publica ainda nao estiver configurada, envie estes tres arquivos juntos, na mesma pasta ou dentro de um ZIP:

- `release/nsis-web/RPG-FUSHI-Web-Setup-<versao>-x64.exe`
- `release/nsis-web/fushi-tabletop-<versao>-x64.nsis.7z`
- `release/nsis-web/latest.yml`

O amigo deve extrair tudo para a mesma pasta e abrir o `RPG-FUSHI-Web-Setup-<versao>-x64.exe`.
Nesse modo o app instala, mas o botao de update remoto fica desativado ate existir URL publica configurada em uma build futura.

## Sem dominio pago

Para alpha privado, tambem existe o fluxo gratis com o seu PC servindo os updates:

- `npm run updates:serve-tunnel` para Cloudflare Quick Tunnel.
- `npm run updates:serve-lan` para LAN/Tailscale.

Veja o passo a passo em `docs/FREE_UPDATES_PC_SERVER.md`.

## Testar update local sem servidor publico

1. Gere uma versao antiga e instale.
2. Aumente `version` em `package.json`.
3. Rode `npm run release:installer`.
4. Em um terminal, rode:
   - `npm run updates:serve-local`
5. Em outro terminal, abra o app instalado apontando para o feed local:
   - `powershell -NoProfile -Command "$env:FUSHI_UPDATE_FEED_URL='http://127.0.0.1:8765'; & \"$env:LOCALAPPDATA\Programs\RPG FUSHI\RPG FUSHI.exe\""`
6. No hub, use `Atualizar` -> `Baixar update` -> `Instalar update`.

## Testar multiplayer antes de publicar

Rode:

- `npm run smoke:multiplayer`

Esse teste sobe um servidor temporario, autentica `player1`, recebe estado publico, move um token e envia um log remoto.

## O que nao distribuir como canal principal

- Nao use `release/win-unpacked` para usuario final quando quiser update remoto.
- Essa pasta serve para teste local e ZIP alpha, mas o updater do Windows espera uma instalacao NSIS.
- Nao use instalador NSIS offline unico para a build completa atual: o pacote grande passa do limite pratico do NSIS embutido.

## Observacoes importantes

- Campanhas, assets e backups ficam fora da pasta instalada, na area de dados do app. Atualizar o executavel nao deve apagar dados do mestre.
- O multiplayer continua usando a mesma aplicacao; o updater so troca a build instalada.
- Para teste local de feed, inicie o app instalado com a variavel `FUSHI_UPDATE_FEED_URL` apontando para uma URL alternativa.
