# Updates gratis usando seu PC

Este fluxo e para alpha entre amigos. Seu PC vira o servidor de update e o app dos amigos salva a URL no hub, no campo `Canal de updates`.

## Opcao A: Cloudflare Quick Tunnel

Vantagem: gera uma URL HTTPS publica sem dominio pago.
Limite: a URL costuma mudar quando o tunnel e reiniciado.

1. Instale o `cloudflared` e deixe ele no PATH do Windows.
2. Gere a build:
   - `npm run release:installer`
3. Inicie o servidor/tunnel:
   - `npm run updates:serve-tunnel`
4. Copie a URL `https://...trycloudflare.com` que aparecer no terminal.
5. Envie essa URL aos amigos.
6. No hub do app, eles colam a URL em `Canal de updates`, clicam `Salvar`, depois `Atualizar`.

Deixe seu PC e o terminal abertos enquanto eles estiverem baixando o update.

## Opcao B: Tailscale

Vantagem: URL/IP mais estavel para um grupo pequeno.
Limite: seus amigos tambem precisam instalar Tailscale e entrar na sua rede.

1. Instale Tailscale no seu PC e nos PCs dos amigos.
2. Rode:
   - `npm run release:installer`
   - `npm run updates:serve-lan`
3. No Tailscale, pegue o IP do seu PC, normalmente `100.x.x.x`.
4. Envie aos amigos:
   - `http://100.x.x.x:8765`
5. No hub do app, eles salvam essa URL em `Canal de updates` e clicam `Atualizar`.

Esse modo usa HTTP dentro da rede privada do Tailscale. Para alpha entre amigos e aceitavel; para publico/comercial, use HTTPS fixo.

## Quando voce me pedir para atualizar

Eu faco este ciclo:

1. Altero o app.
2. Testo build e multiplayer.
3. Subo a versao do `package.json`.
4. Rodo `npm run release:installer`.
5. Voce inicia `npm run updates:serve-tunnel` ou `npm run updates:serve-lan`.
6. Os amigos usam o hub para atualizar.

## Importante

- O app atual precisa ser reinstalado com uma build que ja tenha o campo `Canal de updates`.
- Se a URL do tunnel mudar, envie a nova URL para os amigos salvarem no hub.
- Nao feche o servidor/tunnel enquanto alguem estiver baixando o pacote.
