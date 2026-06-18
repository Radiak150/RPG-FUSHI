# FUSHI Reincarnation Protocol V1

Objetivo: transformar morte/reencarnacao em uma mecanica de mesa divertida, tensa e coerente com a lore do Fragmentado.

## Verdade de lore

O Fragmentado nao escolhe calmamente voltar. Quando um corpo morre, a alma FUSHI/identidade entra em panico biologico e espiritual. Ela tenta continuar existindo porque e uma massa alienigena/viral que desenvolveu consciencia e identidade em tempo absurdo, condensando em meses uma evolucao que levaria milhoes de anos.

Essa continuidade nao e premio gratis. E instinto de sobrevivencia.

## Ordem de busca

Quando um fragmento morre, a mesa resolve a busca nesta ordem:

1. Consumir FUSHI ao redor e reacender o proprio corpo.
2. Possuir a Ficha Avancada mais proxima.
3. Possuir a Ficha Basica mais proxima.
4. Cair em Animal Silvestre proximo.

Nao ha escolha livre de alvo. O MUN decide proximidade.

## Proximidade

1. Mesmo ponto/submapa.
2. Mesmo POI do MUN.
3. Mesmo bioma.
4. Bioma conectado mais proximo por rota.
5. Animal silvestre pequeno como fallback.

## Etapa 1 - Cena do pulso

O jogador faz 3 pulsos. Cada pulso e uma tentativa de agarrar existencia.

Em cada pulso, escolher uma ancora:

- Identidade: Presenca, Vontade ou Determinacao.
- Corpo: Forca ou Vigor.
- Memoria: Intelecto ou Determinacao.

O jogador descreve em uma frase o que a consciencia tenta lembrar, sentir ou puxar.

## DT da tentativa

| Alvo | DT base |
| --- | ---: |
| Proprio corpo por FUSHI ao redor | 32 |
| Ficha Avancada | 30 |
| Ficha Basica | 20 |
| Animal Silvestre | automatico |

Modificadores:

| Condicao | Ajuste |
| --- | ---: |
| Corpo tocando o morto | -5 |
| Corpo no mesmo ponto | -2 |
| Local com FUSHI favoravel | -2 |
| Ritual/aliado ajudando | -2 por ajuda, max -6 |
| Item menor de reencarnacao | -2 |
| Item de ancora alinhado ao fragmento | -3 |
| Item unico de identidade/reencarnacao | -5 |
| Local distorcido | +2 |
| Local hostil/cataclismico | +5 |
| Corpo tem vontade importante, mas comum | +2 |
| Corpo tem objetivo central ativo | +5 |
| Corpo tem vontade Ascensao/Cataclisma ou destino selado | +8 |

## Leitura dos 3 pulsos

- 3 sucessos: reencarna na melhor opcao tentada.
- 2 sucessos: reencarna, mas leva custo leve.
- 1 sucesso: reencarna instavel, com custo grave ou corpo pior.
- 0 sucessos: falha essa opcao e tenta a proxima da ordem.
- Animal Silvestre nao tem DT de entrada. Se tudo falhar, a consciencia cai em um animal silvestre inevitavelmente e vai direto para disputa de posse.

Custo leve:

- perde 1 Determinacao temporaria;
- acorda com condicao leve;
- fica sem reacao no primeiro turno;
- recebe memoria confusa.

Custo grave:

- condicao grave;
- fica parcialmente preso a vontade do corpo;
- perde acesso temporario a habilidade;
- todos os fragmentos sofrem -2 em Presenca, Determinacao e Vontade ate estabilizar.

## Etapa 2 - Disputa de posse

Depois de entrar no corpo, resolver quem controla.

```text
Vontade do Fragmento vs Vontade do Corpo
```

Fragmento:

- Usa Presenca ou Determinacao.
- Bonus numerico por morte com marco forte:
  - morte comum/caotica: +0.
  - morreu protegendo vinculo real: +2.
  - morreu assumindo custo de identidade: +3.
  - morreu em cena central do proprio arco: +5.
