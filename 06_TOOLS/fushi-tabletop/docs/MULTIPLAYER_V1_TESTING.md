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

## Teste Critico De Reentrada

1. Com o Jogador aceito, sair da Mesa para o Fluxo Principal, Livro e Multiplayer.
2. Confirmar que `Sessao ativa` aparece e `Voltar a mesa` nao pede novo aceite.
3. Derrubar temporariamente a conexao de rede e restaurar sem fechar o app.
4. Confirmar que o servidor abre socket novo e readmite a mesma instancia automaticamente.
5. Depois da reconexao, rolar um dado Jogador -> Mestre e outro Mestre -> Jogador.
6. Mestre altera Vida e atribui uma Habilidade; o Jogador deve receber imediatamente.
7. Jogador altera Vida; a ficha canonica do Mestre deve receber imediatamente.
8. Mestre dispara um sorteio EVE; a apresentacao deve abrir no Jogador sem backlog/d10 privado.
9. Fechar o app do Jogador e abrir novamente; agora a entrada deve voltar a `Aguardando`.
10. Expulsar um jogador e confirmar que nem a mesma instancia reaproveita o aceite revogado.

Gate automatizado obrigatorio: `npm run smoke:multiplayer`. Um teste que apenas
reautentica o mesmo socket nao valida reconexao e deve ser tratado como falso positivo.

## Ficha, TURN e combate

- A janela de ficha usa um rascunho local durante `Editar`; ataque, habilidade,
  ritual e item so entram no estado canonico quando o Mestre ou Jogador clica
  `Salvar`. Cancelar nao pode apagar o que ja estava salvo.
- `+/-` de recurso usa trava curta de 10 segundos. `Editar` usa trava exclusiva:
  enquanto um lado salva, o outro recebe `Ficha ocupada` e nao pode sobrescrever
  o rascunho.
- Pedido de manobra ou habilidade feito pelo Jogador vira log reservado ao
  Mestre, com cooldown local de 10 segundos. O servidor valida jogador,
  personagem, token, tipo, timing e retorna ACK real. O pedido nao aparece no
  log publico dos demais jogadores.
- O Mestre aprova ou recusa o pedido no TURN. A aprovacao usa a ficha canonica,
  cobra recursos e marca a acao do turno; a recusa apenas encerra o pedido.
- Rolagem de combate primeiro conclui a fila e mostra o resultado do dado.
  So depois abre `Resolver ataque`; defesa, dano e resultado sao etapas
  distintas. As janelas abertas minimizam durante a rolagem e retornam depois.
- `Ver area` tem fechamento manual e alvo selecionado em vermelho. A area
  mostrada pelo Mestre e publica; a visualizacao local do Jogador nao vaza para
  o Mestre ou para os outros jogadores.
- Aplicar um estado no `BUF` deve aparecer imediatamente na ficha e no token
  do alvo remoto. A fonte secreta de NPC nao pode ser revelada para o Jogador.
- Dano continuo, Cura, Aura e duracao executam uma vez no inicio do turno e nao
  duplicam depois de retry/reconexao.
- A fonte pode cancelar somente um `Especial` que ela propria aplicou. Estados
  comuns continuam reservados ao `BUF` do Mestre.
- Em mapa branco, `Ctrl+A` deve preservar mapa, tokens, fichas, aceite e
  conexao. A recuperacao forte so acontece se a inspecao real de pixels ainda
  detectar branco depois da remontagem leve.

Gate minimo para qualquer build que tocar esses fluxos:

```powershell
npm run smoke:multiplayer
npm run smoke:ui
npm run smoke:combat-v2
npm run smoke:statuses
npm run smoke:events
```

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
- O aceite e ligado a uma instancia efemera do app. Socket pode ser trocado sem
  novo aceite; app fechado/novo, desconexao explicita, recusa e expulsao revogam.
- A ficha do Jogador envia apenas os campos alterados. Skills, rituais, vinculos,
  permissoes e Builds concedidos pelo Mestre continuam canonicos.
- Multiplayer nao possui mesa paralela: ele reutiliza `Jogar > Mesa` e troca apenas a origem dos dados para WebSocket.

## Limites Do V1

- Nao existe servidor cloud.
- Nao existe conta/login online.
- Nao existe criptografia avancada.
- Sem NAT traversal proprio.
- Tunnel externo e manual.
- Validacao de permissao existe no servidor local, mas ainda nao substitui uma arquitetura comercial online.
- A conexao remota V1 autentica jogadores 1-5. Mestre remoto completo nao e habilitado nesta versao; o mestre autoritativo e o host local.
