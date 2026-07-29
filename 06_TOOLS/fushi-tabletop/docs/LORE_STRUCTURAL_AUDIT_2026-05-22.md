# Auditoria estrutural de lore - FUSHI

Data da auditoria: 2026-05-22

Escopo lido nesta primeira passada:

- `C:\RPG FUSHI\RPG-FUSHI\01_LORE`
- `C:\RPG FUSHI\RPG-FUSHI\MUN_REWORK`
- dados principais do app em `C:\RPG FUSHI\RPG-FUSHI\06_TOOLS\fushi-tabletop\src`

Observacao: `01_LORE\Senhas mestre.txt` foi ignorado de proposito. Parece arquivo sensivel e nao e necessario para consolidar lore.

## Veredito curto

A base da historia esta bem forte e da para fechar ate sabado, 2026-05-30, mas hoje existem tres problemas estruturais:

1. A lore atual esta espalhada entre documentos antigos, MUN_REWORK e arquivos soltos de NPCs.
2. O app ainda nao reflete a lore canonica nova em varios pontos importantes.
3. As regras de simulacao, XP, renascimento e Cataclismas ainda precisam virar sistemas objetivos, nao apenas texto narrativo.

O maior risco nao e falta de ideia. O maior risco e o app usar dados antigos enquanto a mesa usa lore nova.

## Pilares canonicos que ja encaixam

### 1. FUSHI

FUSHI funciona como energia fundamental da existencia, ligada a identidade, percepcao e realidade. A regra mais importante e:

- FUSHI nao cria do nada.
- FUSHI transforma o que existe.
- Toda acao tem custo, desgaste ou consequencia.
- Quanto mais forte a identidade, maior a capacidade de perceber, moldar e resistir ao mundo.

Isso conversa bem com os protagonistas, renascimento, Cataclismas e evolucao.

### 2. Protagonistas

Os protagonistas sao fragmentos de um organismo alienigena microscopico/coletivo que absorveu caracteristicas humanas. Eles nao tem "original" superior, nucleo unico ou fragmento mais verdadeiro.

Isso encaixa com:

- todos comecarem no mesmo corpo;
- cada jogador ter uma consciencia independente;
- separacao futura em corpos diferentes;
- conflito interno sem invalidar nenhum player;
- ligacao intuitiva entre fragmentos;
- evolucao por identidade.

Ponto a preservar: nenhum protagonista deve virar "o verdadeiro". A mesa precisa manter equivalencia entre fragmentos.

### 3. Vila inicial

A Vila do Conhecimento Absorvido e um dos centros narrativos mais importantes do RPG.

Ela nao e so "hub inicial". Ela e a matriz humana que ensinou linguagem, emocao, medo, afeto, trauma e identidade ao organismo alienigena.

Funcao da vila:

- espelho emocional dos protagonistas;
- fonte das primeiras memorias absorvidas;
- lugar onde a pergunta moral nasce: absorver alguem torna voce reflexo, herdeiro ou invasor?
- lugar seguro inicial, mas nao neutro;
- possivel fonte de corpos para renascimento;
- prova viva de que a ilha esta morrendo devagar.

Isso esta muito bom e deve virar canon oficial no app.

### 4. Ilha

A ilha funciona como um sistema vivo/selado:

- Floresta Mistica / Arvore da Vida: coracao vivo da ilha.
- Vulcao / nucleo / orbe: peso, poder armazenado e prisao do Dragao FUSHI.
- Veu: memoria, distorcao, identidade e fronteira perceptiva.
- Ruinas: heranca quebrada, selos e Ryoku.
- Mar/Litoral: limite, fuga impossivel e prova de que o mundo externo existe.

O conceito de "sair da ilha exige ferir o sistema que mantem a ilha viva" esta forte e deve ser tratado como dilema central, nao como simples objetivo de mapa.

### 5. Cataclismas

Existem dois Cataclismas estruturais principais ja bem encaminhados:

- Ryoku: Cataclisma do FUSHI Escuro, selado na Torre do Abismo, ligado a fragmentos, Velkar e corrupcao.
- Vhazaryon / Dragao FUSHI: Cataclisma do nucleo/vulcao, ligado a desejo, custo, vontade, ilha inteira e jogo global.

Eles nao sao so bosses. Eles mudam o estado do mundo.

