# Estrategia de simulacao viva - FUSHI

Objetivo: fazer a simulacao respeitar lore, NPCs, cenas jogadas e contexto real, sem gerar evento aleatorio que contradiz a mesa.

## Decisao recomendada

Usar simulacao hibrida.

1. O app salva o estado canonico.
2. A IA sugere proximos movimentos.
3. O mestre aprova, edita ou rejeita.
4. Apenas o aprovado vira canon salvo.

Motivo: colocar API para decidir tudo sozinha agora e arriscado. Falta uma semana, entao o mais seguro e primeiro ter memoria estruturada e botao de sugestao.

## Estado minimo de mundo

Criar/registrar depois no app:

```json
{
  "dia": 1,
  "periodo": "noite",
  "localAtualGrupo": "Caverna do Primeiro Corpo",
  "grupoAtivo": ["Kairos", "Davi", "Connor", "Keal", "Ruiz"],
  "eventosCanonicos": [],
  "estabilidadeIlha": 100,
  "estadoVila": "deteriorando devagar",
  "estadoRyoku": "selado",
  "estadoDragon": "adormecido",
  "perguntasAbertas": []
}
```

## Memoria de NPC

Cada NPC importante deve ter:

```json
{
  "npcId": "npc-vila-nilo-arven",
  "memoriaFixa": "Nilo e ligado a Liora e ao Riacho Claro.",
  "memoriaCurta": [
    "Viu os protagonistas chegarem sem entender a propria origem."
  ],
  "relacoes": {
    "Kairos": "estranhamento",
    "Ruiz": "curiosidade"
  },
  "medoAtual": "perder o que resta de Liora",
  "objetivoAtual": "proteger o lugar secreto do Riacho",
  "ultimoEventoPresenciado": "chegada do grupo a Vila"
}
```

## Memoria de grupo

Quando criar/desfazer grupo:

1. Salvar integrantes.
2. Salvar objetivo declarado.
3. Salvar cenas vistas.
4. Salvar promessas feitas.
5. Salvar conflitos internos.
6. Salvar pendencias para a proxima cena.

Exemplo:

```json
{
  "grupoId": "grupo-sessao-1",
  "integrantes": ["Kairos", "Davi", "Connor", "Keal", "Ruiz"],
  "objetivo": "entender onde acordaram",
  "resumo": "O grupo saiu da caverna, enfrentou lobos e chegou a Vila.",
  "promessas": ["Nilo pediu para nao mexer no Riacho sem ele"],
  "conflitos": ["Davi quer estudar o corpo; Connor quer sobreviver primeiro"],
  "pendencias": ["decidir se vao ao Campo de Treino ou Riacho Claro"]
}
```

## Como usar API depois

Endpoint/botao sugerido no app:

`Sugerir proximo movimento do mundo`

Entrada enviada para a IA:

1. Resumo canonico do mundo.
2. Local atual.
3. NPCs presentes.
4. Memoria curta dos NPCs.
5. Relacoes com jogadores.
6. Perguntas abertas.
7. Limites de canon.

Saida esperada:

```json
{
  "sugestoes": [
    {
      "tipo": "npc_action",
      "npc": "Nilo Arven",
      "acao": "evita falar de Liora diretamente, mas entrega uma pista visual do Riacho",
      "riscoDeCanon": "baixo"
    }
  ],
  "perguntasParaMestre": [
    "Liora pode aparecer como eco nesta cena ou deve ficar apenas como memoria?"
  ],
  "naoFazer": [
    "nao revelar Dragon FUSHI",
    "nao afirmar que Kairos e Selian literal"
  ]
}
```

## Regra de seguranca

A IA nunca pode:

1. matar NPC importante sem confirmacao;
2. revelar verdade final de Cataclisma;
3. mudar mapa mundial;
4. trocar status de Liora;
5. decidir renascimento em corpo vivo;
6. transformar uma teoria em fato.

## Implementacao em etapas

### Etapa 1 - sem API

1. Criar campos de memoria em NPC/grupos.
2. Criar botao de resumo de cena.
3. Salvar evento canonico aprovado.
4. Mostrar perguntas abertas para o mestre.

### Etapa 2 - com API

