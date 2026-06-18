# FUSHI Mechanics Balance Agent

Objetivo: transformar teoria de lore em regra jogavel, com matematica simples, modular e consistente com as fichas reais.

Este documento e fonte de verdade de sistema contra qualquer documento feito antes desta data de atualizacao. Mecanicas novas criadas depois dele so viram verdade quando forem consolidadas aqui ou em documento explicitamente mais novo.

## 0. Correcoes canonicas do mestre - 2026-05-27

- Bloqueio nao e "metade do dano bruto": Bloqueio reduz metade da CA base do dano recebido.
- Esquiva nao e rolagem solta: Esquiva usa CA base + Agilidade + pericia Reflexos.
- Contra-ataque usa CA base: se o ataque inimigo nao alcancar a CA base, o defensor contra-ataca.
- Cada consciencia so pode escolher 1 reacao por turno: Bloqueio, Esquiva ou Contra-ataque.
- Atributo 0 rola 2d20 e pega o pior.
- Vida nao escala por Vigor. Vida vem dos Niveis de Poder + itens + buffs.
- FUSHI nao usa formula derivada neste momento. Usar o valor da ficha/Nivel de Poder.
- Determinacao tambem e gasto de habilidades; rerrolagem so existe quando habilidade/item/regra permitir.
- Coreografia de luta e a regra oficial de multi-hit/dano: sacrificar dados de acerto para ganhar dados de dano.

## 1. Rolagem central

Teste padrao:

```text
resultado = dado_escolhido_do_atributo + bonus_pericia + bonus_item + bonus_cena
```

Atributo:

- Atributo 0: rola 2d20 e pega o pior.
- Atributo 1: rola 1d20.
- Atributo 2: rola 2d20 e pega o maior.
- Atributo 3: rola 3d20 e pega o maior.
- Atributo 4+: rola a quantidade do atributo e pega o maior. Nao existe custo automatico por ter atributo alto.

Pericia:

- Sem treino: +0.
- Treinado: +5.
- Expert: +10.
- Veterano: +15.

Critico:

- Menor numero natural possivel do dado = falha critica.
- Maior numero natural possivel do dado = sucesso critico.
- Em pool de d20, se o dado escolhido final for 20, sucesso critico.
- Em pool de d20, falha critica so acontece se todos os dados rolados forem 1, ou se a regra mandar pegar o pior e o pior for 1.
- Exemplo: 1d20 caindo 1 e falha critica; 2d20 caindo 1 e 1 e falha critica; 2d20 caindo 1 e 2 escolhe 2 e nao e falha critica.
- Em d2/moeda, o dado normalmente serve para decisao cara/coroa. A animacao pode mostrar falha/sucesso como feedback, mas a mesa decide antes qual numero representa cada opcao.

## 2. Coreografia de luta

Coreografia e a forma oficial de trocar chance de acerto por dano.

Regra:

```text
dado_de_acerto_disponivel = atributo
cada dado sacrificado = +1 dado de dano da arma/habilidade
```

Acerto:

```text
se sacrificios < atributo: rola (atributo - sacrificios)d20 e pega maior
se sacrificios >= atributo: rola sacrificios d20 e pega pior
```

Falha critica em coreografia extrema:

- Quando a regra manda pegar o pior, qualquer 1 no dado escolhido como pior vira falha critica.
- A consequencia deve afetar mecanica e narrativa: arma cai, arco quebra, postura abre, alvo ganha vantagem, personagem perde reacao ou sofre condicao curta.

Exemplo com Forca 3 e arma 1d6:

- Sem coreografia: 3d20 pega maior; dano 1d6.
- Sacrifica 1 dado: 2d20 pega maior; dano 2d6.
- Sacrifica 2 dados: 1d20; dano 3d6.
- Sacrifica 3 dados: 3d20 pega pior; dano 4d6.
- Sacrifica 9 dados: 9d20 pega pior; dano 10d6.

Regra importante:

- Coreografia nao tem limite duro.
- Ela sempre e escolha do jogador/mestre.
- Quanto mais sacrifica, mais arriscado fica acertar.
- Se o ataque erra, todo o dano coreografado se perde.
- Coreografia aparece no historico de rolagem/combate quando a rolagem for publica, mas nao precisa virar log tecnico separado.

## 3. DT oficial

A escala antiga era baixa demais para personagens com +10/+15 de pericia. A escala oficial passa a ser:

