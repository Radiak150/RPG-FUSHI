# FUSHI — Compilado de Lore, Continuidade e Pontos de Atenção

> **Uso:** contexto único de Mestre/IA para a campanha. Contém spoilers de protagonista, morte, Ryoku e Vhazaryon; não é material de jogador.
>
> **Atualizado em:** 2026-07-28
> **Natureza:** resumo derivado e navegável. Ele não substitui as fontes canônicas indicadas ao fim.

---

## Como usar este arquivo

### Legenda de estado

- **[CONFIRMADO]** — fato fixado por `01_LORE`, código de mundo ou registro do que ocorreu em mesa.
- **[PLOT DEFINIDO]** — lore/gancho já escrito para uso do Mestre, mas ainda não necessariamente visto em mesa.
- **[PRÉ-DESENVOLVIDO]** — evento, mapa, fase ou encontro desenhado para o futuro; não tratar como acontecido.
- **[ABERTO]** — precisa de decisão explícita antes de virar revelação ou regra.
- **[OBSOLETO]** — não usar para narrar sem revisar; mantido apenas como alerta de continuidade.

### Hierarquia de verdade

1. **O que aconteceu na mesa:** logs reais e resultados de sessão. Eles corrigem o estado atual da campanha.
2. **Lore primária:** `RPG-FUSHI/01_LORE/premissa` e os arquivos individuais de NPC/facção.
3. **Planejamento atual:** `docs/planejamento/campanha-controle.json` e runbooks de sessão.
4. **Mundo implementado:** `src/lib/worldMundiState.ts` confirma IDs, nomes e ganchos já cadastrados no MUN.
5. **Design de futuro:** `RPG-FUSHI/MUN_REWORK/Leitura do mapa.txt`, eventos de Ryoku/Dragão e auditorias históricas.

Em conflito, não inventar uma ponte: registrar a divergência e usar a fonte de maior autoridade. A IA sugere; o Mestre aprova antes de algo virar cânone.

### Limites de revelação pública

O Livro do Jogador pode explicar combate e condições visíveis. Não revelar sem gatilho do Mestre:

- natureza alienígena/coletiva dos protagonistas;
- absorção das matrizes da Vila;
- renascimento, posse, tabela de morte real ou dano de alma;
- XP/progressão por identidade;
- Ritual do Silêncio;
- Ryoku, Vhazaryon, Cataclismos e metaplot;
- explicação secreta de por que os protagonistas entendem a língua antiga da Vila.

---

## Resumo executivo do mundo

- **[CONFIRMADO]** `FUSHI` é energia fundamental presente em tudo. Ele altera o que existe; não cria do nada e sempre cobra custo ou consequência.
- **[CONFIRMADO]** A percepção e o controle de FUSHI dependem de identidade. Esporos se abrem por treino, limite, emoção extrema, desenvolvimento ou trauma.
- **[CONFIRMADO]** Há uso puro (equilíbrio/controle), desequilibrado (instável) e escuro (extremo, distorcido e arriscado).
- **[CONFIRMADO]** Os protagonistas são consciências equivalentes de um único organismo alienígena microscópico coletivo. Não há “jogador original”, núcleo superior ou consciência principal.
- **[CONFIRMADO]** Eles absorveram traços humanos observando a Vila por anos; cada protagonista é uma interpretação nova, não a cópia literal de um morador.
- **[CONFIRMADO]** A campanha gira em torno de identidade, corpo, memória, custo, luto, escolha e sobrevivência — não de uma missão linear imposta.
- **[CONFIRMADO]** A Ilha é viva e continua sem os jogadores: facções têm objetivos próprios, grupos se movem, eventos avançam e consequências persistem.
- **[PLOT DEFINIDO]** O mundo começa em relativa estabilidade, mas pode avançar de sutil para instável, alterado, distorcido e cataclísmico.
- **[PLOT DEFINIDO]** A Vila do Conhecimento Absorvido é uma matriz emocional e social dos protagonistas, não apenas um hub de quest.
- **[PRÉ-DESENVOLVIDO]** Ryoku e Vhazaryon são Cataclismos de escala insular; devem entrar como arcos/eventos com estados, não como chefes aleatórios.

---

## Regras de existência e identidade

### FUSHI

| Tema | Estado consolidado |
|---|---|
| Definição | Energia que sempre existiu, presente em matéria, vida, memória e identidade. |
| Acesso | Esporos internos se abrem por condição extrema, treino, emoção, trauma ou evolução. |
| Limite | Não cria matéria do nada; transforma, movimenta, reorganiza ou amplifica o que existe. |
| Custo | Todo uso cobra energia, risco, consequência emocional, física ou ambiental. |
| Uso puro | Busca equilíbrio, técnica, autocontrole e preservação. |
| Uso escuro | Distorce desejo, obsessão, corpo, memória e ambiente; nunca é atalho sem preço. |

### Protagonistas e matrizes humanas

**[CONFIRMADO]** O organismo coletivo observou a Vila e absorveu linguagem, emoção, trauma, hábitos, memória e desejo. Os jogadores pensaram criar personagens próprios, mas criaram também pessoas reais que servem como matrizes humanas.

| Protagonista | Matriz/espelho principal | Regra de continuidade |
|---|---|---|
| Connor | Renji e aspectos de Kazuo | Connor não é Renji. Ele expressa abandono, sobrevivência, alerta e busca por paz observados nos dois. |
| Davi | Elias | Davi não é Elias. O elo é curiosidade, corpo, experimento, crescimento e risco de ferir os outros. |
| Grim/Ruiz | Dalvo | O elo é sobrevivência, cuidado, escassez e a ética de curar quando há custo. |
| Kael Lebranc | Nayr | O elo é culpa, perda de controle, segredo e a ferida ligada a Mara; não é passado literal. |
| Kairos/Kaíros | Sélian | O elo é voz, silêncio, identidade performada, ritual e pressão da tradição. |
| Fragmentado | Corpo/receptáculo coletivo | É a casca/centro compartilhado do grupo; não possui matriz única de NPC. |

**Guarda de continuidade:** há também um **Kael monge**, da Ordem do Vazio Sereno. Sempre distinguir “Kael Lebranc, jogador” de “Kael, monge”.

