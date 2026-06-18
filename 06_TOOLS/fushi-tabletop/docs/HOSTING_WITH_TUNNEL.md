# Hosting With Tunnel

O FUSHI Multiplayer V1 hospeda um servidor local no PC do mestre. Para jogar pela internet, use um tunnel externo apontando para a porta local do FUSHI.

## Fluxo

```txt
FUSHI.exe do mestre
  -> Hospedar sessao na porta 3030
  -> Tunnel externo aponta para localhost:3030
  -> Jogadores conectam no endereco publico do tunnel
```

## Recomendacao atual

Para mesa real, nao use `trycloudflare` rapido como solucao principal. Ele gera uma URL aleatoria, e a propria Cloudflare trata Quick Tunnels como ambiente de teste/desenvolvimento, sem SLA ou garantia de uptime. O melhor caminho gratuito/baixo custo para o FUSHI hoje e:

1. **Cloudflare Tunnel nomeado**: melhor opcao para mesa fixa. Exige conta Cloudflare e, idealmente, um dominio/subdominio seu apontando para o tunnel. A URL para os jogadores fica estavel, por exemplo `mesa.seudominio.com`, e o `cloudflared` pode ser rodado como servico no PC do mestre.
2. **ngrok Dev Domain**: segunda opcao mais simples. A conta gratis tem um Dev Domain automatico e fixo para endpoints publicos. Funciona com WebSocket via endpoint HTTP/HTTPS. Limite: no plano gratis voce nao escolhe o nome do dominio.
3. **Tailscale Funnel**: bom se voce aceitar configurar Tailscale. Expoe um servico local na internet com URL propria do tailnet, mas tem limites de porta/banda e exige CLI/politicas.
4. **Netlify**: nao e indicado para o servidor ao vivo do FUSHI. Netlify Functions sao serverless e respondem a eventos/requisicoes; isso serve para update feed, pacote de campanha e APIs leves, mas nao para manter uma sala WebSocket viva como o mestre precisa.

`trycloudflare` ainda serve para teste rapido, mas nao deve ser tratado como servidor de sessao.

## Playit.gg, Cloudflare Nomeado Ou Ngrok

O app nao integra automaticamente com playit.gg/ngrok nesta versao.

Configuracao generica:

1. Mestre hospeda FUSHI na porta `3030`.
2. Abrir a ferramenta de tunnel escolhida.
3. Criar tunnel TCP/HTTP/WebSocket para `localhost:3030`.
4. Copiar endereco publico gerado.
5. Enviar aos jogadores:
   - endereco do tunnel;
   - porta externa, se a ferramenta exigir;
   - codigo da sessao FUSHI.

## Jogador

No app:

1. Abrir `Multiplayer`.
2. Informar host/endereco do tunnel.
3. Informar porta.
4. Informar codigo da sessao.
5. Clicar `Entrar em sessao`.
6. Escolher Jogador 1-5 na entrada normal da mesa e digitar a senha.
7. Entrar em `Jogar > Mesa`.

## Seguranca

- Nao exponha portas desnecessarias.
- Use codigo de sessao novo por mesa.
- Encerre o servidor quando terminar.
- Jogador so recebe estado publico filtrado.
- MUN completo e dados privados continuam no PC do mestre.
- A tela do jogador remoto reutiliza a mesma mesa do jogador local; nao existe mini mesa separada para multiplayer.

## Limites

- Se o tunnel cair, jogadores desconectam.
- Quick Tunnels do Cloudflare sao teste/dev; prefira tunnel nomeado para sessao real.
- Firewalls/antivirus podem bloquear a porta local.
- V1 nao tem autenticao forte, ban, sala persistente ou criptografia propria.
