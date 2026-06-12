import { useMemo, useState } from 'react'
import { Search, RefreshCw, AlertTriangle } from 'lucide-react'
import { useApplications } from '../hooks/useApplications'
import AppCard from '../components/apps/AppCard'

export default function Applications() {
  const { apps, loading, error, refetch } = useApplications()
  const [q, setQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const categories = useMemo(() => {
    const set = new Set(apps.map((a) => a.category))
    return ['all', ...[...set].sort()]
  }, [apps])

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false
      if (
        q &&
        !a.name.toLowerCase().includes(q.toLowerCase()) &&
        !(a.description || '').toLowerCase().includes(q.toLowerCase())
      )
        return false
      return true
    })
  }, [apps, q, categoryFilter])

  const grouped = useMemo(() => {
    const byCat = new Map()
    for (const a of filtered) {
      if (!byCat.has(a.category)) byCat.set(a.category, [])
      byCat.get(a.category).push(a)
    }
    return [...byCat.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt'))
  }, [filtered])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar aplicação..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="input md:w-48"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'Todas as categorias' : c}
            </option>
          ))}
        </select>
        <button onClick={refetch} className="btn-secondary md:w-auto" title="Re-ler vault">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} />
          {error} — verifique se o servidor está rodando.
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Lendo vault...</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          Nenhuma aplicação encontrada. Verifique se{' '}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
            02_PROJECTS/
          </code>{' '}
          existe no vault.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {category}{' '}
                <span className="text-slate-400 font-normal">({items.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((a) => (
                  <AppCard key={a.slug} app={a} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
