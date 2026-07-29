# FUSHI Status System V1

Este documento fixa a operacao de buffs, debuffs e condicoes da Mesa. A lista
publica e os numeros saem de `src/data/statusCatalog.ts`; os Livros do Jogador e
do Mestre sao regenerados por `npm run books:statuses`.

## Fonte unica

- `src/data/statusCatalog.ts`: nome, cor, icone, causa, efeito, recuperacao e
  regra mecanica.
- `PersistedTabletopSession.publicCombatMarks`: instancias ativas na Mesa.
- `BUF`: aplicacao, consulta e remocao autoritativa pelo Mestre.
- Ficha: `Seus efeitos` e `Efeitos aplicados em voce` aparecem mesmo vazios.
- Livro do Jogador: o botao de informacao da ficha abre a regra publica exata.

Nao duplicar uma tabela independente em componentes React. Palavra encontrada
em descricao de NPC nao cria estado automatico.

## Estados automaticos de recurso

- Vida 0: `Desmaiado`.
- FUSHI 0: `Exausto`.
- Determinacao 0: `Descontrolado`.
- Tres sucessos contra a morte restauram 1 Vida, mas mantem `Desmaiado`.
- `Desmaiado` encerra ao chegar a 2 Vida.

Esses estados usam `notes: automatic:zero-resource` para nao se confundirem
com um efeito narrativo aplicado manualmente.

## Inicio do turno

Cada marca guarda `lastProcessedRound`. Dano continuo, Cura, Aura, teste de
Quebrado, restricao de acao e decremento de duracao podem executar uma unica
vez naquele turno/rodada. Retry, lag e reconexao nao podem repetir o efeito.

- Sangrando: 1 Vida.
- Envenenado: 1d4 Vida.
- Queimando: 1d4; 3 Acumulos usam 2d4.
- Congelado: 1d4; 3 Acumulos tambem aplicam Paralisado.
- Cura: 1d4 Vida.
- Aura: 1 FUSHI.
- Quebrado: VIG + Fortitude DT 15.

Valores proprios de uma habilidade devem entrar em dado estruturado. Nao
reescrever o texto canonico para caber no valor padrao.

## Permissao e sigilo

- Apenas o Mestre aplica ou remove estados comuns pelo `BUF`.
- A fonte pode cancelar somente `especial-buff` ou `especial-debuff` que ela
  mesma aplicou.
- Jogador recebe o estado do proprio alvo, mas uma fonte NPC oculta e
  sanitizada como `hidden-effect-source`.
- Jogador nao recebe ficha, atributo, recurso ou identidade de fonte secreta.
- Toda alteracao percorre a sessao canonica e o servidor; nao existe estado
  visual paralelo.

## Habilidades de NPC

`npm run status:audit` le as fichas reais de
`%APPDATA%\FUSHI\workspace.json` e classifica:

- `REFERENCIA_NAO_APLICA`: texto cita ou evita um conceito.
- `RESOLUCAO_IMEDIATA`: cura/dreno conclui na propria acao.
- `TESTE_SECUNDARIO`: exige outra defesa antes do estado.
- `ESCOLHA_OU_MODO`: Mestre precisa escolher o efeito.
- `PASSIVA_FASE_OU_EVENTO`: depende de fase, dominio ou persistencia propria.
- `REGRA_ESPECIAL_MANUAL`: efeito real que nao equivale ao estado padrao.
- `EFEITO_DIRETO_ESTRUTURAVEL`: candidato tecnico, ainda sujeito ao valor e
  duracao exatos da habilidade.

Nenhuma dessas categorias autoriza mudar lore, nome, custo, dano ou efeito.

## Recuperacao de render

`Ctrl+A` e um comando de recuperacao visual da Mesa:

1. fecha apresentacoes transitorias e remonta o tabuleiro;
2. preserva toda a sessao persistida e multiplayer;
3. inspeciona pixels reais da regiao do mapa no Electron;
4. se a superficie continuar quase toda branca e sem variacao, recarrega o
   renderer sem cache.

O comando nao limpa mapa, tokens, fichas, turnos, efeitos ou aceite.

## Gates

```powershell
npm run status:audit
npm run smoke:statuses
npm run smoke:combat-runtime
npm run smoke:combat-flow:ui
npm run smoke:multiplayer
npm run build
npm run lint -- --max-warnings=999
```
