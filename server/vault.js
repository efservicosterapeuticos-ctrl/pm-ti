import { promises as fs } from 'node:fs'
import path from 'node:path'
import { classifyCategory } from './category.js'

export const VAULT_DIR =
  process.env.VAULT_DIR || 'C:/Users/grupo/Desktop/Claudio_brain/Claudio'
export const PROJECTS_DIR = path.join(VAULT_DIR, '02_PROJECTS')

const FILE_KINDS = {
  readme: /^README(\.md)?\.md$/i,
  architecture: /^architecture(\.md)?\.md$/i,
  tasks: /^tasks(\.md)?\.md$/i,
  decisions: /^decisions(\.md)?\.md$/i,
  bugs: /^bugs(\.md)?\.md$/i,
  context: /^context(\.md)?\.md$/i,
  logs: /^logs(\.md)?\.md$/i,
}

const CONFLICT_FILE_RE = / \d+ \d+\.md$/i

export async function listApps() {
  let entries
  try {
    entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true })
  } catch {
    return []
  }
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name)
  const apps = await Promise.all(folders.map((slug) => readApp(slug, { full: false })))
  return apps.filter(Boolean)
}

export async function getApp(slug) {
  return readApp(slug, { full: true })
}

async function readApp(slug, { full }) {
  const dir = path.join(PROJECTS_DIR, slug)
  let files
  try {
    files = (await fs.readdir(dir)).filter((f) => !CONFLICT_FILE_RE.test(f))
  } catch {
    return null
  }

  const fileMap = {}
  for (const [kind, re] of Object.entries(FILE_KINDS)) {
    const match = files.find((f) => re.test(f))
    if (match) fileMap[kind] = match
  }

  const loaded = {}
  for (const [kind, name] of Object.entries(fileMap)) {
    const fp = path.join(dir, name)
    const content = await fs.readFile(fp, 'utf-8')
    const stat = await fs.stat(fp)
    loaded[kind] = { file: name, path: fp, content, mtime: stat.mtimeMs }
  }

  const components = extractStack(loaded.readme?.content, loaded.architecture?.content)
  const todos = extractTodos(loaded.tasks?.content || '', loaded.tasks?.file)
  const description = extractFirstParagraph(loaded.readme?.content || '')
  const status = extractStatus(loaded.readme?.content || '')
  const allContent = Object.values(loaded).map((f) => f.content).join('\n')
  const links = extractLinks(allContent)
  const related = extractWikiLinks(allContent)
  const githubRepos = extractGithubBlock(
    loaded.architecture?.content,
    loaded.readme?.content,
  )
  const lastUpdated = Math.max(...Object.values(loaded).map((f) => f.mtime), 0)

  const app = {
    slug,
    name: slug.replace(/_/g, ' ').replace(/-/g, ' '),
    description,
    status,
    components,
    todos,
    todoCounts: {
      pending: todos.filter((t) => !t.done).length,
      done: todos.filter((t) => t.done).length,
    },
    links,
    related,
    githubRepos,
    lastUpdated,
    files: Object.fromEntries(
      Object.entries(loaded).map(([k, v]) => [
        k,
        full
          ? { file: v.file, content: v.content, mtime: v.mtime }
          : { file: v.file, mtime: v.mtime },
      ]),
    ),
  }
  app.category = classifyCategory(app)
  return app
}

