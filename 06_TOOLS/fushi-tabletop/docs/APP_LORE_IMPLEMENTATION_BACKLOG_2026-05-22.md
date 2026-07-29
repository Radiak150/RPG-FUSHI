# Backlog de implementacao lore/app - FUSHI

Data: 2026-05-22

Este backlog serve para transformar a lore canonica em dados reais do app.

## Concluido em 2026-05-22

- Corrigidos os pontos canonicos 13 a 35 em `worldMundiState.ts`, alinhando Vulcao, Gelo e Ruinas com `MUN_REWORK`.
- Copiadas as thumbs oficiais de Vulcao, Gelo e Ruinas para `public/assets/mundi/locations`.
- Atualizada a tag de revisao do MUN para forcar migracao do estado salvo antigo.

Correcao importante: os personagens visiveis no app estao no workspace persistido em `C:\Users\danie\AppData\Roaming\FUSHI\workspace.json`, nao no seed/mock. Antes de alterar fichas, foi criado backup em `C:\Users\danie\AppData\Roaming\FUSHI\workspace.backup-before-lore-2026-05-22.json`.

Pendente consciente: atualizar o workspace real, preservando ids e imagens existentes, em vez de criar duplicatas. Liora ainda nao deve virar ficha sem decisao de mestre sobre memoria/eco/registro.

Atualizado no workspace real:

- `Kairos` continua como `player`, preservando imagem, agora com classe/origem/notas/habilidades/inventario do formulario e regra canonica de que ele e identidade interna/eco de Selian.
- `Selian` continua como `npc`, preservando imagem, agora marcado como matriz emocional de Kairos, sem virar Kairos literal e sem confirmar entidade implantada.
- Criados no workspace real como `player`: `Davi Paixao`, `Connor Mayweather`, `Keal Lebranc`, `Ruiz`.
- Criados no workspace real como `npc`: `Elara Vonn`, `Orian Vonn`, `Nilo Arven`, `Maira Velan`, `Dalvo Seren`, `Elias Norem`, `Nayr Velcaris`, `Renji Akimura`, `Kazuo Kato`.
- Backup extra criado em `C:\Users\danie\AppData\Roaming\FUSHI\workspace.backup-before-overnight-lore-2026-05-22.json`.

Observacao: Davi, Connor e Ruiz receberam atributos/pericias como rascunho mecanico para o app ficar jogavel. Keal recebeu os valores encontrados na ficha. Esses rascunhos precisam de aprovacao do mestre antes de virarem ficha final.

## P0 - Antes da primeira sessao

### Corrigir MUN canonico

Arquivo principal:

- `C:\RPG FUSHI\RPG-FUSHI\06_TOOLS\fushi-tabletop\src\lib\worldMundiState.ts`

Corrigir pelo menos:

- pontos 13 a 21 do Vulcao;
- pontos 22 a 28 do Gelo;
- pontos 29 a 35 das Ruinas.

Motivo: Ryoku, Dragao FUSHI e rotas futuras dependem desses ids.

### Importar NPCs da Vila

Arquivo atual a verificar:

- `C:\RPG FUSHI\RPG-FUSHI\06_TOOLS\fushi-tabletop\src\data\mock\characters.ts`

Status: aplicado no workspace real para todos abaixo, exceto Liora memorial.

Adicionar fichas estruturadas:

- Elara;
- Orian;
- Nilo;
- Selian;
- Maira;
- Dalvo;
- Elias;
- Nayr;
- Renji;
- Kazuo;
- Liora memorial.

Pendente: decidir se Liora sera ficha memorial, eco limitado, registro de mapa ou mais de uma dessas formas.

### Criar mapa extra Nilo/Liora

Tipo: submapa de `Riacho Claro`, nao ponto oficial novo.

Nome sugerido:

- `planicie_riacho_claro_plataforma_liora_nilo`

### Criar regra de XP por Marcos de Identidade

Precisa aparecer no app ou em documento mestre:

- marco;
- descricao;
- nivel/FUSHI concedido;
- se pode repetir;
- quais players receberam.

### Criar regra de renascimento

Minimo para funcionar:

- gatilho;
- tabela de compatibilidade;
- resultado de sucesso/disputa/rejeicao;
- custo;
- efeito em vozes internas;
- consentimento de NPC vivo.

## P1 - Mundo vivo

### Estado de mundo

Criar estrutura para salvar:

- dia;
- hora/periodo;
- local atual do grupo;
- grupo ativo;
- eventos canonicos;
- estabilidade da ilha;
- estado de Ryoku;
- estado do Dragao;
- estado da vila.

### Memoria de NPC

Cada NPC importante precisa ter:

- memoria curta;
- relacao com players;
- medo atual;
- objetivo atual;
- ultimo evento presenciado.

### Memoria de grupo

Quando criar/desfazer grupo, salvar:

- integrantes;
- objetivo;
- cenas importantes;
- promessas;
- conflitos;
- pendencias.

## P1 - Multiplayer

Smoke test obrigatorio no exe:

- host cria sala;
- cliente entra por IP;
- mapa sincroniza;
- ficha sincroniza;
- rolagem sincroniza;
- chat normal funciona;
- chat nao recebe log de sistema;
- troca de mapa funciona;
- desconexao/reentrada nao quebra estado.

## P2 - Cataclismas

### Ryoku

Adicionar estados:

- fragmentCount;
- sealState;
- velkarProgress;
- ruinRisk;
- activeManifestations.

### Dragao FUSHI

Adicionar estados:

- dragonState;
- islandStability;
- proofStates;
- manifestationStates;
- artificialStabilityDuringGame;
- finalWishCost.

## P2 - Assets

### Topdowns

Organizar:

- pointId;
- mapId;
- topdown path;
- thumb path;
- variant state.

### Musicas

Organizar:

- locationId;
- mood;
- combat/ambient;
- loopable;
- boss/event flag.

## P3 - Decoracao e VFX

Depois da base estavel:

- objetos 3D customizados importaveis;
- animacoes importaveis;
- VFX reais por asset;
- preview bonito e leve;
- cenas de interludio.