### Morte, renascimento e corpos

- **[CONFIRMADO]** Um corpo morto morre completamente e não pode ser reutilizado.
- **[CONFIRMADO]** As consciências continuam e o renascimento ocorre na mesma cena, dentro ou fora de combate.
- **[CONFIRMADO]** A seleção do corpo considera FUSHI, capacidade física e capacidade intelectual; a fonte-base divide os corpos em fraco/animal, humano sem FUSHI e corpo com FUSHI.
- **[CONFIRMADO]** Posse pode resultar em sucesso, disputa ou rejeição. Mesmo falhando, a consciência é redirecionada e não fica sem corpo.
- **[CONFIRMADO]** O corpo limita atributos e execução: saber algo não basta para realizá-lo numa forma incapaz.
- **[CONFIRMADO]** Cada morte acumula vozes; elas podem influenciar escolhas, elevar DTs ou impedir ações.
- **[PLOT DEFINIDO]** O Ritual do Silêncio remove vozes acumuladas; a decisão registrada no quadro de lore é que ele mata permanentemente aquela consciência/ser. A regra precisa ser promovida para a fonte primária com custo, alvo, aprendizado e consequência.
- **[PLOT DEFINIDO]** A transposição de consciência é rara e custa uma vida por outra: o protagonista entrega o corpo atual a uma consciência interna, morre e depois renasce normalmente; a consciência escolhida torna-se independente no corpo cedido.
- **[ABERTO]** A implementação jogável ainda precisa de uma tabela única: ordem exata de reencendimento/posse, condição de corpo vivo, disputa, consentimento, fallback animal, custo e apresentação audiovisual.

### Determinação, separação e vínculo

- **[PLOT DEFINIDO]** Incompatibilidade de personalidade/corpo pode reduzir Determinação até a separação. A aparência individual pode emergir, mas todos continuam fragmentos do mesmo ser.
- **[CONFIRMADO]** Mesmo separados, fragmentos percebem com precisão a direção dos outros — como intuição, não rastreamento racional detalhado.
- **[CONFIRMADO]** Cada fragmento possui FUSHI próprio, mesmo quando compartilha o mesmo corpo.
- **[CONFIRMADO]** Morrer é traumático; os protagonistas não têm certeza subjetiva de que retornarão no momento da morte.

### Segredos ainda não revelados em mesa

- **[PLOT DEFINIDO]** O ovo lambido na Caverna do Primeiro Corpo pode ser alimento produzido pelo organismo/entidade alienígena/viral para se desenvolver. Foi usado na Sessão 1, mas não revelado aos jogadores.
- **[PLOT DEFINIDO]** O “Mundo dos Sonhos” é nome de interface: um subconsciente/mundo interno do Fragmentado, não sonho literal nem bioma físico.
- **[PLOT DEFINIDO]** Ecos não são respostas finais. Cada um oferece uma meia-verdade sobre identidade, matriz e corpo.

---

## A Ilha, a simulação e o atlas geográfico

### Estrutura de mundo

- **[CONFIRMADO]** O `MUN` é a camada estratégica de mundo vivo: biomas, locais, rotas, grupos, NPCs, mobs, eventos, estabilidade e logs.
- **[CONFIRMADO]** O `MAP` é a camada de cena local, exploração e combate.
- **[CONFIRMADO]** Não há rota que deva bloquear escolha do grupo por si só; o Mestre pode mover grupos e reagir à decisão dos jogadores.
- **[PLOT DEFINIDO]** A Ilha começa saudável/baixa distorção e pode evoluir: normal → sutil → instável → alterada → distorcida → cataclísmica.
- **[ABERTO]** `01_LORE/mundo/ilha.md`, `biomas.md` e `pontos-de-interesse.md` ainda estão vazios, apesar de o MUN e o design possuírem material amplo. Esse é o maior risco de fragmentação de fonte.

### Biomas oficiais

1. Planície / Floresta Inicial.
2. Praia / Litoral / Oceano.
3. Montanhas do Vazio Sereno.
4. Floresta Mística.
5. Vulcão / Terras Cinzentas.
6. Região Congelada / Neve.
7. Ruínas Antigas.
8. Vale Cinzento / rotas da Ordem do Véu Cinza.

### Pontos oficiais do MUN

Os pontos abaixo existem no atlas de mundo implementado. “Maturidade” descreve a narrativa, não a qualidade técnica do mapa.

#### Planície / Vila — P1 a P6 e P60

| Ponto | Local | Gancho/lore | Maturidade |
|---|---|---|---|
| P1 | Caverna do Primeiro Corpo | Despertar do corpo compartilhado; ovo secreto; entrada da campanha. | Confirmado em mesa |
| P2 | Clareira dos Lobos | Primeiro perigo animal, waves e separações iniciais. | Confirmado em mesa |
| P3 | Armazém Comunitário | Recursos, comida e acesso ao galpão/mapoteca. | Confirmado em mesa |
| P4 | Campo de Treino da Vila | Treino Inicial, armas, nível, itens/arquetípicos e habilidades. | Próxima frente |
| P5 | Vila do Conhecimento Absorvido | Hub emocional, matrizes humanas, crise demográfica e Mapa Mundi. | Confirmado em mesa |
| P6 | Bosque Baixo | Coleta, passagem e respiro inicial. | Pré-desenvolvido leve |
| P60 | Riacho Claro | Nilo, Liora, memória, luto e Caixinha do Ontem. | Confirmado em mesa |

**Submapas relevantes:** plataforma de Nilo/Liora dentro de P60; cartoteca/mapoteca de Orian; espaço de Maira/Sélian; o `Mundo dos Sonhos - Subconsciente do Fragmentado` é um submapa de memória fora dos biomas físicos.

#### Montanhas do Vazio Sereno — P7 a P12