- Penalidade numerica por morte que quebra identidade:
  - morreu em medo/confusao sem escolha propria: -2.
  - morreu traindo a propria vontade declarada: -5.

Corpo:

- Animal silvestre: 1d20 + 0 a +5, conforme porte/instinto.
- Ficha Basica: 1d20 + 5.
- Ficha Avancada: 1d20 + 10.
- Ascensao: 1d20 + 15.
- Cataclisma: nao usar sem evento/ritual aprovado.
- NPC canonico: todo NPC real e importante. Possuir NPC canonico exige aprovacao manual do mestre, mesmo se a matematica permitir.

## Resultado da disputa

Fragmento vence por 5+:

- controla o corpo.
- consciencia original fica suprimida ou em ruido ate novo gatilho.

Fragmento vence por 1 a 4:

- controla o corpo.
- consciencia original causa resistencia menor: -2 em acoes contra a vontade do corpo.

Empate:

- resistencia maior.
- fragmento age, mas toda acao contra a vontade central do corpo recebe -5 ou pede nova disputa.

Fragmento perde por 1 a 4:

- o corpo age por vontade propria.
- fragmento pode tentar 1 comando curto por cena com DT 25.

Fragmento perde por 5+:

- fica inativo dentro do corpo.
- sente, pensa e percebe, mas nao age.
- outros fragmentos precisam liberar.

## Liberar fragmento preso

Os outros fragmentos sentem a direcao/agonia do fragmento preso.

Para liberar:

1. chegar ate o corpo;
2. tocar, conter, chamar ou executar acao coerente;
3. vencer teste de Vontade, Determinacao ou ritual.

DT para liberar:

- Corpo animal/Basico: DT 25.
- Corpo Avancado: DT 30.
- Local com residuo FUSHI hostil: +2 DT.
- Local com FUSHI Escuro ativo: +3 DT.
- Local cataclismico ou contra a identidade do fragmento: +5 DT.
- Cada tentativa falha causa 1 de dano de Determinacao ao fragmento que tentou liberar.

Enquanto preso:

- todos os outros fragmentos sofrem -2 em Presenca, Determinacao e Vontade;
- se dois ou mais fragmentos ficam presos, a penalidade vira -5 e o corpo compartilhado perde 1 reacao por rodada;
- se todos ficam presos, dispara dano critico de alma.

## Todos morrem juntos

Se todos morrerem e todos perderem a disputa de posse:

1. Tomam 1 dano critico de alma.
2. Refazem a disputa.
3. Se perderem de novo, tomam 2 danos criticos de alma e tudo fica pela metade.
4. Se perderem a terceira vez, tomam 3 danos criticos de alma.

Com 3 danos criticos:

- alma rejeitada;
- queda automatica em animal silvestre pequeno nivel 1;
- perde poderes adquiridos;
- stats/acoes ficam em 1/3;
- nasce a escolha: apagar ou continuar.

Efeito numerico por dano critico:

- 1 dano: -5 em Presenca, Determinacao e Vontade ate descanso/ritual de estabilizacao.
- 2 danos: todos os testes e danos ficam pela metade ate arco de recuperacao.
- 3 danos: todos os testes, danos e recursos ficam em 1/3.

Apagar:

- morte real da identidade.

Continuar:

- recomeca quase do zero.
- abre arco de recuperacao/ascensao para curar dano critico de alma.

## Itens futuros de reencarnacao

Itens nao devem escolher alvo automaticamente. Eles so melhoram pulso, memoria, estabilidade ou resgate.

Exemplos:

- Fio de Identidade: -2 DT no primeiro pulso de reencarnacao.
- Semente de Corpo: uma vez por ato, permite rerrolar um pulso.
- Sino de Retorno: aliados no mesmo ponto sentem a direcao exata do fragmento preso.
- Fragmento de Ancoragem: reduz 1 dano critico de alma, destruindo o item.

## Log obrigatorio

Toda reencarnacao real precisa registrar:

- quem morreu;
- onde morreu;
- alvo tentado;
- DT final;
- pulsos passados/falhos;
- corpo final;
- resultado da disputa de posse;
- custo aplicado;
- se entrou em Canon.
