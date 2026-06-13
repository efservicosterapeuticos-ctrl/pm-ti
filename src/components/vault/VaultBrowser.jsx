import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText, Search, LogOut, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function VaultBrowser({ session }) {
  const [notes, setNotes]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selected, setSelected] = useState(null) // path da nota aberta
  const [openFolders, setOpenFolders] = useState(() => new Set(['']))
  const [q, setQ]               = useState('')

  const fetchNotes = async () => {
    setLoading(true); setError(null)
    const { data, error } = await supabase
      .from('notes')
      .select('id, path, folder, filename, size_bytes, updated_at')
      .order('path', { ascending: true })
    if (error) setError(error.message)
    else setNotes(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchNotes() }, [])

  const tree = useMemo(() => buildTree(notes), [notes])

  const filtered = useMemo(() => {
    if (!q) return notes
    const t = q.toLowerCase()
    return notes.filter((n) => n.path.toLowerCase().includes(t))
  }, [notes, q])

  const toggleFolder = (folder) => {
    setOpenFolders((cur) => {
      const next = new Set(cur)
      if (next.has(folder)) next.delete(folder)
      else next.add(folder)
      return next
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      <aside className="card overflow-hidden flex flex-col" style={{ maxHeight: '78vh' }}>
        <div className="p-3 border-b border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-8 text-sm py-1.5"
                placeholder="Buscar notas..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button onClick={fetchNotes} className="btn-ghost p-1.5" title="Recarregar">
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{notes.length} notas</span>
            <button onClick={signOut} className="inline-flex items-center gap-1 hover:text-rose-600">
              <LogOut size={11} /> sair
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <div className="text-sm text-slate-400 italic p-3">Carregando notas...</div>
          ) : error ? (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded p-2">
              {error}
            </div>
          ) : q ? (
            // modo busca: lista flat
            <ul className="space-y-0.5">
              {filtered.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => setSelected(n.path)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-start gap-1.5 ${
                      selected === n.path ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <FileText size={11} className="shrink-0 mt-0.5 text-slate-400" />
                    <span className="truncate">{n.path}</span>
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="text-xs text-slate-400 italic px-2 py-3">Nada encontrado</li>
              )}
            </ul>
          ) : (
            <TreeView
              tree={tree}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              selected={selected}
              onSelect={setSelected}
            />
          )}
        </div>
      </aside>

      <main className="card p-5 overflow-y-auto" style={{ maxHeight: '78vh' }}>
        {!selected ? (
          <EmptyState totalNotas={notes.length} email={session?.user?.email} />
        ) : (
          <NoteViewer path={selected} />
        )}
      </main>
    </div>
  )
}

// ===== Tree =====
function buildTree(notes) {
  const root = { name: '', folders: new Map(), files: [] }
  for (const n of notes) {
    const parts = n.folder ? n.folder.split('/') : []
    let cur = root
    for (const part of parts) {
      if (!cur.folders.has(part)) {
        cur.folders.set(part, { name: part, folders: new Map(), files: [] })
      }
      cur = cur.folders.get(part)
    }
    cur.files.push(n)
  }
  return root
}

function TreeView({ tree, openFolders, toggleFolder, selected, onSelect, depth = 0, parent = '' }) {
  return (
    <ul className={depth === 0 ? '' : 'ml-3 border-l border-slate-100 pl-2'}>
      {/* folders */}
      {[...tree.folders.entries()].sort(([a],[b]) => a.localeCompare(b, 'pt')).map(([name, sub]) => {
        const fullPath = parent ? `${parent}/${name}` : name
        const open = openFolders.has(fullPath)
        return (
          <li key={fullPath}>
            <button
              onClick={() => toggleFolder(fullPath)}
              className="w-full text-left text-xs px-1.5 py-1 rounded flex items-center gap-1 hover:bg-slate-50 text-slate-700"
            >
              {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
              <Folder size={11} className="text-amber-500" />
              <span className="font-medium">{name}</span>
              <span className="text-slate-400 text-[10px] ml-1">{sub.files.length + sub.folders.size}</span>
            </button>
            {open && (
              <TreeView
                tree={sub}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
                selected={selected}
                onSelect={onSelect}
                depth={depth + 1}
                parent={fullPath}
              />
            )}
          </li>
        )
      })}
      {/* files */}
      {tree.files.sort((a, b) => a.filename.localeCompare(b.filename, 'pt')).map((n) => (
        <li key={n.id}>
          <button
            onClick={() => onSelect(n.path)}
            className={`w-full text-left text-xs px-1.5 py-1 rounded flex items-center gap-1.5 ${
              selected === n.path ? 'bg-brand-50 text-brand-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <FileText size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{n.filename}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

// ===== Viewer =====
function NoteViewer({ path }) {
  const [note, setNote]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true); setError(null); setNote(null)
    supabase.from('notes').select('*').eq('path', path).single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setNote(data)
      })
      .finally(() => setLoading(false))
  }, [path])

  if (loading) return <div className="text-sm text-slate-400 italic">Lendo nota...</div>
  if (error)   return <div className="text-sm text-rose-700">{error}</div>
  if (!note)   return null

  const tamanhoKb = (note.size_bytes / 1024).toFixed(1)
  const atualizadoEm = new Date(note.updated_at).toLocaleString('pt-BR')

  return (
    <div>
      <div className="border-b border-slate-100 pb-3 mb-4">
        <div className="text-xs text-slate-500 font-mono">{note.path}</div>
        <h1 className="text-xl font-bold text-slate-900 mt-1">{note.filename}</h1>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
          <span>{tamanhoKb} kB</span>
          <span>atualizado {atualizadoEm}</span>
        </div>
      </div>

      {Object.keys(note.frontmatter || {}).length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">Front matter</div>
          <pre className="text-[11px] text-slate-700 whitespace-pre-wrap font-mono">
{JSON.stringify(note.frontmatter, null, 2)}
          </pre>
        </div>
      )}

      <pre className="text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
        {note.content}
      </pre>
    </div>
  )
}

function EmptyState({ totalNotas, email }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16">
      <div className="rounded-full bg-brand-50 p-4 mb-4">
        <Folder size={28} className="text-brand-600" />
      </div>
      <h3 className="font-semibold text-slate-900 mb-1">Selecione uma nota</h3>
      <p className="text-sm text-slate-500 max-w-md">
        {totalNotas > 0
          ? `${totalNotas} notas sincronizadas. Use a árvore à esquerda ou a busca pra abrir uma.`
          : 'Nenhuma nota ainda. Rode `npm run vault:sync` no terminal pra subir o vault.'}
      </p>
      {email && (
        <p className="text-[11px] text-slate-400 mt-6">logado como {email}</p>
      )}
    </div>
  )
}
