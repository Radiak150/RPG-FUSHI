# Sistema de Poder e Equilibrio

## Objetivo

Fechar o core jogavel da primeira sessao do RPG FUSHI sem backend, sem multiplayer real e sem assets finais.

Esta base define:

- escala inicial de poder
- ficha universal para players e NPCs
- combate base suficiente para tutorial
- lobo tutorial da sessao 01
- fluxo correto de interludios e mapas
- preparacao de controle compartilhado e permissoes futuras

## Escala universal de poder

### Tier 0

Corpo recem-nascido ou fraco.

- inicio da sessao 01
- sem dominio do corpo
- sem FUSHI consciente
- protagonistas ainda entendendo movimento, dor, impacto e controle

### Tier 1

Humano comum treinado.

- combate funcional
- disciplina corporal basica
- ainda sem dominio tecnico estavel de FUSHI

### Tier 2

Usuario iniciante de FUSHI.

- primeiro uso consciente
- tecnicas simples
- ainda instavel

### Tier 3

Usuario competente.

- combina corpo, leitura tatica e energia com consistencia

### Tier 4

Usuario forte.

- ameaca local real
- supera grupos comuns sem preparo

### Tier 5

Elite ou chefe importante.

- referencia regional de poder
- encontro de alto impacto

### Tier 6+

Boss ou evento especial.

- exige evento, fase especial, condicao ou gimmick propria

## Dificuldade basica

- Facil: inimigo abaixo do tier do grupo
- Medio: inimigo igual ao tier do grupo
- Dificil: inimigo 1 tier acima
- Boss: inimigo 2+ tiers acima ou com mecanica especial

## Estado inicial dos protagonistas

Na primeira sessao os protagonistas:

- acordam em Tier 0
- nao dominam FUSHI
- nao entendem o proprio corpo
- compartilham a mesma existencia corporal no inicio
- enfrentam inimigos tutorial de tier igual ou levemente inferior

## Ficha base universal

Players e NPCs usam a mesma base de ficha.

Nao existe ficha separada de NPC e ficha separada de player.

A diferenca fica em:

- permissao
- controle
- contexto narrativo

### Atributos

- Forca
- Agilidade
- Intelecto
- Presenca
- Vigor

### Recursos

- Vida
- FUSHI
- Determinacao

### Combate base

- ataque usa atributo + pericia
- o atributo define quantos d20 sao rolados
- a regra padrao pega o maior d20
- a pericia soma bonus fixo
- dano depende da arma, criatura ou habilidade
- defesa e valor fixo

### Multiataque

Core de risco vs controle do sistema:

- cada ataque extra reduz 1 dado
- quando faz multiataque, pega o menor resultado

Exemplos:

- Forca 3, 1 ataque: 3d20 e pega o maior
- Forca 3, 2 ataques: 2d20 e pega o menor
- Forca 3, 3 ataques: 1d20 e pega o menor
- Forca 4, 2 ataques: 3d20 e pega o menor
- Forca 4, 3 ataques: 2d20 e pega o menor
- Forca 4, 4 ataques: 1d20 e pega o menor

### Sessao 01

Na primeira sessao:

- FUSHI existe, mas nao entra como uso consciente
- foco em movimento, teste, ataque, dano e controle compartilhado
- explosoes instintivas usam Determinacao, nao FUSHI

## Corpo compartilhado no inicio

Conceito base:

- o corpo fisico e unico
- varias consciencias coexistem dentro dele no inicio
- Vida e FUSHI pertencem ao corpo
- Determinacao pertence a cada consciencia

### Estrutura local preparada

```ts
type TokenControl = {
  controlledByPlayerIds: string[]
  primaryControllerId?: string
  sharedControl: boolean
}
```

No MVP local:

- isso fica mockado em tipos e dados
- sem sync real
- sem rede
- sem autoridade distribuida

### Uso futuro

- mestre pode entregar um token a um ou mais players
- mestre pode definir controlador primario
- um NPC pode virar personagem controlavel
- o mestre pode revogar controle a qualquer momento

## Permissao futura de NPC virar personagem

Regra estrutural:

- todo personagem e uma ficha universal
- NPC pode ser entregue para player
- player pode controlar NPC autorizado
- isso habilita possessao, vinculo, troca de corpo e personagens temporarios

## Lobo tutorial

### Lobo da Planicie

- Tier: 0
- Funcao: inimigo tutorial medio/facil
- Ameaca: baixa
- Objetivo: ensinar movimentacao, ataque, defesa e dano

### Ficha base

- Forca 1
- Agilidade 2
- Intelecto 0
- Presenca 1
- Vigor 1
- Vida baixa
- FUSHI 0 ou passivo
- Determinacao baixa
- Defesa baixa/media

### Ataques

- Mordida simples
- Investida curta

### Escala de uso

- 1 lobo: tutorial isolado
- 2 lobos: tutorial medio padrao
- 3 lobos: usar apenas se o grupo estiver indo bem

## Fluxo correto da Sessao 01

1. Interludio inicial: Despertar
2. Mapa: Caverna do Despertar
3. Interludio: Saida da Caverna
4. Mapa: Planicie Aberta
5. Evento: Trilha de Sobrevivencia / Combate com Lobos
6. Interludio: Avistando a Vila
7. Mapa: Regiao Proxima da Vila

### Regra de transicao

Cada interludio pode usar:

- `manual`
- `autoToTargetOnFinish`

Uso na sessao 01 atual:

- Despertar: auto para a Caverna do Despertar ao concluir
- Saida da Caverna: auto para a Planicie Aberta ao concluir
- Avistando a Vila: auto para a Regiao Proxima da Vila ao concluir

## O que esta fora do escopo agora

- backend
- multiplayer real
- assets finais
- videos reais
- 3D
- sistema completo de combate
- FUSHI avancado
- biblioteca grande de NPCs

## Estado atual do app

A implementacao atual ja deixa preparado:

- tiers de poder
- ficha universal
- rolagem com maior, menor e soma
- multiataque no contrato de rolagem
- lobo tutorial como ficha real
- presets de encontro com 1, 2 e 3 lobos
- fluxo da sessao 01 agrupado na biblioteca
- token com controle compartilhado mockado
- permissao futura de NPC virar personagem