function extractStack(...sources) {
  for (const md of sources) {
    if (!md) continue
    const m = md.match(/##\s+Stack\s*\n+([\s\S]*?)(?=\n##\s|\n#\s|$)/i)
    if (!m) continue
    const rows = parseStackBlock(m[1])
    if (rows.length) return rows
  }
  return []
}

function parseStackBlock(block) {
  // Formato 1: tabela markdown | Layer | Tech |
  const table = []
  const tableRe = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm
  let m
  while ((m = tableRe.exec(block)) !== null) {
    const layer = m[1].trim()
    const tech = m[2].trim()
    if (/^[-:]+$/.test(layer) || /^Camada$/i.test(layer) || !layer) continue
    table.push({ layer, technology: tech })
  }
  if (table.length) return table

  // Formato 2: bullets key-value "- **Layer:** Tech"
  const kv = []
  const kvRe = /^\s*-\s+\*\*([^*]+?)\*\*:?\s*(.+?)\s*$/gm
  while ((m = kvRe.exec(block)) !== null) {
    kv.push({ layer: m[1].trim().replace(/:$/, ''), technology: m[2].trim() })
  }
  if (kv.length) return kv

  // Formato 3: bullets simples "- Tech"
  const plain = []
  const plainRe = /^\s*-\s+(?!\*\*)([^\n]+?)\s*$/gm
  while ((m = plainRe.exec(block)) !== null) {
    plain.push({ layer: '—', technology: m[1].trim() })
  }
  return plain
}

function extractTodos(md, file) {
  if (!md) return []
  const todos = []
  let currentSection = null
  md.split('\n').forEach((line, idx) => {
    const heading = line.match(/^##\s+(.+?)\s*$/)
    if (heading) {
      currentSection = heading[1].trim()
      return
    }
    const checkbox = line.match(/^\s*-\s*\[([ xX])\]\s+(.+?)\s*$/)
    if (checkbox) {
      todos.push({
        file,
        line: idx + 1,
        done: checkbox[1].toLowerCase() === 'x',
        text: checkbox[2],
        section: currentSection,
        kind: 'checkbox',
      })
      return
    }
    const bullet = line.match(/^\s*-\s+(?!\[)(.+?)\s*$/)
    if (bullet && currentSection && /pendente/i.test(currentSection)) {
      todos.push({
        file,
        line: idx + 1,
        done: false,
        text: bullet[1],
        section: currentSection,
        kind: 'plain',
      })
    }
  })
  return todos
}

function extractFirstParagraph(md) {
  if (!md) return null
  const noTitle = md.replace(/^#\s+.*\n+/, '')
  const para = noTitle.split(/\n\n/)[0] || ''
  return para.replace(/\n/g, ' ').trim().slice(0, 280) || null
}

function extractStatus(md) {
  if (!md) return null
  const m = md.match(/##\s+Status\s*\n+\s*([^\n]+)/i)
  return m ? m[1].trim() : null
}

function extractLinks(content) {
  if (!content) return []
  const urls = new Set()
  const re = /(https?:\/\/[^\s)\]>"']+)/g
  let m
  while ((m = re.exec(content)) !== null) urls.add(m[1].replace(/[.,;]+$/, ''))
  return [...urls].map((url) => ({ url, kind: classifyLinkKind(url) }))
}

function classifyLinkKind(url) {
  if (url.includes('github.com')) return 'repo'
  if (url.includes('github.io')) return 'prod'
  if (url.includes('supabase.co')) return 'database'
  if (url.includes('docs.google.com')) return 'sheet'
  if (url.includes('vercel.app') || url.includes('netlify.app')) return 'prod'
  return 'other'
}

function extractWikiLinks(content) {
  const set = new Set()
  const re = /\[\[([^\]\n|]+?)(?:\|[^\]]+)?\]\]/g
  let m
  while ((m = re.exec(content)) !== null) set.add(m[1].trim())
  return [...set]
}

// Extrai repos do bloco "## GitHub" — fonte autoritativa do que pertence ao app.
// Suporta dois formatos:
//   1. Tabela markdown:  | [repo-name](https://github.com/owner/repo-name) | url-prod | ... |
//   2. Lista key-value:  - **Repositório:** [owner/repo](https://github.com/owner/repo)
// Retorna [{ name, htmlUrl, prodUrl, description }]
function extractGithubBlock(...sources) {
  for (const md of sources) {
    if (!md) continue
    const m = md.match(/##\s+GitHub[^\n]*\n([\s\S]*?)(?=\n##\s|\n#\s|$)/i)
    if (!m) continue
    const block = m[1]
    const found = []
    const seen = new Set()

    // 1. links github.com/<owner>/<repo> em qualquer formato
    const linkRe = /\[([^\]]+)\]\(https?:\/\/github\.com\/([^/]+)\/([^/)#?]+)\)/g
    let r
    while ((r = linkRe.exec(block)) !== null) {
      const repoName = r[3].replace(/\.git$/, '')
      if (seen.has(repoName)) continue
      seen.add(repoName)
      found.push({
        name: repoName,
        owner: r[2],
        htmlUrl: `https://github.com/${r[2]}/${repoName}`,
        label: r[1],
      })
    }

    // 2. Pra cada repo, tenta achar a URL de produção no mesmo bloco
    for (const entry of found) {
      const prodRe = new RegExp(`https?://[^\\s)\\]"']*?${escapeRegex(entry.name)}[^\\s)\\]"']*`, 'g')
      let p
      let prodUrl = null
      while ((p = prodRe.exec(block)) !== null) {
        const url = p[0].replace(/[.,;]+$/, '')
        if (url.includes('github.io') || url.includes('vercel.app') || url.includes('netlify.app')) {
          prodUrl = url
          break
        }
      }
      entry.prodUrl = prodUrl
    }

    if (found.length) return found
  }
  return []
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function toggleTodo(slug, file, lineNumber, done) {
  const safeSlug = path.basename(slug)
  const safeFile = path.basename(file)
  const fp = path.join(PROJECTS_DIR, safeSlug, safeFile)
  const content = await fs.readFile(fp, 'utf-8')
  const lines = content.split('\n')
  const i = lineNumber - 1
  if (i < 0 || i >= lines.length) throw new Error('linha fora do arquivo')
  const original = lines[i]
  const newChar = done ? 'x' : ' '
  const newLine = original.replace(/^(\s*-\s*\[)([ xX])(\])/, `$1${newChar}$3`)
  if (newLine === original) throw new Error('linha nao e um checkbox')
  lines[i] = newLine
  await fs.writeFile(fp, lines.join('\n'), 'utf-8')
  return { ok: true }
}
