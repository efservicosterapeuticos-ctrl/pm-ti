import { useCallback, useEffect, useRef, useState } from 'react'
import { api, connectBotWS } from '../lib/api'

const MAX_LOGS = 500

export function useBotRunner(slug) {
  const [status, setStatus] = useState({ status: 'stopped' })
  const [logs, setLogs] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const logsRef = useRef([])

  const refresh = useCallback(async () => {
    if (!slug) return
    try {
      const s = await api.getBotStatus(slug)
      setStatus({ status: s.status, pid: s.pid, startedAt: s.startedAt, exitCode: s.exitCode })
      if (Array.isArray(s.logs)) {
        logsRef.current = s.logs.slice(-MAX_LOGS)
        setLogs(logsRef.current.slice())
      }
    } catch (e) {
      setError(e.message)
    }
  }, [slug])

  useEffect(() => {
    refresh()
    const ws = connectBotWS((msg) => {
      if (msg.slug !== slug) return
      if (msg.type === 'bot:log') {
        logsRef.current.push(msg.line)
        if (logsRef.current.length > MAX_LOGS) {
          logsRef.current.splice(0, logsRef.current.length - MAX_LOGS)
        }
        setLogs(logsRef.current.slice())
      } else if (msg.type === 'bot:status') {
        setStatus({
          status: msg.status,
          pid: msg.pid,
          startedAt: msg.startedAt,
          exitCode: msg.exitCode,
        })
      }
    })
    return () => ws.close()
  }, [refresh, slug])

  const start = useCallback(async () => {
    setBusy(true); setError(null)
    try { await api.startBot(slug) } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }, [slug])

  const stop = useCallback(async () => {
    setBusy(true); setError(null)
    try { await api.stopBot(slug) } catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }, [slug])

  const clearLogs = useCallback(() => {
    logsRef.current = []
    setLogs([])
  }, [])

  return { status, logs, busy, error, start, stop, clearLogs, refresh }
}