## Pontas soltas e riscos estruturais

### A. Documentos oficiais do mundo ainda estao vazios

Arquivos como:

- `01_LORE\mundo\ilha.md`
- `01_LORE\mundo\biomas.md`
- `01_LORE\mundo\pontos-de-interesse.md`

ainda estao praticamente vazios, enquanto `MUN_REWORK` ja possui a lore real.

Risco: no futuro, voce ou o app podem ler o documento vazio/antigo e tomar ele como canon.

Acao recomendada: transformar `MUN_REWORK` em canon resumido nesses arquivos oficiais, sem apagar os detalhes do MUN_REWORK.

### B. Numeracao e nomes do MUN estao desalinhados no app

O app ainda tem pontos antigos/desalinhados, principalmente em Vulcao, Gelo e Ruinas.

Exemplos criticos:

- Lore nova: ponto 13 = entrada do vulcao.
- App atual: ponto 13 = campo de cinzas.
- Lore nova: ponto 14 = campo de cinzas / nucleo paradoxal / orbe das seis estatuas.
- App atual: ponto 14 = vulcao adormecido.
- Lore nova: ponto 30 = Torre do Abismo, centro de Ryoku.
- App atual: ponto 30 = cidade afundada.
- Lore nova: ponto 34 = Biblioteca Morta.
- App atual: ponto 31 = Biblioteca Morta.

Isso e um risco grande porque Ryoku, Dragon FUSHI e rotas de boss dependem de ponto exato.

Acao recomendada: corrigir `worldMundiState.ts` antes de usar o MUN como fonte de verdade na mesa.

### C. Vila inicial tem conflito leve de nomeacao

Em um documento antigo, ponto 3 aparece como Trilha para Vila. Na versao nova da vila, ponto 3 virou Armazem Comunitario.

Como o app ja usa Armazem e a vila nova tambem, a canonizacao sugerida e:

- ponto 3: Armazem Comunitario;
- "Trilha para Vila": cena de transicao/interludio, nao ponto oficial numerado.

Isso evita renumerar mapas ja prontos.

### D. Nilo e Liora precisam de mapa emocional proprio

A lore de Nilo criou um lugar importante:

- pequena plataforma de madeira perto do Riacho Claro;
- entre pedras e raizes;
- onde a agua bate nas pedras;
- lugar secreto de Nilo e Liora;
- ligado a memoria, eco temporal e luto.

Esse lugar nao existe entre os 60 pontos oficiais.

Acao recomendada: criar submapa extra:

`planicie_riacho_claro_plataforma_liora_nilo_topdown`

Ele deve ser acessado pelo ponto 60, como rota emocional opcional, nao como novo ponto numerado do MUN.

### E. Liora precisa existir como ficha/lore, mesmo morta

Hoje Liora tem peso enorme na historia de Nilo, mas precisa virar entidade rastreavel:

- ficha memorial;
- relacao com Nilo;
- causa da morte;
- mapas que desenhava;
- possivel eco falso criado por Ryoku;
- possivel eco verdadeiro limitado pelo local;
- objeto pessoal ou mapa deixado.

Ela nao precisa ser NPC vivo. Mas precisa estar no app/lore para a simulacao entender Nilo.

### F. Ritual do Silencio precisa de consequencia fixa

As regras de existencia dizem que o Ritual do Silencio remove vozes acumuladas, mas a consequencia pratica ainda precisa ficar clara.

Perguntas abertas:

- Remove so ruido ou tambem apaga memoria util?
- Afeta identidade/FUSHI?
- Pode apagar uma consciencia que os jogadores queriam salvar?
- E reversivel?
- Quem sabe fazer?
- Qual custo narrativo?

Sem isso, o ritual pode virar "botao de limpar problema".

### G. Renascimento precisa virar tabela de mesa

A regra base esta boa:

- corpo antigo morre de verdade;
- consciencia volta imediatamente;
- novo corpo depende de FUSHI, capacidade fisica e intelectual;
- pode haver sucesso, disputa ou rejeicao.

Mas para mesa e app precisa de tabela objetiva:

- quando rola;
- quem escolhe corpo;
- como calcular compatibilidade;
- o que acontece se so houver animais/corpos fracos por perto;
- diferenca entre corpo vivo, corpo morto recente e corpo vazio;
- como NPCs reagem a serem tomados;
- como consentimento/disputa funciona;
- quando uma voz acumulada interfere.

