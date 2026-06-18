# Multiplayer Tunnel Options - 2026-06-01

Objetivo: substituir o `trycloudflare` rapido por uma opcao gratuita ou quase gratuita que aguente sessoes do FUSHI com menos queda e URL estavel.

## Decisao

Opcao recomendada para a proxima rodada: **Cloudflare Tunnel nomeado**.

Motivo: continua rodando o servidor no PC do mestre, mas troca a URL descartavel do Quick Tunnel por uma rota duravel. Isso reduz a parte mais fragil que aconteceu na sessao: tunnel temporario caindo, URL mudando, streams de asset interrompidas e reconexao manual dos jogadores.

## Ranking

| Opcao | Usar para | Pontos fortes | Limites |
| --- | --- | --- | --- |
| Cloudflare Tunnel nomeado | Mesa oficial | URL estavel, sem abrir porta no roteador, suporta HTTP/WebSocket, pode rodar como servico | Requer conta Cloudflare e idealmente dominio/subdominio |
| ngrok Dev Domain | Plano B simples | Dominio gratis fixo na conta, setup rapido, WebSocket via endpoint HTTP/HTTPS | Dominio gratis nao e escolhido por voce, limites de plano gratis |
| Tailscale Funnel | Mesa com setup tecnico | Bom para rede privada/publicacao controlada | Jogadores/setup dependem de Tailscale; limites de porta e politica |
| Netlify | Updates, assets, APIs leves | CDN/hosting estatico excelente | Nao e host persistente para sala WebSocket viva |
| trycloudflare rapido | Teste rapido | Quase zero setup | URL aleatoria, sem SLA, sem garantia de uptime |

## O que fazer no app

1. Manter `trycloudflare` como fallback de teste.
2. Preparar um script separado para `cloudflared tunnel run fushi-tabletop`.
3. Deixar a tela `NET` do app mostrar:
   - socket aberto/fechado;
   - ping;
   - acoes pendentes;
   - ultimo ACK;
   - tentativas de retry;
   - reconexoes;
   - jogadores conectados.
4. Quando a URL duravel existir, salvar essa URL como host padrao da campanha.

## Fontes oficiais consultadas

- Cloudflare Quick Tunnel: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/
- Cloudflare Tunnel remoto/nomeado: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel/
- ngrok Domains: https://ngrok.com/docs/universal-gateway/domains/
- Tailscale Funnel: https://tailscale.com/kb/1223/funnel
- Netlify Functions: https://docs.netlify.com/build/functions/overview/
