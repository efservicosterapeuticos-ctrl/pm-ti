async function request(url, options) {
  const res = await fetch(url, options)
  if (!res.ok) {
    let err = `HTTP ${res.status}`
    try {
      const j = await res.json()
      if (j.error) err = j.error
    } catch {}
    throw new Error(err)
  }
  return res.json()
}

export const api = {
  listApps: () => request('/api/apps'),
  getApp: (slug) => request(`/api/apps/${encodeURIComponent(slug)}`),
  toggleTodo: (slug, file, line, done) =>
    request(`/api/apps/${encodeURIComponent(slug)}/todos`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file, line, done }),
    }),
  listDashboards: () => request('/api/dashboards'),
  listBots: () => request('/api/bots'),
  getBotConfig: (slug) => request(`/api/bots/${encodeURIComponent(slug)}/config`),
  saveBotConfig: (slug, cfg) =>
    request(`/api/bots/${encodeURIComponent(slug)}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    }),
  deleteBotConfig: (slug) =>
    request(`/api/bots/${encodeURIComponent(slug)}/config`, { method: 'DELETE' }),
  getBotStatus: (slug) => request(`/api/bots/${encodeURIComponent(slug)}/status`),
  startBot: (slug) =>
    request(`/api/bots/${encodeURIComponent(slug)}/start`, { method: 'POST' }),
  stopBot: (slug) =>
    request(`/api/bots/${encodeURIComponent(slug)}/stop`, { method: 'POST' }),
  getAppGithub: (slug, repo) => {
    const qs = repo ? `?repo=${encodeURIComponent(repo)}` : ''
    return request(`/api/apps/${encodeURIComponent(slug)}/github${qs}`)
  },
  health: () => request('/api/health'),
}

export function connectVaultWS(onChange) {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${proto}//${location.host}/ws`)
  ws.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'apps:changed') onChange(msg)
    } catch {}
  })
  return ws
}

export function connectBotWS(onMsg) {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${proto}//${location.host}/ws`)
  ws.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data)
      if (msg.type === 'bot:log' || msg.type === 'bot:status') onMsg(msg)
    } catch {}
  })
  return ws
}
