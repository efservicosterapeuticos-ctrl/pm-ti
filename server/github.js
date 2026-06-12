const TOKEN = process.env.GITHUB_TOKEN
const OWNER = process.env.GITHUB_OWNER || 'efservicosterapeuticos-ctrl'
const TTL_MS = 5 * 60 * 1000

const cache = new Map()

async function gh(path) {
  const key = path
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.at < TTL_MS) return hit.value

  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    const err = new Error(`GitHub ${res.status}: ${txt.slice(0, 200)}`)
    err.status = res.status
    throw err
  }
  const value = await res.json()
  cache.set(key, { at: now, value })
  return value
}

export function inferRepoFromApp(app) {
  // 1. URL prod → github.io/<repo>/ ou github.com/<owner>/<repo>
  for (const l of app.links || []) {
    const m1 = l.url.match(/github\.io\/([^/]+)/i)
    if (m1) return m1[1]
    const m2 = l.url.match(/github\.com\/[^/]+\/([^/?#]+)/i)
    if (m2) return m2[1].replace(/\.git$/i, '')
  }
  // 2. slug bate com algum repo conhecido (heurística direta)
  return null
}

export async function repoMeta(repo) {
  return gh(`/repos/${OWNER}/${repo}`)
}

export async function repoCommits(repo, perPage = 10) {
  return gh(`/repos/${OWNER}/${repo}/commits?per_page=${perPage}`)
}

export async function repoDeployments(repo, perPage = 5) {
  return gh(`/repos/${OWNER}/${repo}/deployments?per_page=${perPage}`)
}

export async function repoPagesStatus(repo) {
  try {
    return await gh(`/repos/${OWNER}/${repo}/pages`)
  } catch (e) {
    if (e.status === 404) return null
    throw e
  }
}

export function cacheStats() {
  return { size: cache.size, ttlMs: TTL_MS }
}

export function clearCache() {
  cache.clear()
}