Sem isso, o renascimento pode virar bagunca mecanica.

### H. XP/level ainda nao esta fechado

Voce ja definiu que level deve se ligar a:

- FUSHI desbloqueado;
- identidade;
- entendimento do mundo;
- experiencia real da mesa.

Isso e bom. Falta sistema.

Sugestao canonica sem inventar lore nova:

- XP comum nao deve ser so matar monstro.
- Evolucao deve vir de Marcos de Identidade.
- Combate, puzzle e descoberta de lore contam quando mudam o entendimento do personagem.

Modelo sugerido para sessao 1:

- descobrir o proprio corpo/primeira morte: marco grande;
- sobreviver/entender os lobos: marco pequeno/medio;
- interagir com a vila e absorver contexto humano: marco grande;
- treino no campo: marco mecanico;
- descobrir rota Bosque/Riacho: marco de mundo;
- primeiro uso consciente de FUSHI: marco grande.

Isso permite subir rapido ate perto do nivel 9 sem parecer grind artificial.

### I. Powerscaling dos NPCs tem ordem confusa

O arquivo de powerscaling define:

- Base;
- Avancado;
- Ascendente;
- Cataclismo.

Mas a numeracao textual coloca Cataclismo como nivel 3 e Ascendente como nivel 4 "entre Avancado e Cataclismo".

Acao recomendada:

- Nivel 1: Base.
- Nivel 2: Avancado.
- Nivel 3: Ascendente.
- Nivel 4: Cataclismo.

Isso limpa a simulacao.

### J. Ryoku e Dragao precisam de regras de coexistencia

Ryoku e Dragao FUSHI podem acontecer em ordens diferentes.

Ja existe:

- se Ryoku desperta primeiro, tenta consumir/corromper o nucleo do Dragao;
- se Dragao desperta primeiro, Ryoku e atraido e pode projetar sombra no jogo global.

Falta transformar isso em regra de estado:

- quais flags mudam no app;
- qual evento tem prioridade visual no MUN;
- como os NPCs reagem;
- como estabilidade da ilha muda;
- quais mapas sao bloqueados ou alterados.

### K. Estabilidade da ilha ainda nao existe como sistema

O evento do Dragao usa `island_stability`, mas isso ainda precisa virar:

- variavel real;
- historico de alteracoes;
- gatilhos de mapa;
- gatilhos de NPC;
- consequencias visuais;
- consequencias de rotas.

Sem isso, Cataclisma vira texto e nao mundo vivo.

### L. Estado do Dragao tem uma possivel contradicao

No evento do Dragao, a ilha pode chegar a estabilidade baixa antes do jogo global, mas depois o estado "global_game_active" aparece com estabilidade 10.

Pode ser intencional, como se o Dragao "congelasse" a ilha para o jogo. Mas precisa ficar explicito.

Opcao canonica recomendada:

- estabilidade fisica da ilha nao sobe de verdade;
- o Dragao cria uma estabilidade artificial durante o jogo;
- quando o jogo acaba, o custo volta.

Isso evita parecer que o problema se resolveu sozinho.

### M. App nao tem as fichas reais dos NPCs

O arquivo de personagens do app ainda tem poucos registros e varios placeholders.

Faltam fichas estruturadas para quase todos os NPCs principais:

- Vila: Dalvo, Elara, Elias, Kazuo, Maira, Nayr, Nilo, Orian, Renji, Selian.
- Monges: Aureon, Eiran, Gorin, Kael, Lux, Musashi.
- FUSHI Escuro: Yanzik, Seraph, Velkar, Ryoku, Jaxir, Lyssara.
- Veu: Arven, Elion, Kairo, Varek, Aeron, Yor.
- Mare: Bront, Lyrissa, Maelra, Nyx, Varden, Veyra.
- Vulcao: Morghast, Euryaleth, Vorashk, Aeronyx, Thal'Zhyr, Astrael, Vhazaryon.
- Protagonistas/corpos: Connor/Emanuel, Davi, Kael/Pyetro, Kairos/Kuster, Ruiz/sem nome, corpo compartilhado fragmentado.

