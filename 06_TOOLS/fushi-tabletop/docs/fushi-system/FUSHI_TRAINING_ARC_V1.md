# FUSHI Training Arc V2 - O Circuito do Centro

## Fonte canonica

Esta versao aplica o documento `Treinamentos atuais.docx` recebido em
2026-07-18. O EVE controla o evento; o Mestre narra, escolhe participante e
registra Marcas/Contratempos. O Jogador ve objetivo e progresso, nunca DT ou
guia privado.

## Como abrir

1. Mestre abre `MUN` e seleciona `Campo de Treinamento`.
2. Clica `Ativar treinamento`.
3. O mapa e o painel aparecem para Mestre e Jogadores.
4. O evento tambem pode ser aberto, desativado ou retomado por `EVE > Treino Inicial`.
5. Desativar fecha a camada temporaria e preserva o progresso. `Novo ciclo` e
   a unica acao que reinicia Marcas e Contratempos.

## Regra comum

- Todas as abordagens usam DT 10, visivel somente ao Mestre.
- Cada estacao exige 3 Marcas por participante.
- Sucesso concede +1 Marca.
- Ousadia aplica -1d20, cancela ajuda e concede +2 Marcas.
- Falha concede +1 Contratempo e nao remove Marcas.
- Ajuda coerente concede +1d20 quando a estacao permitir.

## Contratempos totais

Contratempo e acumulado no circuito inteiro por participante, nao por bloco.

- 0-1: nenhuma consequencia mecanica.
- 2-5: o proximo ataque causa -1d4 de dano.
- 6+: mantem -1d4 no proximo ataque e o Mestre escolhe um turno em que o
  personagem fica paralisado lembrando das falhas.

O painel mostra o total e a faixa ativa. A aplicacao narrativa do turno e do
proximo ataque continua sob controle do Mestre.

## Estacoes

### 01. Escalada

Alcancar o sino com 3 Marcas. O participante escolhe `FOR + Atletismo`, `VIG`,
`AGI`, `INT` ou `PRES`, conforme a abordagem narrada. Um aliado pode firmar a
corda ou indicar apoio e conceder +1d20. Rota curta usa Ousadia.

### 02. Guardas

Renji anuncia `Alta`, `Baixa` ou `Avanco`. O ciclo e
`Alta > Avanco > Baixa > Alta`: vencer concede +1d20, perder aplica -1d20 e
empate nao altera o teste. Abordagens: `AGI + Iniciativa`, `FOR + Luta`,
`INT + Tatica` ou `PRES + Percepcao`.

### 03. Obstaculos

Cordas, Troncos e Equilibrio formam as tres secoes. Cada uma deve usar um
atributo principal diferente entre `FOR`, `AGI`, `INT`, `VIG` e `PRES`. Um
atributo usado, inclusive em falha, so volta depois das tres secoes.

### 04. Alvos

O jogador declara a zona antes de rolar. Centro usa a faixa 15-20; proximo do
centro usa 5-15; fora do alvo usa 5-20, conforme o documento canonico. Acertar
uma zona diferente da declarada concede +1 Contratempo. Centro e a rota de
Ousadia e vale +2 Marcas.

### 05. Ringue

Forme tres duplas entre Kairos, Connor, Davi, Grim, Kael e Renji. Cada um leva
um marcador de papel nas costas; um golpe limpo remove o marcador adversario.
O campo pode ser usado, mas armas letais nao entram no treino.

### 06. Lama

Em dupla, um participante carrega o outro com uma maca na cabeca por cinco
pontos de lama. O portador usa `FOR + Atletismo`; o parceiro pode ajudar com
`AGI + Acrobacia`. Quem esta em cima usa `AGI + Acrobacia` para manter a maca
e pode ajudar o portador com `INT + Tatica`.

## Prova final - dominio da identidade

Antes da prova, o Mestre atribui as cinco habilidades canonicas pelo painel
final ou por `EVE > Atribuir Skills`.

Cada protagonista passa por tres etapas individuais:

1. **Sensacao do corpo:** `PRES + Vontade`, DT 10, ate obter sucesso. Cada
   falha remove 2 FUSHI da ficha canonica.
2. **Estabilizacao:** role 1dN, em que N e o FUSHI perdido, e registre quanto
   foi recuperado. O valor volta para a ficha canonica sem ultrapassar o maximo.
3. **Euforia:** escolha uma emocao para a manifestacao, como Acao Bonus uma
   vez: Medo (+1d10 CA), Felicidade (+1d10 para perfurar CA), Tristeza
   (+1d10 mitigacao), Nojo (+1d10 em uma pericia) ou Raiva (+1d10 dano).

A prova so conclui quando os cinco participantes chegam a 3/3 e as cinco
habilidades foram atribuidas.

## Recompensas canonicas

- Kairos: `Barulho Torturante`.
- Davi: `Analise Cirurgica`.
- Connor: `Percepcao Sensorial`.
- Kael: `Pata Mansa`.
- Grim: `Vida Sugada`.

Fragmentado nao recebe habilidade porque esta sem consciencia ocupando o corpo.
A gravacao e canonica, sincronizada e idempotente.

## Contrato multiplayer

- Fonte: `PersistedTabletopSession.trainingState`.
- Mestre altera; Jogador recebe estado somente leitura.
- O payload publico contem estacao, Marcas, Contratempos totais e progresso da
  prova, mas remove DT, abordagens e notas privadas.
- As alteracoes de FUSHI e habilidades usam a ficha canonica existente.
- Nenhuma regra de movimento de token ou de aceite multiplayer e alterada.

## Aceitacao rapida de sessao

1. Ative no MUN e confirme mapa/painel nos dois computadores.
2. Registre +1 Marca, +2 Ousadia e Contratempo; confirme sincronizacao.
3. Leve um participante a 2 e depois 6 Contratempos; confira as duas faixas.
4. Abra a prova, registre falha corporal e recuperacao; confira o FUSHI.
5. Atribua uma habilidade e confirme que nao e possivel duplicar.
6. Desative e reative; o painel deve sumir e voltar com o progresso preservado.

## Arquivos canonicos

- Definicao: `src/data/training/village-training-arc.json`
- Estado: `src/lib/tabletopTraining.ts`
- Interface: `src/components/tabletop/TabletopTrainingArc.tsx`
- EVE: `src/components/tabletop/TabletopEventManager.tsx`
- Integracao: `src/pages/TablePage.tsx`
- Privacidade: `electron/multiplayer-server.cjs`
- Smoke: `scripts/smoke-training-arc.cjs`
