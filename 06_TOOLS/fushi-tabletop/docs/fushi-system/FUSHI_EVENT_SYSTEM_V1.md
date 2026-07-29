# FUSHI Event System V1

Status: implementado na alpha.84 e em teste real de mesa.

## Objetivo

O `EVE` e o gerenciador canonico de eventos temporarios da Mesa. Ele existe
para ativar regras, paineis e apresentacoes de uma cena sem criar uma logica
isolada para cada evento e sem deixar estado residual quando a cena termina.

Eventos podem coexistir. Desativar um evento nunca encerra outro evento ativo.

## Fonte de verdade

- Catalogo, tipos e ciclo de vida: `src/lib/tabletopEvents.ts`.
- Estado persistido: `PersistedTabletopSession.eventState`.
- Progresso do treino: `PersistedTabletopSession.trainingState`.
- Regras do treino: `src/data/training/village-training-arc.json`.
- Catalogo de atribuicoes: `src/data/grants/characterGrantCatalog.ts`.
- Interface do Mestre: `TabletopEventManager` no hub `EVE`.
- Apresentacao publica: `TabletopEventPresentation`.
- Sanitizacao multiplayer: `sanitizeEventStateForPlayer`.

React renderiza e despacha comandos. Regras de evento nao devem ser copiadas
para componentes diferentes.

## Ciclo de vida

Cada evento tem os estados `inativo` e `ativo`, com data de ativacao,
desativacao e atualizacao.

### Ativar

1. somente o Mestre inicia o evento;
2. o estado canonico e atualizado;
3. a superficie publica aparece para Mestre e Jogadores;
4. efeitos especificos, como abrir o mapa do treino, sao aplicados;
5. outros eventos ativos continuam intactos.

### Desativar

1. a superficie e a regra temporaria somem de todas as telas;
2. apresentacoes transitorias do evento sao limpas;
3. o estado-base da Mesa volta sem recarregar o app;
4. o progresso arquivado nao e apagado;
5. outros eventos ativos continuam intactos.

`Reiniciar progresso` e uma acao separada e explicita. Desativar nunca significa
reiniciar.

## Eventos existentes

### Treino Inicial

- Categoria: evento de mundo.
- Gatilho: `Campo de Treinamento > Ativar treinamento` ou `EVE`.
- Ao ativar: abre o mapa do Campo, ativa o painel e preserva o mapa anterior
  para retorno.
- Mestre: ve DT, abordagens, controles, Marcas, Contratempos e prova final.
- Jogador: ve somente objetivo e progresso.
- Ao desativar: fecha o painel, devolve a Mesa ao mapa anterior quando
  aplicavel e preserva todo o progresso.

### Sorteio Raridade Build

- Categoria: apresentacao visual.
- Mestre escolhe personagem, arquetipo e item.
- A raridade usa a tabela canonica de 1d10: Comum, Raro, Epico, Lendario ou
  Mitico.
- A animacao e transmitida para a mesa inteira.
- O numero bruto do dado fica privado do Mestre.
- O evento nao vincula item, nao altera ficha e nao substitui o `BUI`.
- Depois da revelacao, cada tela fecha sua apresentacao ao clicar em qualquer
  lugar. Esse descarte e local ao app/janela e nao apaga o resultado do EVE.
- A apresentacao e descartavel e expira em ate 18 segundos. Trocar de rota,
  cena ou voltar para a Mesa nunca pode ressuscitar um sorteio antigo.
- Um novo `drawId` sempre abre uma nova apresentacao, mesmo que a anterior ja
  tenha sido fechada.
- O EVE guarda para o Mestre um backlog dos 100 sorteios mais recentes, com
  personagem, item, raridade, d10 bruto e horario. Esse backlog nunca aparece
  para Jogadores.
- O evento pode permanecer ativo entre varios sorteios. Fechar ou expirar uma
  apresentacao nao exige desativar o evento.
- O Mestre pode usar **Limpar backlog** no EVE para apagar somente o historico
  operacional de sorteios. A acao pede confirmacao, preserva a apresentacao
  atual e nao altera ficha, BUI, itens absorvidos ou logs narrativos.
- Ao desativar: somente a apresentacao atual e removida. O backlog do Mestre e
  preservado para auditoria da sessao.

### Atribuir Skills