Acao recomendada: importar primeiro a Vila, porque ela sera usada na primeira sessao.

### N. Mobs e encontros nao estao centralizados

Existem bosses e NPCs importantes, mas falta uma lista de mobs por regiao:

- Planicie;
- Praia;
- Montanha;
- Floresta Mistica;
- Vulcao;
- Gelo;
- Ruinas;
- Veu.

Para a primeira sessao, so precisa fechar Planicie e rotas iniciais.

### O. Musicas ainda nao estao mapeadas por cena

Trilha sonora deve ser tratada como asset de cena, nao so decoracao.

Minimo para sessao 1:

- nascimento/caverna;
- tensao leve/exploracao;
- combate lobos;
- vila segura/melancolica;
- campo de treino;
- Nilo/Liora/Riacho;
- misterio FUSHI;
- encerramento/suspense.

## Vila inicial - consolidacao canonica sugerida

### Pontos oficiais

1. Caverna do Primeiro Corpo
2. Clareira dos Lobos
3. Armazem Comunitario
4. Campo de Treino
5. Vila da Planicie / Vila do Conhecimento Absorvido
6. Bosque Baixo
60. Riacho Claro

### Cena de transicao

- Trilha para Vila: usar como caminho narrativo entre pontos, nao como ponto numerado.

### Submapa extra necessario

- Plataforma de Nilo e Liora no Riacho Claro.

### NPCs prioritarios para ficha no app

1. Elara
2. Orian
3. Nilo
4. Selian
5. Maira
6. Dalvo
7. Elias
8. Nayr
9. Renji
10. Kazuo
11. Liora como ficha memorial

### Funcoes narrativas da vila

- Elara: desejo de salvar a vila, dilema de abandonar o lugar para preservar o povo.
- Orian: mapas, rotas antigas, memoria geografica, tentativa de entender saida.
- Nilo: luto, eco temporal pequeno, amor por Liora, resistencia a deixar o lugar.
- Selian: vozes internas, sensibilidade ao peso da vila, possivel espelho do problema dos protagonistas.
- Maira: tradicao, medo da mudanca, resistencia moral.
- Dalvo: praticidade, apoio silencioso, sobrevivencia diaria.
- Elias: diagnostico da decadencia biologica/social.
- Renji/Kazuo: prova viva de que existe mundo externo.
- Nayr: precisa ser lido com mais detalhe antes de fechar funcao canonica.
- Liora: memoria, mapas, perda, rota secreta, perigo de eco falso.

## Cataclisma Ryoku - consolidacao

Ryoku deve ser tratado como Cataclisma selado na Torre do Abismo, nao como boss aleatorio.

### Pontos fundamentais

- Ponto 30: Torre do Abismo, corpo/nucleo selado.
- Pontos 31, 32, 33, 34: quatro travas fisicas nas Ruinas.
- Fragmentos espalhados pela ilha:
  - 30 Torre do Abismo;
  - 34 Biblioteca Morta;
  - 32 Altar Quebrado;
  - 33 Estruturas das Ruinas;
  - 31 Corredor das Vozes;
  - 39 Laboratorio Abandonado;
  - 38 Arvore FUSHI Vivo;
  - 15 Rio da Escuridao;
  - 23 Fortaleza Soterrada;
  - 59 Arena Antiga / litoral.

### Estados recomendados

- 0 a 3 fragmentos: selado, sussurros e ecos.
- 4 a 6 fragmentos: ruinas instaveis, risco aumentado.
- 7 a 9 fragmentos: projecoes, mobs, Velkar mais ativo.
- 10 fragmentos: despertar, cataclisma das ruinas.

### Regras faltando

- O que Velkar faz por dia se os players ignoram a quest?
- Quais fragmentos podem ser obtidos antes de saberem o que sao?
- Como o app mostra risco de Ryoku no MUN?
- O que acontece se Ryoku alcanca o nucleo do Dragao?

## Cataclisma Dragao FUSHI - consolidacao

Vhazaryon e a entidade criada pelo acumulo de fe, medo, ambicao, memoria, sacrificio e FUSHI da civilizacao antiga.

Ele nao e "mal". Ele testa desejo, vontade, custo, identidade e equilibrio.

### Pontos fundamentais

