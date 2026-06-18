# Multiplayer V1 Testing

Multiplayer V1 e um servidor local hospedado pelo PC do mestre. Nao e cloud, nao tem login real online e nao faz NAT traversal proprio.

## Teste Local No Mesmo PC

1. Abrir `RPG FUSHI.exe`.
2. Entrar como Mestre.
3. Abrir a campanha desejada.
4. Ir em `Multiplayer`.
5. Informar porta `3030`.
6. Clicar `Hospedar sessao`.
7. Anotar o codigo da sessao.
8. Abrir outra janela do app.
9. Entrar em `Multiplayer`.
10. Em `Entrar como jogador`, usar:
   - host: `127.0.0.1`
   - porta: `3030`
   - codigo: codigo exibido pelo mestre
11. Clicar `Entrar em sessao`.
12. Escolher `Jogador 1` e digitar a senha configurada.
13. Confirmar que o jogador fica aguardando liberacao do Mestre.
14. No painel do Mestre, confirmar que aparece `player1`/`Jogador 1` como `Aguardando`.
15. Mestre clica `Aceitar`.
16. Confirmar que o jogador remoto entra em `Jogar > Mesa`, usando a mesma tela da visao local de jogador.
17. Confirmar que o MAP ativo e igual ao visto pela visao local do Jogador 1.
18. Mestre ativa outro mapa.
19. Confirmar que o jogador remoto recebe atualizacao.
20. Mestre move token visivel.
21. Confirmar que o jogador remoto ve a nova posicao.
22. Mestre vincula corpo/ficha ao Jogador 1.
23. Confirmar que o jogador ve a ficha correta vinculada.
24. Confirmar que o jogador nao consegue mover token nenhum.
25. No painel do Mestre, testar `Expulsar` em um jogador aceito.
26. Repetir entrada de outro jogador e testar `Recusar` antes de liberar a mesa.

## Teste LAN

1. Mestre hospeda na porta `3030`.
2. O painel mostra IPs locais, por exemplo `192.168.0.15:3030`.
3. Jogador na mesma rede abre o app.
4. Entra em `Multiplayer`.
5. Usa host `192.168.0.15`, porta `3030` e codigo da sessao.
6. Repetir testes de mapa ativo e token.

## Regras Esperadas

- Jogador recebe apenas estado publico.
- Jogador nao recebe MUN completo.
- Jogador nao recebe mapas em preparacao.
- Jogador nao recebe notas do mestre.
- Jogador nao pode ativar mapa.
- Jogador nao move tokens nesta mesa; apenas o Mestre reposiciona tokens.
- Vinculo de jogador serve para ficha/visibilidade/controle de personagem, nao para arrastar token.
- Entrada remota precisa de senha valida e aceite do Mestre.
- Mestre pode aceitar, recusar ou expulsar jogadores conectados.
- Servidor local do mestre e a fonte autoritativa.
- Multiplayer nao possui mesa paralela: ele reutiliza `Jogar > Mesa` e troca apenas a origem dos dados para WebSocket.

## Limites Do V1

- Nao existe servidor cloud.
- Nao existe conta/login online.
- Nao existe criptografia avancada.
- Sem NAT traversal proprio.
- Tunnel externo e manual.
- Validacao de permissao existe no servidor local, mas ainda nao substitui uma arquitetura comercial online.
- A conexao remota V1 autentica jogadores 1-5. Mestre remoto completo nao e habilitado nesta versao; o mestre autoritativo e o host local.