| DT | Leitura de mesa | Uso principal |
| --- | --- | --- |
| 10 | rotina sob pressao | so falha com atributo ruim ou caos |
| 15 | comum treinado | facil para pericia treinada, ainda util em cena inicial |
| 20 | dificil Basico | medio/dificil para ficha Basica com +5/+10 |
| 25 | dificil Avancado | elite para Basico, dificil para Avancado |
| 30 | dificil Ascensao | sobrenatural; exige dado alto mesmo com +10/+15 |
| 32 | cataclismico inicial | limite acima do comum, usado em cena de risco real |
| 35 | teto sem item forte | 20 natural + pericia +15 |
| 40+ | alem da ficha pura | exige item, ritual, ajuda, condicao ou evento |

Regra por ficha:

- Ficha Inicial/Basica: DT 20 ja e dificil.
- Ficha Avancada: DT 25 ja e dificil.
- Ficha Ascensao: DT 30 ja e dificil.
- Ficha Cataclisma: DT 30+ e normal de risco; DT 35+ cobra preparo; DT 40+ cobra recurso especial.

Nota de balanceamento:

- Se uma pericia tem +15, DT 20 nao deve ser chamada de dificil.
- Se algo precisa parecer dificil para especialista, usar DT 25 ou 30.
- Se algo precisa desafiar CA/Esquiva Cataclisma, precisa de bonus especial, item, ritual, terreno ou condicao.

## 4. Combate pratico

Turno:

1. Acao principal: atacar, ritual, interagir complexo, ajudar forte.
2. Movimento: deslocar ate o valor do corpo/token.
3. Acao curta: sacar item, abrir porta simples, falar comando, preparar.
4. Reacao: cada consciencia escolhe 1 entre Bloqueio, Esquiva ou Contra-ataque ate seu proximo turno.

Ataque:

```text
ataque = resultado_de_atributo + pericia + bonus
acerta se ataque >= CA escolhida/valida do alvo
dano = dado_da_arma_ou_mob + coreografia + FUSHI_imbuido + bonus
```

Dano base:

- Punho normal: 1d4.
- Lamina curta: 1d6.
- Arma afiada/maior: 1d8.
- Dano acima de 1d8 entra como habilidade, item forte, fase de boss ou mecanica de Nivel de Poder. Nao tratar como "arma comum" sem custo.

CA base:

- Valor base da ficha/equipamento.
- Referencia de poder:
  - Basico: CA 16+ contando armadura leve.
  - Avancado: CA 20+ contando defesa.
  - Ascensao: CA 25+.
  - Cataclisma: CA 30+.

Bloqueio:

```text
dano_final = dano_recebido - floor(CA_base / 2)
```

- Usa a reacao do turno.
- Nao evita efeito narrativo que nao dependa de dano, salvo item/habilidade dizer.
- Se reduzir abaixo de 0, vira 0.

Esquiva:

```text
CA_esquiva = CA_base + Agilidade + Reflexos
```

- Usa a reacao do turno.
- Se ataque inimigo nao alcancar a CA_esquiva, evita o dano.
- Em ficha Cataclisma, esquiva pode chegar perto de 50; isso e intencional e exige contador especial para acertar.

Contra-ataque:

```text
CA_contra = CA_base
```

- Usa a reacao do turno.
- Se o ataque inimigo nao alcancar a CA base, o defensor contra-ataca.
- O contra-ataque usa o ataque/dano normal do defensor, sem coreografia extra salvo habilidade permitir.

## 5. FUSHI imbuido em dano

Ideia aprovada como mecanica viavel, com risco claro:

```text
bonus_dano = FUSHI_gasto
```

Exemplo:

- Punho 1d4 + 1 FUSHI = 1d4+1.
- Lamina 1d6 + 5 FUSHI = 1d6+5.

Regra:

- O FUSHI gasto sai do recurso atual.
- Se o usuario chega a 0 FUSHI, continua consciente, mas fica totalmente imovel/incapaz ate recuperar FUSHI por regra aprovada.
- Pode ser usado com coreografia, mas precisa declarar antes da rolagem.
- Se errar, se o alvo esquivar ou se houver contra-ataque bem-sucedido, o FUSHI gasto ainda foi queimado.
- So pode soltar FUSHI imbuido 1 vez por turno por atacante.