- Ponto 14: nucleo paradoxal / campo de cinzas / seis estatuas / orbe.
- Ponto 20: dimensao Astrael / transcendente.
- Ponto 21: manifestacao de Deus Dragao, escala de ilha inteira.

### Estrutura do evento

1. Ruptura do nucleo.
2. Manifestacao no MUN.
3. Jogo global.
4. Manifestacoes nos biomas.
5. Forma humana final.
6. Resolucao do desejo/custo.

### Assets/mapas necessarios

- mapa do ponto 14 selado;
- mapa do ponto 14 rachado;
- mapa do ponto 14 desperto;
- dimensao Astrael normal;
- dimensao Astrael rachada;
- dimensao Astrael julgamento;
- overlay do MUN com Cataclisma do Dragao;
- manifestacao olho no vulcao;
- manifestacao garra nas cinzas;
- manifestacao escama no litoral;
- manifestacao coracao na floresta;
- manifestacao sombra no Veu;
- manifestacao cauda no oceano;
- manifestacao mandibula nas ruinas;
- arena forma humana final.

### Regras faltando

- Como a estabilidade artificial do jogo global funciona.
- Como o app salva escolhas/custos de desejo.
- Como os NPCs lembram a manifestacao.
- Como o Dragon interfere em rotas ja abertas.
- Como o mapa inteiro muda durante o ponto 21.

## Mapas e thumbs necessarios

### Ja existem como prioridade de sessao 1

Na pasta da Vila ja existem topdowns para:

- Caverna do Primeiro Corpo;
- Clareira dos Lobos;
- Vila da Planicie;
- Campo de Treino;
- Armazem Comunitario;
- Bosque Baixo;
- Riacho Claro.

### Falta criar para sessao 1

- Plataforma de Nilo e Liora no Riacho Claro.
- Thumb/ficha memorial de Liora.
- Possiveis pequenos mapas de transicao da Trilha para Vila, se voce quiser encenar caminhada sem usar mapa grande.

### Falta criar para Cataclismas

- variantes do nucleo do Dragao no ponto 14;
- mapas dos guardioes do vulcao com fases;
- mapas de manifestacao global do Dragao;
- mapas das quatro travas de Ryoku;
- mapa da Torre do Abismo canonica;
- overlays do MUN para Ryoku e Dragao.

### Falta organizar no app

- thumbs de todos os pontos do MUN com nomes canonicos;
- relacao `pointId -> mapId -> asset`;
- relacao `characterId -> locationIds`;
- relacao `eventState -> mapVariant`.

## Itens, pistas e puzzles por funcao

### Sessao 1

Itens/pistas recomendados sem inventar grandes novas mitologias:

- fragmento de memoria na Caverna do Primeiro Corpo;
- marcas de lobo/FUSHI na Clareira;
- objeto cotidiano da vila reconhecido sem saber por que;
- mapa antigo incompleto no Armazem ou com Orian;
- treino que desbloqueia primeira tecnica consciente;
- som/eco no Riacho Claro ligado a Nilo/Liora;
- bifurcacao Bosque/Riacho mostrando que a ilha tem regioes muito diferentes.

### Vila

Puzzles devem ser sociais/emocionais:

- entender quem esta com medo de sair;
- entender quem quer sair mas tem culpa;
- descobrir que a tradicao pode ser medo herdado;
- perceber que os protagonistas "conhecem" coisas da vila sem terem vivido ali.

### Ryoku

Puzzles devem ser de selo/memoria/voz:

- distinguir voz verdadeira de manipulacao;
- fechar ou abrir travas sabendo o custo;
- impedir Velkar sem necessariamente entender tudo.

### Dragao

Puzzles devem ser de desejo/custo:

- o que voce quer;
- o que voce aceita pagar;
- o que voce chama de liberdade;
- se preservar a ilha e preservar as pessoas sao a mesma coisa.

## Simulacao viva e memoria de contexto

Para a simulacao nao gerar cenas aleatorias depois de uma cena importante, o app precisa salvar contexto em camadas.

### Camadas recomendadas

1. Canon fixo
   - regras do mundo;
   - historia da ilha;
   - fichas dos NPCs;
   - regras de FUSHI/renascimento/Cataclismas.

2. Estado do mundo
   - dia atual;
   - pontos visitados;
   - estabilidade da ilha;
   - estado de Ryoku;
   - estado do Dragao;
   - faccoes ativas;
   - NPCs mortos, feridos, movidos ou convencidos.

