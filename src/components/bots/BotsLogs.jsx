import { useMemo, useState, useEffect, useRef } from 'react'
import { Terminal, Filter, ArrowDown } from 'lucide-react'
import { MOCK_BOTS, MOCK_LOGS } from '../../lib/botsMockData'

const LEVELS = [
  { id: 'all',   label: 'Todos' },
  { id: 'info',  label: 'Info' },
  { id: 'ok',    label: 'OK' },
  { id: 'warn',  label: 'Aviso' },
  { id: 'error', label: 'Erro' },
]

const LEVEL_STYLE = {
  info:  { text: 'text-sky-300',     tag: 'INFO ' },
  ok:    { text: 'text-emerald-300', tag: 'OK   ' },
  warn:  { text: 'text-amber-300',   tag: 'WARN ' },
  error: { text: 'text-rose-300',    tag: 'ERROR' },
}

export default function BotsLogs() {
  const [level, setLevel]   = useState('all')
  const [botSlug, setBot]   = useState('all')
  const [autoScroll, setAS] = useState(true)
  const [tick, setTick]     = useState(0)
  const scrollRef = useRef(null)

  // Simula chegada de novos logs a cada 4s (visual "vivo")
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000)
    return () => clearInterval(id)
  }, [])

  const filtered = useMemo(() => {
    let out = MOCK_LOGS
    if (level !== 'all')   out = out.filter((l) => l.nivel === level)
    if (botSlug !== 'all') out = out.filter((l) => l.bot === botSlug)
    return out
  }, [level, botSlug, tick])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [filtered, autoScroll])

  const counts = useMemo(() => {
    return MOCK_LOGS.reduce((acc, l) => {
      acc[l.nivel] = (acc[l.nivel] || 0) + 1
      return acc
    }, {})
  }, [])

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Terminal size={18} className="text-brand-600" />
            Logs em tempo real
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Stream de eventos dos bots — info, sucesso, avisos e erros
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          live stream
        </span>
      </div>

      <div className="card p-3 mb-4 flex flex-col md:flex-row gap-2 items-stretch md:items-center">
        <div className="flex items-center gap-2 text-sm text-slate-500 px-2">
          <Filter size={14} />
          <span className="font-medium">Filtros</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {LEVELS.map((l) => {
            const count = l.id === 'all' ? MOCK_LOGS.length : (counts[l.id] || 0)
            const isActive = level === l.id
            return (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {l.label}
                <span className={`text-[10px] px-1.5 rounded ${isActive ? 'bg-white/20' : 'bg-white text-slate-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <select className="input md:w-52 md:ml-auto" value={botSlug} onChange={(e) => setBot(e.target.value)}>
          <option value="all">Todos os bots</option>
          {MOCK_BOTS.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
          <option value="sistema">Sistema</option>
        </select>

        <label className="text-xs text-slate-600 flex items-center gap-1.5 px-2">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAS(e.target.checked)}
            className="rounded"
          />
          <ArrowDown size={12} />
          auto-scroll
        </label>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="ml-3 text-xs text-slate-400 font-mono">
            pm-ti · bot-monitor · stream
          </span>
          <span className="ml-auto text-[10px] text-slate-500 font-mono">
            {filtered.length} eventos
          </span>
        </div>

        <div ref={scrollRef} className="p-4 max-h-[520px] overflow-y-auto font-mono text-[12px] leading-relaxed">
          {filtered.length === 0 ? (
            <div className="text-slate-500 italic">// nenhum log com os filtros atuais</div>
          ) : (
            filtered.map((l, i) => {
              const s = LEVEL_STYLE[l.nivel] || LEVEL_STYLE.info
              return (
                <div key={i} className="grid grid-cols-[110px_60px_120px_1fr] gap-3 py-0.5 border-b border-slate-800/40 hover:bg-slate-800/40">
                  <span className="text-slate-500">{l.ts}</span>
                  <span className={`font-semibold ${s.text}`}>{s.tag}</span>
                  <span className="text-slate-400">[{l.bot}]</span>
                  <span className="text-slate-100">{l.texto}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
