import { useMemo, useState } from 'react'
import { Filter, CheckCircle2, AlertCircle, Clock, Play } from 'lucide-react'
import { MOCK_BOTS, MOCK_SESSIONS, MOTIVO_LABEL } from '../../lib/botsMockData'
import { calcularScore, maxVolume, pct, fmt, formatarDuracao } from '../../lib/botsMetrics'

const STATUS_FILTER = [
  { id: 'all',         label: 'Todos os status' },
  { id: 'rodando',     label: 'Rodando agora' },
  { id: 'finalizada',  label: 'Finalizadas' },
  { id: 'caiu',        label: 'Caíram' },
]

const PERIOD_FILTER = [
  { id: '24h', label: 'Últimas 24h' },
  { id: '7d',  label: 'Últimos 7 dias' },
  { id: 'all', label: 'Todo o período' },
]

export default function BotsSessions() {
  const [botFilter, setBotFilter]       = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')

  const max = useMemo(() => maxVolume(MOCK_SESSIONS), [])

  const filtered = useMemo(() => {
    let out = MOCK_SESSIONS.map((s) => ({
      ...s,
      score: calcularScore(s, max),
      botNome: MOCK_BOTS.find((b) => b.slug === s.bot_slug)?.name || s.bot_slug,
    }))
    if (botFilter !== 'all')    out = out.filter((s) => s.bot_slug === botFilter)
    if (statusFilter !== 'all') out = out.filter((s) => s.status === statusFilter)
    // periodFilter mock — não aplica filtro real, é só pra apresentação
    return out.sort((a, b) => {
      if (a.status === 'rodando' && b.status !== 'rodando') return -1
      if (b.status === 'rodando' && a.status !== 'rodando') return 1
      return new Date(b.inicio) - new Date(a.inicio)
    })
  }, [botFilter, statusFilter, max])

  // KPIs
  const total       = MOCK_SESSIONS.length
  const rodando     = MOCK_SESSIONS.filter((s) => s.status === 'rodando').length
  const caidas      = MOCK_SESSIONS.filter((s) => s.status === 'caiu').length
  const finalizadas = MOCK_SESSIONS.filter((s) => s.status === 'finalizada').length
  const taxaSucesso = ((finalizadas + rodando) / total) * 100
  const tempoMedio  = Math.round(MOCK_SESSIONS.reduce((a, s) => a + s.duracao_min, 0) / total)

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <SessionKpi label="Taxa de sucesso" value={`${taxaSucesso.toFixed(1)}%`} hint="sessões que não caíram" tone="emerald" Icon={CheckCircle2} />
        <SessionKpi label="Rodando agora"   value={rodando}                       hint={`de ${total} sessões`}      tone="brand"   Icon={Play} />
        <SessionKpi label="Tempo médio"     value={formatarDuracao(tempoMedio)}   hint="por sessão"                 tone="sky"     Icon={Clock} />
        <SessionKpi label="Quedas"          value={caidas}                        hint={caidas > 0 ? 'requer atenção' : 'tudo ok'} tone={caidas > 0 ? 'rose' : 'emerald'} Icon={AlertCircle} />
      </div>

      <div className="card p-3 mb-4 flex flex-col md:flex-row gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-500 px-2">
          <Filter size={14} />
          <span className="font-medium">Filtros</span>
        </div>
        <select className="input md:w-52" value={botFilter} onChange={(e) => setBotFilter(e.target.value)}>
          <option value="all">Todos os bots</option>
          {MOCK_BOTS.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
        </select>
        <select className="input md:w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_FILTER.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select className="input md:w-44" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)}>
          {PERIOD_FILTER.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <div className="ml-auto text-xs text-slate-500 self-center px-2">
          {filtered.length} de {total} sessões
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-3 text-[11px] text-slate-500">
        <Legend color="bg-brand-500"   label="Contatados" />
        <Legend color="bg-sky-500"     label="Entregues" />
        <Legend color="bg-amber-500"   label="Visualizados" />
        <Legend color="bg-emerald-500" label="Respondidos" />
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
          <div className="col-span-3">Bot / Período</div>
          <div className="col-span-1">Duração</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3">Funil da sessão</div>
          <div className="col-span-2 text-center">Respostas</div>
          <div className="col-span-1 text-right">Score</div>
        </div>

        <div>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400 italic">
              Nenhuma sessão com os filtros atuais
            </div>
          ) : filtered.map((s) => <SessionRow key={s.id} s={s} max={max} />)}
        </div>
      </div>
    </div>
  )
}

const KPI_TONES = {
  emerald: 'bg-emerald-50 text-emerald-700',
  brand:   'bg-brand-50 text-brand-700',
  sky:     'bg-sky-50 text-sky-700',
  rose:    'bg-rose-50 text-rose-700',
}

function SessionKpi({ label, value, hint, tone, Icon }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
        <div className={`p-1.5 rounded-md ${KPI_TONES[tone]}`}>
          <Icon size={12} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-2">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  )
}

const STATUS_PILL = {
  rodando:    { bg: 'bg-brand-50',   text: 'text-brand-700',   dot: 'bg-brand-500',   pulse: true },
  finalizada: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', pulse: false },
  caiu:       { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500',    pulse: false },
}

function SessionRow({ s, max }) {
  const status = STATUS_PILL[s.status]
  const dtInicio = new Date(s.inicio).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
  const dtFim = s.fim
    ? new Date(s.fim).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'em execução'

  return (
    <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors items-center text-sm">
      <div className="col-span-3 min-w-0">
        <div className="font-semibold text-slate-900 truncate">{s.botNome}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{dtInicio} → {dtFim}</div>
      </div>
      <div className="col-span-1">
        <div className="font-semibold text-slate-900">{formatarDuracao(s.duracao_min)}</div>
        <div className="text-[10px] text-slate-500">duração</div>
      </div>
      <div className="col-span-2">
        <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${status.pulse ? 'animate-pulse' : ''}`} />
          {s.status}
        </span>
        {s.motivo_fim && (
          <div className="text-[10px] text-slate-400 italic mt-1">
            {MOTIVO_LABEL[s.motivo_fim]}
          </div>
        )}
      </div>
      <div className="col-span-3">
        <MiniFunil s={s} max={max} />
        <div className="text-[10px] text-slate-500 mt-1">
          tx. resposta {pct(s.respondidos, s.contatados)}
        </div>
      </div>
      <div className="col-span-2 text-center">
        <div className="font-bold text-slate-900">{fmt(s.respondidos)}</div>
        <div className="text-[10px] text-slate-500">de {fmt(s.contatados)} contatos</div>
      </div>
      <div className="col-span-1 text-right">
        <div className="text-lg font-bold text-brand-600">{s.score.toFixed(1)}</div>
      </div>
    </div>
  )
}

function MiniFunil({ s, max }) {
  const partes = [
    { c: 'bg-brand-500',   v: s.contatados },
    { c: 'bg-sky-500',     v: s.entregues },
    { c: 'bg-amber-500',   v: s.visualizados },
    { c: 'bg-emerald-500', v: s.respondidos },
  ]
  return (
    <div className="flex gap-0.5 h-4 rounded overflow-hidden bg-slate-100">
      {partes.map((p, i) => (
        <span key={i} className={`block ${p.c}`} style={{ width: `${Math.max((p.v / max) * 100, 1)}%` }} />
      ))}
    </div>
  )
}