3. Memoria de grupo
   - quem esta no grupo;
   - o que aconteceu desde que o grupo foi formado;
   - conflitos internos;
   - promessas feitas;
   - NPCs presentes.

4. Memoria de NPC
   - o que esse NPC viu;
   - o que ele sabe;
   - o que ele acredita;
   - relacao com cada player;
   - trauma/objetivo/medo atual.

5. Resumo de sessao
   - resumo curto apos cada cena;
   - decisoes canonicas;
   - ganchos pendentes.

### Regra importante

A IA pode sugerir, mas o app deve salvar fatos canonicos somente quando o mestre confirma ou quando uma acao de jogo realmente acontece.

Isso evita a IA "inventar canon" sozinha.

## Multiplayer e estabilidade

Para a primeira sessao, o objetivo deve ser:

- host no seu PC;
- jogadores entram por IP;
- mapa sincroniza;
- rolagens sincronizam;
- chat normal nao vira log de sistema;
- fichas abrem;
- movimento de tokens funciona;
- mudanca de mapa nao derruba os clientes;
- assets principais ja carregados ou com fallback limpo;
- mestre consegue corrigir estado manualmente.

Antes de decorar com objetos/animacoes 3D, o app precisa passar um smoke test multiplayer.

## Plano ate sabado, 2026-05-30

### 2026-05-22 a 2026-05-23

- Corrigir nomes/ids canonicos do MUN no app.
- Importar fichas da Vila para o app.
- Criar ficha memorial de Liora.
- Criar backlog de mapas faltantes.
- Fechar regra de XP por Marcos de Identidade.
- Fechar tabela de renascimento.

### 2026-05-24 a 2026-05-25

- Implementar estado minimo de mundo vivo:
  - dia;
  - grupo;
  - memoria curta;
  - eventos canonicos;
  - estado Ryoku/Dragao inicial.
- Preparar conteudo da primeira sessao.
- Testar multiplayer por IP em rede local.

### 2026-05-26 a 2026-05-27

- Completar assets minimos:
  - thumbs da Vila;
  - mapa extra Nilo/Liora;
  - trilhas sonoras base;
  - mobs da Planicie.
- Rodar build do Electron.
- Testar app real em `release\win-unpacked\RPG FUSHI.exe`.

### 2026-05-28 a 2026-05-29

- Corrigir bugs encontrados.
- Fazer dry-run de 1 hora sozinho como mestre.
- Fazer checklist de inicio da sessao.

### 2026-05-30

- Sessao teste de 1 hora:
  - nascimento;
  - lobos;
  - chegada/primeiro contato com vila;
  - treino ou descoberta de FUSHI;
  - gancho final com rota Bosque/Riacho.

## Ordem de implementacao recomendada no app

1. Corrigir MUN canonico (`worldMundiState.ts` e mapas relacionados).
2. Adicionar fichas da Vila.
3. Adicionar Liora como ficha memorial.
4. Adicionar mapa extra Nilo/Liora como submapa do Riacho Claro.
5. Criar regras de XP por Marcos de Identidade.
6. Criar regras de renascimento.
7. Criar estado minimo de simulacao viva.
8. Testar multiplayer.
9. So depois investir em assets 3D, VFX e cinematicas.

## Decisoes que precisam de confirmacao do mestre

Estas nao devem ser inventadas pelo app/IA sem voce aprovar:

1. O Ritual do Silencio apaga memoria, vozes ou identidade?
2. Liora pode aparecer como eco verdadeiro, ou so como memoria/ilusao?
3. A plataforma de Nilo e Liora deve ser um lugar seguro, puzzle ou gatilho de perigo?
4. Os players podem tomar corpo de NPC vivo sem consentimento?
5. Renascimento em animal e permitido na primeira sessao?
6. A vila deve saber desde o inicio que algo esta errado com os protagonistas?
7. Dragon FUSHI pode conceder desejo sem destruir algo equivalente?
8. Ryoku pode fingir ser uma voz interna dos protagonistas?
9. A saida da ilha deve ser possivel antes de lidar com Arvore/Vulcao?
10. O primeiro teste deve levar os personagens ate nivel 9 exatamente, ou "perto do 9"?