1. Configurar chave da OpenAI localmente.
2. Enviar contexto compacto.
3. Receber sugestoes em JSON.
4. Mostrar para mestre aprovar.
5. Salvar apenas o aprovado.

### Etapa 3 - simulacao viva

1. NPCs atualizam medo/objetivo conforme eventos.
2. Faccoes reagem entre dias.
3. Cataclismas avançam por gatilhos.
4. MUN muda por estado canonico, nao por random.

## Atualizacao 2026-05-25 - base para voz e sessao online

O caminho recomendado agora e tratar a mesa como um servidor canonico com tres camadas:

1. Event log invisivel da mesa.
2. Memoria estruturada de mundo/NPCs.
3. IA consultiva em tempo real, sempre com aprovacao do mestre para mudancas canonicas.

### Event log minimo

Cada acao importante precisa virar evento estruturado:

```json
{
  "id": "evt_...",
  "timestamp": "2026-05-25T00:00:00.000Z",
  "actor": "gm|player1|player2|npc_jaxir|system",
  "actorCharacterId": "char_jaxir",
  "type": "voice|chat|roll|token_move|map_change|asset_request|npc_state|gm_note",
  "sceneId": "scene_...",
  "mapId": "map_...",
  "text": "fala ou resumo do evento",
  "payload": {}
}
```

Isso ja combina com os logs de `C:\RPG FUSHI\SERVIDOR-FUSHI\logs`, mas a proxima etapa e salvar tambem em formato de sessao consultavel pelo app.

### Voz por papel

Antes de camera, a voz e mais importante.

1. Cada microfone/audio de jogador entra como canal: `mestre`, `j1`, `j2`, `j3`, `j4`, `j5`.
2. Como cada jogador ja tem perfil e corpo/personagem vinculado, a transcricao vira fala do personagem correto.
3. O mestre pode ativar um "Atrelar microfone ao NPC" em uma ficha, por exemplo `Jaxir`.
4. Enquanto esse modo estiver ativo, a voz do mestre vira evento `actor=npc_jaxir`.
5. Ao desligar, a voz do mestre volta a ser narracao/controle de mesa.

Camera fica para depois, como opcional: util para gestos/expressao, mas cara, pesada e mais dificil de transformar em canon confiavel.

### Motor de NPC

Cada NPC importante deve ter:

1. `memoria_fixa`: origem, traumas, relacoes, segredos.
2. `memoria_curta`: ultimos eventos presenciados.
3. `objetivo_atual`: o que quer agora.
4. `medo_atual`: o que esta evitando.
5. `relacoes`: confianca/medo/divida/raiva por personagem.
6. `limites_canon`: coisas que a IA nao pode decidir.
7. `agenda`: intencoes caso os jogadores nao interfiram.

O motor roda em ticks narrativos, nao em tempo real bruto:

1. Durante a cena, ele observa eventos.
2. A cada gatilho importante, sugere reacao.
3. Fora de cena, simula progresso entre locais, faccoes e horarios.
4. O mestre aprova o que vira canon.

### API recomendada

Para este app, a arquitetura ideal e:

1. API de tempo real para voz/transcricao e fala baixa latencia.
2. API de respostas com tool calling e saida JSON estruturada para decisoes de NPC/mundo.
3. Embeddings/vector store local ou remoto para buscar lore, historico e fichas relevantes sem mandar tudo toda vez.
4. Banco local de eventos canonicos para reprocessar/resumir sessao.

O primeiro prototipo deve evitar autonomia total. A IA deve sugerir:

```json
{
  "npcId": "jaxir",
  "percepcao": "Jaxir percebeu que Jogador 2 esta desconfiado.",
  "intencao": "testar a lealdade do grupo sem revelar sua real prioridade",
  "fala_sugerida": "...",
  "acao_sugerida": "aproxima-se do mapa e aponta uma rota falsa",
  "impacto_canonico": "baixo",
  "precisa_aprovacao": true
}
```

### O que falta antes da API

1. Estabilizar multiplayer, asset streaming e fichas de jogador.
2. Ter log canonico estruturado para chat, rolagens, movimento, mapa e fala.
3. Criar painel do mestre para revisar/aprovar eventos.
4. Normalizar IDs de personagens, NPCs, mapas e cenas.
5. Criar memoria editavel por NPC.
6. Criar resumo automatico de sessao.
7. So entao plugar voz/API.

