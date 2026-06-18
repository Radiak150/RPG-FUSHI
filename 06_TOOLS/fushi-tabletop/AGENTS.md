# FUSHI Tabletop Agent Entry

Use `Agent.md` as the main project agent file. It contains the current operating rules for stability, content, mechanics, and new build handoffs.

Before changing systems, content, NPCs, mechanics, assets, or release workflow, read:

- `Agent.md`
- `docs/CONTENT_READINESS_SOURCE_OF_TRUTH.md`
- `docs/ALPHA84_CORE_PACK_PLAN.md`
- `docs/planejamento/campanha-controle.json`
- `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx`

`docs/planejamento/campanha-controle.json` is the editable campaign production model. The workbook `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx` is the visual panel generated from that model plus real app/lore audits. At the end of every meaningful build, stability pass, or content pass, run `npm run content:audit`, regenerate the workbook with `.codex-dev/artifact-work/build-alpha84-control-workbook.mjs`, and mention whether the workbook was updated.

For campaign planning sheets, only use real persisted campaign characters from `%APPDATA%\FUSHI\workspace.json` or the active `FUSHI_APPDATA_ROOT`, plus lore under `C:\RPG FUSHI\RPG-FUSHI\01_LORE\npcs\Facções`. Do not use `src/data/mock/characters.ts`, seeds, backups, or `.codex-dev` repro data as campaign truth.

Key workbook tabs:

- `Controle`: simple campaign production panel.
- `App_Base`: stable app checklist.
- `Campanha_Checklist`: lore/content checklist by area.
- `Protagonistas_Controle`: player, real body, village body, premise and next production step.
- `NPCs_Mobs`: NPCs, mobs and placeholders without mixing them.
- `Bosses_Rituais`: advanced bosses, rituals and Cataclysm production gates.
- `Biomas_Mapas`: MUN/biome production panel.
- `Audio_VFX`: audio, VFX, rituals, legendary abilities and animated map backlog.
- `Protagonistas`: player characters only.
- `NPC_Mecanicas`: full real workspace character board.
- `Bosses_Fases`: advanced boss/Cataclysm planning, including phase/map/VFX/interlude needs.
- `Faccoes`: faction production overview.
- `Mundo_Biomas`: MUN/biome production overview.
