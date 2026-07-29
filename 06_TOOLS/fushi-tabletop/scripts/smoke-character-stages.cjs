const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ts = require('typescript')

const rootDir = path.resolve(__dirname, '..')
const sourcePath = path.join(rootDir, 'src', 'lib', 'characterStages.ts')
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fushi-character-stages-'))
const compiledPath = path.join(tempDir, 'characterStages.cjs')

try {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  })
  fs.writeFileSync(compiledPath, compiled.outputText, 'utf8')
  const stages = require(compiledPath)

  const character = {
    id: 'character-davi',
    nome: 'Davi',
    tipo: 'player',
    faccao: 'Vila',
    localAtual: 'Campo',
    isSharedBodyHost: false,
    jogador: 'player2',
    permissions: {
      canBeAssignedToPlayer: true,
      gmCanRevokeControl: true,
      tokenControl: {
        controlledByPlayerIds: ['player2'],
        sharedControl: false,
      },
    },
    avatarUrl: '/assets/davi-a.png',
    tokenImageUrl: '/assets/davi-a-token.png',
    atributos: { forca: 0, agilidade: 2 },
    recursos: { vidaAtual: 10, vidaMaxima: 10 },
  }

  const legacyState = stages.getCharacterStageState(character)
  assert.equal(legacyState.activeStageId, stages.DEFAULT_CHARACTER_STAGE_ID)
  assert.equal(legacyState.activeStageLabel, 'Padrao')
  assert.equal(character.stageState, undefined)

  const created = stages.createCharacterStage(character, 'Fase 2')
  assert.equal(created.stageState.catalog.length, 2)
  assert.equal(created.stageState.activeStageLabel, 'Fase 2')
  assert.notEqual(created.stageState.activeStageId, stages.DEFAULT_CHARACTER_STAGE_ID)
  assert.equal(created.stageState.catalog[0].snapshot.stageState, undefined)
  assert.equal(created.stageState.catalog[1].snapshot.stageState, undefined)
  assert.equal(
    stages.getPublicCharacterStageState(created).catalog,
    undefined,
  )

  const edited = {
    ...created,
    tokenImageUrl: '/assets/davi-phase-2-token.png',
    recursos: { ...created.recursos, vidaMaxima: 42 },
  }
  const switchedBack = stages.switchCharacterStage(
    edited,
    stages.DEFAULT_CHARACTER_STAGE_ID,
  )
  assert.equal(switchedBack.stageState.activeStageLabel, 'Padrao')
  assert.equal(switchedBack.tokenImageUrl, '/assets/davi-a-token.png')
  assert.equal(switchedBack.recursos.vidaMaxima, 10)
  assert.equal(switchedBack.id, character.id)
  assert.deepEqual(switchedBack.permissions, character.permissions)

  const switchedForward = stages.switchCharacterStage(
    switchedBack,
    created.stageState.activeStageId,
  )
  assert.equal(switchedForward.stageState.activeStageLabel, 'Fase 2')
  assert.equal(switchedForward.tokenImageUrl, '/assets/davi-phase-2-token.png')
  assert.equal(switchedForward.recursos.vidaMaxima, 42)
  const sameStage = stages.switchCharacterStage(
    switchedForward,
    created.stageState.activeStageId,
  )
  assert.equal(sameStage.stageState.revision, switchedForward.stageState.revision)
  assert.equal(
    sameStage.stageState.activeStageId,
    switchedForward.stageState.activeStageId,
  )

  const renamed = stages.renameCharacterStage(
    switchedForward,
    created.stageState.activeStageId,
    'Boss desperto',
  )
  assert.equal(renamed.stageState.activeStageLabel, 'Boss desperto')
  assert.equal(
    renamed.stageState.catalog.find(
      (stage) => stage.id === created.stageState.activeStageId,
    ).label,
    'Boss desperto',
  )
  const thirdStage = stages.createCharacterStage(renamed, 'Fase 3')
  const deletedArchived = stages.deleteCharacterStage(
    thirdStage,
    renamed.stageState.activeStageId,
  )
  assert.equal(deletedArchived.stageState.catalog.length, 2)

  const protectedDelete = stages.deleteCharacterStage(
    renamed,
    created.stageState.activeStageId,
  )
  assert.equal(protectedDelete.stageState.catalog.length, 2)
  const deleted = stages.deleteCharacterStage(
    renamed,
    stages.DEFAULT_CHARACTER_STAGE_ID,
  )
  assert.equal(deleted.stageState.catalog.length, 2)

  const serverSource = fs.readFileSync(
    path.join(rootDir, 'electron', 'multiplayer-server.cjs'),
    'utf8',
  )
  assert.match(
    serverSource,
    /publicCharacter\.stageState\s*=\s*\{\s*activeStageId/,
  )
  assert.match(serverSource, /'stageState',/)
  assert.match(serverSource, /delete publicCharacter\.stageState/)

  console.log('[smoke:stages] OK - snapshots, troca, protecao e privacidade auditados.')
} finally {
  fs.rmSync(tempDir, { force: true, recursive: true })
}