## Implementado na alpha.13 - fundacao sem API

1. Criado `src/lib/worldSimulation.ts` com evento canonico estruturado separado do log visual da mesa.
2. Chat, rolagens, pings e eventos de sistema agora podem virar eventos observados/candidatos para contexto futuro.
3. Movimentos de token e troca de mapa registram eventos estruturados locais para alimentar resumo e IA depois.
4. Criado builder de memoria inicial de NPC a partir da ficha, do estado MUN e dos eventos recentes.
5. Criado snapshot de contexto para futura chamada de API, mantendo a regra: IA sugere, mestre aprova, canon so depois.

Proximos passos seguros:

1. Criar painel do mestre para revisar/aprovar eventos candidatos.
2. Exportar/importar estes eventos junto da campanha.
3. Conectar transcricao de voz por perfil `M/J1/J2/J3/J4/J5`.
4. Depois disso, plugar API para gerar sugestoes JSON de NPC/mundo.

## Implementado na alpha.14 - NPCs canonicos e trava anti-invencao

1. A simulacao agora resolve uma base canonica para NPCs reais usando somente ficha, faccao, `localAtual` e locais existentes do MUN.
2. NPC placeholder nao entra no motor de simulacao.
3. O MUN ganhou sincronizacao de NPCs reais, incluindo Companhia da Mare Livre no Embarque da Mare Livre, Vila no ponto inicial, Guardioes nos mapas do Vulcao e faccoes de Montanha/Veu/Ruinas em seus pontos oficiais.
4. Cada NPC recebe validacao de prontidao IA: local atual, local inicial, objetivo macro, objetivo atual, contexto canonico, comportamento e gatilhos de entrada.
5. Quando faltar informacao, a IA fica marcada como pendente. A regra e nao preencher lacunas com imaginacao.
6. A tela de NPCs mostra as perguntas essenciais por personagem para o mestre completar antes de liberar autonomia real.

Proximos passos seguros:

1. Preencher objetivo macro/atual e tendencias dos NPCs que ficarem pendentes.
2. Criar memoria editavel por NPC com relacoes especificas com `M/J1/J2/J3/J4/J5`.
3. Adicionar revisao/aprovacao de sugestoes canonicas antes de qualquer NPC mover, falar ou alterar a historia sozinho.
4. Ligar voz/transcricao somente depois que a base de contexto estiver sem pendencias bloqueantes.

## Implementado na alpha.15 - memoria relacional e fila de canon

1. NPCs agora possuem memoria expandida: medo atual, memoria curta, agenda, limites de canon e relacoes por ator.
2. As relacoes por ator usam `M`, `J1`, `J2`, `J3`, `J4` e `J5`, com afinidade, confianca, rivalidade, ameaca e notas.
3. A aba `Canon` do MUN permite registrar notas candidatas, aprovar ou rejeitar eventos antes de virarem fato.
4. O snapshot seguro para API pode ser gerado no painel, juntando eventos recentes, memoria de NPC e guardrails.
5. Eventos de simulacao entram no export/import de campanha, junto com o restante do estado da mesa.
Regra de fechamento antes da API:

1. Cada NPC recorrente precisa ter pelo menos objetivo atual, medo atual ou conflito pendente.
2. NPC com voz/interpretacao frequente precisa ter relacao preenchida para o mestre e para os jogadores envolvidos.
3. Toda sugestao de IA deve nascer como `canon_candidate`.
4. So `canon_approved` pode alimentar resumo futuro como fato.

## Implementado na alpha.16 - fechamento de prontidao dos NPCs

1. NPCs sem objetivo da sessao agora recebem um objetivo seguro derivado apenas do local/intencao canonicos ja existentes.
2. NPCs sem tendencias recebem tendencias defensivas anti-invencao: usar fatos confirmados, pedir revisao do mestre e aguardar evento aprovado.
3. Auditoria local da campanha ativa: 40/40 NPCs reais sem bloqueios obrigatorios de contexto antes da API.
4. A campanha ativa recebeu backup antes das migracoes de objetivo/tendencias em `AppData/Roaming/FUSHI/campaigns/.../backups`.

