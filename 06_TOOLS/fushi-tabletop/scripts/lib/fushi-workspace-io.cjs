const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

function resolveRepoRoot(projectRoot = process.cwd()) {
  return path.resolve(projectRoot, '..', '..')
}

function getAppDataRoot() {
  return path.join(
    process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
    'FUSHI',
  )
}

function getDefaultWorkspacePath() {
  return path.join(getAppDataRoot(), 'workspace.json')
}

function getDefaultAutosavePath(projectRoot = process.cwd()) {
  return path.join(
    resolveRepoRoot(projectRoot),
    '03_DATA',
    'APP_STATE',
    'fushi-tabletop-autosave.json',
  )
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function readWorkspaceFromAutosave(autosavePath) {
  const backup = readJson(autosavePath)
  const rawWorkspace = backup.localStorage?.['fushi-tabletop:workspace:v1']

  if (typeof rawWorkspace !== 'string') {
    return null
  }

  return JSON.parse(rawWorkspace)
}

function readWorkspaceState(input = {}) {
  const projectRoot = input.projectRoot || process.cwd()
  const workspacePath =
    input.workspacePath ||
    process.env.FUSHI_WORKSPACE_PATH ||
    getDefaultWorkspacePath()
  const autosavePath =
    input.autosavePath ||
    process.env.FUSHI_AUTOSAVE_PATH ||
    getDefaultAutosavePath(projectRoot)

  if (fs.existsSync(workspacePath)) {
    return {
      sourcePath: workspacePath,
      sourceType: 'workspace',
      stat: fs.statSync(workspacePath),
      workspace: readJson(workspacePath),
    }
  }

  if (fs.existsSync(autosavePath)) {
    return {
      sourcePath: autosavePath,
      sourceType: 'autosave',
      stat: fs.statSync(autosavePath),
      workspace: readWorkspaceFromAutosave(autosavePath),
    }
  }

  return {
    sourcePath: workspacePath,
    sourceType: 'missing',
    stat: null,
    workspace: null,
  }
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function writeWorkspaceState(input) {
  const workspacePath = input.workspacePath || getDefaultWorkspacePath()
  const workspace = input.workspace
  const backupLabel = input.backupLabel || 'workspace.backup-before-lore-apply'
  const directoryPath = path.dirname(workspacePath)
  const backupPath = path.join(directoryPath, `${backupLabel}-${safeTimestamp()}.json`)
  const temporaryPath = `${workspacePath}.tmp`

  fs.mkdirSync(directoryPath, { recursive: true })

  if (fs.existsSync(workspacePath)) {
    fs.copyFileSync(workspacePath, backupPath)
  }

  fs.writeFileSync(temporaryPath, `${JSON.stringify(workspace, null, 2)}\n`, 'utf8')
  fs.renameSync(temporaryPath, workspacePath)

  return {
    backupPath: fs.existsSync(backupPath) ? backupPath : null,
    workspacePath,
  }
}

module.exports = {
  getDefaultAutosavePath,
  getDefaultWorkspacePath,
  readWorkspaceState,
  resolveRepoRoot,
  writeWorkspaceState,
}
