# Combat V2 - Aplicacao Confirmada

Aplicado em: 2026-07-11T19:57:10.412Z

Workspace alvo: `C:\Users\danie\AppData\Roaming\FUSHI\workspace.json`

Backup automatico criado antes da escrita:

`C:\Users\danie\AppData\Roaming\FUSHI\workspace.backup-before-combat-v2-2026-07-11T19-57-10-395Z.json`

## Resultado

- 56 fichas analisadas.
- 48 fichas alteradas na primeira aplicacao.
- Bloqueio passou a usar Fortitude com teto normal 15.
- Esquiva estatica foi zerada; a Mesa agora rola Esquiva como Reacao ativa.
- Lobos foram reclassificados na escala de encontro: Lobo Cinzento com 8 Vida
  e Lobo Marcado por FUSHI com 14 Vida.
- Liryssa recebeu a Pistola de Sinalizacao Adaptada estruturada, pois sua ficha
  real continha a referencia do equipamento mas nenhum ataque direto.
- Veyra integrou `RESULTADO` em `HABILIDADE LENDARIA TUDO OU NADA`.
- Liryssa integrou `COMANDO DA CAPITA` em `HABILIDADE LENDARIA CAPITULO FINAL?
  NEM PENSAR`.

## Verificacao posterior

Um dry-run executado depois da aplicacao retornou `changed: 0`. A migracao agora
e idempotente: uma nova execucao nao reaplica Vida de lobo, nao duplica ataque
e nao reabre as Habilidades que ja foram integradas.

## Resync de 2026-07-12

Uma gravacao posterior do workspace reintroduziu quatro divergencias de defesa.
O resync foi aplicado sem alterar lore, imagem, habilidade ou recurso:

- Kairos: Esquiva estatica 15 -> 0.
- Connor: Bloqueio 0 -> 5 por Fortitude.
- Kael jogador: Bloqueio 0 -> 5 por Fortitude.
- Maira Velan: perfil V2, Bloqueio 8 -> 0 e Esquiva estatica 17 -> 0.

Backup automatico do resync:

`C:\Users\danie\AppData\Roaming\FUSHI\workspace.backup-before-combat-v2-2026-07-12T03-48-58-861Z.json`

Depois da escrita, `combat:v2:plan` e `math:npc:plan` retornaram zero alteracoes,
e `smoke:combat-v2` aprovou as 56 fichas e os cinco cenarios.
