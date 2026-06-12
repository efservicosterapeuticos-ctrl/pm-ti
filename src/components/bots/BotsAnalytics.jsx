import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts'
import { Flame, Activity, AlertOctagon, TrendingUp } from 'lucide-react'
import { MOCK_BOTS, HEATMAP, ERROS_DISTRIBUICAO, HISTORICO_7D, getFunnelFor } from '../../lib/botsMockData'
import { fmt } from '../../lib/botsMetrics'

const COR_FUNIL = {
  contatados:   '#6366f1',
  entregues:    '#0ea5e9',
  visualizados: '#f59e0b',
  respondidos:  '#10b981',
}

export default function BotsAnalytics() {
  const dadosBots = useMemo(() => {
    return MOCK_BOTS.map((b) => {
      const f = getFunnelFor(b.slug)
      return {
        nome: b.name.split(' · ')[0],
        contatados: f.contatados,
        entregues:  f.entregues,
        visualizados: f.visualizados,
        respondidos: f.respondidos,
      }
    })
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HeatmapCard />
        <ErrosCard />
      </div>

      <ComparativoCard data={dadosBots} />

      <TendenciaCard />
    </div>
  )
}

// ===== HEATMAP =====
function HeatmapCard() {
  const maxVal = useMemo(() => Math.max(...HEATMAP.matriz.flat()), [])

  const corPorIntensidade = (val) => {
    if (val === 0) return 'bg-slate-100'
    const t = val / maxVal
    if (t < 0.15) return 'bg-brand-100'
    if (t < 0.3)  return 'bg-brand-200'
    if (t < 0.5)  return 'bg-brand-300'
    if (t < 0.7)  return 'bg-brand-400'
    if (t < 0.85) return 'bg-brand-500'
    return 'bg-brand-700'
  }

  return (
    <div className="card p-5 lg:col-span-2">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
        <Flame size={16} className="text-amber-500" />
        Heatmap de atividade
      </h3>
      <p className="text-xs text-slate-500 mb-5">
        Volume de envios por dia da semana × hora do dia (últimos 7 dias)
      </p>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: '36px repeat(24, 1fr)' }}>
            <div></div>
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="text-[9px] text-slate-400 text-center">
                {h % 3 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>
          <div className="grid gap-0.5 mt-1" style={{ gridTemplateColumns: '36px repeat(24, 1fr)' }}>
            {HEATMAP.dias.map((dia, di) => (
              <Row key={dia} dia={dia} dados={HEATMAP.matriz[di]} corFn={corPorIntensidade} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-500">
        <span>menos</span>
        <span className="w-3 h-3 rounded-sm bg-slate-100" />
        <span className="w-3 h-3 rounded-sm bg-brand-100" />
        <span className="w-3 h-3 rounded-sm bg-brand-300" />
        <span className="w-3 h-3 rounded-sm bg-brand-500" />
        <span className="w-3 h-3 rounded-sm bg-brand-700" />
        <span>mais</span>
      </div>
    </div>
  )
}

function Row({ dia, dados, corFn }) {
  return (
    <>
      <div className="text-[10px] text-slate-500 self-center font-medium">{dia}</div>
      {dados.map((val, h) => (
        <div
          key={h}
          className={`aspect-square rounded-sm ${corFn(val)} hover:ring-2 hover:ring-brand-400 cursor-pointer transition-all`}
          title={`${dia} ${h}h · ${val} envios`}
        />
      ))}
    </>
  )
}

// ===== DISTRIBUICAO ERROS =====
function ErrosCard() {
  const dados = ERROS_DISTRIBUICAO.map((e) => ({ name: e.motivo, value: e.total, fill: e.cor }))
  const total = dados.reduce((a, b) => a + b.value, 0)

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
        <AlertOctagon size={16} className="text-rose-500" />
        Distribuição de erros
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Motivos de queda das sessões (7 dias)
      </p>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={70}
              paddingAngle={2}
            >
              {dados.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
            <Tooltip
              formatter={(v) => [`${v} ocorrências`, '']}
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-1.5 mt-3">
        {dados.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.fill }} />
              <span className="text-slate-700">{d.name}</span>
            </span>
            <span className="text-slate-500">
              <strong className="text-slate-900">{d.value}</strong> ({((d.value / total) * 100).toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== COMPARATIVO ENTRE BOTS =====
function ComparativoCard({ data }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
        <Activity size={16} className="text-brand-600" />
        Comparativo entre bots
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Funil completo lado a lado — identifica onde cada bot perde mais leads
      </p>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
              formatter={(v) => fmt(v)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="contatados"   fill={COR_FUNIL.contatados}   radius={[3, 3, 0, 0]} />
            <Bar dataKey="entregues"    fill={COR_FUNIL.entregues}    radius={[3, 3, 0, 0]} />
            <Bar dataKey="visualizados" fill={COR_FUNIL.visualizados} radius={[3, 3, 0, 0]} />
            <Bar dataKey="respondidos"  fill={COR_FUNIL.respondidos}  radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ===== TENDENCIA 7 DIAS =====
function TendenciaCard() {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-1">
        <TrendingUp size={16} className="text-emerald-600" />
        Tendência semanal
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Volume de envios vs respostas obtidas — últimos 7 dias
      </p>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={HISTORICO_7D} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
              formatter={(v) => fmt(v)}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="enviados"    stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="respondidos" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