Limite por Niveis de Poder:

| Nivel de Poder | FUSHI imbuido seguro | FUSHI imbuido extremo | Observacao |
| --- | ---: | ---: | --- |
| Basico | 1 a 5 | 6 a 10 | forte para finalizar, perigoso para o proprio corpo |
| Avancado | 1 a 15 | 16 a 25 | nao permite descarregar 75 FUSHI em um turno |
| Ascensao | 1 a 25 | 26 a 50 | ja muda cena se usado no teto |
| Cataclisma | 1 a 50 | 51 a 100+ | 100+ e evento/fase, nao ataque comum |

Tempo de carga:

| FUSHI armazenado | Tempo |
| ---: | --- |
| 1 a 10 | pode sair no mesmo turno do ataque |
| 11 a 25 | exige 1 turno preparando e solta no turno seguinte |
| 26 a 50 | exige 2 turnos preparando e solta no terceiro turno |
| 51+ | exige ritual, fase de boss, item lendario ou evento Cataclisma |

Regras de carga:

- Enquanto carrega, o FUSHI fica perceptivel narrativamente.
- Se o usuario for interrompido antes de soltar, perde metade do FUSHI carregado, arredondando para cima.
- Se o ataque final falhar, todo o FUSHI carregado e queimado.
- O mestre pode permitir interromper carga com dano, controle, empurrao, quebra de concentracao ou condicao.
- Carga de FUSHI nao pode ser escondida como ataque comum se passar de 10.

Pros:

- Simples.
- Dramatico.
- Da escolha real de risco.
- Faz sentido com FUSHI como energia de vontade/custo.

Contras:

- Sem consequencia, vira botao de deletar inimigo.
- Em NPCs Ascensao/Cataclisma, all-in mata ficha comum.
- Precisa de log e telegrapho narrativo para o mestre controlar escala.

Regra anti-quebra:

- FUSHI imbuido forte deve ser anunciado antes do ataque.
- O mestre pode marcar "acao cataclismica" quando o gasto muda a cena.
- Bosses e guardioes podem ter fases, resistencias, interrupcao ou condicao para impedir um all-in vazio.
- Itens que aumentam FUSHI maximo precisam ter custo proporcional de build, risco, mobilidade, defesa, vida ou estabilidade.

## 6. Recursos

Vida:

- Vida vem dos Niveis de Poder + itens + buffs.
- Nao usar Vigor para recalcular vida global, para nao quebrar fichas existentes.
- Build Tank deve ganhar vida por item, buff, base, consumivel raro ou habilidade especifica.

FUSHI:

- Usar o valor da ficha/Nivel de Poder.
- Os intervalos antigos eram placeholder e nao devem recalcular ficha.
- Itens podem aumentar FUSHI maximo, mas sempre com custo de build ou risco.
- Esta regra vale para todos os itens de stat: todo ganho precisa de perda proporcional em eixo oposto.

Determinacao:

- Determinacao e individual por consciencia.
- Usada para habilidades, Instinto, resistir perda de controle, sustentar corpo compartilhado e efeitos mentais.
- Rerrolagem nao e regra gratuita universal; so acontece quando habilidade, item, ritual ou cena permitir.

## 7. Progressao por identidade

Os jogadores nao precisam saber exatamente a tabela. O mestre registra marcos e aplica niveis.

Atos sugeridos:

| Ato | Faixa | Poder |
| --- | --- | --- |
| Ato 1 | nivel 1 a 9 | Inicial -> Basico |
| Ato 2 | nivel 9 a 17 | Avancado |
| Ato 3 | nivel 17 a 20 | Ascensao curta |
| Ato 4 | nivel 20 a 30 | Ascensao alta / Cataclisma inicial |
| Ato 5 | nivel 30 a 37 | Cataclisma |

Fontes de nivel por ato:

| Fonte | Limite |
| --- | ---: |
| Sobreviveu cena real de risco | ate 2 por ato |
| Tomou decisao que revela vontade | 1 por ato |
| Criou ou rompeu vinculo importante | 1 por ato |
| Entendeu algo real sobre FUSHI | 1 por ato |
| Assumiu custo de uma escolha | ate 2 por ato |
| Treino real/mentor/base | 1 por ato |
| Ritual concluido | 1 por ato |
| Reencarnacao com consequencia | 1 por ato |
| Item marco/descoberta de identidade | 1 por ato |