| Ponto | Local | Gancho/lore | Maturidade |
|---|---|---|---|
| P7 | Caverna de Meditação | Passagem espiritual entre Planície e Montanhas; FUSHI puro. | Pré-desenvolvido |
| P8 | Templo do Vazio Sereno | Base dos Monges; disciplina, treino e contenção. | PLOT DEFINIDO |
| P9 | Ponte Suspensa | Travessia de altitude e ponto ritual com vento. | Pré-desenvolvido |
| P10 | Pico dos Quatro Ventos | Pico/santuário, prova de altitude e contemplação. | Pré-desenvolvido |
| P11 | Arena Natural de Pedra | Duelo, honra e evolução marcial. | Pré-desenvolvido |
| P12 | Saída das Montanhas | Bifurcação perigosa para Vulcão e Gelo. | Pré-desenvolvido |

#### Vulcão / Terras Cinzentas — P13 a P21

| Ponto | Local | Gancho/lore | Maturidade |
|---|---|---|---|
| P13 | Entrada do Vulcão | Bifurcação para Montanhas, Gelo, Ruínas e núcleo. | Pré-desenvolvido |
| P14 | Campo de Cinzas / Núcleo Paradoxal | Orbe e seis estátuas: núcleo ligado ao Dragão e guardiões. | PLOT DEFINIDO |
| P15 | Rio da Escuridão | Arena de Morghast; sombra, núcleo e expulsão. | Pré-desenvolvido |
| P16 | Vulcão Abandonado | Jardim petrificado, tabuleiro ritual e Euryaleth. | Pré-desenvolvido |
| P17 | Labirinto Quente | Vorashk, perseguição, adaptação e baús com risco. | Pré-desenvolvido |
| P18 | Boca do Inferno | Ascensão por lava até Aeronyx. | Pré-desenvolvido |
| P18.5 | Escadaria em Erupção | Variante de fase de P18; não é ponto oficial separado. | Pré-desenvolvido |
| P19 | Mar Inquieto | Preparação naval e confronto com Thal’Zhyr. | Pré-desenvolvido |
| P20 | Transcendente | Julgamento de Astrael e escala cósmica. | Pré-desenvolvido |
| P21 | Deus Dragão | Manifestação cataclísmica de Vhazaryon na escala da Ilha. | Pré-desenvolvido |

#### Região Congelada / Neve — P22 a P28

| Ponto | Local | Gancho/lore | Maturidade |
|---|---|---|---|
| P22 | Vale Branco | Entrada/vale de gelo. | Visual/POI; lore rasa |
| P23 | Fortaleza Soterrada | Fragmento de Ryoku e ruína congelada. | Pré-desenvolvido |
| P24 | Lago Congelado | Silhueta/mecha congelado e mistério visual. | Visual/POI; lore rasa |
| P25 | Grande Avalanche | Evento ambiental perigoso. | Visual/POI; lore rasa |
| P26 | Caverna Azul | Dungeon de gelo. | Visual/POI; lore rasa |
| P27 | Bonecos de Neve | Evento local. | Visual/POI; lore rasa |
| P28 | Santuário Sob o Gelo | Dungeon/segredo de gelo. | Visual/POI; lore rasa |

#### Ruínas Antigas / Ryoku — P29 a P35

| Ponto | Local | Gancho/lore | Maturidade |
|---|---|---|---|
| P29 | Terras Podres | Entrada degradada para selos, vozes e Torre. | Pré-desenvolvido |
| P30 | Torre do Abismo | Prisão/núcleo de Ryoku, quatro travas e dez encaixes. | PLOT DEFINIDO |
| P31 | Corredor das Vozes | Voz de Ryoku e fragmento/trava. | Pré-desenvolvido |
| P32 | Altar Quebrado | Trava ritual e fragmento do corpo. | Pré-desenvolvido |
| P33 | Estruturas das Ruínas Abandonadas | Pilares, parkour e forma instável. | Pré-desenvolvido |
| P34 | Biblioteca Morta | Memória da civilização e localização de fragmentos. | Pré-desenvolvido |
| P35 | Portão Sem Nome | Passagem condicional entre Ruínas, Floresta e Véu. | Pré-desenvolvido |

**Submapas de P30:** entrada, câmara dos fragmentos, corpo petrificado de Ryoku e Torre do Abismo despertando. São camadas do mesmo eixo, não locais novos independentes.

#### Floresta Mística — P36 a P42

| Ponto | Local | Gancho/lore | Maturidade |
|---|---|---|---|
| P36 | Trilha Enraizada | Raízes, passagem secreta e ligação com Véu/Laboratório. | Pré-desenvolvido |
| P37 | Coração Verde | Árvore-mãe e organismo vivo do bioma. | PLOT DEFINIDO |
| P38 | Árvore de FUSHI Vivo | Núcleo cristalino da Floresta; fragmento de Ryoku e possível ruptura de saída. | Pré-desenvolvido |
| P39 | Laboratório Abandonado | Vestígios humanos/tecnológicos; elo com Elias e fragmento “Carne Imortal”. | Pré-desenvolvido |
| P40 | Clareira dos Animais | Avião caído, frutas FUSHI e urso territorial. | Pré-desenvolvido |
| P41 | Lago Espelhado | Ilusões, esporos soníferos e batalha mental. | Pré-desenvolvido |
| P42 | Árvore Bebê | Broto protegido, bifurcação para Praia/Véu/Floresta. | Pré-desenvolvido |

#### Vale Cinzento / Véu — P43 a P50

| Ponto | Local | Gancho/lore | Maturidade |
|---|---|---|---|
| P43 | Saída do Portão | Túnel de ferro entre Ruínas, Véu e Floresta. | Pré-desenvolvido |
| P44 | Acampamento do Véu | Base investigativa/militar da Ordem do Véu Cinza. | PLOT DEFINIDO |
| P45 | Ruína Segura | Estátuas, oceano e possível oferenda/memória. | Pré-desenvolvido |
| P46 | Depósito Camuflado | Suprimentos, armas e entrada escondida. | Pré-desenvolvido |
| P47 | Trilha dos Espiões | Caminho difícil, cachoeira e item raro. | Pré-desenvolvido |
| P48 | Posto de Interceptação | Bunker, defesas e explosivos perigosos. | Pré-desenvolvido |
| P49 | Torre de Observação | Telescópio, vigilância e informação de vários biomas. | Pré-desenvolvido |
| P50 | Grande Lago | Travessia para Praia, Floresta e Véu. | Pré-desenvolvido |

