# FUSHI Tabletop Agent Entry

Use `Agent.md` as the main project agent file. It contains the current operating rules for stability, content, mechanics, and new build handoffs.

Before changing systems, content, NPCs, mechanics, assets, or release workflow, read:

- `Agent.md`
- `docs/CONTENT_READINESS_SOURCE_OF_TRUTH.md`
- `docs/ALPHA84_CORE_PACK_PLAN.md`
- `docs/planejamento/campanha-controle.json`
- `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx`
- `docs/fushi-system/FUSHI_COMBAT_V2.md`
- `docs/fushi-system/FUSHI_RULEBOOK_CANON_V1.md`
- `docs/fushi-system/FUSHI_EVENT_SYSTEM_V1.md`
- `docs/fushi-system/FUSHI_STATUS_SYSTEM_V1.md`
- `docs/fushi-system/FUSHI_CHARACTER_STAGES_V1.md`

Para regras dos livros, o texto publicado no app/PDF sai de
`src/data/rulebook/player-rulebook.json` e
`src/data/rulebook/master-rulebook.json`. Nao duplicar manualmente essas regras
em componentes React.

`docs/planejamento/campanha-controle.json` is the editable campaign production model. The workbook `docs/planejamento/FUSHI_App_Readiness_Alpha84.xlsx` is the visual panel generated from that model plus real app/lore audits. At the end of every meaningful build, stability pass, or content pass, run `npm run content:audit`, regenerate the workbook with `.codex-dev/artifact-work/build-alpha84-control-workbook.mjs`, and mention whether the workbook was updated.

For campaign planning sheets, only use real persisted campaign characters from `%APPDATA%\FUSHI\workspace.json` or the active `FUSHI_APPDATA_ROOT`, plus lore under `C:\RPG FUSHI\RPG-FUSHI\01_LORE\npcs\Facções`. Do not use `src/data/mock/characters.ts`, seeds, backups, or `.codex-dev` repro data as campaign truth.

Inventory is a shared canonical rule, not a component-local calculation. Use
`src/lib/inventoryCapacity.ts` and preserve the common 3-medium capacity,
3-small conversion, Grande+ exclusivity, normal backpack penalty, and
Mochila+ movement floor. Keep `docs/planejamento/ALPHA88_INVENTORY_FOUNDATION_2026-07-28.md`
updated. Do not start MSC implementation without direct Mestre approval.

For any Combat V2 pass, run `npm run smoke:combat-v2` after the simulator or
real-data migration. It protects Fortitude Block, active Dodge, wolves,
Liryssa/Veyra integration, books, and the simulator warning contract.
Balance simulations are offline developer tooling and must not appear as a
normal Mesa HUD control. Use `npm run combat:simulate` and
`npm run combat:builds:plan`; package only player/GM gameplay surfaces.

For the Village training arc, use
`docs/fushi-system/FUSHI_TRAINING_ARC_V1.md` and
`src/data/training/village-training-arc.json` as the single rules source. Do
not duplicate station rules in React. Any change must pass
`npm run smoke:training`, `npm run smoke:training:ui`, and
`npm run smoke:multiplayer`; DT and GM guidance must never render in the
player panel.

All temporary Mesa events use the `EVE` protocol in
`docs/fushi-system/FUSHI_EVENT_SYSTEM_V1.md`. Do not create independent event
flags or let a player replace the whole session. New player interactions need
typed, server-validated, idempotent remote actions with real ACK. Event changes
must pass `npm run smoke:events` plus the affected feature and multiplayer
smokes.

Multiplayer admission belongs to the live app instance, not to a route or a
disposable socket. Moving
between Mesa, Fluxo Principal, Livro and Multiplayer must use internal router
navigation without reload or a new pending request. Closing the app, explicit
disconnect, rejection or kick revoke that live admission.

Any multiplayer change must preserve both Mestre -> Jogador and Jogador ->
Mestre for dice, public EVE presentations and the canonical ficha. The required
gate is a real new-socket reconnect with the same ephemeral `clientInstanceId`;
re-authenticating the old socket is not a valid reconnect test. Player ficha
updates must be field patches and must not replace GM-granted skills, rituals,
permissions, shared-body state or absorbed builds.

New attacks, skills, rituals and combat items must use the structured
`automation.combat` contract from `src/data/types.ts`; free text is presentation,
not runtime math. Combat freezes source/target cells when the roll enters the
queue. Public receipts, impacts, marks and player death states must pass through
the per-player sanitizer, with each involved player receiving only their own
resource changes. Run `smoke:combat-runtime`, `smoke:combat-flow:ui` and
`smoke:multiplayer` after changing this path.

Buffs, debuffs and conditions use `src/data/statusCatalog.ts` plus the `BUF`
protocol in `docs/fushi-system/FUSHI_STATUS_SYSTEM_V1.md`. Do not infer an
automatic state from a keyword in NPC prose. Run `npm run status:audit` and
`npm run smoke:statuses`; conditional, phase, choice and custom-value effects
remain explicit review items until their own structured resolver exists.

Character stages use `docs/fushi-system/FUSHI_CHARACTER_STAGES_V1.md`. The
active stage remains the single canonical `CharacterSheet` used by combat,
turn, inventory, Fluxo Principal and multiplayer. The GM-only stage catalog is
stored as non-recursive snapshots; player payloads may contain only the active
stage id, label and revision. A stage switch must preserve identity, player
binding, permissions and shared-body fields, use the canonical ficha update
path, and trigger an idempotent public token transition. Do not create a
parallel live ficha or infer boss phases from prose.

The Mesa `Ctrl+A` recovery preserves the persisted session. It first remounts
the board and then, only if a real Electron pixel inspection still detects a
blank surface, reloads the renderer without cache. Never replace it with a
visual white fallback or a session reset.

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