Balanceamento:

- Ato 1 precisa de 8 niveis para ir de 1 a 9; a tabela oferece ate 11, entao o mestre escolhe os que aconteceram.
- Ato 2 precisa de 8 niveis; a tabela tambem cobre sem forcar grind.
- Ato 3 e curto; limitar ganho total a 3, mesmo que mais marcos acontecam.
- Ato 4 precisa de 10 niveis; permitir quase todas as fontes.
- Ato 5 precisa de 7 niveis; usar so marcos realmente grandes.

Planilha do mestre:

- Cada player/fragmento tem colunas por fonte.
- Marcar "usado neste ato" para vontade, vinculo, FUSHI, treino, ritual, reencarnacao e item marco.
- "Assumiu custo" tem duas caixas por ato.
- "Risco real" tem duas caixas por ato.

## 8. Niveis de Poder

Fonte canonica de referencia: `C:\RPG FUSHI\RPG-FUSHI\01_LORE\npcs\Regras importante Powerscaling NPCs (para Simulacao).md.txt`.

Usar sempre o termo **Niveis de Poder** para evitar confusao com ato, nivel de personagem ou vida base.

### Basico

- Atributos comuns: 1 a 3.
- Pericias: +5, alguns +10.
- Dano comum: 1d4 a 1d6.
- Vida comum: 20 a 30.
- CA comum: 16+ contando armadura leve/defesa.
- DT dificil: 20.

### Avancado

- Atributos comuns: 2 a 4.
- Pericias: +5/+10, alguns +15.
- Dano comum: 1d6 a 1d8; habilidades podem chegar a 2d10/3d10 com custo.
- Vida comum: 130 a 150.
- FUSHI comum: por volta de 75 quando registrado como Ficha Avancada.
- CA comum: 20+.
- DT dificil: 25.

### Ascensao

- Atributos comuns: 3 a 5.
- Pericias: +10/+15.
- Dano comum: 1d8 a 2d8.
- Vida comum: 250 a 400.
- FUSHI comum: 100 a 150.
- Determinacao comum: 40 a 70.
- CA comum: 25+.
- DT dificil: 30.

### Cataclisma

- Atributos comuns: 4 a 6+.
- Pericias: +15.
- Dano comum: 3d12+10, dano automatico, ignorar CA, dominio ou mecanica de fase.
- Vida comum: 450+ ou vida por fase.
- CA comum: 30+.
- Esquiva pode chegar em 50.
- DT dificil: 30+; DT extrema 35+; DT impossivel comum 40+.
- Cataclisma sozinho deve ser quase impossivel para apenas 5 Fichas Avancadas sem preparo. O alvo de balanceamento e: 8 Fichas Avancadas dao trabalho, 10 Fichas Avancadas ficam pareo a pareo.

## 9. Builds simples

Regra anti-broken:

- Toda build ganha algo e perde algo.
- Todo item forte precisa ter eixo forte e eixo fraco.
- Item que aumenta dano nao aumenta defesa no mesmo pacote.
- Item que aumenta defesa nao aumenta mobilidade no mesmo pacote.
- Item que aumenta FUSHI deve cobrar recurso, risco, fragilidade ou instabilidade.

Tank:

- Ganha: Vida, protecao, controle de espaco e melhoria limitada de Bloqueio.
- Perde: mobilidade e dano explosivo.
- Cuidado: nao empilhar CA demais. Os degraus fortes de CA sao +5, +10 e +15, e devem ser raros/condicionados.

Assassino:

- Ganha: dano em alvo isolado, furtividade, critico, iniciativa.
- Perde: Vida e sustentacao.

Suporte:

- Ganha: cura, escudo, remocao de condicao, posicionamento.
- Perde: dano direto.

Lutador:

- Ganha: corpo a corpo, manobra, regen curta, dano consistente.
- Perde: alcance e dano quando longe.

Atirador:

- Ganha: alcance, preparo, precisao, terreno.
- Perde: defesa sob pressao corpo a corpo.

Ocultista:

- Ganha: dano/controle FUSHI, ritual, informacao.
- Perde: FUSHI rapido, estabilidade e seguranca quando fica sem recurso.

## 10. Reencarnacao

Reencarnacao nao e escolha livre. E uma resposta automatica da alma FUSHI/identidade tentando nao apagar.

Lore mecanica:

