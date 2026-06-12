import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  ExternalLink,
  Layers,
  ListChecks,
  FileText,
  GitBranch,
  Monitor,
  RefreshCw,
} from 'lucide-react'
import { useApplication, useAppGithub } from '../hooks/useApplications'
import { api } from '../lib/api'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ApplicationDetail() {
  const { slug } = useParams()
  const { app, loading, error, refetch } = useApplication(slug)
  const [tab, setTab] = useState('overview')

  const tabs = useMemo(() => {
    const base = [
      { id: 'overview', label: 'Visão geral', icon: FileText },
      { id: 'components', label: 'Componentes', icon: Layers },
      { id: 'todos', label: 'TODOs', icon: ListChecks },
    ]
    if (app?.githubRepos?.some((r) => r.prodUrl)) base.push({ id: 'live', label: 'Live', icon: Monitor })
    if (app?.githubRepos?.length) base.push({ id: 'github', label: 'GitHub', icon: GitBranch })
    base.push({ id: 'related', label: 'Relacionados', icon: GitBranch })
    base.push({ id: 'raw', label: 'Markdown', icon: FileText })
    return base
  }, [app])

  if (loading) return <div className="text-center py-12 text-slate-500">Carregando...</div>
  if (error)
    return (
      <div className="max-w-3xl mx-auto p-4 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
        {error}
      </div>
    )
  if (!app) return <div className="text-center py-12 text-slate-500">App não encontrada</div>

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/aplicacoes" className="text-sm text-slate-500 hover:text-slate-700 inline-flex items-center gap-1 mb-3">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <header className="mb-5">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-slate-900">{app.name}</h1>
          <span className="text-xs uppercase tracking-wider px-2 py-1 rounded-full bg-slate-100 text-slate-600">
            {app.category}
          </span>
        </div>
        {app.status && <p className="text-sm text-slate-600 mt-1">{app.status}</p>}
        {app.description && <p className="text-slate-700 mt-3">{app.description}</p>}

        {app.links.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {app.links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary text-xs"
              >
                <ExternalLink size={12} /> {l.kind === 'other' ? l.url.replace(/^https?:\/\//, '').slice(0, 30) : l.kind}
              </a>
            ))}
          </div>
        )}
      </header>

      <nav className="flex gap-1 border-b border-slate-200 overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 mb-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              tab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && <Overview app={app} />}
      {tab === 'components' && <Components app={app} />}
      {tab === 'todos' && <Todos app={app} onChanged={refetch} />}
      {tab === 'live' && <Live app={app} />}
      {tab === 'github' && <GitBranchTab app={app} />}
      {tab === 'related' && <Related app={app} />}
      {tab === 'raw' && <Raw app={app} />}
    </div>
  )
}

