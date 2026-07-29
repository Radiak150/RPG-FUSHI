# FUSHI Tabletop Agent

Este arquivo e a regra de operacao para qualquer chat/agente que mexer no sistema do RPG-FUSHI.

## Regras duras

1. Nao modificar NPCs canonicos ja criados sem pedido explicito do mestre.
2. Criar mobs e estruturas tecnicas e permitido quando eles entram separados como `tipo: mob`.
3. O MUN e a fonte de verdade do mundo vivo: local, grupo, tempo, memoria, Canon e BASE devem sair dele.
4. A IA nunca aplica acao sozinha. Ela gera previa, diagnostico ou sugestao; o mestre aprova.
5. Plot oculto do mestre nao vira conhecimento interno do NPC antes de acontecer em Canon.
6. Itens, puzzles e recompensas de ponto ficam reservados aos jogadores, salvo decisao manual do mestre.
7. Toda mecanica nova precisa ter: gatilho, rolagem, custo, efeito, limite, risco e como desfazer/logar.
8. `docs/planejamento/campanha-controle.json` e o modelo editavel de producao da campanha; a planilha `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx` e o painel visual gerado a partir desse modelo + auditoria real. Todo fim de build/rodada relevante deve atualizar `npm run content:audit` e regenerar essa planilha antes do resumo final.
9. Ao abrir novo chat sem contexto, consultar primeiro `docs/CONTENT_READINESS_SOURCE_OF_TRUTH.md`, `docs/ALPHA84_CORE_PACK_PLAN.md` e a planilha de readiness antes de criar novas logicas ou conteudo.
10. As abas de personagens (`Protagonistas`, `NPC_Mecanicas`, `Bosses_Fases`, `Faccoes`) so podem usar personagens reais do workspace persistido (`%APPDATA%\FUSHI\workspace.json` ou `FUSHI_APPDATA_ROOT`) e lore real em `C:\RPG FUSHI\RPG-FUSHI\01_LORE\npcs\Facções`. Nunca tratar `src/data/mock/characters.ts`, seed, backup ou reproducoes `.codex-dev` como verdade da campanha.
11. Boss Cataclisma e Ficha Avancada precisam ser planejados como sistemas de producao: fases, mapas, aparencias, VFX/3D, interludios, audio, controle de estado e criterios de teste.
12. O arco de treino da Vila usa `docs/fushi-system/FUSHI_TRAINING_ARC_V1.md` + `src/data/training/village-training-arc.json`; nao duplicar regras no React. Mestre ve DT/controle, Jogador ve somente objetivo e progresso. Rodar `smoke:training`, `smoke:training:ui` e `smoke:multiplayer` ao alterar.
13. Todo evento temporario da Mesa usa o hub e protocolo `EVE` descrito em `docs/fushi-system/FUSHI_EVENT_SYSTEM_V1.md`. Eventos podem coexistir; desativar limpa somente a camada temporaria e preserva progresso. Interacao futura do Jogador exige acao remota tipada, validada, idempotente e com ACK real; nunca aceitar substituicao completa da sessao.
14. O aceite multiplayer pertence a instancia viva do app, nao a rota nem ao socket descartavel. Navegar entre Mesa, Fluxo, Livro e Multiplayer deve usar React Router, sem reload e sem novo `pending`; reconexao de rede usa socket novo com o mesmo `clientInstanceId`. Fechar o app, desconectar explicitamente, recusar ou expulsar encerram a entrada e exigem novo aceite na proxima instancia real.
15. Toda mudanca multiplayer precisa provar Mestre -> Jogador e Jogador -> Mestre para dados, EVE publico e ficha canonica. O smoke deve derrubar o socket e abrir outro; reautenticar o mesmo socket e falso positivo. Atualizacao de ficha do Jogador usa patch de campos e nunca pode apagar skills, rituais, permissoes, corpo compartilhado ou Build Absorvida concedidos pelo Mestre.
16. A ficha da Mesa usa rascunho local durante `Editar` e salva somente no
    comando explicito `Salvar`. Ataque, habilidade, ritual e inventario devem
    passar pelo mesmo caminho canonico, sem estados paralelos por tipo.
17. O TURN e o unico caminho de pedido de acao do Jogador: o pedido remoto e
    tipado, validado, idempotente, reservado ao Mestre e limitado por cooldown.
    A aprovacao do Mestre usa a ficha canonica, consome recurso e marca a acao.
