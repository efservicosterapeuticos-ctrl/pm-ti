import { useState } from 'react'
import { Lock, Mail, KeyRound, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function VaultLogin() {
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [mode, setMode]       = useState('login')  // 'login' | 'signup'
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState(null)
  const [info, setInfo]       = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(null); setInfo(null)
    try {
      const fn = mode === 'signup' ? supabase.auth.signUp : supabase.auth.signInWithPassword
      const { error } = await fn({ email, password })
      if (error) throw error
      if (mode === 'signup') setInfo('Conta criada. Verifique seu email pra confirmar (se exigido).')
    } catch (err) {
      setError(err.message || 'Falha na autenticação')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="rounded-lg bg-brand-50 text-brand-600 p-2">
            <Lock size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Acesso ao vault</h2>
        </div>
        <p className="text-sm text-slate-500 mb-6">
          Esse é um espaço privado. Faça login pra acessar suas notas.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              className="input pl-9"
              placeholder="email@dominio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              className="input pl-9"
              placeholder="senha"
              value={password}
              onChange={(e) => setPass(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          {info && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              {info}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? '...' : (mode === 'signup' ? 'Criar conta' : 'Entrar')}
          </button>

          <div className="text-center text-xs text-slate-500 pt-2">
            {mode === 'login' ? (
              <button type="button" onClick={() => setMode('signup')} className="text-brand-700 hover:underline">
                Primeira vez? Criar conta
              </button>
            ) : (
              <button type="button" onClick={() => setMode('login')} className="text-brand-700 hover:underline">
                Já tenho conta · Voltar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