- Categoria: gestao privada do Mestre.
- O Mestre ativa o evento, escolhe uma ficha real de Jogador e usa uma das
  categorias `Habilidades`, `Rituais` ou `Outros`.
- `Habilidades` nasce com as cinco recompensas canonicas do Treino Inicial.
  O catalogo referencia a mesma fonte do painel final do treino; nao existe uma
  segunda copia das regras ou dos numeros.
- `Rituais` e `Outros` permanecem visiveis como `EM CONSTRUCAO` ate receberem
  conteudo canonico aprovado. Nenhuma entrada provisoria e criada.
- Atribuir grava diretamente na ficha canonica pelo fluxo existente de
  personagem. Fluxo Principal, Mesa e multiplayer passam a enxergar a mesma
  habilidade.
- A operacao e idempotente pelo `id` da habilidade ou ritual. Uma ficha que ja
  possui o conteudo nao recebe uma segunda copia e o comando fica bloqueado.
- Desativar o evento fecha apenas a superficie administrativa. Habilidades ja
  atribuidas sao permanentes e nao sao removidas.
- Jogadores nao recebem catalogo, selecao, recomendacao de personagem ou
  controles do EVE. Eles veem somente o conteudo que o Mestre efetivamente
  atribuiu em sua propria ficha.

## Autoridade multiplayer

- Ativar, desativar, reiniciar, sortear e atribuir conteudo sao comandos
  exclusivos do Mestre.
- Jogadores recebem apenas o estado publico sanitizado.
- `restoreMapId`, `lastRoll` e `rarityHistory` nunca entram no payload do
  Jogador.
- Nenhum evento pode aceitar uma substituicao completa de sessao enviada por
  Jogador.

## Admissao e navegacao do Jogador

- O aceite do Mestre pertence a instancia viva do app, nao a uma rota da tela
  nem a um socket descartavel.
- Ir da Mesa para Fluxo Principal, Livro, Personagens ou Multiplayer usa
  navegacao interna e nunca recarrega a pagina nem volta o jogador para
  `pending`.
- Enquanto a mesma instancia do app estiver aberta, Multiplayer exibe `Sessao
  ativa` e `Voltar a mesa` sem pedir senha ou novo aceite. Se a rede cair, um
  socket novo com o mesmo `clientInstanceId` retoma a entrada.
- Fechar o app, desconectar explicitamente, expulsar ou recusar revoga a
  entrada. Uma nova instancia recebe outro identificador e exige aprovacao.
- O servidor protege esse contrato por `jogador + clientInstanceId`; repetir
  autenticacao no mesmo socket nao conta como teste de reconexao.
- A fila de acoes para ate a readmissao real. Dados, ficha e EVE nao podem ser
  enviados sob um perfil antigo enquanto o socket novo ainda esta `pending`.
- Atualizacao de ficha Jogador -> Mestre envia patch dos campos alterados e nao
  substitui Habilidades, Rituais, permissoes, corpo ou Build do Mestre.
- Se um mapa estiver preparado/oculto, o bloqueio cobre somente o tabuleiro; o
  menu superior continua disponivel para navegar sem reiniciar a conexao.

Quando um evento futuro exigir interacao do Jogador, implementar uma acao
tipada e pequena no protocolo remoto:

1. incluir o tipo em uma allowlist explicita;
2. validar jogador, personagem, evento ativo e payload no servidor;
3. usar `remoteActionId`, ACK real e protecao idempotente;
4. aplicar somente a mutacao autorizada;
5. transmitir o novo estado publico;
6. testar Jogador -> Mestre e Mestre -> Jogador no smoke multiplayer.

## Requisitos para um novo evento

Todo evento novo precisa declarar:

1. id estavel e categoria;
2. descricao para o Mestre;
3. superficie publica;
4. estado persistente e estado transitorio;
5. acao de ativar;
6. acao de desativar e limpeza completa;
7. politica de retomada/reinicio;
8. campos privados e sanitizacao;
9. impacto em mapa, ficha, turno, audio ou regra;
10. smoke de ciclo de vida e multiplayer.

## Gates de aceite

```powershell
npm run build
npm run smoke:events
npm run smoke:training
npm run smoke:training:ui
npm run smoke:multiplayer
npm run smoke:release
```

Para promocao completa, tambem executar `smoke:release:deep` e validar o
executavel real em `release\win-unpacked`.
