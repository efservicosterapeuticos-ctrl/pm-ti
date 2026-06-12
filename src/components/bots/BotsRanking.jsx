import { useMemo } from 'react'
import { Bot, TrendingUp, Eye, MessageSquare } from 'lucide-react'
import { MOCK_BOTS, getFunnelFor } from '../../lib/botsMockData'
import { calcularScore, maxVolume, pct, fmt } from '../../lib/botsMetrics'

const STATUS_STYLES = {
  online:  { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  offline: { bg: 'bg-rose-50',     text: 'text-rose-700',    dot: 'bg-rose-500' },
  warning: { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500' },
}

const FUNCTION_STYLES = {
  'Atendimento (IA)':     'bg-violet-100 text-violet-700',
  'Atendimento WhatsApp': 'bg-emerald-100 text-emerald-700',
  'Envio em massa':       'bg-amber-100 text-amber-700',
  'Discagem':             'bg-sky-100 text-sky-700',
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function BotsRanking() {
  const ranked = useMemo(() => {
    const funnels = MOCK_BOTS.map((b) => getFunnelFor(b.slug))
    const max = maxVolume(funnels)
    return MOCK_BOTS
      .map((b) => {
        const funnel = getFunnelFor(b.slug)
        return {
          ...b,
          funnel,
          score: calcularScore(funnel, max),
          taxaResp: pct(funnel.respondidos, funnel.contatados),
          taxaVis:  pct(funnel.visualizados, funnel.entregues),
        }
      })
      .sort((a, b) => b.score - a.score)
  }, [])

  return (
    <div>
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ranking de performance</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Score combina taxa de resposta (50%), visualização (30%) e volume (20%)
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold">
            {ranked.length} bots
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ranked.map((b, i) => (
          <BotCard key={b.slug} bot={b} position={i} />
        ))}
      </div>
    </div>
  )
}

function BotCard({ bot, position }) {
  const status = STATUS_STYLES[bot.status] || STATUS_STYLES.offline
  const fnStyle = FUNCTION_STYLES[bot.botFunction] || 'bg-slate-100 text-slate-700'
  const isTop3 = position < 3

  return (
    <div className={`card p-5 relative overflow-hidden hover:shadow-md transition-shadow ${isTop3 ? 'ring-1 ring-brand-100' : ''}`}>
      {isTop3 && (
        <div className="absolute top-3 right-3 text-3xl drop-shadow-sm">
          {MEDALS[position]}
        </div>
      )}

      <div className="flex items-start gap-3 mb-4">
        <div className={`rounded-lg p-2 shrink-0 ${isTop3 ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-600'}`}>
          <Bot size={18} />
        </div>
        <div className="min-w-0 flex-1 pr-8">
          <div className="font-semibold text-slate-900 truncate">{bot.name}</div>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${fnStyle}`}>
              {bot.botFunction}
            </span>
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {bot.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Stat label="Contatados"  value={fmt(bot.funnel.contatados)} />
        <Stat label="Respondidos" value={fmt(bot.funnel.respondidos)} accent="text-emerald-600" />
        <Stat label="Tx. visualização" value={bot.taxaVis}  Icon={Eye} />
        <Stat label="Tx. resposta"     value={bot.taxaResp} Icon={MessageSquare} accent="text-emerald-600" />
      </div>

      <div className="flex items-end justify-between pt-3 border-t border-slate-100">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
            Score de desempenho
          </div>
          <div className="text-2xl font-bold text-brand-600 leading-none mt-1">
            {bot.score.toFixed(1)}
          </div>
        </div>
        <ScoreBar score={bot.score} />
      </div>
    </div>
  )
}

function Stat({ label, value, accent = 'text-slate-900', Icon }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
        {Icon && <Icon size={10} />}
        {label}
      </div>
      <div className={`text-sm font-bold mt-1 ${accent}`}>{value}</div>
    </div>
  )
}

function ScoreBar({ score }) {
  const pctScore = Math.min(score, 100)
  return (
    <div className="w-24">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
        <TrendingUp size={10} />
        progresso
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pctScore}%` }}
        />
      </div>
    </div>
  )
}
