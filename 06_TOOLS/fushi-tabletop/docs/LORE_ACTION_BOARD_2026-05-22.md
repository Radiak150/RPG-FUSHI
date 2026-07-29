# Quadro objetivo de lore - FUSHI

Data: 2026-05-22

Este arquivo substitui a leitura confusa por categorias praticas: perguntas, respostas, furos, mapas, musica e estrategia.

## Estado real do app

O app que voce abriu em `release\win-unpacked` esta lendo o workspace persistido aqui:

`C:\Users\danie\AppData\Roaming\FUSHI\workspace.json`

Por isso alteracoes feitas so no seed/mock nao aparecem automaticamente na tela de personagens. O workspace real agora tem 48 personagens. Antes desta consolidacao ele tinha 35 personagens com imagens, incluindo:

- `Fragmentado` como jogador.
- `Kairos` como jogador.
- `Selian` como NPC.
- Bosses do Vulcao, Monges, FUSHI Escuro, Veu e Mare como NPCs.

Backup criado antes de mexer nessa base:

`C:\Users\danie\AppData\Roaming\FUSHI\workspace.backup-before-lore-2026-05-22.json`

Backup extra antes da consolidacao noturna:

`C:\Users\danie\AppData\Roaming\FUSHI\workspace.backup-before-overnight-lore-2026-05-22.json`

Regra daqui para frente: atualizar personagens existentes por id/nome, preservando imagem e ficha visual; criar novo personagem so quando ele realmente nao existir.

## Aplicado no app real

Estas alteracoes ja foram aplicadas no workspace que o exe le:

1. Jogadores adicionados como `player`
   - `Davi Paixao`;
   - `Connor Mayweather`;
   - `Keal Lebranc`;
   - `Ruiz`.

2. NPCs da Vila adicionados como `npc`
   - `Elara Vonn`;
   - `Orian Vonn`;
   - `Nilo Arven`;
   - `Maira Velan`;
   - `Dalvo Seren`;
   - `Elias Norem`;
   - `Nayr Velcaris`;
   - `Renji Akimura`;
   - `Kazuo Kato`.

3. `Kairos` e `Selian` foram alinhados sem duplicar ficha
   - `Kairos` segue como jogador/protagonista fragmentado.
   - `Selian` segue como NPC real da Vila.
   - A relacao entre eles foi registrada como espelho/matriz emocional, nao como "sao a mesma pessoa literal".

4. Pontos ainda marcados como pendentes no app
   - Davi, Connor e Ruiz receberam atributos/pericias como rascunho mecanico para o app ficar jogavel; confirmar antes da sessao.
   - Keal recebeu atributos/pericias diretamente da ficha.
   - Liora ainda nao virou ficha propria porque falta decidir se ela sera memoria, eco limitado, registro ou combinacao.

## Perguntas

Estas perguntas agora tem resposta canonica do mestre em 2026-05-23.

1. Liora aparece como o que?
   - Resposta: Liora aparece como memoria. Ela tambem pode aparecer como Eco no Riacho Claro, mas nesse caso entra como `mob`, nao como NPC vivo.

2. Kairos e Selian devem se espelhar ate que ponto?
   - Resposta: todos os protagonistas sao interpretacoes distorcidas que o Fragmentado absorveu de personalidades especificas da vila. No caso de Kairos, a matriz central absorvida foi Selian. Selian continua sendo pessoa real da vila; Kairos continua sendo Fragmentado.

3. Connor e Renji seguem a mesma regra?
   - Resposta: sim. Connor nao e Renji literal. Connor e o Fragmentado interpretando Renji/Kazuo por absorcao de personalidade, abandono, sobrevivencia, alerta e desejo de paz.

4. Keal/Kael precisa de nome canonico?
   - Resposta: podem existir dois Kael. O monge continua `Kael`; o jogador fica `Kael Lebranc` ou sera chamado de `Lebranc` quando for preciso diferenciar.

5. O Ritual do Silencio remove o que?
   - Resposta: mata realmente aquela consciencia/ser para sempre. E ritual pesado, nao limpeza emocional simples.

6. Renascimento pode tomar corpo vivo?
   - Resposta atualizada em 2026-05-27: renascimento e automatico por mecanica; nem o Fragmentado nem os NPCs escolhem livremente. A alma FUSHI tenta, em ordem de proximidade: reacender o proprio corpo consumindo FUSHI ao redor, possuir Ficha Avancada, possuir Ficha Basica ou cair em Animal Silvestre. Depois disso ainda existe a disputa de posse contra a vontade do corpo.

