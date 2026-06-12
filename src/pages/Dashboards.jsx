import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, GitBranch, Search, RefreshCw, Monitor } from 'lucide-react'
import { useDashboards } from '../hooks/useApplications'

export default function Dashboards() {
  const { items, loading, error, refetch } = useDashboards()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    if (!q) return items
    const t = q.toLowerCase()
    return items.filter(
      (d) =>
        d.repo.toLowerCase().includes(t) ||
        d.appName.toLowerCase().includes(t) ||
        (d.label || '').toLowerCase().includes(t),
    )
  }, [items, q])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar dashboard..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button onClick={refetch} className="btn-secondary md:w-auto" title="Re-ler vault">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Carregando dashboards...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          Nenhum dashboard encontrado. Adicione um bloco{' '}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">## GitHub</code> com URL de produção em algum{' '}
          <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">architecture.md</code> do vault.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <DashboardTile key={`${d.appSlug}-${d.repo}`} d={d} />
          ))}
        </div>
      )}
    </div>
  )
}

function DashboardTile({ d }) {
  return (
    <div className="card overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <Link
        to={`/dashboards/${encodeURIComponent(d.appSlug)}/${encodeURIComponent(d.repo)}`}
        className="block relative bg-slate-100 aspect-video group"
      >
        <iframe
          src={d.prodUrl}
          title={d.repo}
          className="w-full h-full pointer-events-none"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
        />
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 bg-white text-slate-900 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow">
            <Monitor size={14} /> Abrir
          </span>
        </div>
      </Link>
      <div className="p-3 flex flex-col gap-1">
        <Link
          to={`/dashboards/${encodeURIComponent(d.appSlug)}/${encodeURIComponent(d.repo)}`}
          className="font-medium text-slate-900 truncate hover:text-brand-700"
          title={d.repo}
        >
          {d.repo}
        </Link>
        <div className="text-xs text-slate-500 truncate">
          {d.label || d.appName}
        </div>
        <div className="flex items-center justify-between mt-1 text-xs">
          <Link
            to={`/aplicacoes/${encodeURIComponent(d.appSlug)}`}
            className="text-slate-500 hover:text-brand-700 truncate"
          >
            {d.appName}
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={d.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-slate-900"
              title="Ver no GitHub"
            >
              <GitBranch size={14} />
            </a>
            <a
              href={d.prodUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-slate-900"
              title="Abrir em nova aba"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