- O Fragmentado e uma massa/virus alienigena com identidade extrema.
- Ele evoluiu em meses o que a humanidade levou milhoes de anos para desenvolver.
- Quando morre, a alma FUSHI tenta desesperadamente entrar em qualquer corpo viavel.
- A morte deve ter custo real, mesmo que exista continuidade.

Ordem de tentativa:

1. Consumir FUSHI ao redor e continuar no proprio corpo.
2. Incorporar Ficha Avancada proxima.
3. Incorporar Ficha Basica proxima.
4. Cair em Animal Silvestre proximo.

Regra de proximidade:

- Tenta sempre o alvo mais proximo primeiro.
- Se nao houver alvo no ponto atual, procura no bioma.
- Se nao houver no bioma, procura o bioma/ponto mais proximo pelo MUN.
- Animal silvestre sempre existe como fallback, mas pode ser pessimo.

Etapa A - Pulso de sobrevivencia:

Fazer 3 pulsos rapidos. Em cada pulso, o jogador escolhe uma ancora:

- Identidade: Presenca/Vontade.
- Corpo: Vigor/Forca.
- Memoria: Intelecto/Determinacao.

Cada alvo tentado usa 3 pulsos. Em cada pulso, o jogador escolhe uma ancora e rola contra a DT do alvo atual:

| Opcao | DT base |
| --- | ---: |
| Reviver no proprio corpo com FUSHI ao redor | 32 |
| Ficha Avancada | 30 |
| Ficha Basica | 20 |
| Animal Silvestre | automatico |

Modificadores:

- Corpo muito perto: -2 DT.
- Corpo tocando o morto: -5 DT.
- Local com FUSHI favoravel: -2 DT.
- Local distorcido: +2 DT.
- Local hostil/cataclismico: +5 DT.
- Item de bonus de reencarnacao menor: -2 DT.
- Item de ancora alinhado ao fragmento: -3 DT.
- Item unico de identidade/reencarnacao: -5 DT.
- Aliado ajuda com ritual/acao: -2 DT por ajuda relevante, max -6.

Resultado da Etapa A:

- 3 sucessos: entra na melhor opcao tentada.
- 2 sucessos: entra, mas com custo leve.
- 1 sucesso: entra instavel, com custo grave ou corpo pior.
- 0 sucessos: falha a opcao e tenta a proxima na ordem.
- Animal Silvestre nao tem DT de entrada. Se todas as opcoes falharem, a consciencia cai nele inevitavelmente e vai direto para a disputa de posse.

Etapa B - Posse do corpo:

Depois de entrar em um corpo, resolver disputa:

```text
Vontade_do_fragmento vs Vontade_do_corpo
```

Vontade_do_fragmento:

- Presenca ou Determinacao, o que fizer mais sentido.
- Bonus numerico por morte com marco forte:
  - morte comum/caotica: +0.
  - morreu protegendo vinculo real: +2.
  - morreu assumindo custo de identidade: +3.
  - morreu em cena central do proprio arco: +5.
- Penalidade numerica por morte que quebra identidade:
  - morreu em medo/confusao sem escolha propria: -2.
  - morreu traindo a propria vontade declarada: -5.

Vontade_do_corpo:

- Animal silvestre: 1d20 + 0 a +5, conforme porte/instinto.
- Ficha Basica: 1d20 + 5.
- Ficha Avancada: 1d20 + 10.
- Ascensao: 1d20 + 15.
- Cataclisma: nao usar sem evento/ritual aprovado.
- NPC canonico: todo NPC real e importante. Possuir NPC canonico exige aprovacao manual do mestre, mesmo se a matematica permitir.

Resultados:

- Fragmento vence: controla o corpo.
- Empate: resistencia maior. O fragmento age, mas toda acao contra a vontade do corpo recebe -5 no teste ou pede nova disputa.
- Fragmento vence por 1 a 4: resistencia menor. O fragmento controla, mas a consciencia original pode impor -2 em acoes contra sua vontade.
- Fragmento vence por 5+: controle estavel. A consciencia original vira ruido narrativo ate novo gatilho.
- Fragmento perde por 1 a 4: influencia invertida. O corpo age por vontade propria, mas o fragmento pode tentar 1 comando curto por cena com DT 25.
- Fragmento perde por 5+: fragmento preso. Ele percebe e pensa, mas nao controla.

