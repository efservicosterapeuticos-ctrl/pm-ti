import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  Search,
  RefreshCw,
  Play,
  Square,
  Terminal,
  ExternalLink,
  X,
  Copy,
  Check,
  Folder,
  Settings,
  Activity,
} from 'lucide-react'
import { useBots } from '../../hooks/useApplications'
import { api, connectBotWS } from '../../lib/api'
import ConfigBotModal from './ConfigBotModal'
import LogsDrawer from './LogsDrawer'

const FUNCTION_STYLES = {
  'Atendimento (IA)': 'bg-violet-100 text-violet-700',
  'Atendimento WhatsApp': 'bg-emerald-100 text-emerald-700',
  'Envio em massa': 'bg-amber-100 text-amber-700',
  Discagem: 'bg-sky-100 text-sky-700',
  Sincronização: 'bg-blue-100 text-blue-700',
  Bot: 'bg-slate-100 text-slate-700',
}

export default function BotsManage() {
  const { items, loading, error, refetch } = useBots()
  const [q, setQ] = useState('')
  const [functionFilter, setFunctionFilter] = useState('all')
  const [modalBot, setModalBot] = useState(null)
  const [configBot, setConfigBot] = useState(null)
  const [logsBot, setLogsBot] = useState(null)
  const [runtimeMap, setRuntimeMap] = useState({})

  useEffect(() => {
    const init = {}
    for (const b of items) init[b.slug] = b.runtime || { status: 'stopped' }
    setRuntimeMap(init)
  }, [items])

  useEffect(() => {
    const ws = connectBotWS((msg) => {
      if (msg.type !== 'bot:status') return
      setRuntimeMap((prev) => ({
        ...prev,
        [msg.slug]: { status: msg.status, pid: msg.pid, startedAt: msg.startedAt, exitCode: msg.exitCode },
      }))
    })
    return () => ws.close()
  }, [])

  const functions = useMemo(() => {
    const set = new Set(items.map((b) => b.botFunction))
    return ['all', ...[...set].sort()]
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((b) => {
      if (functionFilter !== 'all' && b.botFunction !== functionFilter) return false
      if (q) {
        const t = q.toLowerCase()
        const haystack = `${b.name} ${b.description || ''} ${b.botFunction}`.toLowerCase()
        if (!haystack.includes(t)) return false
      }
      return true
    })
  }, [items, q, functionFilter])

  const grouped = useMemo(() => {
    const byFunction = new Map()
    for (const b of filtered) {
      if (!byFunction.has(b.botFunction)) byFunction.set(b.botFunction, [])
      byFunction.get(b.botFunction).push(b)
    }
    return [...byFunction.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt'))
  }, [filtered])

  const handleStart = async (slug) => {
    try { await api.startBot(slug) } catch (e) { alert(e.message) }
  }
  const handleStop = async (slug) => {
    try { await api.stopBot(slug) } catch (e) { alert(e.message) }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar bot..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="input md:w-52"
          value={functionFilter}
          onChange={(e) => setFunctionFilter(e.target.value)}
        >
          {functions.map((f) => (
            <option key={f} value={f}>
              {f === 'all' ? 'Todas as funções' : f}
            </option>
          ))}
        </select>
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
        <div className="text-center py-12 text-slate-500">Lendo vault...</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          Nenhum bot detectado no vault.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([fn, items]) => (
            <section key={fn}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${FUNCTION_STYLES[fn] ?? FUNCTION_STYLES.Bot}`}>
                  {fn}
                </span>
                <span className="text-slate-400 font-normal">({items.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((b) => (
                  <BotCard
                    key={b.slug}
                    bot={b}
                    runtime={runtimeMap[b.slug] || { status: 'stopped' }}
                    onStart={() => handleStart(b.slug)}
                    onStop={() => handleStop(b.slug)}
                    onConfig={() => setConfigBot(b)}
                    onLogs={() => setLogsBot(b)}
                    onShowRun={() => setModalBot(b)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {modalBot && <RunInstructionsModal bot={modalBot} onClose={() => setModalBot(null)} />}
      {configBot && (
        <ConfigBotModal bot={configBot} onClose={() => setConfigBot(null)} onSaved={refetch} />
      )}
      {logsBot && <LogsDrawer bot={logsBot} onClose={() => setLogsBot(null)} />}
    </div>
  )
}

function BotCard({ bot, runtime, onStart, onStop, onConfig, onLogs, onShowRun }) {
  const stack = bot.components.map((c) => c.technology).slice(0, 4)
  const hasConfig = !!bot.config
  const running = runtime.status === 'running'
  const crashed = runtime.status === 'crashed'

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="rounded-lg bg-brand-50 text-brand-600 p-2 shrink-0">
            <Bot size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to={`/aplicacoes/${encodeURIComponent(bot.slug)}`}
              className="block font-semibold text-slate-900 truncate hover:text-brand-700"
            >
              {bot.name}
            </Link>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${FUNCTION_STYLES[bot.botFunction] ?? FUNCTION_STYLES.Bot}`}>
                {bot.botFunction}
              </span>
              <RuntimeBadge status={runtime.status} />
            </div>
          </div>
        </div>
        <button
          onClick={onConfig}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
          title="Configurar comando"
        >
          <Settings size={16} />
        </button>
      </div>

      {bot.description && (
        <p className="text-sm text-slate-700 line-clamp-3">{bot.description}</p>
      )}

      {stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {stack.map((t, i) => (
            <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 mt-auto border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          {!hasConfig ? (
            <button onClick={onConfig} className="btn-secondary text-xs" title="Cadastrar comando de execucao">
              <Settings size={14} /> Configurar
            </button>
          ) : running ? (
            <button onClick={onStop} className="btn-secondary text-rose-700 text-xs">
              <Square size={14} /> Stop
            </button>
          ) : (
            <button onClick={onStart} className={`text-xs ${crashed ? 'btn-secondary text-amber-700' : 'btn-primary'}`}>
              <Play size={14} /> {crashed ? 'Reiniciar' : 'Start'}
            </button>
          )}
          {hasConfig && (
            <button onClick={onLogs} className="btn-ghost text-xs" title="Ver logs ao vivo">
              <Activity size={14} /> Logs
            </button>
          )}
        </div>
        <button onClick={onShowRun} className="btn-ghost text-xs" title="Ver instrucoes do README">
          <Terminal size={14} />
        </button>
      </div>
    </div>
  )
}

function RuntimeBadge({ status }) {
  if (status === 'running') {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        rodando
      </span>
    )
  }
  if (status === 'crashed') {
    return <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">crashed</span>
  }
  return null
}

function RunInstructionsModal({ bot, onClose }) {
  const [copiedIdx, setCopiedIdx] = useState(null)

  const copy = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx((cur) => (cur === idx ? null : cur)), 1500)
    } catch {}
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-b-none md:rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Terminal size={18} /> Como rodar: {bot.name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Comandos extraídos do README/architecture do vault</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {bot.description && (
            <div className="text-sm text-slate-700">{bot.description}</div>
          )}

          {bot.runInstructions.length === 0 ? (
            <div className="text-sm text-slate-500 italic">
              Nenhum comando shell detectado. Edite o <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">README.md</code> ou <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">architecture.md</code> do vault e adicione um bloco{' '}
              <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">```bash</code> com o comando.
            </div>
          ) : (
            <ul className="space-y-3">
              {bot.runInstructions.map((cmd, i) => (
                <li key={i} className="relative">
                  <pre className="text-xs bg-slate-900 text-slate-100 p-3 pr-12 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                    {cmd}
                  </pre>
                  <button
                    onClick={() => copy(cmd, i)}
                    className="absolute top-2 right-2 p-1.5 rounded-md text-slate-300 hover:bg-slate-700"
                    title="Copiar"
                  >
                    {copiedIdx === i ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {bot.githubRepos && bot.githubRepos.length > 0 && (
            <div className="text-sm text-slate-600 pt-2 border-t border-slate-100">
              <div className="font-medium mb-1">Repositórios:</div>
              <ul className="space-y-1">
                {bot.githubRepos.map((r) => (
                  <li key={r.name}>
                    <a href={r.htmlUrl} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline inline-flex items-center gap-1">
                      <Folder size={12} /> {r.name} <ExternalLink size={10} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