## Implementado na alpha.17 - distribuicao real de NPCs no MUN

1. Facção deixou de significar "todo mundo no mesmo ponto"; personagens importantes agora têm posicionamento explicito por nome quando existe lugar/submapa conhecido.
2. Monges foram espalhados pelas Montanhas: templo, pico, arena, caverna, ponte e saida das montanhas.
3. Guardioes do Vulcao foram fixados em seus locais/submapas próprios: Morghast, Euryaleth, Vorashk, Aeronyx, Thal'Zhyr e Astrael.
4. Yanzik foi colocado como presenca revisavel no Gelo para o bioma nao ficar vazio; Seraph e Jaxir foram separados nas Ruinas.
5. Arven/Varek sairam da Floresta Mistica inicial e foram para pontos do Veu Cinzento.
6. O "Mostrar" do MUN agora exibe retratos nas presencas de bioma/local/submapa, inclusive NPC selado para o mestre saber onde esta.
7. Submapas passam a listar presencas com retrato/nome/status, facilitando marcar quem esta dentro e formar grupos.

## Implementado na alpha.18 - NPC como unidade viva, grupos e memoria de sessao

1. NPC dentro de grupo agora deixa de aparecer como presenca solta no ponto anterior. O grupo passa a carregar aquele NPC como uma unidade viva.
2. Ao dissolver um grupo, NPCs e entidades ficam no ultimo local/submapa real do grupo, sem sumir do MUN.
3. Movimento de grupo sincroniza jogadores, NPCs e entidades para o mesmo local, mantendo submapa quando aplicavel.
4. Retratos de NPCs tambem aparecem nos tokens de grupo/rotas, nao apenas nos popovers de bioma.
5. Chips de NPC, entidade e grupo podem ser arrastados para cards de submapa/S0 para corrigir local rapidamente.
6. O editor de NPC ganhou campo de subrota/submapa para ajuste manual rapido sem editar arquivo.
7. Aureon foi movido para a Floresta Mistica por prioridade narrativa, mostrando que faccao nao prende local.
8. Thal'Zhyr foi movido para M19-S3 e Astrael ficou em M20-S0.
9. A aba Historia registra o fechamento de sessao por NPC com fatos, mudanca de vontade, conflito, medo atual e deltas de afinidade/confianca/ameaca.
10. O motor de sugestoes ignora NPCs que estao em grupo ativo, evitando mover o mesmo personagem por dois caminhos ao mesmo tempo.

Regra canonica nova:

1. `token_oculto` significa que o NPC existe no mapa para o mestre, mas nao deve ser tratado como revelado aos jogadores.
2. `selado` significa que o NPC existe, mas esta travado por condicao de historia; a simulacao nao deve desloca-lo livremente sem acao do mestre.
3. "Corpo" nao e vinculo de grupo. Corpo significa ocupar/usar aquele NPC como corpo de jogador, pausando a simulacao autonoma daquele NPC enquanto estiver ocupado.

## Implementado na alpha.19 - catalogo vivo, contatos de sessao e checkpoints

1. Pontos do MUN com presenca de NPC agora exibem retratos e contagem no proprio marcador, igual os grupos ativos.
2. A aba Historia deixou de listar NPCs sem contato; entram apenas NPCs vistos por grupo/player, marcados manualmente, em grupo ativo ou com memoria factual ja registrada.
3. Contatos inferidos pelo movimento do grupo podem ser desfeitos ou marcados como "nao encontraram", para evitar canon falso quando o grupo passa por um ponto sem interagir.
4. Afinidade, confianca e ameaca foram explicitadas como deltas em relacao ao grupo/jogadores, nao ao mundo inteiro.
5. A nova aba Personagens funciona como catalogo vivo: retrato, local, subrota, estado, intencao, ultimo log e memoria curta por NPC.
6. Os editores tecnicos de locais, NPCs e rotas foram condensados em Editor, com layout separado para nao sobrepor mapa e formulario.
7. Salvar Historia cria candidatos de Canon e leva o mestre para revisar os fatos antes de consolidar a sessao.
8. Configuracoes/Testes virou Sessao, com reset seguro de campanha e export/import de checkpoint contendo mundo, grupos, NPCs, logs e eventos de simulacao.