Resgate por outros fragmentos:

- Outros players sentem onde o fragmento preso esta.
- Para liberar sem ritual, outro fragmento precisa tocar o corpo e vencer DT 25 de Determinacao ou Vontade.
- Se o corpo for Avancado, DT 30.
- Local com residuo FUSHI hostil: +2 DT.
- Local com FUSHI Escuro ativo: +3 DT.
- Local cataclismico ou contra a identidade do fragmento: +5 DT.
- Cada tentativa falha causa 1 de dano de Determinacao ao fragmento que tentou liberar.
- Enquanto um fragmento esta preso, todos os outros fragmentos sofrem -2 em testes de Presenca, Determinacao e Vontade.
- Se dois ou mais fragmentos estiverem presos, a penalidade vira -5 e o corpo compartilhado perde 1 reacao por rodada.
- Se todos estiverem presos, dispara a regra de todos morrem juntos/dano critico de alma.

Todos morrem juntos:

1. Todos fazem Etapa A e B.
2. Se todos perdem a disputa de Vontade, sofrem 1 dano critico de alma.
3. Refazem a disputa.
4. Segundo fracasso coletivo: 2 danos criticos de alma; tudo fica pela metade.
5. Terceiro fracasso coletivo: falha moral, alma rejeitada, queda automatica em animal silvestre pequeno nivel 1.

Dano critico de alma:

- 1 dano: -5 em Presenca, Determinacao e Vontade ate descanso/ritual de estabilizacao.
- 2 danos: todos os testes e danos ficam pela metade ate arco de recuperacao.
- 3 danos: todos os testes, danos e recursos ficam em 1/3; perde poderes adquiridos e escolhe apagar ou recomecar.

Escolha final:

- Apagar: morte real da identidade.
- Continuar: recomeca em animal pequeno nivel 1, sem poderes, com debuff de alma ate arco de ascensao/recuperacao.

## 11. Rituais

Todo ritual precisa ter:

- Nome.
- Nivel de Poder minimo.
- Custo.
- Tempo.
- Componentes/condicao.
- Teste.
- Efeito.
- Falha.
- Falha critica.
- Impacto no MUN.

DT ritual:

- Basico: 20.
- Avancado: 25.
- Ascensao: 30.
- Cataclisma: 32+.
- Preparos, BASE, item, local correto e ajuda de NPC podem reduzir DT.

Ritual narrativo importante nunca e so DT. Precisa de condicao, tributo e uma pequena mecanica de mesa.

Catalogo inicial:

| Ritual | Nivel de Poder | Local MUN ideal | Funcao | Condicao/tributo |
| --- | --- | --- | --- | --- |
| Ritual de Silencio | Ascensao | Torre do Abismo, Biblioteca Morta ou Altar Quebrado | matar/remover uma voz ou consciencia real | nome verdadeiro, memoria ligada ao alvo, custo permanente de Determinacao |
| Transposicao de Consciencia | Avancado/Ascensao | Caverna do Primeiro Corpo, Riacho Claro ou Torre do Abismo | mover consciencia entre corpo morto e corpo vivo/tributo | corpo morto, corpo vivo, consentimento ou contencao, 3 pulsos |
| Separacao dos Fragmentos | Avancado | Caverna do Primeiro Corpo ou Nucleo FUSHI da BASE | separar corpo compartilhado em corpos distintos | material de identidade de cada fragmento, risco de dano de alma |
| Reuniao dos Fragmentos | Avancado | Caverna do Primeiro Corpo | unir fragmentos em corpo compartilhado | todos precisam aceitar ou vencer disputa interna |
| Ancoragem de Reencarnacao | Basico/Avancado | Caverna do Primeiro Corpo, Riacho Claro ou Sala MUN da BASE | dar bonus em morte futura | item de ancora, sangue/FUSHI, registro no Canon |
| Purificacao de Dano de Alma | Ascensao | Riacho Claro, Arvore de FUSHI Vivo ou Sala de Musica da BASE | remover dano critico de alma | cena de memoria, custo emocional, teste coletivo |
| Dominio Parcial | Ascensao/Cataclisma | local ligado ao conceito do usuario | expansao de dominio/fase de boss/habilidade lendaria | gatilho de identidade, gasto alto de FUSHI, risco de colapso |
| Selo de Cataclisma | Cataclisma | Torre do Abismo, Campo de Cinzas, Deus Dragao | conter entidade/evento global | multiplas chaves, sacrificio, mapa ativo e consequencia no MUN |

