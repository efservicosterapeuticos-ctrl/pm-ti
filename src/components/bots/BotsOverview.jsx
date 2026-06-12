import { useMemo } from 'react'
import { Users, Send, Eye, MessageSquare, AlertTriangle, Trophy, TrendingUp, Activity } from 'lucide-react'
import {
  MOCK_BOTS,
  MOCK_ALERTS,
  MOCK_SESSIONS,
  HISTORICO_7D,
  getFunnelFor,
} from '../../lib/botsMockData'
import { calcularScore, maxVolume, agregarFunis, pct, fmt } from '../../lib/botsMetrics'

export default function BotsOverview() {
  const bots = MOCK_BOTS

  const data = useMemo(() => {
    const funnels = bots.map((b) => getFunnelFor(b.slug))
    const total = agregarFunis(funnels)
    const max = maxVolume(funnels)
    const ranked = bots
      .map((b) => ({ ...b, funnel: getFunnelFor(b.slug), score: calcularScore(getFunnelFor(b.slug), max) }))
      .sort((a, b) => b.score - a.score)
    const sessoesRodando = MOCK_SESSIONS.filter((s) => s.status === 'rodando').length
    return { total, ranked, sessoesRodando }
  }, [bots])

  const kpis = [
    {
      label: 'Pessoas contatadas',
      value: fmt(data.total.contatados),
      delta: '+12.4% vs semana passada',
      tone: 'brand',
      Icon: Users,
    },
    {
      label: 'Taxa de entrega',
      value: pct(data.total.entregues, data.total.contatados),
      delta: `${fmt(data.total.entregues)} entregues`,
      tone: 'sky',
      Icon: Send,
    },
    {
      label: 'Taxa de visualização',
      value: pct(data.total.visualizados, data.total.entregues),
      delta: `${fmt(data.total.visualizados)} visualizaram`,
      tone: 'amber',
      Icon: Eye,
    },
    {
      label: 'Taxa de resposta',
      value: pct(data.total.respondidos, data.total.contatados),
      delta: `${fmt(data.total.respondidos)} responderam`,
      tone: 'emerald',
      Icon: MessageSquare,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </div>

      <Funnel total={data.total} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <AlertsCard alerts={MOCK_ALERTS} />
          <ActivityCard sessoesRodando={data.sessoesRodando} historico={HISTORICO_7D} />
        </div>
        <TopBots ranked={data.ranked.slice(0, 3)} />
      </div>
    </div>
  )
}

const TONE_STYLES = {
  brand:   { bar: 'bg-brand-500',   icon: 'bg-brand-50 text-brand-600' },
  sky:     { bar: 'bg-sky-500',     icon: 'bg-sky-50 text-sky-600' },
  amber:   { bar: 'bg-amber-500',   icon: 'bg-amber-50 text-amber-600' },
  emerald: { bar: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600' },
}

function KpiCard({ label, value, delta, tone, Icon }) {
  const t = TONE_STYLES[tone] || TONE_STYLES.brand
  return (
    <div className="card p-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${t.bar}`} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
          {label}
        </span>
        <div className={`p-1.5 rounded-lg ${t.icon}`}>
          <Icon size={14} />
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-[11px] text-slate-500 mt-1">{delta}</div>
    </div>
  )
}

function Funnel({ total }) {
  const stages = [
    { label: 'Contatados',   valor: total.contatados   },
    { label: 'Entregues',    valor: total.entregues    },
    { label: 'Visualizaram', valor: total.visualizados },
    { label: 'Responderam',  valor: total.respondidos  },
  ]
  const base = total.contatados || 1

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-600" />
          Funil de engajamento
        </h3>
        <span className="text-[11px] uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          live
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-5">
        Avanço do primeiro contato até a resposta — somatório de todos os bots
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {stages.map((s, i) => {
          const next = stages[i + 1]
          const conv = next ? pct(next.valor, s.valor) : null
          const widthPct = (s.valor / base) * 100
          return (
            <div key={s.label} className="relative bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                {s.label}
              </div>
              <div className="text-xl font-bold text-slate-900 mt-1">{fmt(s.valor)}</div>
              <div className="h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              {conv && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {conv} →
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ALERT_STYLES = {
  danger:  { wrap: 'border-rose-200 bg-rose-50',    iconBg: 'bg-rose-100 text-rose-700' },
  warning: { wrap: 'border-amber-200 bg-amber-50',  iconBg: 'bg-amber-100 text-amber-700' },
  info:    { wrap: 'border-sky-200 bg-sky-50',      iconBg: 'bg-sky-100 text-sky-700' },
}

function AlertsCard({ alerts }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
        <AlertTriangle size={16} className="text-amber-600" />
        Alertas ativos
        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold ml-1">
          {alerts.length}
        </span>
      </h3>
      <div className="space-y-2">
        {alerts.map((a) => {
          const s = ALERT_STYLES[a.tipo] || ALERT_STYLES.info
          return (
            <div key={a.id} className={`flex items-start gap-3 border rounded-lg p-3 ${s.wrap}`}>
              <div className={`p-1.5 rounded-md ${s.iconBg} shrink-0`}>
                <AlertTriangle size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-900">{a.titulo}</div>
                <div className="text-xs text-slate-500 mt-0.5">{a.detalhe}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActivityCard({ sessoesRodando, historico }) {
  const total7d = historico.reduce((acc, h) => acc + h.enviados, 0)
  const resp7d = historico.reduce((acc, h) => acc + h.respondidos, 0)

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
        <Activity size={16} className="text-emerald-600" />
        Atividade últimos 7 dias
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Mini label="Sessões rodando" value={sessoesRodando} accent="text-emerald-600" />
        <Mini label="Mensagens 7d" value={fmt(total7d)} />
        <Mini label="Respostas 7d" value={fmt(resp7d)} />
      </div>
      <div className="flex items-end gap-1 h-24">
        {historico.map((h) => {
          const maxV = Math.max(...historico.map((x) => x.enviados))
          const hPct = (h.enviados / maxV) * 100
          const respPct = (h.respondidos / maxV) * 100
          return (
            <div key={h.dia} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end gap-0.5 h-full">
                <div className="flex-1 bg-brand-200 rounded-t" style={{ height: `${hPct}%` }} />
                <div className="flex-1 bg-emerald-400 rounded-t" style={{ height: `${respPct}%` }} />
              </div>
              <div className="text-[10px] text-slate-500">{h.dia}</div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 mt-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <i className="w-2 h-2 rounded bg-brand-200" /> Enviados
        </span>
        <span className="flex items-center gap-1.5">
          <i className="w-2 h-2 rounded bg-emerald-400" /> Respondidos
        </span>
      </div>
    </div>
  )
}

function Mini({ label, value, accent = 'text-slate-900' }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
        {label}
      </div>
      <div className={`text-lg font-bold mt-1 ${accent}`}>{value}</div>
    </div>
  )
}

const MEDALS = ['🥇', '🥈', '🥉']

function TopBots({ ranked }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
        <Trophy size={16} className="text-amber-500" />
        Top performers
      </h3>
      <div className="space-y-3">
        {ranked.map((b, i) => (
          <div key={b.slug} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-slate-50">
            <div className="text-2xl shrink-0">{MEDALS[i]}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-900 truncate">{b.name}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                taxa resposta {pct(b.funnel.respondidos, b.funnel.contatados)}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-bold text-brand-600">{b.score.toFixed(1)}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">score</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