Regra canonica nova:

1. Historia e memoria curta registram somente fatos de contato, revisao ou impacto confirmado pelo mestre.
2. Personagens mostra o estado vivo operacional, mas nao transforma atividade em canon sem aprovacao.
3. Checkpoint de Sessao e a forma recomendada de guardar o estado core entre encontros antes da API de IA.

## Implementado na alpha.20 - MUN factual, faccoes e IA diagnostica

1. A aba Personagens agora separa NPCs por faccao em secoes visuais, mantendo retrato, local, intencao e memoria curta de cada personagem.
2. A aba Historia passou a considerar contato real apenas quando um grupo com players divide o mesmo ponto/submapa com NPC solto ou grupo de NPCs; estados antigos de memoria nao reabrem NPCs sozinhos.
3. O movimento de grupos nao aplica mais simulacao automatica de NPCs. NPCs so mudam por comando do mestre, grupo/contexto direto ou previa de simulacao aprovada.
4. Tokens de grupo ficam acima dos pontos para permitir arrastar entre rotas, enquanto popovers ficam acima de todos os marcadores para nao serem cobertos.
5. Subrotas e pontos S0 aceitam mover ou planejar grupo, usando o mesmo fluxo rapido/planejado do MUN geral e registrando destino de submapa.
6. Cards detalhados de pontos/submapas mostram todos os presentes em vez de resumir com `+N`, para manter a verdade operacional visivel.
7. A nova aba IA gera um diagnostico local e deterministico do MUN: usa snapshot, logs, canon pendente, grupos, contatos e alertas reais sem chamar API e sem inventar fato.
8. Previa de simulacao continua separada da IA diagnostica; sugestoes podem ser geradas e aplicadas manualmente, mas nao viram canon sem revisao.

Regra canonica nova:

1. IA diagnostica e ferramenta de leitura/consistencia do mestre; ela nao e o motor autonomo de NPCs.
2. A simulacao autonoma de NPCs deve permanecer opt-in e aprovavel ate existir API com guardrails, memoria por NPC e revisao de canon.
3. Movimentos em subrota contam como deslocamento real do mundo, inclusive para planejamento de tempo e contatos.

## Implementado na alpha.21 - prioridade de cena e assistente IA local

1. A aba Personagens permite arrastar secoes de faccao para cima/baixo, persistindo a prioridade visual do mestre no estado do MUN.
2. Cada faccao mostra o simbolo oficial vindo de `public/assets/factions`, copiado da pasta de logos do MUN_REWORK.
3. O resumo da faccao fica oculto quando a pasta esta recolhida, reduzindo ruido visual.
4. Grupos ativos podem ser renomeados direto no MUN; o nome vira contexto operacional para logs, planejamento e leitura da IA.
5. A aba IA deixou de responder sempre com o mesmo diagnostico: quando a pergunta menciona NPC por nome, ela retorna local real, estado, intencao, acao atual, motivo, memoria curta, logs, conhecimento inferido e proxima acao segura.
6. A resposta da IA pode ser enviada como candidato de Canon, mas nada e aprovado ou aplicado automaticamente.
7. O Editor ganhou a secao NPC IA, separando as leis do futuro motor autonomo de NPCs da IA diagnostica de mesa.

Regra canonica nova:

1. Prioridade visual de faccao e ferramenta do mestre, nao altera aliado/inimigo nem local canonico.
2. Nome de grupo e contexto narrativo/operacional; nao substitui membros reais, local real ou Canon.
3. Resposta da IA local e leitura factual/inferencia marcada; so vira fato depois de revisao no Canon.

## Implementado na alpha.22 - logos oficiais, relogio e memoria subjetiva

