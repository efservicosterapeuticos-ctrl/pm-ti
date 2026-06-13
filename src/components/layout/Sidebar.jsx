import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Boxes, Monitor, Bot, BookOpen } from 'lucide-react'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/aplicacoes', label: 'Aplicações', icon: Boxes },
  { to: '/dashboards', label: 'Dashboards', icon: Monitor },
  { to: '/bots', label: 'Bots', icon: Bot },
  { to: '/vault', label: 'Vault', icon: BookOpen },
]

export default function Sidebar() {
  return (
    <>
      {/* Desktop: lateral */}
      <aside className="hidden md:flex md:flex-col md:w-56 md:shrink-0 border-r border-slate-200 bg-white">
        <div className="h-14 flex items-center px-4 border-b border-slate-200">
          <span className="font-semibold text-slate-900">
            PM<span className="text-brand-600">·</span>TI
          </span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 text-[11px] text-slate-400 border-t border-slate-200">
          vault: <span className="font-mono">02_PROJECTS</span>
        </div>
      </aside>

      {/* Mobile: bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 grid grid-cols-5">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2 text-[11px] ${
                isActive ? 'text-brand-600' : 'text-slate-500'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