7. Animal/corpo fraco na sessao 1?
   - Resposta: nao usar morte real na sessao 1. Para o tutorial, usar mecanica de waves: ao chegar a 0 HP, o jogador volta a 1 HP, a wave para, mobs fogem, e o grupo perde 50% dos recursos daquela rodada/serie.

8. Dragon FUSHI concede desejo sem custo?
   - Resposta: nao. O custo existe e normalmente equivale a energia necessaria para realizar o desejo. Exemplo canon possivel: Ryoku pode ter pedido imortalidade; ganhou, mas ficou preso a ilha, teve poder selado e nao pode sair.

9. Ryoku pode fingir ser voz interna dos protagonistas?
   - Resposta: nao como regra padrao. Ryoku nao e divindade. Ele e um usuario muito poderoso de FUSHI moldado por ganancia e FUSHI Escuro, prova viva de que abusar disso nunca acaba bem.

10. Saida da ilha antes de Arvore/Vulcao/Ryoku?
   - Resposta: nao existe saida sem vortices instaveis. Os vortices ficam instaveis por Arvore, Vulcao ou energia muito forte de FUSHI Escuro, como Ryoku liberado.

## Respostas

Estas sao estruturas que ja encaixam e podem virar canon, salvo voce discordar.

1. FUSHI nao cria do nada.
   - Ele transforma o que existe e cobra custo. Isso sustenta poderes, cura, Dragon, renascimento e identidade.

2. Protagonistas sao fragmentos equivalentes.
   - Nenhum player e "o verdadeiro". Todos sao partes independentes do organismo fragmentado.

3. A vila nao e hub comum.
   - A Vila do Conhecimento Absorvido e a matriz emocional/humana que o organismo absorveu.

4. Point 3 canonico e Armazem Comunitario.
   - "Trilha para Vila" fica como cena de transicao, nao POI numerado.

5. Nilo/Liora precisa ser submapa do Riacho Claro.
   - Nao vira ponto 61. Fica como local emocional acessado pelo ponto 60.

6. Arvore e Vulcao tem papeis complementares.
   - Arvore/Floresta = coracao vivo.
   - Vulcao/Nucleo/Orbe = peso, poder armazenado e prisao do Dragao.

7. Ryoku fica no ponto 30.
   - Torre do Abismo e o centro do Cataclisma Ryoku. Ele nao deve ser boss aleatorio depois de coletar fragmentos.

8. Dragon FUSHI nao e vilao simples.
   - Ele e entidade de desejo/custo/vontade. O horror vem da escala e do preco, nao de maldade comum.

9. Connor/Renji/Kazuo ja tem encaixe bom.
   - A historia de Connor valoriza o formulario do player sem contradizer Renji/Kazuo reais.

10. Selian/Kairos ja tem encaixe bom se tratado como eco.
   - Selian real: sensivel a vozes, rituais e pressao da vila.
   - Kairos player: forma simbolica do Fragmentado para transformar isso em sinos, faixas e "voz".

## Furos de roteiro

Estes pontos foram revisados com a resposta do mestre em 2026-05-23.

1. Protagonistas vs NPCs da Vila.
   - Nao e furo: Fragmentado, Kairos, Davi, Kael, Ruiz e Connor sao o mesmo ser em essencia. Eles nasceram de um organismo/virus/alienigena que observou e absorveu personalidades especificas da vila.
   - Regra: NPC da vila nao e "passado literal" do jogador. O NPC e matriz humana observada; o jogador e a interpretacao distorcida criada pelo Fragmentado.

2. Identidade real dos protagonistas.
   - Ponto aberto intencional: o verdadeiro plot e descobrir quem/que coisa eles realmente sao, e se vao querer continuar como as personalidades novas que absorveram.

3. Separar ou juntar corpos.
   - Ponto a estruturar: nas Ruinas/Torre deve existir informacao ou ritual que separa corpos, junta novamente, ou remove vozes/consciencias depois de renascimento.

4. Determinacao 0 e separacao.
   - Regra lembrada: se a personalidade nao for compativel com o corpo, ela vai se separando quando chega a 0 de Determinacao. A aparencia real da personalidade pode emergir com nome e visual proprio, mas todos continuam sendo Fragmentado.

5. Liora.
   - Resolvido: Liora fica como memoria e possivel `mob` Eco do Riacho. Nao e NPC vivo comum.

