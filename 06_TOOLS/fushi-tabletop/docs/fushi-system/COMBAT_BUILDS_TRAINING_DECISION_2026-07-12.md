# CA, Builds, Vigor e Treinamento

Status: **IMPLEMENTADO NA ALPHA.84 - CATALOGO, DEFESA E BUILDS DOS NPCs**

Fontes operacionais: `src/data/builds/fushi-build-catalog.json`,
`docs/fushi-system/NPC_BUILD_ASSIGNMENTS.json` e os dois Livros gerados.
As 48 matrizes e as 41 builds de NPC foram aplicadas no workspace real. Lore,
efeitos de Habilidades/Rituais, tokens, movimento e protocolo multiplayer
permaneceram protegidos. As fixtures de CA por Nivel continuam sendo somente
instrumentos de teste; nao viraram regra canonica por acidente.

Resultados reproduziveis:

```powershell
npm run smoke:builds
npm run combat:builds:simulate
```

Saidas completas: `BUILD_CATALOG_STRESS_RESULTS.json`,
`NPC_BUILD_ASSIGNMENTS.json` e `NPC_BUILD_PAIRWISE_SIMULATION.json`.

## 0. Travas

- Niveis de Poder sao uma estrutura propria do FUSHI.
- Esquiva deve ser preservada exatamente como o Mestre definiu.
- Jogadores podem misturar quaisquer itens e arquetipos.
- NPC recebe build fechada pelo Mestre. NPC nao sorteia classe nem subclasse.
- Nao existe slot, teto de integracao, carga, recarga ou troca de loadout.
- Integracao e permanente na identidade.
- O mesmo item pode ser integrado por identidades diferentes.
- Um item normal e passivo; o jogador nao aperta um botao para ativa-lo.
- Itens Secretos sao ligados a lore e ficam fora do sorteio comum.
- Lore, token, multiplayer e alertas de conteudo nao podem ser alterados por
  esta revisao.

## 1. Defesa exigida

### 1.1 CA passiva

```text
CA passiva atual = Base do Nivel de Poder + AGI + Protecao + efeito temporario
```

### 1.2 Esquiva

```text
Esquiva fixa = CA passiva atual + AGI + bonus integral de Reflexos
```

Exemplo definitivo dado pelo Mestre:

```text
CA atual 12 + AGI 2 + Reflexos 5 = Esquiva 19
```

- Esquiva nao rola dados.
- Reflexos entra com o valor completo: `0`, `5`, `10` ou `15`.
- Basico e Avancado podem ter Pericias ate `+10`.
- `+15` fica para Ascensao e Cataclisma.
- Esquiva consome a unica Reacao da rodada.
- Depois da Reacao, ataques seguintes enfrentam apenas a CA passiva atual.
- Protecao nao e somada duas vezes. Ela ja faz parte da CA atual usada no
  inicio da formula.
- Nao existe conversao `0/2/4/6`.

### 1.3 Consequencia aceita da especializacao

Um personagem muito focado em AGI e Reflexos pode tornar o primeiro ataque do
mesmo Nivel impossivel de acertar. Isso nao autoriza reduzir Reflexos nem mudar
a formula. O custo esta em:

- gastar a unica Reacao;
- deixar o segundo atacante enfrentar apenas a CA passiva;
- investir Atributos e Pericias em defesa em vez de outros eixos;
- continuar sujeito a controle, area, arena, recursos e Habilidades declaradas.

O simulador agora mostra separadamente Esquiva sem treino, `+5`, o teto do
Nivel e pressao de varios atacantes. Duelo `1 x 1` hiperdefensivo pode empatar;
isso e uma leitura da regra, nao motivo para alterar a Esquiva.

### 1.4 Bases usadas apenas para teste

| Nivel | Base de CA da fixture | Atributos totais | Teto por Atributo | Pericia maxima |
| --- | ---: | ---: | ---: | ---: |
| Basico | 10 | 9 | 4 | +10 |
| Avancado | 15 | 14 | 6 | +10 |
| Ascensao | 20 | 20 | 8 | +15 |
| Cataclisma | por fase | por ficha | por ficha | +15 ou regra da fase |

Somente `9 / teto 4` do Basico, `20` totais de Ascensao e os limites de
Pericia informados pelo Mestre estao confirmados. Base de CA, total/teto do
Avancado e teto de Ascensao continuam fixtures, nao canon.

## 2. Bloqueio e NPC legado

Bloqueio candidato continua igual ao bonus integral de Fortitude:

| Fortitude | Bloqueio |
| --- | ---: |
| Sem treino | 0 |
| Treinado | 5 |
| Expert | 10 |
| Veterano | 15 |

