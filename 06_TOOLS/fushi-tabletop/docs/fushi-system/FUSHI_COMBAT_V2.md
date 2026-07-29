# FUSHI Combat V2

Data de decisao: 2026-07-11

Este documento substitui somente as regras de defesa, critico, manobras e
leitura de ficha que contradizem esta versao. Lore, recursos, Niveis de Poder,
reencarnacao e identidades continuam preservados.

## Objetivo

Combate deve ser legivel em segundos, ter escolhas reais por turno e manter
Basico, Avancado, Ascensao e Cataclisma como camadas narrativas diferentes.
Itens nao existem para consertar uma defesa matematica quebrada; eles aprofundam
uma build que ja funciona sem eles.

## Defesa V2

### CA

CA e a defesa passiva. Um ataque acerta quando o total de ataque e maior ou
igual a CA. Protecao, cobertura e efeitos declarados podem alterar CA.

### Bloqueio

Bloqueio e uma Reacao. A reducao e o bonus de Fortitude do defensor:

| Fortitude | Bloqueio |
| --- | ---: |
| Sem treino | 0 |
| Treinado | 5 |
| Expert | 10 |
| Veterano | 15 |

- O teto normal e 15.
- Item ou habilidade pode dar bonus temporario, mas nao ultrapassa 15 sem regra
  rara explicita.
- Protecao continua dando CA; ela nao vira Bloqueio automaticamente.
- Bloqueio nao anula condicao, empurrao ou efeito que nao seja dano, salvo regra
  que diga o contrario.

### Esquiva

Correcao canonica do Mestre em 2026-07-13: Esquiva nao rola dados.

```text
Esquiva = CA passiva atual + AGI + bonus integral de Reflexos
```

Depois de um ataque alcancar a CA, o defensor pode gastar sua Reacao para
Esquivar. O total do ataque precisa alcancar tambem o valor fixo de Esquiva.
Se nao alcancar, evita todo o dano. A CA passiva atual ja contem Base do Nivel,
AGI, Protecao e efeitos temporarios declarados. Portanto, Protecao acompanha a
Esquiva uma vez; nao e apagada nem somada de novo.

- Esquiva precisa ser matematicamente mais protetora que a CA passiva.
- Reflexos entra integralmente como 0, 5, 10 ou 15; nao converter para 0/2/4/6.
- Basico e Avancado podem chegar a +10; +15 fica para Ascensao/Cataclisma.
- Ela abre mao de Bloqueio, Contra-ataque e qualquer outra Reacao da rodada.
- Especializacao pode negar automaticamente o primeiro ataque do mesmo Nivel.
  Isso e compensado pela unica Reacao: ataques seguintes enfrentam a CA passiva.
- A curva final das Bases por Nivel ainda esta em revisao offline e deve ser
  calibrada ao redor desta formula, sem reduzir Reflexos.
- O runtime e os Livros ainda precisam de migracao depois do checkmate da
  matematica completa; nao criar uma terceira regra intermediaria.

### Contra-ataque

Se o ataque nao alcancar a CA passiva, o defensor pode gastar sua Reacao para
fazer um ataque normal. Contra-ataque nao recebe Coreografia, salvo regra
especifica.

### Reacao

Cada consciencia tem uma Reacao ate o inicio do proprio proximo turno. Escolha
uma entre Bloqueio, Esquiva, Contra-ataque ou uma Reacao declarada por item,
Habilidade ou Ritual.

## Critico V2

- Um critico ocorre quando o dado **escolhido** do ataque e 20 natural.
- Em Coreografia extrema, o dado escolhido e o menor; um 20 so e critico se ele
  continuar sendo o resultado escolhido.
- Critico dobra os **dados de dano**. Bonus fixo, FUSHI gasto, custo, condicao,
  empurrao e duracao nao dobram por padrao.
- A reducao de Bloqueio acontece depois da rolagem critica.
- Efeito automatico ou dano sem dado precisa declarar na ficha se pode critar.

Exemplo: `3d10 + 5` em critico vira `6d10 + 5`, nao `6d10 + 10`.

## Dano e Coreografia

- Golpe desarmado: 1d2. LUTA define o acerto; treino nao aumenta o dado base.
- Arma leve: 1d6.
- Arma maior: 1d8.
- Dano acima de 1d8 precisa de custo, condicao, preparo, habilidade, item ou
  fase.

Coreografia continua central: cada d20 sacrificado adiciona um dado de dano da
arma ou efeito. A declaracao acontece antes da rolagem e todo o dano se perde
se o ataque falhar.

## Manobras

| Manobra | Custo | Teste | Resultado |
| --- | --- | --- | --- |
| Agarrar | Acao Principal | FOR + Luta vs FOR + Fortitude ou AGI + Acrobacia | Alvo Agarrado: deslocamento 0; escapar usa Acao Principal. |
| Empurrar | Acao Principal | FOR + Luta vs FOR + Fortitude ou AGI + Acrobacia | Move 3 m; terreno perigoso cria consequencia narrada. |
| Puxar | Acao Principal | FOR + Luta com pegada, corda ou gancho vs FOR + Fortitude ou AGI + Acrobacia | Move 3 m em sua direcao; sem ferramenta ou pegada a tentativa falha. |
| Derrubar | Acao Principal | FOR ou AGI + Luta vs AGI + Acrobacia | Alvo Caido: fica exposto ate gastar Movimento para levantar. |
| Desarmar | Acao Principal | AGI + Luta vs AGI + Acrobacia | Item cai em celula adjacente; nao destrui item. |
| Ajudar | Acao Curta | acao coerente | Aliado recebe +1d20 na proxima acao declarada. |
| Desengajar | Acao Curta | sem teste | Sai de manada sem provocar oportunidade. |
| Preparar | Acao Principal | gatilho declarado | Reserva a Reacao para uma acao especifica. |

