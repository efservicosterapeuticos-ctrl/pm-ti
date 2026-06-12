import { Link } from 'react-router-dom'
import { ExternalLink, CheckSquare, Square, Layers, GitBranch } from 'lucide-react'

const KIND_LABEL = {
  repo: 'Repositório',
  prod: 'Produção',
  database: 'Banco',
  sheet: 'Planilha',
  other: 'Link',
}

export default function AppCard({ app }) {
  const stack = app.components.slice(0, 4).map((c) => c.technology).join(' · ')
  const primaryLink = app.links.find((l) => l.kind === 'prod') ?? app.links[0]

  return (
    <Link
      to={`/aplicacoes/${encodeURIComponent(app.slug)}`}
      className="card p-4 hover:shadow-md transition-shadow flex flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{app.name}</h3>
          {app.status && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{app.status}</p>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
          {app.category}
        </span>
      </div>

      {app.description && (
        <p className="text-sm text-slate-600 line-clamp-2">{app.description}</p>
      )}

      {stack && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Layers size={12} className="shrink-0" />
          <span className="truncate">{stack}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1" title="Pendentes / feitos">
            <Square size={12} />
            {app.todoCounts.pending}
            <span className="text-slate-300">/</span>
            <CheckSquare size={12} />
            {app.todoCounts.done}
          </span>
          {app.related.length > 0 && (
            <span className="flex items-center gap-1" title="Apps relacionadas">
              <GitBranch size={12} />
              {app.related.length}
            </span>
          )}
        </div>
        {primaryLink && (
          <span
            className="flex items-center gap-1 text-xs text-brand-700 truncate max-w-[60%]"
            title={primaryLink.url}
          >
            <ExternalLink size={12} />
            {KIND_LABEL[primaryLink.kind] ?? 'Link'}
          </span>
        )}
      </div>
    </Link>
  )
}