#### Praia / Litoral / Oceano — P51 a P59

| Ponto | Local | Gancho/lore | Maturidade |
|---|---|---|---|
| P51 | Praia dos Náufragos | Chegada/ruína marítima. | Visual/POI; lore rasa |
| P52 | Enseada Azul | Área costeira de menor risco. | Visual/POI; lore rasa |
| P53 | Embarque da Maré Livre | Base/embarque da Companhia da Maré Livre. | PLOT DEFINIDO |
| P54 | Recife Cortante | Travessia e risco costeiro. | Visual/POI; lore rasa |
| P55 | Alto Mar | Brilhos, vórtices e risco de navegação. | Pré-desenvolvido |
| P56 | Farol Quebrado | Ponto de litoral abandonado. | Visual/POI; lore rasa |
| P57 | Caverna da Maré | Dungeon litoral. | Visual/POI; lore rasa |
| P58 | Costa dos Ossos | Caverna/cachoeira e risco alto. | Pré-desenvolvido |
| P59 | Estátuas do Litoral | Arena antiga de guerra; fragmento “Sangue da Guerra”. | Pré-desenvolvido |

---

## Facções, pessoas e tensões

### A. Ordem do Vazio Sereno — Monges

**Identidade:** tradição antiga de domínio interior, equilíbrio de FUSHI e disciplina. Base nas Montanhas; ligação com áreas limpas de FUSHI e Floresta Mística.

**Função dramática:** referência espiritual, treinamento, contenção e julgamento. Podem ajudar, testar ou confrontar protagonistas instáveis; não são ingênuos nem automaticamente aliados.

| Pessoa | Núcleo de lore/uso |
|---|---|
| Eiran | Pacifista ativo. Carrega violência passada e a culpa de ter matado inocente; protege vida e sustenta que não há inimigos simples. |
| Aureon | Ser artificial/ciborgue criado para inteligência perfeita. Protege sistemas e natureza, mesmo que isso exija sacrificar indivíduos. |
| Kael (monge) | Prodígio elemental que fugiu de responsabilidade e morreu afogado; procura equilíbrio, honra os mestres e evita que outros sofram. |
| Lux | Nascido com FUSHI puro extremo; executor brincalhão que investiga anomalias. Usar com contenção para não resolver a campanha. |
| Gorin | Cego, maciço, irmão de Musashi; perdeu família para criaturas corrompidas e luta por dever/proteção, não por prazer. |
| Musashi | Irmão de Gorin; transformou força destrutiva em técnica, duelo e entendimento. Rival recorrente possível. |

### B. FUSHI Escuro

**Identidade:** não é organização única. É convergência de obsessões, corpos, desejos e FUSHI deformado. Surge em Ruínas, áreas abandonadas, subterrâneos e zonas de morte/distorção.

**Função dramática:** horror existencial, tentação, corrupção, corpo/psique e consequência de poder sem limite.

| Pessoa/entidade | Núcleo de lore/uso |
|---|---|
| Yanzik | Sobreviveu a abuso e descarte; busca cura para alguém amado. Pode salvar pessoas antes de escalar para extremo/corrupção. |
| Seraph | Messias autoproclamado que governa por palavra e sangue. Busca imortalidade/domínio; o “Eclipse” é evento futuro ainda pouco integrado. |
| Velkar | Manipula identidade, corpo e alma. Busca os dez fragmentos de Ryoku, quer moldar corpos e libertar algo antigo. É agente ativo do arco Ryoku. |
| Ryoku | Cataclisma selado na Torre do Abismo. Não é chefe comum; cresce por fragmentos, pressão ambiental e decisões. |
| Jaxir | Combatente caótico que quer sentir algo real em luta; prolonga testes, pode mudar de lado e não cabe em alinhamento simples. |
| Lyssara | Manipuladora emocional que busca uma escritura/perda própria e prefere controle indireto à luta aberta. |

### C. Ordem do Véu Cinza

**Identidade:** investigação, contenção e estratégia pragmática. Trabalha com informação, rotas, postos, arquivos e operações moralmente cinzentas.

**Função dramática:** podem contratar, observar, manipular ou salvar por cálculo. Entram em atrito com FUSHI Escuro, Monges, aventureiros e protagonistas.

| Pessoa | Núcleo de lore/uso |
|---|---|
| Aeron | Espião que previne guerra antes de ela começar; age em dupla com Yor e manipula rotas/informação. |
| Arven | Líder estratégico, ex-soldado, calcula sacrifícios e conduz equipe. |
| Elion | Investigador lógico de padrões; pode revelar segredos, mas deve ser usado com parcimônia. |
| Kairo | Formado pela “Sala Branca”; controlador indireto que quer entender a lógica da Ilha e manter liberdade. |
| Varek | Executor veloz, moldado pela violência e salvo por Arven; proteção a Arven é eixo pessoal. |
| Yor | Linha de frente/protetora de Aeron desde infância; a dupla é mais importante que uma ficha isolada. |

### D. Vila do Conhecimento Absorvido

**Identidade:** comunidade humana da Planície e matriz emocional dos protagonistas. A força da Vila é significado, memória e vínculo — não poder bruto.

**Conflito central:** “Você absorveu parte de mim. É reflexo, herdeiro ou invasor?”

**A Última Geração — [PLOT DEFINIDO]**

- A Vila está definhando por exaustão demográfica, social e ambiental, não por uma única guerra ou peste.
- Correntes/vórtices invisíveis de FUSHI puxam viajantes para dentro e tornam a saída difícil ou fatal; a regra cultural de “não sair” nasceu daí.
- Uma saída só se torna possível ao afetar estruturas de equilíbrio: Árvore da Floresta, núcleo/Vulcão ou energia extrema como Ryoku solto. Toda opção tem preço grave.
- Elara vê nos protagonistas a prova de que alguém entrou — e talvez possa abrir um futuro/saída para a comunidade.
- Orian e Elara consideram a possibilidade de outra criança, mas não existe filho novo no estado atual.
- Mapas de Orian são herdados, simbólicos e mudam com FUSHI, medo, mortes e selos.

