import { BookOpen } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import VaultLogin from '../components/vault/VaultLogin'
import VaultBrowser from '../components/vault/VaultBrowser'

export default function Vault() {
  const { session, loading } = useSession()

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-10 text-center text-slate-400">
        verificando sessão...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-brand-50 text-brand-600 p-2">
          <BookOpen size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vault</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Segundo cérebro Obsidian · sincronizado com Supabase
          </p>
        </div>
      </div>

      {session ? <VaultBrowser session={session} /> : <VaultLogin />}
    </div>
  )
}
