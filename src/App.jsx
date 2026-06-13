import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import ApplicationDetail from './pages/ApplicationDetail'
import Dashboards from './pages/Dashboards'
import DashboardLive from './pages/DashboardLive'
import Bots from './pages/Bots'
import Vault from './pages/Vault'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/aplicacoes" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/aplicacoes" element={<Applications />} />
        <Route path="/aplicacoes/:slug" element={<ApplicationDetail />} />
        <Route path="/dashboards" element={<Dashboards />} />
        <Route path="/dashboards/:slug/:repo" element={<DashboardLive />} />
        <Route path="/bots" element={<Bots />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="*" element={<Navigate to="/aplicacoes" replace />} />
      </Route>
    </Routes>
  )
}
