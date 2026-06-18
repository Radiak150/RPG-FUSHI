# RPG FUSHI

Base organizacional do projeto criativo `RPG FUSHI` e do app `RPG FUSHI Tabletop`.

Este repositório existe para manter consistência entre app, sistema, dados estruturados, preparação de sessão e ferramentas futuras de suporte ao mestre.

O app principal fica em:

`06_TOOLS/fushi-tabletop`

## Estado De Versionamento

- `main`: baseline público e versionável do projeto.
- Branches `alpha*` e `feature/*`: trabalho em andamento antes de virar base.
- Conteúdo privado de campanha, lore sensível, builds locais, releases empacotados, caches e backups não entram no Git.
- A planilha operacional atual fica em `06_TOOLS/fushi-tabletop/docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx`.
- Antes de promover mudanças importantes do app, validar o build real Windows em `06_TOOLS/fushi-tabletop/release/win-unpacked`.

## Premissa consolidada

- O nome oficial do sistema de poder é `FUSHI`.
- FUSHI existe em todos os seres e coisas.
- Os protagonistas são um organismo alienígena microscópico coletivo, semelhante a um vírus consciente em evolução.
- Os protagonistas começam todos no mesmo corpo.
- Eles são imortais por renascimento em corpos já existentes.
- A morte é dolorosa, traumática e imediata, e o renascimento acontece imediatamente.
- Eles mantêm 100% da própria memória entre mortes.
- O corpo novo sempre já existia no mundo.
- FUSHI pode existir em estado puro, desequilibrado ou escuro.
- A campanha principal se passa em uma ilha isolada e viva, com reação ao desequilíbrio de FUSHI.
- A estrutura da campanha prevê exploração moderada, hub inicial, progressão de mapa, facções com objetivos próprios e eventos dinâmicos.

## Estrutura do projeto

- `00_ADMIN`: decisões fixas, glossário, roadmap e regras de trabalho.
- `01_LORE`: premissa, mundo, facções, NPCs, vilões e mistérios.
- `02_GAME_DESIGN`: adaptação de sistema, balanceamento e loops de jogo.
- `03_DATA`: dados estruturados em JSON para futura automação e consulta.
- `04_SESSIONS`: preparação e registro de sessões.
- `05_ASSETS`: mapas, retratos, símbolos e referências visuais.
- `06_TOOLS`: backlog e documentação de ferramentas futuras.

## Regras de organização

- Conteúdo para leitura humana deve ficar prioritariamente em arquivos `Markdown`.
- Conteúdo estruturado e reutilizável deve ficar prioritariamente em arquivos `JSON`.
- Toda decisão consolidada deve ser registrada em `00_ADMIN/decisoes-fixas.md`.
- Quando houver conflito entre ideias, o material anterior não deve ser apagado; a divergência deve ser movida para uma seção `PENDENTE DE REVISÃO`.

## Ponto de partida recomendado

Revise nesta ordem:

1. `00_ADMIN/decisoes-fixas.md`
2. `00_ADMIN/glossario.md`
3. `00_ADMIN/roadmap.md`
4. `00_ADMIN/workflow-agent.md`

## Estado atual

O repositório foi inicializado com estrutura base, documentos iniciais e arquivos de dados vazios com esquema mínimo.