| Pessoa | Núcleo de lore/uso |
|---|---|
| Elara Vonn | Líder e mãe de Liora. Quer preservar a Vila, proteger Nilo e escolher se entrega mapas/esperança. Pode resistir a um desejo de trazer Liora de volta por conhecer o preço. |
| Orian Vonn | Cartógrafo, pai de Liora e marido de Elara. Mapas denunciam rotas que mudaram e a Ilha que “mente quando tem medo”. Entrega o Mapa Mundi após confiança. |
| Nilo Arven | Inventor ligado a Liora e ao Riacho. A Caixinha do Ontem repete pequenos instantes, não viaja no tempo completo. Representa movimento contra a paralisia do luto. |
| Liora | Filha falecida de Elara/Orian; amor de Nilo. Deve existir como memória ou Eco limitado, nunca como NPC vivo comum. |
| Maira Velan | Mãe de Sélian e guardiã de cantos/tradição. Amor e dever misturados; os cantos podem ser técnica antiga de estabilização, não religião literal. |
| Sélian Velan | Matriz de Kairos. Ouve ecos emocionais, busca silêncio e pode sentir que protagonistas “soam como vários”. Não é entidade possuída. |
| Dalvo Seren | Coletor/cuidador, não xamã. A morte do avô em triagem de recursos criou a ética de cura com custo. |
| Elias Norem | Naturalista e cuidador de animais. Investiga mutação/FUSHI e esconde depósito de campo ligado a Yuren; ponte para Laboratório Abandonado. |
| Nayr Velcaris | Ladrão/problema escondido. Observação incompleta o fez parecer assassino da mãe; outra pessoa silenciou Mara. Carrega culpa e resíduo de FUSHI. |
| Renji Akimura | Estrangeiro e matriz de Connor. Foi guarda de transporte e protegeu vulneráveis após conflito de suprimentos. Não é cego nem prevê futuro. |
| Kazuo Katō | Mentor/forasteiro de Renji. Sobreviveu, abriu esporos e rastreou a Ilha; entende que protagonistas não são possessão simples e sabe mais do que revela. |

**Regra de Liora:** ela não morreu de doença. Uma onda/pulso de FUSHI vindo das Ruínas assustou um animal comum numa rota que Liora marcava para suprimentos; o acidente ocorreu e Nilo chegou tarde. A Vila tratou como tragédia natural; Nilo nunca aceitou que essa fosse toda a verdade.

### E. Companhia da Maré Livre

**Identidade:** aventureiros navais móveis, sem autoridade fixa. Regra: não acorrentar os seus. Contrasta com ordens, contenção e controle.

| Pessoa | Núcleo de lore/uso |
|---|---|
| Lyrissa/Liryssa | Capitã autoproclamada, criada como investimento/confinada; transformou liberdade em aventura e fica precisa sob pressão. |
| Maelra | Curandeira mais velha, maternal e rebelde; fica perto da Ilha se jovens/feridos estiverem em risco. |
| Bront | Cozinheiro/engenheiro caloroso; mantém tripulação e navio unidos. |
| Nyx | Rica, gamer/hacker; enxerga realidade/FUSHI como sistema programável, útil para puzzle e criatividade. |
| Varden | Anatomista de corpos/criaturas, não sádico; ponte para cura, biologia, corrupção e reintegração. |
| Veyra | Transformou trauma de apostas alheias em escolha do próprio risco; pode ser aliada, tensão ou negociadora perigosa. |

### F. Guardiões do Vulcão e Vhazaryon

**Identidade:** sistema de contenção vivo. Os seis guardiões são partes da estrutura vulcânica; não são vilões e cada queda aumenta a instabilidade do selo.

| Ordem | Guardião | Papel |
|---|---|---|
| 1 | Morghast | Sombras, desgaste e primeiro selo; tenta expulsar invasores. |
| 2 | Euryaleth | Petrificação, estagnação e estátuas como aviso. |
| 3 | Vorashk | Serpente/labirinto que aprende e se adapta. |
| 4 | Aeronyx | Céu, altitude, queda e arena colapsando. |
| 5 | Thal’Zhyr | Mar, dilúvio e hidra; exige operação naval. |
| 6 | Astrael | Selo transcendente, diálogo/julgamento e escolha final de estabilizar ou romper. |

**Vhazaryon / Dragão FUSHI — [PRÉ-DESENVOLVIDO]**

- Não existe como espécie de dragão natural: é manifestação acumulada de desejo, fé, medo, ambição, memória, sacrifício e FUSHI de civilização antiga.
- É “aquele que concede e cobra”; seu horror é escala e preço, não maldade simples.
- Estados previstos: selado → rachado → despertar parcial → jogo global → forma humana → resolução do desejo.
- Despertar afeta todos os biomas, rotas, estabilidade e reação das facções.
- O evento desenha sete manifestações: olho no Vulcão, garra nas Cinzas, escama no Litoral, coração na Floresta, sombra no Véu, cauda no Oceano e mandíbula nas Ruínas.
- Depois de manifestações/dano, há uma forma humana e desejos resolvidos sempre com custo.

---

## Arcos e eventos pré-desenvolvidos

### 1. O arco da Vila, dos espelhos e da identidade

**Estado:** em andamento e já tocado em mesa.

- Protagonistas conhecem moradores cujas dores/traços ecoam neles, sem saber a natureza completa do vínculo.
- Kael no Mundo dos Sonhos foi preparado para ensinar: “molde não é dono da alma”; uma meia-verdade é pista, não origem completa.
- A Vila pode reagir à estranheza dos protagonistas: medo, proteção, curiosidade, acolhimento ou acusações de invasão.

**Próximo passo seguro:** treinamento, tradução, conversas com Renji/Kazuo/Orian e consequências emocionais da promessa feita a Nilo.

### 2. Liora, Nilo, Caixinha do Ontem e esfera

**Estado:** ativado na Sessão 3.

