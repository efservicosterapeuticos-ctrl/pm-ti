import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REGISTRY_PATH = path.resolve(__dirname, '..', '.bots.json')

const LOG_BUFFER_SIZE = 500
const SIGTERM_GRACE_MS = 5000

const procs = new Map() // slug -> { child, status, exitCode, startedAt }
const logs = new Map()  // slug -> string[] (circular)
let onEvent = () => {}

export function setEventBus(fn) {
  onEvent = fn
}

async function loadRegistry() {
  try {
    const txt = await readFile(REGISTRY_PATH, 'utf8')
    const json = JSON.parse(txt)
    return json.bots && typeof json.bots === 'object' ? json.bots : {}
  } catch {
    return {}
  }
}

async function saveRegistry(bots) {
  const payload = {
    $schema: 'Registry de bots executaveis. Chave = slug do bot no vault. Editar pela UI em /bots.',
    bots,
  }
  await writeFile(REGISTRY_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8')
}

export async function getConfig(slug) {
  const bots = await loadRegistry()
  return bots[slug] || null
}

export async function getAllConfigs() {
  return loadRegistry()
}

export async function setConfig(slug, cfg) {
  const bots = await loadRegistry()
  bots[slug] = cfg
  await saveRegistry(bots)
  return cfg
}

export async function deleteConfig(slug) {
  const bots = await loadRegistry()
  delete bots[slug]
  await saveRegistry(bots)
}

export function getStatus(slug) {
  const p = procs.get(slug)
  if (!p) return { status: 'stopped' }
  return {
    status: p.status,
    pid: p.child?.pid,
    startedAt: p.startedAt,
    exitCode: p.exitCode ?? null,
  }
}

export function getLogs(slug) {
  return logs.get(slug) || []
}

function appendLog(slug, line) {
  if (!logs.has(slug)) logs.set(slug, [])
  const arr = logs.get(slug)
  arr.push(line)
  if (arr.length > LOG_BUFFER_SIZE) arr.splice(0, arr.length - LOG_BUFFER_SIZE)
  onEvent({ type: 'bot:log', slug, line })
}

function emitStatus(slug) {
  onEvent({ type: 'bot:status', slug, ...getStatus(slug) })
}

export async function start(slug) {
  const existing = procs.get(slug)
  if (existing && existing.status === 'running') {
    throw new Error('bot ja esta rodando')
  }
  const cfg = await getConfig(slug)
  if (!cfg) throw new Error('bot sem configuracao — cadastre primeiro')
  if (!cfg.cwd || !existsSync(cfg.cwd)) throw new Error(`cwd nao existe: ${cfg.cwd}`)
  if (!cfg.command || typeof cfg.command !== 'string') throw new Error('command invalido')

  const args = Array.isArray(cfg.args) ? cfg.args.map(String) : []

  const child = spawn(cfg.command, args, {
    cwd: cfg.cwd,
    shell: false,
    windowsHide: true,
    env: { ...process.env, ...(cfg.env || {}) },
  })

  const entry = {
    child,
    status: 'running',
    exitCode: null,
    startedAt: new Date().toISOString(),
  }
  procs.set(slug, entry)
  appendLog(slug, `[runner] spawn pid=${child.pid} cmd="${cfg.command} ${args.join(' ')}" cwd="${cfg.cwd}"`)
  emitStatus(slug)

  child.stdout.on('data', (buf) => {
    for (const line of buf.toString('utf8').split(/\r?\n/)) {
      if (line) appendLog(slug, line)
    }
  })
  child.stderr.on('data', (buf) => {
    for (const line of buf.toString('utf8').split(/\r?\n/)) {
      if (line) appendLog(slug, `[stderr] ${line}`)
    }
  })
  child.on('error', (err) => {
    appendLog(slug, `[runner] erro: ${err.message}`)
    entry.status = 'crashed'
    emitStatus(slug)
  })
  child.on('exit', (code, signal) => {
    entry.exitCode = code
    entry.status = code === 0 || signal === 'SIGTERM' ? 'stopped' : 'crashed'
    appendLog(slug, `[runner] exit code=${code} signal=${signal}`)
    emitStatus(slug)
  })

  return getStatus(slug)
}

export function stop(slug) {
  const entry = procs.get(slug)
  if (!entry || entry.status !== 'running') {
    return { status: entry?.status || 'stopped' }
  }
  const child = entry.child
  appendLog(slug, `[runner] enviando SIGTERM`)
  child.kill('SIGTERM')
  setTimeout(() => {
    if (entry.status === 'running') {
      appendLog(slug, `[runner] processo nao respondeu — SIGKILL`)
      try { child.kill('SIGKILL') } catch {}
    }
  }, SIGTERM_GRACE_MS)
  return getStatus(slug)
}

export function shutdownAll() {
  for (const slug of procs.keys()) {
    try { stop(slug) } catch {}
  }
}
