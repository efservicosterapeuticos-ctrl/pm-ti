import 'dotenv/config'
import express from 'express'
import { WebSocketServer } from 'ws'
import chokidar from 'chokidar'
import { createServer } from 'node:http'
import path from 'node:path'
import {
  listApps,
  getApp,
  toggleTodo,
  PROJECTS_DIR,
  VAULT_DIR,
} from './vault.js'
import {
  inferRepoFromApp,
  repoMeta,
  repoCommits,
  repoPagesStatus,
} from './github.js'
import * as runner from './runner.js'

const PORT = Number(process.env.PORT) || 3001

const app = express()
app.use(express.json())

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, vault: VAULT_DIR, projectsDir: PROJECTS_DIR }),
)

app.get('/api/apps', async (_req, res) => {
  try {
    const apps = await listApps()
    apps.sort((a, b) => a.name.localeCompare(b.name, 'pt'))
    res.json(apps)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/apps/:slug', async (req, res) => {
  try {
    const data = await getApp(req.params.slug)
    if (!data) return res.status(404).json({ error: 'app não encontrada' })
    res.json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.patch('/api/apps/:slug/todos', async (req, res) => {
  try {
    const { file, line, done } = req.body || {}
    if (typeof file !== 'string' || typeof line !== 'number' || typeof done !== 'boolean') {
      return res.status(400).json({ error: 'payload inválido' })
    }
    await toggleTodo(req.params.slug, file, line, done)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

function classifyBotFunction(app) {
  const s = `${app.slug} ${app.name} ${app.description || ''}`.toLowerCase()
  const techs = (app.components || []).map((c) => c.technology.toLowerCase()).join(' ')
  if (/isis|gemini|assistente|sdr|atendimento consultivo/.test(s)) return 'Atendimento (IA)'
  if (/sync|integração|integracao|asaas|contaazul|webhook entre/.test(s)) return 'Sincronização'
  if (/ligação|ligacao|discagem|cockpit|call|wavoip/.test(s + ' ' + techs)) return 'Discagem'
  if (/massa|bulk|envio|enviar-audio|broadcast/.test(s)) return 'Envio em massa'
  if (/whatsapp/.test(s + ' ' + techs)) return 'Atendimento WhatsApp'
  return 'Bot'
}

function isBot(app) {
  const s = `${app.slug} ${app.name}`.toLowerCase()
  const desc = (app.description || '').toLowerCase()
  const techs = (app.components || []).map((c) => c.technology.toLowerCase()).join(' ')
  if (/dashboard|gerenciador|tarefas|kanban/.test(s)) return false // exclui dashboards/CRUD
  return (
    /bot|whatsapp|liga|call|sync|isis|cockpit/.test(s) ||
    /whatsapp-web|wavoip|gemini|asaas|contaazul/.test(techs) ||
    /whatsapp|telegram|automação|automacao|integração|integracao/.test(desc)
  )
}

function inferRunInstructions(app) {
  // Procura blocos de código no README e architecture que tenham 'node ', 'npm run', '.exe', '.bat'
  const sources = [app.files?.readme?.content, app.files?.architecture?.content].filter(Boolean)
  const cmds = []
  for (const md of sources) {
    const blocks = md.match(/```(?:[a-z]*\n)?([\s\S]*?)```/g) || []
    for (const b of blocks) {
      const inner = b.replace(/```[a-z]*\n?/, '').replace(/```$/, '').trim()
      if (/\b(node|npm|npx|electron|\.bat|\.exe|python|pip|cargo)\b/i.test(inner) && inner.length < 400) {
        cmds.push(inner)
        if (cmds.length >= 3) break
      }
    }
    if (cmds.length >= 3) break
  }
  return cmds
}

app.get('/api/bots', async (_req, res) => {
  try {
    const apps = await listApps()
    const configs = await runner.getAllConfigs()
    const bots = []
    for (const slim of apps.filter(isBot)) {
      const full = await getApp(slim.slug)
      bots.push({
        slug: full.slug,
        name: full.name,
        description: full.description,
        status: full.status,
        category: full.category,
        botFunction: classifyBotFunction(full),
        components: full.components.slice(0, 5),
        runInstructions: inferRunInstructions(full),
        related: full.related,
        lastUpdated: full.lastUpdated,
        githubRepos: full.githubRepos,
        config: configs[full.slug] || null,
        runtime: runner.getStatus(full.slug),
      })
    }
    bots.sort((a, b) => a.botFunction.localeCompare(b.botFunction, 'pt'))
    res.json(bots)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const SHELL_BLOCKLIST = new Set([
  'cmd', 'cmd.exe',
  'powershell', 'powershell.exe',
  'pwsh', 'pwsh.exe',
  'bash', 'bash.exe',
  'sh', 'sh.exe',
  'wscript', 'wscript.exe',
  'cscript', 'cscript.exe',
])

const SYSTEM_DIRS = [
  'C:\\Windows',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\ProgramData',
]

function validateBotConfig(cfg) {
  if (!cfg || typeof cfg !== 'object') throw new Error('config deve ser objeto')
  if (typeof cfg.cwd !== 'string' || !cfg.cwd.trim()) throw new Error('cwd obrigatorio')
  if (typeof cfg.command !== 'string' || !cfg.command.trim()) throw new Error('command obrigatorio')
  if (cfg.args != null && !Array.isArray(cfg.args)) throw new Error('args deve ser array')
  if (cfg.args && cfg.args.some((a) => typeof a !== 'string')) throw new Error('args devem ser strings')

  const cmdBase = path.basename(cfg.command).toLowerCase()
  if (SHELL_BLOCKLIST.has(cmdBase)) {
    throw new Error(`shell "${cmdBase}" nao permitido — chame node/python/.exe diretamente`)
  }

  if (/[;&|`$()<>]/.test(cfg.command)) {
    throw new Error('command contem metacaracteres de shell — passe argumentos via args[]')
  }

  const cwdNorm = path.resolve(cfg.cwd)
  for (const sys of SYSTEM_DIRS) {
    if (cwdNorm.toLowerCase().startsWith(sys.toLowerCase())) {
      throw new Error(`cwd em diretorio de sistema nao permitido: ${sys}`)
    }
  }
  if (cwdNorm.length <= 3) {
    throw new Error('cwd nao pode ser raiz de drive')
  }

  return { cwd: cwdNorm, command: cfg.command, args: cfg.args || [], env: cfg.env || undefined }
}

app.get('/api/bots/:slug/config', async (req, res) => {
  try {
    const cfg = await runner.getConfig(req.params.slug)
    res.json(cfg || {})
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/bots/:slug/config', async (req, res) => {
  try {
    const cfg = validateBotConfig(req.body)
    const saved = await runner.setConfig(req.params.slug, cfg)
    res.json(saved)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.delete('/api/bots/:slug/config', async (req, res) => {
  try {
    await runner.deleteConfig(req.params.slug)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/bots/:slug/start', async (req, res) => {
  try {
    const status = await runner.start(req.params.slug)
    res.json(status)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.post('/api/bots/:slug/stop', (req, res) => {
  try {
    const status = runner.stop(req.params.slug)
    res.json(status)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.get('/api/bots/:slug/status', (req, res) => {
  res.json({
    ...runner.getStatus(req.params.slug),
    logs: runner.getLogs(req.params.slug),
  })
})

app.get('/api/dashboards', async (_req, res) => {
  try {
    const apps = await listApps()
    const tiles = []
    for (const a of apps) {
      const repos = a.githubRepos || []
      // Só conta como dashboard se tem URL de produção (github.io/vercel/netlify)
      for (const r of repos.filter((x) => x.prodUrl)) {
        tiles.push({
          appSlug: a.slug,
          appName: a.name,
          repo: r.name,
          repoUrl: r.htmlUrl,
          prodUrl: r.prodUrl,
          label: r.label,
          appCategory: a.category,
          lastUpdated: a.lastUpdated,
        })
      }
    }
    tiles.sort((a, b) => a.repo.localeCompare(b.repo, 'pt'))
    res.json(tiles)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/apps/:slug/github', async (req, res) => {
  try {
    const app = await getApp(req.params.slug)
    if (!app) return res.status(404).json({ error: 'app não encontrada' })
    const repos = app.githubRepos || []
    if (repos.length === 0) {
      return res.json({ repos: [], reason: 'app sem bloco "## GitHub" no architecture.md' })
    }
    // Suporta ?repo=<name> pra filtrar quando app tem múltiplos
    const filter = req.query.repo
    const targets = filter ? repos.filter((r) => r.name === filter) : repos
    const wanted = targets[0]
    if (!wanted) return res.status(404).json({ error: `repo "${filter}" não pertence à app` })
    const repo = wanted.name

    const [meta, commits, pages] = await Promise.allSettled([
      repoMeta(repo),
      repoCommits(repo, 10),
      repoPagesStatus(repo),
    ])

    const payload = {
      repo,
      owner: process.env.GITHUB_OWNER || 'efservicosterapeuticos-ctrl',
      availableRepos: repos.map((r) => ({ name: r.name, prodUrl: r.prodUrl })),
    }
    if (meta.status === 'fulfilled') {
      payload.meta = {
        name: meta.value.name,
        description: meta.value.description,
        defaultBranch: meta.value.default_branch,
        pushedAt: meta.value.pushed_at,
        updatedAt: meta.value.updated_at,
        homepage: meta.value.homepage,
        htmlUrl: meta.value.html_url,
        language: meta.value.language,
        openIssues: meta.value.open_issues_count,
        size: meta.value.size,
      }
    } else {
      payload.metaError = meta.reason.message
    }
    if (commits.status === 'fulfilled') {
      payload.commits = commits.value.map((c) => ({
        sha: c.sha,
        shortSha: c.sha.slice(0, 7),
        message: (c.commit.message || '').split('\n')[0].slice(0, 140),
        author: c.commit.author?.name,
        date: c.commit.author?.date,
        url: c.html_url,
      }))
    } else {
      payload.commitsError = commits.reason.message
    }
    if (pages.status === 'fulfilled' && pages.value) {
      payload.pages = {
        url: pages.value.html_url,
        status: pages.value.status,
        cname: pages.value.cname,
      }
    }
    res.json(payload)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

const httpServer = createServer(app)
const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

function broadcast(msg) {
  const str = JSON.stringify(msg)
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(str)
  }
}

runner.setEventBus(broadcast)

process.on('SIGINT', () => { runner.shutdownAll(); process.exit(0) })
process.on('SIGTERM', () => { runner.shutdownAll(); process.exit(0) })

const watcher = chokidar.watch(PROJECTS_DIR, {
  ignored: /(^|[\\/])\.|\.swp$/,
  awaitWriteFinish: { stabilityThreshold: 250, pollInterval: 50 },
  ignoreInitial: true,
})

let timer
watcher.on('all', (event, filePath) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    const rel = path.relative(PROJECTS_DIR, filePath)
    const slug = rel.split(/[\\/]/)[0]
    broadcast({ type: 'apps:changed', slug, event })
  }, 200)
})

httpServer.listen(PORT, () => {
  console.log(`[pm-ti server] http://localhost:${PORT}  vault=${VAULT_DIR}`)
})