Mecanica padrao de ritual importante:

1. Preparar: reunir local, tributo e participantes.
2. Abrir: teste DT do Nivel de Poder.
3. Sustentar: 3 pulsos, cada pulso com risco diferente.
4. Fechar: escolher custo final ou consequencia.
5. Registrar: log no MUN e possivel Canon.

Rituais e funcoes iniciais por local:

| Ritual | Local principal | Funcao pratica | Mecanica curta |
| --- | --- | --- | --- |
| Ancoragem de Reencarnacao | Caverna do Primeiro Corpo | criar ancora de morte futura | 3 pulsos DT 20/25; sucesso da -2 DT em uma morte futura; falha marca Corpo instavel por 1 cena |
| Separacao dos Fragmentos | Caverna do Primeiro Corpo ou Nucleo FUSHI da BASE | separar consciencias do corpo compartilhado | cada fragmento faz 1 pulso de Identidade; 3 falhas totais causam 1 dano critico de alma |
| Reuniao dos Fragmentos | Caverna do Primeiro Corpo | reunir fragmentos em corpo compartilhado | todos aceitam ou fazem disputa interna; empate gera Fragmentado por 1 sessao |
| Purificacao de Dano de Alma | Riacho Claro ou Sala de Musica da BASE | remover dano critico de alma | cena de memoria + 3 testes coletivos DT 30; 2 sucessos removem 1 dano; falha adiciona Trauma mental |
| Transposicao de Consciencia | Torre do Abismo ou Caverna do Primeiro Corpo | mover consciencia para corpo preparado | 3 pulsos DT do corpo-alvo; exige corpo, contencao/consentimento e custo de Determinacao |
| Ritual de Silencio | Biblioteca Morta ou Torre do Abismo | calar/remover voz real | exige nome verdadeiro + memoria; sucesso causa Selado/Apagado; falha retorna Trauma mental |
| Dominio Parcial | local ligado ao conceito do usuario | abrir habilidade lendaria/dominio | gasta FUSHI alto, sustenta 3 pulsos; falha gera Corrompido ou Fora do tempo |
| Selo de Cataclisma | Torre do Abismo, Campo de Cinzas ou Deus Dragao | conter boss/evento global | ritual de fase, multiplas chaves, custo de Canon e log obrigatorio no MUN |

Regra de local:

- Se o ritual for feito fora do local principal, DT +5.
- Se for feito em local hostil ao conceito do ritual, DT +10 ou ritual proibido.
- BASE pode reduzir DT em -2 quando o upgrade apropriado estiver ativo.
- Ajuda de NPC so reduz DT se o NPC realmente souber o ritual ou tiver relacao com o local.

## 12. Condicoes

Leves:

- Sangrando leve: perde 1 Vida por rodada ate gastar acao curta para estancar.
- Abalado: -2 em Presenca/Determinacao ate fim da cena.
- Cansado: -2 em Forca/Agilidade e -1 deslocamento ate descanso curto.
- Lento: perde metade do deslocamento por 1 rodada/cena.
- Assustado: nao pode se aproximar voluntariamente da fonte sem teste DT 20.

Graves:

- Quebrado: -5 em acoes fisicas ligadas ao membro/estrutura afetada.
- Exausto: -5 em todos os testes fisicos e nao pode coreografar.
- Marcado por FUSHI: +2 DT em resistir distorcao; interage com rituais.
- Trauma mental: -5 em Presenca/Determinacao contra gatilho especifico.
- Corpo instavel: no inicio do turno, teste DT 20; falha perde acao curta ou reacao.

Cataclismicas:

- Corrompido: mestre ganha 1 gatilho de interferencia por cena.
- Fragmentado: consciencias sofrem -5 para agir em conjunto.
- Selado: nao usa FUSHI ativo ate quebrar selo.
- Apagado: perde acesso a memoria/habilidade definida ate restauracao.
- Fora do tempo: age em turnos alternados ou chega atrasado 1 rodada em toda cena.

Regra:

- Condicao leve dura cena ou descanso curto.
- Condicao grave exige tratamento, ritual, item ou descanso longo em local seguro.
- Condicao cataclismica exige arco narrativo, ritual especifico ou custo grande.