18. Rolagem de combate e uma maquina de etapas: fila do dado -> resultado ->
    defesa -> dano -> conclusao. Nao abrir Resolver ataque antes do resultado e
    nao aplicar dano antes da confirmacao final.
19. Ataque, Habilidade, Ritual ou item novo com efeito de combate usa
    `automation.combat` estruturado. Deve declarar Acao, Teste, Dano, Alcance,
    Resolucao, Falha e Reacao quando aplicaveis. Texto livre e somente
    apresentacao; nao pode ser a unica fonte de calculo do runtime.
20. A distancia de combate e congelada quando a rolagem entra na fila. O
    resultado usa esse snapshot mesmo se o Mestre mover tokens durante a
    animacao. Um quadrado vale 1,5 m; Pontaria a ate 2 quadrados recebe -1d20 e
    usa o contexto adjacente da Build.
21. Recibo, impacto, marca e estado de queda sao dados publicos sanitizados por
    jogador. So atacante, alvo e eventual alvo de cura recebem o recibo, cada
    um ve apenas a propria variacao de recurso, e nenhum log publico carrega o
    payload interno de combate. Alteracoes nesse fluxo exigem
    `smoke:combat-runtime`, `smoke:combat-flow:ui` e `smoke:multiplayer`.
22. Buffs, debuffs e condicoes usam exclusivamente
    `src/data/statusCatalog.ts` e o protocolo
    `docs/fushi-system/FUSHI_STATUS_SYSTEM_V1.md`. O `BUF` do Mestre e a
    superficie autoritativa para aplicar/remover estados manuais. Texto livre
    ou palavra parecida em habilidade nunca vira estado automatico. Uma fonte
    so pode cancelar `Especial` que ela propria aplicou; estado canonico comum
    so o Mestre remove.
23. Estados por turno guardam `lastProcessedRound`: dano continuo, Cura, Aura,
    duracao e restricao de acao executam uma unica vez por turno/rodada, mesmo
    com retry ou reconexao. `Desmaiado`, `Exausto` e `Descontrolado` refletem
    automaticamente Vida, FUSHI e Determinacao em zero. Alteracoes exigem
    `status:audit`, `smoke:statuses`, `smoke:combat-runtime` e
    `smoke:multiplayer`.
24. `Ctrl+A` na Mesa e recuperacao de render, nao reset de campanha. Primeiro
    remonta o tabuleiro preservando a sessao; se a inspecao de pixels ainda
    detectar uma superficie branca, recarrega o renderer sem cache. Nao criar
    fallback branco nem limpar tokens, mapa, fichas ou multiplayer.
25. Inventario usa exclusivamente `src/lib/inventoryCapacity.ts` e os campos
    `inventarioDetalhado[].porte`, `inventarioDetalhado[].quantidade` e
    `inventarioPerfil.mochila`. Inventario comum tem 3 medios; 3 pequenos
    equivalem a 1 medio; Grande+ exclui medio/grande; Mochila normal adiciona
    3 medios com penalidade de 2 m por medio acima da base; Mochila+ troca
    deslocamento por carga ate o piso de 1 m e nao cria teto depois dele.
    Nao implementar MSC sem aprovacao direta do Mestre. Alteracoes exigem
    `npm run smoke:inventory`, `npm run smoke:multiplayer` e a atualizacao do
    documento `docs/planejamento/ALPHA88_INVENTORY_FOUNDATION_2026-07-28.md`.
26. Estagios/Fases usam exclusivamente o protocolo
    `docs/fushi-system/FUSHI_CHARACTER_STAGES_V1.md`. A fase ativa continua
    sendo a unica `CharacterSheet` canonica consumida por combate, TURN,
    inventario, Fluxo Principal e multiplayer. O catalogo do Mestre e formado
    por snapshots privados sem `stageState` recursivo; o Jogador recebe apenas
    `activeStageId`, `activeStageLabel` e `revision`. Trocas preservam id,
    jogador, vinculo, permissoes e corpo compartilhado, bloqueiam edicao
    concorrente e publicam uma transicao visual idempotente. Nao inferir fases
    por texto/lore e nao criar uma segunda ficha viva. Alteracoes exigem
    `npm run smoke:stages`, `npm run smoke:multiplayer`, `npm run smoke:ui` e
    `npm run smoke:release`.