- Nilo usa FUSHI preso em luto/memória para repetir ou atrasar instantes curtos.
- O Eco de Liora consumiu energia e desapareceu ao grupo se aproximar; isso não prova retorno à vida.
- O mecanismo gerou uma esfera mágica de ativação/retorno, hoje com o grupo.
- Kael mentiu/prometeu trazer “Eliora/Liora” de volta para conseguir a Caixinha. A caixa também está com o grupo.

**Risco dramático:** tratar a caixa como máquina de desfazer morte ou transformar Liora em guia vivo. Ela é memória limitada; qualquer resposta nova ao luto pode ser eco, interferência ou algo perigoso.

### 3. Solo de Kael e o fio azul

**Estado:** conteúdo implementado/preparado; a Sessão 3 já avançou além do ponto de partida original.

- Kael esteve deslocado, não morto: corpo na cama; consciência em espaço interno.
- O fio azul liga Kael, Fragmentado e outras consciências como vínculo, não corrente.
- Ecos de Kael/Kairos/Davi/Grim/Connor revelam meias-verdades sobre nome, culpa, crescimento, impulso e abandono.
- A vitória acontece quando Kael assume identidade própria sem negar que os ecos existem.

**Não revelar por esse arco:** explicação total do organismo, NPCs como cópias literais, Liora como fantasma vivo ou Ryoku/Dragão como causa direta do episódio.

### 4. Ryoku, Velkar e os dez fragmentos

**Estado:** grande arco pré-desenvolvido; ainda não jogado como Cataclisma.

Ryoku é uma concentração primordial/distorcida de FUSHI ligada a invocações e civilização antiga. Está selado na Torre do Abismo. Velkar move-se de forma autônoma para localizar, roubar ou ritualizar os fragmentos.

| Fragmento | Ponto | Ideia/natureza |
|---|---|---|
| 01 | P30 Torre do Abismo | Núcleo petrificado/corpo. Retirar é decisão, não recompensa simples. |
| 02 | P34 Biblioteca Morta | Memória da civilização. |
| 03 | P32 Altar Quebrado | Corpo ritual. |
| 04 | P33 Estruturas | Forma instável. |
| 05 | P31 Corredor das Vozes | Voz sem boca. |
| 06 | P39 Laboratório Abandonado | Carne imortal. |
| 07 | P38 Árvore de FUSHI Vivo | Coração rejeitado. |
| 08 | P15 Rio da Escuridão | Corrente escura. |
| 09 | P23 Fortaleza Soterrada | Fome congelada. |
| 10 | P59 Estátuas do Litoral | Sangue da guerra. |

**Estados previstos:** 0–3 selado/inércia; 4–6 influência ambiental; 7–9 projeções parciais; 10 despertado. A Torre possui quatro travas físicas (P31–P34 e eixo P30) e o evento não deve depender de os jogadores coletarem tudo por vontade própria: Velkar/facções podem mover o mundo.

### 5. Vhazaryon e o jogo global

**Estado:** pré-desenvolvido; não apresentado em mesa.

- A cadeia dos seis guardiões mede a pressão sobre o selo do Dragão.
- Vhazaryon pode alterar a Ilha inteira e impor escolhas/desejos com custo proporcional.
- O “jogo global” é estrutura de evento, não um chefe de ficha plana. Exige fases, mapas, VFX, áudio, consequências e estado persistente.
- O conflito de desejos deve atingir facções e vínculos: por exemplo, Elara pode desejar Liora, mas saber que aceitar tem preço impossível.

### 6. Seraph e Eclipse

**Estado:** pré-desenvolvido e pouco integrado.

Seraph é um arco de poder carismático, domínio territorial, sangue e promessa de imortalidade. O Eclipse existe como evento indicado em sua ficha, mas ainda precisa de gatilhos, locais, facções afetadas, custo e encaixe com Ryoku/Dragão para não competir por atenção.

### 7. Saída da Ilha

**Estado:** regra de mundo definida; rota dramática aberta.

- Não há saída normal sem vórtices instáveis.
- Eles podem surgir ao mexer na Árvore/Floresta, no núcleo/Vulcão ou em energia extrema de FUSHI Escuro como Ryoku solto.
- Sair não é resolução automaticamente boa: pode exigir abandonar a Vila física, destruir equilíbrio ou aceitar custo coletivo.

---

## Linha do tempo canônica jogada

### Antes da campanha

- **[CONFIRMADO]** O organismo coletivo observou a Vila por anos e formou consciências a partir de traços humanos absorvidos.
- **[PLOT DEFINIDO]** A Vila já sofria com isolamento, êxodo impossível, demografia em queda e memórias presas ao FUSHI local.
- **[CONFIRMADO]** Liora morreu no acidente da rota após o pulso de FUSHI; Nilo ficou preso ao instante e criou/aperfeiçoou sua Caixinha.

### Sessão 1 — 2026-05-31

- O grupo despertou na Caverna do Primeiro Corpo e lambeu o ovo, ganhando 1 de Vida.
- Usou um osso como alavanca para sair da caverna.
- Na Clareira dos Lobos, enfrentou waves até a wave 4; ao menos três lobos foram derrotados.
- Connor, Kairos, Kael e Grim/Ruiz saíram do Fragmentado; Davi permaneceu no receptáculo.
- O grupo fugiu e avistou a Vila do Conhecimento Absorvido.

### Sessão 2 — 2026-07-09

- Kael ficou incapacitado/desacordado; Connor buscou ajuda na Vila.
- Kazuo, Orian, Elara, Maira, Sélian, Dalvo, Elias, Renji e outros foram introduzidos em diferentes graus.
- Davi/Fragmentado voltou sozinho à Clareira, falhou em teste e viu um feixe azul indo na direção do corpo de Kael.
- Davi/Fragmentado enfrentou três lobos por quase uma hora, ficou gravemente ferido e voltou; não levou lobos à Vila.
- Nayr permaneceu escondido; Nilo/Riacho ainda não foram explorados.

### Sessão 3 — 2026-07-18