1. As logos de faccao foram recriadas como SVGs validos e leves em `public/assets/factions`, deixando de depender de PNG com extensao errada.
2. MUN e Biblioteca de Personagens passam a usar a mesma fonte oficial de logos por `faction-a` a `faction-f`.
3. O MUN ganhou a aba Relogio com passos de 10min, ajuste manual como `00:20`, botoes de tempo parado e desfazer.
4. Rotas oficiais foram refinadas para escala de 10min, com overrides de pontos colados como Vila/Campo de Treino e Vila/Riacho Claro.
5. Subrotas agora contam como deslocamento real, inclusive quando o grupo entra em um mapa interno depois de chegar ao ponto.
6. A previa autonoma de NPC agora respeita turno invisivel: 6h de mundo geram 3h de acao propria para NPCs soltos; abaixo de 6h nao nasce novo estado autonomo.
7. A IA diagnostica filtra conhecimento de mestre, protagonistas, players, cataclismas ocultos e passado real ainda nao descoberto antes de responder como mente do NPC.
8. O evento oculto de Seraph foi registrado como evento de mestre: existe para risco narrativo, mas nao entra na memoria interna do NPC sem Canon revelado.

Regra canonica nova:

1. NPC nao sabe plot oculto, poder oculto, futuro, "protagonistas" ou verdade de mestre antes de contato, descoberta, log ou Canon aprovado.
2. Memoria do NPC e subjetiva: passado conhecido, local atual, exploracao real na ilha e informacoes recebidas em cena.
3. Puzzles, itens e recompensas de pontos sao desenhados para os jogadores; NPC que atravessa o local nao consome a recompensa sem decisao manual do mestre.
4. Tempo de jogadores e tempo autonomo de NPC nao sao iguais: em simulacao fora de cena, NPC se move e decide em ritmo mais lento para preservar foco da mesa.

## Implementado na alpha.23 - relogio limpo, help e drag de subrotas

1. A aba Relogio virou controle seco: apenas Avancar 1h, Avancar 6h e ajuste manual, sem texto ensinando a usar.
2. O botao `?` virou aba Ajuda, concentrando comandos, fluxo de MUN, regras de tempo e guardrails de IA.
3. O drag de grupo agora usa payload real do navegador (`dataTransfer`), reduzindo falhas ao arrastar grupo para ponto, S0 ou submapa.
4. Subrotas no hub de local e na lista de submapas aceitam grupo, nao apenas NPC solto ou entidade.
5. A revisao de rotas oficiais foi bumpada para `rotas_mun_60_v9_tempo_10min`; ao abrir, estados antigos migram para os tempos oficiais atuais preservando bloqueios e metadados personalizados.
6. Pontos colados continuam calibrados em 10min/30min, enquanto travessias longas seguem a escala global aproximada de 24h+ ate a ponta oposta da ilha.

Regra canonica nova:

1. Relogio e ferramenta operacional; explicacao, comandos e regras ficam em Ajuda.
2. Arrastar para submapa e movimento real do mundo, mesmo quando o deslocamento interno e curto.
3. A proxima etapa de API deve ler o snapshot do MUN/Canon/Historia/Logs e responder com fatos rastreaveis antes de sugerir simulacao autonoma.

## Implementado na alpha.24 - Ollama local como motor aprovavel

1. O desktop ganhou provedor `ollama` local em `http://127.0.0.1:11434`, salvo em `AppData/Roaming/FUSHI/ai-provider.json`.
2. A ponte Electron chama `/api/tags` para testar a instalacao e `/api/chat` com `stream:false` para resposta local.
3. A aba IA permite configurar endpoint, modelo e temperatura, testar o Ollama e pedir uma resposta factual do MUN.
4. A opcao `Previa Ollama 6h` envia contexto compacto do MUN, logs, grupos, NPCs, rotas, Canon e uma previa deterministica local.
5. O retorno do Ollama e validado contra IDs reais de NPCs e locais; qualquer `characterId`, `toId`, acao ou intencao invalida cai para a previa segura local.
6. Mesmo com Ollama, nada move NPC automaticamente: a previa entra no mesmo fluxo de revisao e so muda o MUN quando o mestre clica em aplicar.

Regra canonica nova:

1. Ollama e motor local gratuito de sugestao, nao autoridade canonica.
2. A IA pode sugerir movimento/objetivo de NPC solto, mas nao pode inventar mapa, consumir recompensa de jogador, revelar plot oculto ou aprovar Canon.
3. Se o Ollama nao estiver instalado, lento ou sem modelo, o MUN continua usando a previa local deterministica.