## Fonte de verdade operacional

- Planilha principal: `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx`
- Modelo editavel de producao: `docs/planejamento/campanha-controle.json`
- Script de auditoria: `npm run content:audit`
- Gerador da planilha: `.codex-dev/artifact-work/build-alpha84-control-workbook.mjs`
- Regra: verde = estavel/ok, amarelo = foco/atencao, vermelho = critico/bloqueio.
- Conteudo novo deve entrar pelo modelo `campanha-controle.json` e aparecer na planilha: lore, mecanica, animacao, token, audio, asset, fallback e teste de aceite.
- Abas simples primeiro: `Controle`, `App_Base`, `Campanha_Checklist`, `Protagonistas_Controle`, `NPCs_Mobs`, `Bosses_Rituais`, `Biomas_Mapas`, `Audio_VFX`.
- NPCs e mobs da planilha devem informar a fonte. Se a fonte nao for `workspace real`, a linha e critica e nao deve guiar producao.
- `Protagonistas` separa player real de NPC com nome parecido.
- `Bosses_Fases` separa boss/fases/Cataclisma de ficha basica com imagens de lore.
- `FUSHI_CHARACTER_STAGES_V1.md` define o contrato tecnico de fases da ficha,
  privacidade e sincronizacao da transformacao.
- `Mundo_Biomas` deve acompanhar a organizacao real do MUN, mas focada no que falta produzir.

## Eixo matematico

- Fonte ativa de defesa, critico, manobras, escala de encontro e itens:
  `docs/fushi-system/FUSHI_COMBAT_V2.md`. Se este arquivo divergir de regra
  V1 mais antiga, Combat V2 prevalece.
- Teste padrao: atributo define quantidade de d20; pega o maior; soma pericia e bonus.
- Critico de ataque: 20 natural no dado escolhido dobra somente os dados de dano.
- CA base: valor da ficha/equipamento. Em geral: base do Nivel de Poder + armadura/habilidade.
- Esquiva: Reacao com valor fixo `CA atual + AGI + Reflexos` contra o total do ataque; nao rola dados.
- Bloqueio: Reacao que reduz dano pelo bonus de Fortitude, com teto normal 15.
- Contra-ataque: usa a CA base; se o ataque inimigo nao alcancar a CA base, o defensor contra-ataca.
- Por turno, cada consciencia escolhe apenas 1 reacao defensiva: Bloqueio, Esquiva ou Contra-ataque.
- Determinacao e individual. Vida e FUSHI podem ser compartilhados pelo corpo.
- O sistema tem quatro Niveis de Poder: Basico, Avancado, Ascensao, Cataclisma.
- Vida nao escala por Vigor; vem do corpo/Nivel de Poder + itens + buffs.
- Depois de migrar fichas ou mexer em defesa/dano, rodar `npm run smoke:combat-v2`
  e `npm run combat:simulate`. O simulador e ferramenta offline e nao deve
  aparecer como controle normal da Mesa.

## Documentos de referencia

- `docs/fushi-system/FUSHI_RULEBOOK_CANON_V1.md`
- `docs/fushi-system/FUSHI_MECHANICS_BALANCE_AGENT.md`
- `docs/fushi-system/FUSHI_REINCARNATION_PROTOCOL_V1.md`
- `docs/fushi-system/FUSHI_DT_AUDIT_2026-05-27.md`
- `docs/fushi-system/FUSHI_DAMAGE_BALANCE_AUDIT_V1.md`
- `docs/fushi-system/FUSHI_LEVEL_LEDGER_TEMPLATE.md`
- `docs/fushi-system/FUSHI_MOBS_AND_WAVES_V1.md`
- `docs/fushi-system/FUSHI_ITEMS_AND_BASE_V1.md`
- `docs/fushi-system/FUSHI_EVENT_SYSTEM_V1.md`
- `docs/fushi-system/FUSHI_STATUS_SYSTEM_V1.md`
- `docs/fushi-system/FUSHI_MECHANICS_GAP_AUDIT_2026-05-27.md`

## Ordem segura de implementacao

1. Fechar regra em documento.
2. Criar dado estruturado separado.
3. Conectar UI sem apagar estado antigo.
4. Logar toda mudanca relevante.
5. Testar mesa GM e player.
6. So entao ligar API/IA em modo de previa aprovada.
