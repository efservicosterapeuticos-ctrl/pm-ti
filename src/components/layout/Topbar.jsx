import { useLocation } from 'react-router-dom'

const TITLES = {
  '/dashboard': 'Dashboard',
  '/aplicacoes': 'Aplicações',
  '/dashboards': 'Dashboards',
  '/bots': 'Bots',
}

export default function Topbar() {
  const { pathname } = useLocation()
  let title = TITLES[pathname] ?? 'PM·TI'
  if (pathname.startsWith('/aplicacoes/')) title = 'Detalhe da aplicação'
  if (pathname.startsWith('/dashboards/')) title = 'Dashboard ao vivo'

  return (
    <header className="h-14 flex items-center px-4 md:px-6 bg-white border-b border-slate-200 shrink-0">
      <h1 className="text-base md:text-lg font-semibold text-slate-900 truncate">{title}</h1>
    </header>
  )
}
