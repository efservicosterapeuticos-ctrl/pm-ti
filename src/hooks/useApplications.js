import { useCallback, useEffect, useState } from 'react'
import { api, connectVaultWS } from '../lib/api'

export function useApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    try {
      setError(null)
      const data = await api.listApps()
      setApps(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
    const ws = connectVaultWS(() => refetch())
    return () => ws.close()
  }, [refetch])

  return { apps, loading, error, refetch }
}

export function useApplication(slug) {
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!slug) return
    try {
      setError(null)
      setLoading(true)
      const data = await api.getApp(slug)
      setApp(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    refetch()
    const ws = connectVaultWS((msg) => {
      if (msg.slug === slug) refetch()
    })
    return () => ws.close()
  }, [refetch, slug])

  return { app, loading, error, refetch }
}

export function useBots() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    try {
      setError(null)
      const data = await api.listBots()
      setItems(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
    const ws = connectVaultWS(() => refetch())
    return () => ws.close()
  }, [refetch])

  return { items, loading, error, refetch }
}

export function useDashboards() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    try {
      setError(null)
      const data = await api.listDashboards()
      setItems(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
    const ws = connectVaultWS(() => refetch())
    return () => ws.close()
  }, [refetch])

  return { items, loading, error, refetch }
}

export function useAppGithub(slug, repo) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    setError(null)
    api
      .getAppGithub(slug, repo)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [slug, repo])

  return { data, loading, error }
}
