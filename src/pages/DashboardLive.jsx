import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, GitBranch, RefreshCw, Maximize2 } from 'lucide-react'
import { useDashboards, useAppGithub } from '../hooks/useApplications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DashboardLive() {
  const { slug, repo } = useParams()
  const { items } = useDashboards()
  const { data: gh } = useAppGithub(slug, repo)
  const [reloadKey, setReloadKey] = useState(0)

  const tile = items.find((d) => d.appSlug === slug && d.repo === repo)

  if (!tile)
    return (
      <div className="text-center py-12 text-slate-500">
        Dashboard não encontrado.{' '}
        <Link to="/dashboards" className="text-brand-700 underline">
          Voltar
        </Link>
      </div>
    )

  const lastPush = gh?.meta?.pushedAt
  const lastPushAgo = lastPush
    ? formatDistanceToNow(new Date(lastPush), { addSuffix: true, locale: ptBR })
    : null

  return (
    <div className="h-full flex flex-col -m-4 md:-m-6">
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center gap-3 flex-wrap shrink-0">
        <Link
          to="/dashboards"
          className="text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Voltar
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm md:text-base font-semibold text-slate-900 truncate">
            {tile.repo}
          </h1>
          <p className="text-xs text-slate-500 truncate">
            {tile.label} · em <Link to={`/aplicacoes/${slug}`} className="hover:text-brand-700">{tile.appName}</Link>
            {lastPushAgo && (
              <>
                {' · último push '}
                <span className="text-slate-700">{lastPushAgo}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="btn-ghost"
            title="Recarregar iframe"
          >
            <RefreshCw size={16} />
          </button>
          <a
            href={tile.repoUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
            title="GitHub"
          >
            <GitBranch size={16} />
          </a>
          <a
            href={tile.prodUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            title="Abrir em nova aba"
          >
            <ExternalLink size={14} /> Tela cheia
          </a>
        </div>
      </div>

      <iframe
        key={reloadKey}
        src={tile.prodUrl}
        title={tile.repo}
        className="flex-1 w-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  )
}