- Fragmentado retornou ferido; Connor e Renji foram procurá-lo; Kael acordou.
- Elara falou de Liora e da crise de futuro/população da Vila e pediu ajuda.
- Kairos passou mal, disse que queria sair e esse sentimento levou Davi/Fragmentado a se desvincular do receptáculo.
- Todas as consciências saíram; o corpo do Fragmentado caiu vazio e paralisado. Davi não o ocupa mais.
- Davi, Kairos e Kael foram ao Riacho Claro; viram Nilo e o Eco de Liora, que se desfez sem energia.
- Nilo ativou o mecanismo; Davi pegou a esfera mágica; Kael obteve a Caixinha do Ontem por promessa falsa de trazer Liora de volta.
- Connor e Grim, com Kazuo/Orian, viram o estoque comunitário, entraram no galpão dos mapas e liberaram o Mapa Mundi.
- O grupo se reuniu e seguiu para o Campo de Treinamento.

### Estado presente / Sessão 4

**Confirmado agora:**

- Mapa Mundi liberado.
- Caixinha do Ontem e esfera mágica estão com o grupo.
- Receptáculo do Fragmentado está vazio/paralisado.
- Davi, Kairos e Kael retornaram do Riacho Claro.
- Frente imediata: Treinamento Inicial no Campo de Treinamento.

**Preparo solicitado:**

- arma `1d6` e/ou escudo/lança para cada protagonista;
- um nível para cada jogador;
- seis itens, um por arquétipo, para escolha/absorção opcional;
- cinco habilidades individuais;
- cinco aparelhos de tradução simultânea;
- catálogo de região, facção, local e línguas dos NPCs;
- música de treino com origem/licença registrada.

---

## Lacunas, contradições e furos que pedem atenção

Esses itens não são convites para inventar. São uma fila de decisões ou consolidações necessárias para preservar a coerência.

| Prioridade | Ponto | Risco | Ação segura |
|---|---|---|---|
| P0 | Mundo oficial vazio | `01_LORE/mundo/ilha.md`, `biomas.md` e `pontos-de-interesse.md` não refletem a riqueza já usada em MUN/design. | Consolidar resumos canônicos nesses três arquivos a partir deste compilado e das fontes primárias. |
| P0 | Morte/renascimento/rituais | A premissa explica o conceito, mas a mesa precisa de ordem operacional, disputa, custo, consentimento, fallback e revelação. | Criar uma ficha mestre única de morte real e ritual, sem expor no Livro do Jogador. |
| P0 | Fragmentado vazio | O grupo deixou um receptáculo paralisado; falta decisão pronta de reação social, risco físico, proteção e próxima consequência. | Preparar estados rápidos de Elara, Orian, Renji, Kazuo, Sélian e Maira. |
| P0 | Liora sem fonte própria | A personagem é central, mas não possui ficha/lore individual; há risco de versões divergentes. | Criar uma fonte curta “Liora — memória/eco”, fixando acidente, limites e relações. |
| P0 | Promessa a Nilo | Kael mentiu para obter a Caixinha. Se ficar sem consequência, enfraquece luto, confiança e custo. | Definir 2–3 reações possíveis de Nilo/Elara e gatilhos honestos; não punir automaticamente sem cena. |
| P1 | Ryoku × Vhazaryon | Há caminhos de coexistência, mas não uma regra canônica final de estados, prioridade e consequências. | Fechar uma matriz de estados antes de acionar qualquer Cataclisma. |
| P1 | Estabilidade da Ilha | Um desenho do jogo global fala em estabilidade artificial; auditoria antiga marcou contradição. | Separar explicitamente estabilidade visual/temporária de estabilidade física real, ou eliminar a exceção. |
| P1 | Vilão principal | `01_LORE/viloes/vilao-principal.md` é placeholder; Ryoku, Vhazaryon, Seraph e Velkar podem disputar esse papel. | Decidir se FUSHI terá antagonista central ou arquitetura de antagonismos. |
| P1 | Saída da Ilha | A condição de vórtices está definida, mas faltam consequências sociais, rota, duração e quem pode atravessar. | Escrever uma decisão por rota: Árvore, Vulcão e Ryoku. |
| P1 | Gelo e litoral | Muitos pontos têm mapa/visual, mas pouca história, NPC, conflito ou recompensa narrativa. | Para cada bioma, definir um conflito humano, um segredo, um evento e uma conexão de facção. |
| P1 | Seraph/Eclipse | Evento existe como ideia, sem integração clara de timing, mapa, custo e reação de facções. | Integrar somente após fechar Ryoku/Dragão ou declarar arco independente. |
| P1 | Mundo vivo de facções | Fichas dão motivações, mas falta agenda temporal de movimentos, alianças e gatilhos. | Fazer uma linha curta “o que cada facção faz se jogadores ignorarem”. |
| P2 | Matriz não é cópia | É fácil narrar Connor=Renji, Kairos=Sélian etc. como literal e quebrar a tese central. | Manter em toda cena a frase-regra: matriz humana observada, fragmento alienígena interpretado. |
| P2 | Nomes e grafia | Kael/Keal, Kairos/Kaíros, Lyrissa/Liryssa, “Villa/Vila” aparecem de modos diferentes. | Adotar tabela de nomes canônicos e aliases no controle de campanha. |
| P2 | Arquivo agregado de fichas | `Todas as fichas.txt` pode ficar defasado em relação a arquivos individuais. | Usar fichas individuais como fonte e regenerar/arquivar o agregado quando necessário. |
| P2 | Lore versus regras antigas | Fichas antigas têm números/defesas que conflitam com Combat V2. | Não copiar mecânica de fichas antigas; para combate, usar `FUSHI_COMBAT_V2.md`. |

### Contradições já resolvidas ou bloqueadas

- **Liora morreu de doença — [OBSOLETO].** A versão correta é acidente causado por animal comum em pânico após pulso de FUSHI das Ruínas.
- **Liora como NPC vivo — [BLOQUEADO].** Ela aparece como memória ou Eco limitado no Riacho; nunca como retorno simples à normalidade.
- **“Trilha para Vila” como ponto oficial — [OBSOLETO].** É cena de transição. P3 é Armazém Comunitário e P60 é Riacho Claro.
- **NPC da Vila = passado literal do jogador — [OBSOLETO].** São matrizes observadas, não a mesma pessoa.
- **Ryoku como voz interna divina padrão — [BLOQUEADO].** Ele não deve falsificar automaticamente as vozes dos protagonistas.
- **Desejo do Dragão sem custo — [BLOQUEADO].** Todo desejo cobra preço proporcional.

