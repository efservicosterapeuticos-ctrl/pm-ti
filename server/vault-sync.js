// Watcher do vault Obsidian -> tabela `notes` no Supabase
// Modos:
//   node server/vault-sync.js          -> sync inicial (one-shot)
//   node server/vault-sync.js --watch  -> sync inicial + observa mudanças continuamente

import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import chokidar from 'chokidar'
import matter from 'gray-matter'

const VAULT_PATH = process.env.VAULT_PATH
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!VAULT_PATH)   { console.error('VAULT_PATH ausente no .env'); process.exit(1) }
if (!SUPABASE_URL) { console.error('VITE_SUPABASE_URL ausente no .env'); process.exit(1) }
if (!SERVICE_KEY || SERVICE_KEY === 'COLE_AQUI') {
  console.error('SUPABASE_SERVICE_ROLE_KEY ausente. Pegue em: Supabase > Settings > API > service_role')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const isWatch = process.argv.includes('--watch')

// Pastas/arquivos a ignorar
const IGNORE = [
  '**/.git/**',
  '**/.obsidian/**',
  '**/.trash/**',
  '**/node_modules/**',
]

// Normaliza caminho para POSIX (path do vault na tabela usa /)
function toPosix(p) {
  return p.split(path.sep).join('/')
}

// Converte caminho absoluto -> caminho relativo ao vault
function relPath(absPath) {
  return toPosix(path.relative(VAULT_PATH, absPath))
}

async function lerNota(absPath) {
  const rel = relPath(absPath)
  const folder = toPosix(path.dirname(rel))
  const filename = path.basename(rel)
  const raw = await fs.readFile(absPath, 'utf8')
  const stat = await fs.stat(absPath)

  let frontmatter = {}
  let content = raw
  try {
    const parsed = matter(raw)
    frontmatter = parsed.data || {}
    content = parsed.content
  } catch {
    // se o YAML der pau, manda o markdown inteiro como conteudo
  }

  return {
    path: rel,
    folder: folder === '.' ? '' : folder,
    filename,
    content,
    frontmatter,
    size_bytes: stat.size,
  }
}

async function upsertOne(absPath) {
  try {
    const nota = await lerNota(absPath)
    const { error } = await supabase
      .from('notes')
      .upsert(nota, { onConflict: 'path' })
    if (error) {
      console.error(`✗ upsert falhou: ${nota.path} -> ${error.message}`)
    } else {
      console.log(`✓ ${nota.path} (${nota.size_bytes}B)`)
    }
  } catch (e) {
    console.error(`✗ erro ao processar ${absPath}: ${e.message}`)
  }
}

async function deleteOne(absPath) {
  const rel = relPath(absPath)
  const { error } = await supabase.from('notes').delete().eq('path', rel)
  if (error) console.error(`✗ delete falhou: ${rel} -> ${error.message}`)
  else console.log(`✗ removido: ${rel}`)
}

// Lista recursivamente todos .md do vault (ignorando padrões)
async function listMdFiles(dir, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      // ignora pastas blacklisted
      const lower = e.name.toLowerCase()
      if (lower === '.git' || lower === '.obsidian' || lower === '.trash' || lower === 'node_modules') continue
      await listMdFiles(full, acc)
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) {
      acc.push(full)
    }
  }
  return acc
}

async function syncInicial() {
  console.log(`\n📂 Vault: ${VAULT_PATH}`)
  console.log(`☁  Supabase: ${SUPABASE_URL}\n`)

  console.log('🔎 Procurando arquivos .md...')
  const arquivos = await listMdFiles(VAULT_PATH)
  console.log(`   ${arquivos.length} notas encontradas\n`)

  console.log('⬆  Subindo (upsert por path)...')
  const inicio = Date.now()
  let okCount = 0
  for (const f of arquivos) {
    try {
      const nota = await lerNota(f)
      const { error } = await supabase.from('notes').upsert(nota, { onConflict: 'path' })
      if (error) console.error(`✗ ${nota.path} -> ${error.message}`)
      else { okCount++; if (okCount % 10 === 0) console.log(`   ${okCount}/${arquivos.length}`) }
    } catch (e) {
      console.error(`✗ ${f} -> ${e.message}`)
    }
  }
  const segs = ((Date.now() - inicio) / 1000).toFixed(1)
  console.log(`\n✅ ${okCount}/${arquivos.length} notas sincronizadas em ${segs}s`)
}

async function startWatcher() {
  console.log(`\n👀 Watcher ativo em: ${VAULT_PATH}`)
  console.log('   (Ctrl+C pra parar)\n')

  const watcher = chokidar.watch(`${VAULT_PATH}/**/*.md`, {
    ignored: IGNORE,
    ignoreInitial: true, // já fizemos sync inicial
    awaitWriteFinish: {
      stabilityThreshold: 400, // espera 400ms sem mudanças antes de processar
      pollInterval: 100,
    },
  })

  watcher
    .on('add',    (p) => { console.log(`+ add ${relPath(p)}`); upsertOne(p) })
    .on('change', (p) => { console.log(`~ change ${relPath(p)}`); upsertOne(p) })
    .on('unlink', (p) => { console.log(`- unlink ${relPath(p)}`); deleteOne(p) })
    .on('error',  (e) => console.error(`watcher error: ${e.message}`))
}

async function main() {
  await syncInicial()
  if (isWatch) await startWatcher()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
