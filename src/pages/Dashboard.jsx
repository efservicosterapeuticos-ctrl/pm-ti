import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layers, ListChecks, Boxes, AlertCircle } from 'lucide-react'
import { useApplications } from '../hooks/useApplications'

export default function Dashboard() {
  const { apps, loading } = useApplications()

  const stats = useMemo(() => {
    const totalApps = apps.length
    const totalTodosPending = apps.reduce((s, a) => s + a.todoCounts.pending, 0)
    const totalTodosDone = apps.reduce((s, a) => s + a.todoCounts.done, 0)
    const noStack = apps.filter((a) => a.components.length === 0).length
    return { totalApps, totalTodosPending, totalTodosDone, noStack }
  }, [apps])

  const topPending = useMemo(
    () => [...apps].sort((a, b) => b.todoCounts.pending - a.todoCounts.pending).slice(0, 5),
    [apps],
  )

  if (loading) return <div className="text-center py-12 text-slate-500">Carregando...</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Boxes} label="Aplicações" value={stats.totalApps} />
        <StatCard icon={ListChecks} label="TODOs pendentes" value={stats.totalTodosPending} />
        <StatCard icon={Layers} label="TODOs concluídos" value={stats.totalTodosDone} />
        <StatCard icon={AlertCircle} label="Sem stack documentada" value={stats.noStack} />
      </div>

      <section>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Com mais pendências
        </h2>
        <div className="card divide-y divide-slate-100">
          {topPending.map((a) => (
            <Link
              key={a.slug}
              to={`/aplicacoes/${encodeURIComponent(a.slug)}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <div className="font-medium text-slate-900 truncate">{a.name}</div>
                <div className="text-xs text-slate-500 truncate">{a.category}</div>
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {a.todoCounts.pending}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="rounded-lg bg-brand-50 text-brand-600 p-2">
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  )
}