Os 41 NPCs foram auditados e o Bloqueio foi derivado da Fortitude que ja
existia na ficha. Nenhuma Fortitude nova foi inventada para preencher zero:
sem treino continua `0`. Qualquer mudanca futura de papel defensivo exige
revisao autoral do Mestre antes de alterar a Pericia.

## 3. Arquitetura dos itens

### 3.1 Item normal

Cada item normal possui exatamente:

1. um objeto e nome narrativos;
2. um prefixo benefico;
3. um sufixo negativo;
4. uma passiva pequena e fixa, quando o objeto pedir;
5. afinidade com um dos seis arquetipos.

Essa leitura usa a clareza de `objeto + prefixo + sufixo + tier`, sem copiar a
complexidade de seis modificadores. Referencias de pesquisa:

- https://www.pathofexile.com/item-data
- https://www.pathofexile.com/item-data/mods
- https://www.pathofexile.com/forum/view-thread/1290356

### 3.2 Potencia e raridade

Ao descobrir o item, uma unica rolagem `1d10` fecha prefixo e sufixo:

| 1d10 | Raridade | Chance |
| ---: | --- | ---: |
| 1-2 | Comum | 20% |
| 3-4 | Raro | 20% |
| 5-6 | Epico | 20% |
| 7-9 | Lendario | 30% |
| 10 | Mitico | 10% |

A raridade nao adiciona novos textos escondidos. Ela define a potencia `R`
usada nos dois afixos. A passiva normal continua a mesma.

### 3.3 Item Secreto

- Nao rola `1d10`.
- Nao entra nos 48 itens padrao.
- Usa afixos no maximo da matriz aprovada.
- Tem passiva autoral mais forte e ligada diretamente a lore.
- Local, condicao e dono narrativo dependem de aprovacao do Mestre.

## 4. Distribuicao mundial

Existem oito biomas e seis arquetipos. A base minima correta e:

```text
8 biomas x 6 arquetipos = 48 itens padrao
```

- Cada bioma recebe pelo menos um Tank, Assassino, Suporte, Lutador,
  Atirador e Ocultista.
- Cada arquetipo possui oito itens padrao no mundo.
- Secretos sao adicionais.
- Varios itens podem estar no mesmo ponto de interesse.
- O Mestre pode trocar forma e nome do objeto sem mudar a matriz sorteada.
- Como o mesmo item pode ser integrado por mais de uma identidade, o drop nao
  cria competicao obrigatoria entre cinco protagonistas.

Em 100.000 mundos com 48 rolagens independentes, o simulador encontrou:

- media de `4,799` Miticos por mundo, proxima dos `4,8` teoricos;
- `56,95%` de chance de um arquetipo ter ao menos um Mitico entre seus 8 itens;
- `99,36%` de chance de existir ao menos um Mitico entre os 48;
- em `54,22%` dos mundos, a soma de potencia do arquetipo mais sortudo ficou
  pelo menos 20 pontos acima do menos sortudo.

Isso nao muda a quantidade, mas confirma que sorteio puro cria diferenca de
qualidade. Nao foi adicionado baralho selado, pity ou reroll escondido.

## 5. Afinidade de Atributos

| Arquetipo | Atributo | Funcao principal |
| --- | --- | --- |
| Tank | VIG | Vida e resistencia |
| Assassino | AGI | explosao e alvo isolado |
| Suporte | PRE | cuidado e sustentacao |
| Lutador | FOR | consistencia corpo a corpo |
| Atirador | AGI | dano por distancia e posicao |
| Ocultista | INT | FUSHI e quantidade de usos |

AGI e compartilhada por Assassino e Atirador porque um converte precisao em
explosao isolada e o outro em alcance. Os demais Atributos alimentam uma
direcao cada.

O atributo aumenta o prefixo, mas o sufixo inteiro sempre se aplica. Assim um
item fora da afinidade continua utilizavel, porem entrega menos beneficio pelo
mesmo custo. Isso reduz o impulso de absorver tudo sem criar limite artificial.

Determinacao e FUSHI nao sao itens universais separados. Eles podem aparecer
como prefixo ou sufixo em variantes dos 48 itens e em Secretos. A matriz de
referencia abaixo testa apenas um item ancora por arquetipo; nao e o catalogo.

## 6. Matriz ancora implementada

`R` e o resultado do `1d10`. Esta e a ancora da Planicie; os outros sete itens
de cada arquetipo variam os eixos sem abandonar beneficio, contrapartida e
passiva auditavel.