6. Prioridade Dragon vs Ryoku.
   - Resolvido: Dragon tem prioridade estrutural porque altera stats core da ilha. Ryoku aumenta instabilidade e risco, mas nao muda o core global antes do Dragon.

7. Ritual do Silencio e rituais de transferencia.
   - Furo ainda real: falta ficha mecanica separada para cada ritual, custo, alvo, materiais, consequencia e onde aprender.

8. Renascimento como caos/consequencia.
   - Nao e furo: virar caos faz parte do peso da morte. Mesmo imortais, morrer tem custo real. A regra precisa ficar clara para nao virar atalho.

9. App e lore do MUN.
   - Ja corrigido no codigo para Vulcao/Ruinas/Gelo, mas novos mapas/topdowns ainda precisam ser implementados por lote.

## Mapas que faltam

### Subcategorias para nao esquecer

1. Mapa oficial numerado.
   - Ponto do MUN com id proprio, usado na progressao principal.

2. Submapa emocional.
   - Nao vira ponto novo. Exemplo: Plataforma de Nilo e Liora dentro do eixo `Riacho Claro`.

3. Interior funcional.
   - Casa, sala, mapoteca, deposito, laboratorio, bunker ou templo ligado a um ponto oficial.

4. Memoria/interludio.
   - Cena visual de origem do protagonista ou eco de personalidade absorvida. Nao precisa ser rota fisica permanente.

5. Fase/variante de boss.
   - Mesmo local, mas com estado alterado por luta, ritual, cataclisma ou transformacao.

6. Overlay cataclisma.
   - Mudanca visual global por Dragon, Ryoku ou outro evento estrutural, sem substituir todos os mapas base.

### Prioridade sessao 1

1. Plataforma de Nilo e Liora no Riacho Claro.
   - Submapa emocional do ponto 60.
   - Madeira pequena, pedras, raizes, agua batendo, clima de memoria.

2. Sala/mapoteca de Orian.
   - Pode ser interior pequeno da vila.
   - Necessario se a entrega do mapa virar cena importante.

3. Casa/espaco ritual de Maira e Selian.
   - Necessario se o primeiro contato com Selian for cena forte.

### Protagonistas / memorias

4. Memoria de Kairos.
   - Altar/ritual/sinos/faixas, mas tratar como memoria simbolica, nao lugar literal obrigatorio.

5. Memoria de Connor/Renji.
   - Beco/emboscada/Kazuo acolhendo. Serve como interludio, nao mapa principal da ilha.

6. Memoria de Davi.
   - Laboratorio/cameras/Yuri/Jefferson. Serve como interludio de origem.

7. Memoria de Keal/Nayr.
   - Caverna, perda de controle, morte da mae/Mara conforme canon final. Precisa cuidado para nao misturar player e NPC literal.

8. Memoria de Ruiz.
   - Floresta noturna, mestre/avo, energia vital ressoando.

### Ruinas / Ryoku

9. Terras Podres - ponto 29.
10. Torre do Abismo - ponto 30.
11. Corredor das Vozes - ponto 31.
12. Altar Quebrado - ponto 32.
13. Estruturas das Ruinas Abandonadas - ponto 33.
14. Biblioteca Morta - ponto 34.
15. Portao Sem Nome - ponto 35.

Status 2026-05-23: lote base integrado no app como bioma `Ruinas Antigas / Ryoku`, usando as imagens existentes de `MUN_REWORK` para escolha rapida no tabuleiro. Ainda falta trocar por topdowns taticos 4000x4000 definitivos quando a direcao visual for aprovada.

### Vulcao / Dragon FUSHI

16. Entrada do Vulcao - ponto 13.
17. Campo de Cinzas / Nucleo com seis estatuas - ponto 14.
18. Rio da Escuridao / Morghast - ponto 15.
19. Vulcao Abandonado / Euryaleth - ponto 16.
20. Labirinto Quente / Vorashk - ponto 17.
21. Boca do Inferno / Aeronyx - ponto 18.
22. Escadaria do Vulcao em erupcao - subvariante 18.5.
23. Mar Inquieto / Thal'Zhyr - ponto 19.
24. Transcendente / Astrael - ponto 20.
25. Deus Dragao - ponto 21 / mapa de ilha inteira.