function Overview({ app }) {
  const files = Object.entries(app.files)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Resumo</h3>
        <dl className="text-sm space-y-1.5">
          <div className="flex justify-between"><dt className="text-slate-500">Slug</dt><dd className="font-mono text-xs">{app.slug}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Componentes</dt><dd>{app.components.length}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">TODOs pendentes</dt><dd>{app.todoCounts.pending}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">TODOs feitos</dt><dd>{app.todoCounts.done}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Repos GitHub</dt><dd>{app.githubRepos?.length || 0}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Relacionados</dt><dd>{app.related.length}</dd></div>
        </dl>
      </div>
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Arquivos no vault</h3>
        <ul className="text-sm space-y-1.5">
          {files.map(([kind, f]) => (
            <li key={kind} className="flex items-center justify-between">
              <span className="capitalize text-slate-700">{kind}</span>
              <span className="font-mono text-xs text-slate-400 truncate ml-2">{f.file}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Components({ app }) {
  if (app.components.length === 0)
    return <div className="text-sm text-slate-500 py-6 text-center">Nenhum componente documentado (sem seção "## Stack" nos .md).</div>
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Camada</th>
            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tecnologia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {app.components.map((c, i) => (
            <tr key={i}>
              <td className="px-4 py-2 text-slate-600">{c.layer}</td>
              <td className="px-4 py-2 text-slate-900">{c.technology}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Todos({ app, onChanged }) {
  const [busy, setBusy] = useState(null)

  const toggle = async (todo) => {
    if (todo.kind === 'plain') return
    const key = `${todo.file}:${todo.line}`
    setBusy(key)
    try {
      await api.toggleTodo(app.slug, todo.file, todo.line, !todo.done)
      onChanged()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(null)
    }
  }

  if (app.todos.length === 0)
    return <div className="text-sm text-slate-500 py-6 text-center">Sem TODOs em tasks.md.</div>

  const sections = new Map()
  for (const t of app.todos) {
    const k = t.section || 'Sem seção'
    if (!sections.has(k)) sections.set(k, [])
    sections.get(k).push(t)
  }

  return (
    <div className="space-y-5">
      {[...sections.entries()].map(([section, todos]) => (
        <div key={section}>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{section}</h3>
          <ul className="card divide-y divide-slate-100">
            {todos.map((t) => {
              const key = `${t.file}:${t.line}`
              const isBusy = busy === key
              const disabled = t.kind === 'plain' || isBusy
              return (
                <li key={key} className="flex items-start gap-3 px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => toggle(t)}
                    disabled={disabled}
                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed"
                    title={t.kind === 'plain' ? 'Lista sem checkbox no .md (edite no Obsidian)' : ''}
                  />
                  <span className={`flex-1 ${t.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {t.text}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Live({ app }) {
  const repos = app.githubRepos.filter((r) => r.prodUrl)
  const [active, setActive] = useState(repos[0]?.name)
  const [reloadKey, setReloadKey] = useState(0)
  const repo = repos.find((r) => r.name === active) || repos[0]
  if (!repo) return null

  return (
    <div className="space-y-3">
      {repos.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {repos.map((r) => (
            <button
              key={r.name}
              onClick={() => setActive(r.name)}
              className={`text-xs px-2.5 py-1 rounded-full border ${
                r.name === active
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs">
        <a
          href={repo.prodUrl}
          target="_blank"
          rel="noreferrer"
          className="text-slate-500 hover:text-brand-700 truncate"
        >
          {repo.prodUrl}
        </a>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setReloadKey((k) => k + 1)} className="btn-ghost" title="Recarregar">
            <RefreshCw size={14} />
          </button>
          <Link
            to={`/dashboards/${encodeURIComponent(app.slug)}/${encodeURIComponent(repo.name)}`}
            className="btn-secondary"
          >
            <Monitor size={12} /> Modo dashboard
          </Link>
        </div>
      </div>
      <div className="card overflow-hidden">
        <iframe
          key={reloadKey}
          src={repo.prodUrl}
          title={repo.name}
          className="w-full h-[70vh] border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    </div>
  )
}

function GitBranchTab({ app }) {
  const repos = app.githubRepos
  const [active, setActive] = useState(repos[0]?.name)
  const { data, loading, error } = useAppGithub(app.slug, active)

  if (!repos.length) return null

  return (
    <div className="space-y-4">
      {repos.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {repos.map((r) => (
            <button
              key={r.name}
              onClick={() => setActive(r.name)}
              className={`text-xs px-2.5 py-1 rounded-full border ${
                r.name === active
                  ? 'bg-brand-50 border-brand-300 text-brand-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {loading && <div className="text-sm text-slate-500 py-3">Carregando GitHub...</div>}
      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {data?.meta && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <GitBranch size={12} /> {data.repo}
            </h3>
            <dl className="text-sm space-y-1.5">
              <div className="flex justify-between"><dt className="text-slate-500">Default branch</dt><dd className="font-mono text-xs">{data.meta.defaultBranch}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Linguagem</dt><dd>{data.meta.language || '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Issues abertas</dt><dd>{data.meta.openIssues}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Último push</dt><dd>{formatDistanceToNow(new Date(data.meta.pushedAt), { addSuffix: true, locale: ptBR })}</dd></div>
              {data.pages && (
                <div className="flex justify-between"><dt className="text-slate-500">GitHub Pages</dt><dd>{data.pages.status}</dd></div>
              )}
            </dl>
            <div className="mt-3 flex gap-2">
              <a href={data.meta.htmlUrl} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                <GitBranch size={12} /> Abrir repo
              </a>
              {data.meta.homepage && (
                <a href={data.meta.homepage} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                  <ExternalLink size={12} /> Homepage
                </a>
              )}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Últimos commits</h3>
            <ul className="text-sm divide-y divide-slate-100 -mx-4">
              {(data.commits || []).slice(0, 6).map((c) => (
                <li key={c.sha} className="px-4 py-2">
                  <a href={c.url} target="_blank" rel="noreferrer" className="block">
                    <div className="text-slate-900 truncate hover:text-brand-700">{c.message}</div>
                    <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                      <span className="font-mono">{c.shortSha}</span>
                      <span>·</span>
                      <span>{c.author}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(c.date), { addSuffix: true, locale: ptBR })}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

function Related({ app }) {
  if (app.related.length === 0)
    return <div className="text-sm text-slate-500 py-6 text-center">Sem wikilinks <code className="text-xs">[[X]]</code> nos .md.</div>
  return (
    <div className="flex flex-wrap gap-2">
      {app.related.map((r) => (
        <Link
          key={r}
          to={`/aplicacoes/${encodeURIComponent(r)}`}
          className="card px-3 py-1.5 text-sm hover:border-brand-300"
        >
          {r}
        </Link>
      ))}
    </div>
  )
}

function Raw({ app }) {
  const [active, setActive] = useState(Object.keys(app.files)[0])
  if (!active) return null
  return (
    <div className="card">
      <div className="flex gap-1 border-b border-slate-200 px-2 pt-2 overflow-x-auto">
        {Object.keys(app.files).map((k) => (
          <button
            key={k}
            onClick={() => setActive(k)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-md whitespace-nowrap ${
              active === k ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      <pre className="text-xs font-mono p-4 overflow-x-auto whitespace-pre-wrap text-slate-800">
        {app.files[active].content}
      </pre>
    </div>
  )
}
