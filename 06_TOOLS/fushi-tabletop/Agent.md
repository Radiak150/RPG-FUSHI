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
- `Mundo_Biomas` deve acompanhar a organizacao real do MUN, mas focada no que falta produzir.

## Eixo matematico

- Teste padrao: atributo define quantidade de d20; pega o maior; soma pericia e bonus.
- Critico: menor resultado natural escolhido = falha critica; maior resultado natural escolhido = sucesso critico. Em pool normal, 2d20 com 1 e 2 escolhe 2 e nao falha critica.
- CA base: valor da ficha/equipamento. Em geral: base do Nivel de Poder + armadura/habilidade.
- Esquiva: CA base + Agilidade + pericia Reflexos; evita o dano se o ataque nao alcancar essa CA.
- Bloqueio: reduz metade da CA base do dano recebido.
- Contra-ataque: usa a CA base; se o ataque inimigo nao alcancar a CA base, o defensor contra-ataca.
- Por turno, cada consciencia escolhe apenas 1 reacao defensiva: Bloqueio, Esquiva ou Contra-ataque.
- Determinacao e individual. Vida e FUSHI podem ser compartilhados pelo corpo.
- O sistema tem quatro Niveis de Poder: Basico, Avancado, Ascensao, Cataclisma.
- Vida nao escala por Vigor; vem do corpo/Nivel de Poder + itens + buffs.

## Documentos de referencia

- `docs/fushi-system/FUSHI_MECHANICS_BALANCE_AGENT.md`
- `docs/fushi-system/FUSHI_REINCARNATION_PROTOCOL_V1.md`
- `docs/fushi-system/FUSHI_DT_AUDIT_2026-05-27.md`
- `docs/fushi-system/FUSHI_DAMAGE_BALANCE_AUDIT_V1.md`
- `docs/fushi-system/FUSHI_LEVEL_LEDGER_TEMPLATE.md`
- `docs/fushi-system/FUSHI_MOBS_AND_WAVES_V1.md`
- `docs/fushi-system/FUSHI_ITEMS_AND_BASE_V1.md`
- `docs/fushi-system/FUSHI_MECHANICS_GAP_AUDIT_2026-05-27.md`

## Ordem segura de implementacao

1. Fechar regra em documento.
2. Criar dado estruturado separado.
3. Conectar UI sem apagar estado antigo.
4. Logar toda mudanca relevante.
5. Testar mesa GM e player.
6. So entao ligar API/IA em modo de previa aprovada.