Manobra nao causa dano direto. Ela cria posicao, condicao, vantagem, cobertura
ou oportunidade para LUTA, PONTARIA, Habilidade, Ritual, item ou ambiente.

## Escala de encontros

- Minion e unidade de encontro, nao Nivel de Poder: 4 a 8 Vida e 1 a 2 acertos
  para cair.
- Mob Basico: 8 a 16 Vida, papel claro e sem Canon complexo.
- Basico: 20 a 30 Vida; 3 a 5 acertos relevantes para cair.
- Avancado: 110 a 150 Vida; 5 a 8 acertos relevantes em duelo equilibrado.
- Ascensao e Cataclisma usam fases, objetivos, arena, telegrapho e condicao; nao
  so Vida inflada.

## Builds e raridade

Itens integrados continuam permanentes por identidade. Raridade mede quanto a
regra muda o estilo de jogo, nao apenas quanto sobe um numero:

| Raridade | Papel |
| --- | --- |
| Comum | primeiro tradeoff simples de build |
| Raro | especializacao de papel e condicao clara |
| Epico | muda uma rotina de combate ou cena |
| Lendario | assinatura com risco, limite ou preparo |
| Cataclisma | evento registrado no MUN; nao e loot comum |

Todo item precisa declarar ganho, perda, limite, risco, Nivel de Poder sugerido
e ponto de origem no MUN antes de ser entregue.

## Runtime transacional da Mesa

Toda acao que altera combate segue uma unica maquina:

1. ficha ou TURN prepara a acao, sem rolar;
2. Dados de Combate escolhe forma de teste e alvo;
3. origem, alvo e distancia sao congelados quando a rolagem entra na fila;
4. o dado termina antes de abrir `Resolver ataque`;
5. o Mestre confirma defesa, dano/cura e ajuste final;
6. somente a confirmacao final altera a ficha canonica;
7. recibo, impacto visual, marca e estado de queda sao publicados pelo
   sanitizador multiplayer.

Cancelar encerra a transacao sem gastar recurso ou alterar Vida. O custo de
FUSHI, Determinacao ou Vida e mostrado como antes/depois e e aplicado junto com
o resultado final. Cura pura nao recebe bonus de dano da Build. Dreno transfere
somente o dano efetivamente sofrido pelo alvo, nunca o dano bruto excedente.

O contrato estruturado de `automation.combat` precisa declarar, quando
aplicavel:

- `acao`: Principal, Curta, Movimento, Reacao ou Livre;
- `teste`: atributo, pericia, CA/DT/resistido e formas alternativas;
- `dano`: formula, tipo, gatilho e regra de critico;
- `alcance`: faixa, minimo, maximo e penalidade adjacente;
- `resolucao`: dano, cura ou dreno-transferencia;
- `efeitoRapido`, `falha`, `reacao` e `risco`;
- `presentation`: area, audio, VFX ou cena de dominio, sem substituir a regra.

Texto livre pode explicar a acao, mas nao substitui esses campos. Isso permite
que ataques, Habilidades, Rituais e itens criados pela ficha usem a mesma
rolagem, Resolver e log sem codigo individual por personagem.

### Distancia

- 1 quadrado = 1,5 m.
- Corpo a corpo: adjacente.
- Curto: ate 6 quadrados.
- Medio: ate 12 quadrados.
- Longo: ate 24 quadrados.
- Extremo: ate 60 quadrados e normalmente representa fora do mapa.
- Pontaria a ate 2 quadrados recebe -1d20 e usa penalidades adjacentes da Build.
- A acao nao pode ser ativada fora do alcance estruturado.

Mover um token depois que o dado comecou nao altera aquela transacao. A proxima
acao usa a posicao nova.

### Privacidade e queda

- O Mestre recebe o Resolver completo.
- Jogador envolvido recebe um recibo resumido da propria participacao e somente
  a propria mudanca de recurso.
- Outro jogador nao recebe ficha, atributo, custo ou calculo privado alheio.
- Logs publicos carregam texto e resultado do dado, nunca o payload interno do
  Resolver.
- Somente J1-J5 exibem o estado publico de 0 Vida: caveira, tres sucessos e tres
  falhas. Tres sucessos recuperam 1 Vida; tres falhas deixam o token cinza.
- NPC a 0 Vida nao revela esse painel de estabilizacao.

## Migracao

1. Preservar Vida, CA, lore e identidade de NPCs.
2. Recalcular Bloqueio por Fortitude; nao por metade da CA.
3. Tratar Esquiva como valor fixo de Reacao: CA passiva atual + AGI + Reflexos
   integral; nao rolar dados nem converter a Pericia.
4. Corrigir ataques e Habilidades divididas sem inventar poder novo.
5. Simular antes de aprovar itens, mob novo ou alteracao de Vida canonica.
6. Validar runtime, fluxo visual e privacidade com
   `smoke:combat-runtime`, `smoke:combat-flow:ui` e `smoke:multiplayer`.
