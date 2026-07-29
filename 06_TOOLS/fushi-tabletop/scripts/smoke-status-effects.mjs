import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function fail(message) {
  throw new Error(`[status-effects] ${message}`)
}

function assert(condition, message) {
  if (!condition) fail(message)
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

async function main() {
  const vite = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    root,
    server: { middlewareMode: true },
  })

  try {
    const statusModule = await vite.ssrLoadModule('/src/data/statusCatalog.ts')
    const sessionModule = await vite.ssrLoadModule('/src/lib/tabletopSession.ts')
    const catalog = statusModule.TABLETOP_STATUS_CATALOG
    const byId = new Map(catalog.map((status) => [status.id, status]))

    assert(catalog.length === 24, `catalogo deveria ter 24 estados; recebeu ${catalog.length}`)
    assert(byId.size === catalog.length, 'catalogo possui IDs duplicados')

    for (const status of catalog) {
      assert(status.label?.trim(), `${status.id} sem nome`)
      assert(/^#[0-9a-f]{6}$/i.test(status.color), `${status.id} sem cor hexadecimal valida`)
      assert(status.cause?.trim(), `${status.id} sem causa`)
      assert(status.effect?.trim(), `${status.id} sem efeito`)
      assert(status.recovery?.trim(), `${status.id} sem recuperacao`)
      assert(status.icon?.trim(), `${status.id} sem icone`)
    }

    assert(byId.get('cansado')?.rules.dicePenalty === 1, 'Cansado perdeu -1 dado')
    assert(
      byId.get('quebrado')?.rules.physicalDicePenalty === 1,
      'Quebrado perdeu -1 dado fisico',
    )
    assert(
      byId.get('quebrado')?.rules.movementMultiplier === 0.5,
      'Quebrado perdeu metade do deslocamento',
    )
    assert(byId.get('desmaiado')?.rules.preventsTurn, 'Desmaiado deixou de bloquear o turno')
    assert(
      byId.get('vulneravel')?.rules.doublesIncomingDamage,
      'Vulneravel deixou de dobrar dano final',
    )
    assert(
      byId.get('envenenado')?.rules.continuousDamage === '1d4',
      'Envenenado perdeu dano continuo',
    )
    assert(byId.get('queimando')?.rules.maxStacks === 3, 'Queimando perdeu Acumulos')
    assert(byId.get('congelado')?.rules.maxStacks === 3, 'Congelado perdeu Acumulos')
    assert(byId.get('vacina')?.rules.immuneToStatuses, 'Vacina perdeu imunidade')
    assert(byId.get('aura')?.rules.fushiPerTurn === 1, 'Aura perdeu recuperacao de FUSHI')
    assert(byId.get('cura')?.rules.healingPerTurn === '1d4', 'Cura perdeu recuperacao de Vida')

    const persisted = sessionModule.createPersistedTabletopSession({
      publicCombatMarks: [
        {
          cancelableBySource: false,
          color: byId.get('queimando').color,
          createdAt: 1,
          durationRounds: 3,
          id: 'status-smoke',
          icon: byId.get('queimando').icon,
          kind: 'debuff',
          label: byId.get('queimando').label,
          lastProcessedRound: 4,
          sourceTokenId: 'source-smoke',
          stacks: 3,
          statusId: 'queimando',
          targetTokenId: 'target-smoke',
        },
      ],
    })
    const mark = persisted.publicCombatMarks.find((item) => item.id === 'status-smoke')

    assert(mark, 'sessao descartou o estado persistido')
    assert(mark.statusId === 'queimando', 'sessao descartou statusId')
    assert(mark.stacks === 3, 'sessao descartou Acumulos')
    assert(mark.durationRounds === 3, 'sessao descartou duracao')
    assert(mark.lastProcessedRound === 4, 'sessao descartou idempotencia por rodada')

    const tablePage = read('src/pages/TablePage.tsx')
    const tabletopBoard = read('src/components/tabletop/TabletopBoard.tsx')
    const tokenStatusCluster = read(
      'src/components/tabletop/TabletopTokenStatusCluster.tsx',
    )
    const globalStyles = read('src/styles/globals.css')
    const preload = read('electron/preload.cjs')
    const main = read('electron/main.cjs')
    const multiplayer = read('electron/multiplayer-server.cjs')

    for (const contract of [
      'resolveStatusTurnStart',
      'lastProcessedRound',
      'automatic:zero-resource',
      'hardRecoverBoardRenderer',
    ]) {
      assert(tablePage.includes(contract), `TablePage perdeu contrato ${contract}`)
    }
    assert(
      tabletopBoard.includes('inspectRenderedRegion'),
      'tabuleiro perdeu a inspecao real de pixels renderizados',
    )
    assert(
      tabletopBoard.includes('TabletopTokenStatusCluster'),
      'tabuleiro perdeu o conjunto visual de estados do token',
    )
    assert(
      tokenStatusCluster.includes('marks.map'),
      'token voltou a exibir somente o ultimo estado',
    )
    assert(
      !tokenStatusCluster.includes('title={status.label}'),
      'token voltou a depender de rotulo textual nativo',
    )
    for (const visualContract of [
      '.tabletop-token__status-strip',
      '.tabletop-token__status-popover',
      '.tabletop-token__status-detail',
      '.tabletop-token__status-stack',
    ]) {
      assert(
        globalStyles.includes(visualContract),
        `visual de estados perdeu contrato ${visualContract}`,
      )
    }
    assert(preload.includes('reloadRenderer'), 'preload perdeu recarga forte do renderer')
    assert(main.includes('reloadIgnoringCache'), 'Electron perdeu recarga sem cache')
    assert(
      multiplayer.includes('hidden-effect-source:'),
      'multiplayer deixou de ocultar a fonte secreta do estado',
    )
    assert(
      multiplayer.includes('lastProcessedRound'),
      'multiplayer deixou de transmitir idempotencia por rodada',
    )

    console.log(
      `[status-effects] ok: ${catalog.length} estados, persistencia, turno, privacidade e recuperacao visual`,
    )
  } finally {
    await vite.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