| Arquetipo | Prefixo candidato | Sufixo candidato | Passiva/condicao |
| --- | --- | --- | --- |
| Tank | `Vida = 2 + R + VIG` | `dano = -ceil(R/4)` | pequena resistencia tematica, por item |
| Assassino | `dano = ceil(R/3) + floor(AGI/3)` | `Vida = -(2 + ceil(R/2))` | `+1 dano` contra isolado na ancora |
| Suporte | `Cuidados = R + PRE` | `dano = -ceil(R/4)` | sustenta mais e bate menos |
| Lutador | `Vida = ceil(R/5) + floor(FOR/4)` e `dano corpo a corpo = ceil(R/5)` | `FUSHI = -(1 + ceil(R/2))` | generalista sem pico de especialista |
| Atirador | `dano distante = ceil(R/3) + floor(AGI/3)` | `dano adjacente = -(1 + ceil(R/3))` | depende da distancia real |
| Ocultista | `FUSHI = R + INT` | `Vida = -(2 + ceil(R/2))` | mais usos, nao dano gratuito |

Exemplo Comum `R=1`, Basico especializado:

| Arquetipo | Resultado da ancora |
| --- | --- |
| Tank, VIG 4 | `+7 Vida`, `-1 dano` |
| Assassino, AGI 4 | `+2 dano`, `-3 Vida`, `+1 contra isolado` |
| Suporte, PRE 4 | `+5 Cuidados`, `-1 dano` |
| Lutador, FOR 4 | `+2 Vida`, `+1 dano corpo a corpo`, `-2 FUSHI` |
| Atirador, AGI 4 | `+2 dano distante`, `-2 adjacente` |
| Ocultista, INT 4 | `+5 FUSHI`, `-3 Vida` |

Os outros sete itens de cada arquetipo variam os eixos. Podem trocar
Vida, dano, deslocamento, FUSHI, Determinacao, CA, Protecao, Bloqueio,
iniciativa ou condicoes, desde que todo beneficio tenha custo auditavel. Nao
existem apenas quatro matrizes universais.

## 7. Testes e leitura correta

Os gates reproduziveis sao:

```powershell
npm run smoke:builds
npm run combat:builds:simulate
```

- os 48 itens possuem prefixo, sufixo, passiva e progressao monotona;
- ha 6 itens por bioma e 8 por arquetipo;
- seis Comuns mistos nao dominam seis especializados em nenhum eixo principal;
- nem oito Miticos do mesmo arquetipo permitem que uma fixture Basica apague
  sozinha a distancia para uma fixture Avancada;
- os 41 NPCs foram testados em 820 pares, em duelo e sob pressao;
- nao houve virada numerica dura entre Niveis acima do limite de 25%;
- cinco resultados foram classificados como contextuais por cura, controle ou
  fase fora do duelo, e nao provocaram nerf automatico de Habilidade.

Os dados completos ficam em `BUILD_CATALOG_STRESS_RESULTS.json` e
`NPC_BUILD_PAIRWISE_SIMULATION.json`. Vitoria solo nunca e usada como unica
medida para Suporte, controle ou chefe de varias fases.

## 8. Fechamento e pendencias reais

Concluido nesta aplicacao:

1. catalogo de 48 itens com FUSHI e Determinacao entre os eixos;
2. distribuicao equilibrada dos 41 NPCs em `7/7/7/7/7/6`;
3. Bloqueio derivado da Fortitude integral;
4. Esquiva fixa `CA atual + AGI + Reflexos`, sem dados;
5. teto de Pericia `+10` para Basico/Avancado e `+15` para Ascensao/Cataclisma;
6. Livros e fichas usando a mesma fonte de catalogo.

Ainda depende de trabalho autoral ou de mesa:

1. posicionar e revelar fisicamente cada loot no MUN;
2. criar os itens Secretos ligados a lore;
3. validar a experiencia de mistura/absorção com os cinco protagonistas;
4. fechar o treinamento e suas recompensas visuais;
5. revisar manualmente qualquer NPC cujo papel narrativo mude no futuro.

## 9. Treinamento estacionado

O treinamento nao foi redesenhado nesta rodada. Permanecem registrados como
efeitos canonicos informados pelo Mestre, todos usando FUSHI:

- Kairos: `Sinos - Barulho Torturante`;
- Davi: `Ciencias - Analise Cirurgica`;
- Connor: `Cego - Percepcao Sensorial`;
- Kael: `Ladrao - Pata Mansa`;
- Grim: `Curandeiro - Vida Sugada`;
- Fragmentado: sem consciencia no corpo e sem recompensa atual.

Custo, DT, Acao, alcance, duracao, alvo, limite, resistencia, feedback e
automacao continuam pendentes. Nenhum numero antigo foi tratado como canon.
