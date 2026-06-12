import { useEffect, useState } from 'react'
import { api } from '../lib/api'

// Detecta se o backend Express (porta 3001) está respondendo.
// Útil em produção (GitHub Pages) pra esconder features que dependem dele.
// Retorna: null = checando, true = online, false = offline
export function useBackendHealth() {
  const [online, setOnline] = useState(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)

    api.health()
      .then(() => {
        if (!cancelled) setOnline(true)
      })
      .catch(() => {
        if (!cancelled) setOnline(false)
      })
      .finally(() => clearTimeout(timeout))

    return () => {
      cancelled = true
      clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  return online
}