---

## Próximas decisões recomendadas para fechar roteiro

1. **Promover o mundo que já existe** para `01_LORE/mundo`: Ilha, oito biomas, pontos oficiais e função de cada facção.
2. **Fechar o protocolo de morte real**: condição, ordem, disputa, corpo vivo, animal, custo, Ritual do Silêncio, transposição e apresentação de mesa.
3. **Criar a entrada primária de Liora**: memória/eco, acidente, limites do retorno e relações com Nilo/Elara/Orian.
4. **Resolver a consequência imediata do receptáculo vazio** e da mentira de Kael antes de abrir arcos distantes.
5. **Escrever uma matriz Ryoku–Vhazaryon–Seraph**: estados possíveis, prioridade, interferência e resultado se dois arcos escalam ao mesmo tempo.
6. **Dar identidade narrativa a Gelo, Praia e Véu** antes de exigir exploração longa nesses biomas.
7. **Planejar movimentos autônomos de facções** em uma página: objetivo, próximo passo, gatilho de contato e consequência de ignorar.

---

## Snapshot curto para alimentar outra IA

```md
FUSHI é uma campanha de mundo vivo sobre identidade, corpo, memória, custo e sobrevivência. FUSHI altera o que existe e sempre cobra consequência; não cria do nada. Os protagonistas são consciências equivalentes de um organismo alienígena coletivo que absorveu matrizes emocionais de moradores da Vila, mas NPC e jogador nunca são a mesma pessoa literal.

O grupo saiu da Sessão 3 indo ao Campo de Treinamento. O Mapa Mundi foi liberado. A Caixinha do Ontem e uma esfera mágica estão com o grupo. Todas as consciências saíram do Fragmentado; o receptáculo ficou vazio e paralisado. Davi, Kairos e Kael voltaram do Riacho Claro. Kael mentiu/prometeu trazer Liora de volta para Nilo a fim de pegar a Caixinha.

Liora não morreu de doença: uma onda de FUSHI das Ruínas assustou um animal comum numa rota que ela marcava para suprimentos; houve acidente e Nilo chegou tarde. Liora só pode aparecer como memória/Eco limitado, não como NPC vivo normal. A Caixinha repete instantes curtos; não é viagem temporal completa.

Prioridade imediata: Treinamento Inicial, itens/armas/habilidades/tradutores, reação da Vila ao corpo vazio e à promessa feita a Nilo. Não revelar publicamente: natureza real dos protagonistas, renascimento/posse, Ritual do Silêncio, XP oculto, Ryoku, Vhazaryon ou metaplot.

Arcos futuros: Ryoku é Cataclisma selado na Torre do Abismo (P30), ligado a Velkar e 10 fragmentos; Vhazaryon é Dragão FUSHI, entidade de desejo/custo, contida pelo sistema de seis guardiões do Vulcão; Seraph/Eclipse ainda precisa de integração. Quando não houver fonte, marcar como hipótese de Mestre, nunca como cânone.
```

---

## Índice de fontes principais

### Lore primária

- `RPG-FUSHI/01_LORE/premissa/fushi.md`
- `RPG-FUSHI/01_LORE/premissa/protagonistas.md`
- `RPG-FUSHI/01_LORE/premissa/regras-da-existencia.md`
- `RPG-FUSHI/01_LORE/CONTEXTO APP.txt`
- `RPG-FUSHI/01_LORE/CONTEXTO CRIAÇÃO PERSONAGEM + Prota.txt`
- `RPG-FUSHI/01_LORE/npcs/Facções/(D) Villa (Planicie) (Protagonistas)/Nilo (Inspirado Ekko)/Lore + Ficha Nilo.txt`
- Arquivos individuais em `RPG-FUSHI/01_LORE/npcs/Facções/` para cada NPC/facção.

### Estado de campanha e mesa

- `RPG-FUSHI/06_TOOLS/fushi-tabletop/docs/planejamento/SESSION_1_ACTUAL_LOG_2026-05-31.md`
- `RPG-FUSHI/06_TOOLS/fushi-tabletop/docs/planejamento/SESSION_2_ACTUAL_LOG_2026-07-09.md`
- `RPG-FUSHI/06_TOOLS/fushi-tabletop/docs/planejamento/PLANICIE_SESSAO_03_RESULTADO_2026-07-18.md`
- `RPG-FUSHI/06_TOOLS/fushi-tabletop/docs/planejamento/PLANICIE_SOLO_KAEL_ECOS_RUNBOOK_2026-07-09.md`
- `RPG-FUSHI/06_TOOLS/fushi-tabletop/docs/planejamento/campanha-controle.json`

### Mundo implementado e design futuro

- `RPG-FUSHI/06_TOOLS/fushi-tabletop/src/lib/worldMundiState.ts`
- `RPG-FUSHI/MUN_REWORK/Leitura do mapa.txt`
- `RPG-FUSHI/01_LORE/npcs/Facções/(B) FUSHI escuro (Andarilho)(.)/Ryoku (Sukuna)/EVENTO -CATACLISMA RYOKU.txt`
- `RPG-FUSHI/01_LORE/npcs/Facções/(F) Guardiões (Vulcão)/Vhazaryon (Dragão FUSHI)/EVENTO CATACLISMA - DESPERTAR DO DRAGÃO FUSHI1.txt`
- `RPG-FUSHI/06_TOOLS/fushi-tabletop/docs/LORE_ACTION_BOARD_2026-05-22.md`
- `RPG-FUSHI/06_TOOLS/fushi-tabletop/docs/LORE_STRUCTURAL_AUDIT_2026-05-22.md`

### Não usar como verdade isolada

- `RPG-FUSHI/01_LORE/npcs/Facções/Todas as fichas.txt` — índice agregado potencialmente defasado.
- Fichas antigas para números de combate — a fonte ativa é `docs/fushi-system/FUSHI_COMBAT_V2.md`.
- `01_LORE/mundo/{ilha,biomas,pontos-de-interesse}.md` — placeholders até receberem consolidação canônica.
