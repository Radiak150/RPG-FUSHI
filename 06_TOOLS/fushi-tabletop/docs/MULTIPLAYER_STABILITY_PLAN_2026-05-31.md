# Plano de estabilidade multiplayer FUSHI - 2026-05-31

## Diagnostico atual

- O app mistura WebSocket, HTTP `/action`, HTTP `/state`, polling e broadcast de snapshot completo.
- Acoes remotas nao possuem `actionId` obrigatorio, ACK confirmado, retry idempotente e ordem global.
- Movimento do jogador aplica otimismo local e depois recebe snapshot do servidor, abrindo espaco para rollback visual.
- Dados entram como log/chat, nao como evento autoritativo de rolagem com confirmacao propria.
- Tokens antigos guardam copia de arte (`topdownImageUrl`) que fica obsoleta quando a ficha muda.
- O servidor salva em disco e rebroadcasta estado completo com frequencia alta, o que pesa em sessao real.
- Assets grandes e estado vivo passam pelo mesmo app/tunnel, aumentando chance de travamento e queda.

## Regra de ouro

O servidor da sessao deve ser a fonte unica de verdade para:

- estado da mesa;
- posicao de token;
- vinculos de jogador;
- rolagens;
- interludios;
- chat/log publico;
- permissao por perfil.

Cliente pode animar, prever e deixar a interface bonita, mas nao pode ser dono definitivo do estado.

## Arquitetura alvo

1. Estado em memoria com versao
   - Servidor mantem `stateVersion` monotonicamente crescente.
   - Cada evento confirmado recebe `eventSeq`.
   - Disco vira persistencia por checkpoint/debounce, nao fonte lida e escrita a cada clique.

2. Protocolo unico de acoes
   - Cliente envia `clientAction` com `actionId`, `playerId`, `stateVersionSeen`, `type`, `payload`.
   - Servidor valida permissao, aplica ou rejeita.
   - Servidor responde `actionAck` para o autor com status, `actionId`, `eventSeq`, `stateVersion`.
   - Servidor transmite `statePatch`/`domainEvent` para todos.
   - Reenvio do mesmo `actionId` nunca duplica dado, chat, movimento ou ficha.

3. Sincronizacao por eventos, snapshot so para entrada/reparo
   - Ao entrar: cliente baixa snapshot completo.
   - Durante a sessao: recebe patches pequenos.
   - Se perder versao: pede `resyncSnapshot`.
   - Nada depende de "digitar no chat" ou "trocar mapa" para atualizar.

4. Dados autoritativos
   - Jogador pede `rollDice`.
   - Servidor gera os resultados, registra o `RollRecord`, e transmite `rollEvent`.
   - Todos animam o mesmo resultado com o dado 3D local.
   - O resultado existe antes da animacao, entao travar animacao nao perde o dado.

5. Movimento sem rollback
   - Jogador clica no token e destino.
   - Cliente pode mostrar preview "pendente".
   - So confirma visual final quando chega `actionAck/statePatch`.
   - Se rejeitado, mostra motivo claro, sem ficar pulando 5 vezes.

6. Vinculo global de jogador
   - Criar mapa unico `playerBindings`: `playerId -> characterId/bodyId`.
   - Spawnar esse personagem em qualquer mapa herda permissao automaticamente.
   - Um jogador nao pode ter dois corpos controlaveis ao mesmo tempo.

7. Assets fora do canal vivo
   - Pacote da campanha baixa assets pesados localmente.
   - Imagem/video improvisado entra como asset novo com URL/cache, nao dentro do estado.
   - Estado vivo carrega somente ids, URLs e metadados pequenos.

8. Telemetria visivel
   - HUD opcional de ping, FPS, reconexao, fila pendente e ultima acao confirmada.
   - TAB mostra jogadores conectados, ping, pacote da campanha e estado de sync.
   - Logs de servidor precisam registrar `actionId`, `eventSeq`, `stateVersion`, `playerId`.

## Ordem de implementacao

1. Corrigir fontes de verdade locais: imagem do token, vinculo global, ficha real.
2. Separar protocolo multiplayer em `actions`, `events`, `snapshots` e `assets`.
3. Trocar rolagem para evento autoritativo do servidor.
4. Trocar movimento para ACK + patch, removendo rollback otimista.
5. Trocar broadcast de snapshot completo por patches com versao.
6. Adicionar painel de ping/FPS/sync.
7. Fazer teste de carga local com 5 clientes automatizados por 60 minutos.
8. So depois escolher hospedagem definitiva: PC com tunnel nomeado, VPS, edge/serverless com estado duravel, ou servico realtime.

## Observacao sobre hospedagem

Cloudflare quick tunnel e bom para teste, mas nao e base confiavel de producao de mesa.
Netlify pode servir assets/update e possui Edge Functions com WebSocket API, mas tem limite de CPU por request; antes de mover a sessao viva para la, precisa validar se o modelo suporta conexoes longas + estado compartilhado sem cair em limitacao de edge/serverless.
