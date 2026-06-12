import { useState, useEffect, useMemo } from 'react'
import { LayoutDashboard, Bot, Trophy, Clock, BarChart3, ScrollText } from 'lucide-react'
import BotsOverview from '../components/bots/BotsOverview'
import BotsManage from '../components/bots/BotsManage'
import BotsRanking from '../components/bots/BotsRanking'
import BotsSessions from '../components/bots/BotsSessions'
import BotsAnalytics from '../components/bots/BotsAnalytics'
import BotsLogs from '../components/bots/BotsLogs'
import { MOCK_ALERTS } from '../lib/botsMockData'
import { useBackendHealth } from '../hooks/useBackendHealth'

const TABS = [
  { id: 'overview',  label: 'Visão Geral', icon: LayoutDashboard, comp: BotsOverview, requiresBackend: false },
  { id: 'manage',    label: 'Gerenciar',   icon: Bot,             comp: BotsManage,   requiresBackend: true  },
  { id: 'ranking',   label: 'Ranking',     icon: Trophy,          comp: BotsRanking,  requiresBackend: false },
  { id: 'sessions',  label: 'Sessões',     icon: Clock,           comp: BotsSessions, requiresBackend: false },
  { id: 'analytics', label: 'Analytics',   icon: BarChart3,       comp: BotsAnalytics,requiresBackend: false },
  { id: 'logs',      label: 'Logs',        icon: ScrollText,      comp: BotsLogs,     requiresBackend: false },
]

const STORAGE_KEY = 'bots:active-tab'

export default function Bots() {
  const backendOnline = useBackendHealth()

  // Filtra abas: esconde as que precisam de backend quando ele estiver offline
  const visibleTabs = useMemo(() => {
    if (backendOnline === false) return TABS.filter((t) => !t.requiresBackend)
    return TABS
  }, [backendOnline])

  const [activeId, setActiveId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'overview'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeId)
  }, [activeId])

  // Se a aba ativa sumiu (ex: usuário estava em Gerenciar, backend caiu), volta pra overview
  useEffect(() => {
    if (!visibleTabs.find((t) => t.id === activeId)) {
      setActiveId('overview')
    }
  }, [visibleTabs, activeId])

  const ActiveComp = visibleTabs.find((t) => t.id === activeId)?.comp || BotsOverview
  const alertCount = MOCK_ALERTS.filter((a) => a.tipo === 'danger' || a.tipo === 'warning').length

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Controle de Bots</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitoramento, performance e operação dos bots do ecossistema
        </p>
      </div>

      <div className="card p-1.5 mb-6 inline-flex flex-wrap gap-1 overflow-x-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeId === tab.id
          const showBadge = tab.id === 'overview' && alertCount > 0
          return (
            <button
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {showBadge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-rose-100 text-rose-700'
                }`}>
                  {alertCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <ActiveComp />
    </div>
  )
}
