import { useEffect, useRef, useState } from 'react'
import { X, Trash2, Play, Square } from 'lucide-react'
import { useBotRunner } from '../../hooks/useBotRunner'

export default function LogsDrawer({ bot, onClose }) {
  const { status, logs, busy, error, start, stop, clearLogs } = useBotRunner(bot.slug)
  const scrollRef = useRef(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const running = status.status === 'running'

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="min-w-0">
            <h2 className="font-semibold truncate flex items-center gap-2">
              {bot.name}
              <StatusBadge status={status.status} />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {running && status.pid ? `PID ${status.pid} · iniciado ${formatTime(status.startedAt)}` : 'Parado'}
              {status.exitCode != null && ` · exit ${status.exitCode}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            {running ? (
              <button onClick={stop} disabled={busy} className="btn-secondary text-rose-700">
                <Square size={14} /> Stop
              </button>
            ) : (
              <button onClick={start} disabled={busy} className="btn-primary">
                <Play size={14} /> Start
              </button>
            )}
            <button onClick={clearLogs} className="btn-ghost text-xs">
              <Trash2 size={14} /> Limpar
            </button>
          </div>
          <label className="text-xs text-slate-600 flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
        </div>

        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 border-b border-rose-200 px-4 py-2">
            {error}
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 font-mono text-xs p-3"
        >
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">Sem logs ainda. Clique em Start.</div>
          ) : (
            logs.map((line, i) => (
              <div key={i} className={line.startsWith('[stderr]') ? 'text-rose-300' : line.startsWith('[runner]') ? 'text-amber-300' : ''}>
                {line}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    running: { txt: 'rodando', cls: 'bg-emerald-100 text-emerald-700' },
    stopped: { txt: 'parado', cls: 'bg-slate-100 text-slate-600' },
    crashed: { txt: 'crashed', cls: 'bg-rose-100 text-rose-700' },
  }
  const { txt, cls } = map[status] || map.stopped
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${cls} inline-flex items-center gap-1`}>
      {status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {txt}
    </span>
  )
}

function formatTime(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString('pt-BR') } catch { return iso }
}