Status 2026-05-23: lote base integrado no app como bioma `Vulcao / Terras Cinzentas`, usando as imagens existentes de `MUN_REWORK` para escolha rapida no tabuleiro. Ainda faltam topdowns taticos 4000x4000 definitivos e variantes de fase do Dragon/Cataclismas.

### Dragon global

26. Nucleo ponto 14 selado.
27. Nucleo ponto 14 rachado.
28. Nucleo ponto 14 desperto.
29. Astrael normal.
30. Astrael rachado.
31. Astrael julgamento.
32. Overlay MUN Cataclisma Dragon.
33. Olho no Vulcao.
34. Garra nas Cinzas.
35. Escama no Litoral.
36. Coracao na Floresta.
37. Sombra no Veu.
38. Cauda no Oceano.
39. Mandibula nas Ruinas.
40. Arena forma humana final.

### Gelo

41. Vale Branco - ponto 22.
42. Fortaleza Soterrada - ponto 23.
43. Lago Congelado - ponto 24.
44. Grande Avalanche - ponto 25.
45. Caverna Azul - ponto 26.
46. Bonecos de Neve - ponto 27.
47. Santuario Sob o Gelo - ponto 28.

Observacao: existem thumbnails, mas faltam topdowns taticos completos se voce quiser combate/exploracao nesses pontos.

## Projeto Musica

### Sessao 1

1. Nascimento na Caverna - ambient escuro, pulso organico, sem melodia forte.
2. Clareira dos Lobos - percussao curta, tensao de tutorial.
3. Vila do Conhecimento Absorvido - melancolica, segura, com peso de fim de ciclo.
4. Campo de Treino - leve, foco e ritmo.
5. Riacho Claro - agua, memoria, luto contido.
6. Nilo/Liora - tema emocional pequeno, quase caixa musical.
7. Primeiro FUSHI consciente - textura crescente, identidade despertando.

### Faccao / regioes

8. Monges / Montanha - disciplina, vento, serenidade.
9. Veu Cinzento - investigacao, suspense, cordas baixas.
10. Mare Livre - aventura costeira, percussao naval.
11. Floresta Mistica - vida, coro sutil, misterio natural.
12. Gelo - isolamento, notas longas, frio.
13. Ruinas/Ryoku - vozes distorcidas, grave, pressao.
14. Vulcao - calor, metal, batida pesada.

### Bosses / eventos

15. Ryoku selado.
16. Ryoku desperto.
17. Morghast.
18. Euryaleth.
19. Vorashk.
20. Aeronyx.
21. Thal'Zhyr.
22. Astrael.
23. Dragon FUSHI global.
24. Dragon forma humana final.
25. Renascimento.
26. Ritual do Silencio.

## Estrategia

Solucao mais viavel: simulacao hibrida.

1. O app salva estado real de mundo em JSON.
   - dia/hora;
   - grupo ativo;
   - local atual;
   - NPCs presentes;
   - relacoes;
   - promessas;
   - eventos canonicos;
   - estado Ryoku;
   - estado Dragon;
   - estabilidade da ilha.

2. A IA nao decide canon sozinha.
   - Ela recebe contexto e gera sugestoes.
   - O mestre aprova, edita ou rejeita.
   - So depois vira evento canonico salvo.

3. Cada NPC tem memoria curta e memoria fixa.
   - Fixa: ficha/lore/trauma/objetivo.
   - Curta: ultimas cenas, relacao com players, promessas, medo atual.

4. Grupos precisam ter resumo proprio.
   - Quando criar grupo: salvar objetivo, integrantes e contexto.
   - Quando desfazer grupo: gerar resumo do que aconteceu e gravar nos NPCs envolvidos.

5. API pode entrar depois da base estavel.
   - Melhor uso: botao "Sugerir proximo movimento do mundo".
   - Nao usar API para rodar tudo automaticamente no fundo antes do sistema estar estavel.

6. Para 2026-05-30, fazer versao sem API primeiro.
   - Menos risco.
   - O app registra contexto e voce roda a cena.
   - Depois acoplamos API para interpretar esse contexto.

## Proxima acao segura

1. Voce revisar no app se os novos cards aparecem como jogador/NPC corretos.
2. Confirmar atributos/pericias finais de Davi, Connor e Ruiz.
3. Criar o submapa Nilo/Liora no Riacho Claro.
4. Fechar regra curta de XP por Marcos de Identidade.
5. Fechar regra curta de renascimento antes de permitir corpo vivo de NPC.
6. Detalhar mecanica dos rituais de separar, juntar, transferir e silenciar consciencias.
