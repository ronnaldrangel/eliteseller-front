// Simple shared cache to deduplicate /profile requests between client components
const cache = new Map()

function key(profileUrl, apiKey) {
  return `${profileUrl}|${apiKey || ''}`
}

export function getCachedProfile(profileUrl, apiKey) {
  const entry = cache.get(key(profileUrl, apiKey))
  return entry?.resolved || null
}

export function clearProfileCache(profileUrl, apiKey) {
  cache.delete(key(profileUrl, apiKey))
}

export function fetchWazendProfile(profileUrl, apiKey, delayMs = 700) {
  if (!profileUrl) {
    return Promise.resolve({ status: undefined, payload: null, errorMsg: 'Missing profileUrl' })
  }
  const k = key(profileUrl, apiKey)
  const existing = cache.get(k)
  if (existing?.promise) return existing.promise
  if (existing?.resolved) return Promise.resolve(existing.resolved)

  const controller = new AbortController()
  const promise = (async () => {
    try {
      const ms = Math.max(0, Number(delayMs) || 0)
      if (ms) await new Promise(r => setTimeout(r, ms))
      const res = await fetch(profileUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'X-Api-Key': apiKey } : {}),
        },
        cache: 'no-store',
        signal: controller.signal,
      })
      const data = await res.json().catch(() => ({}))
      const result = {
        status: res.status,
        payload: data,
        errorMsg: res.ok ? null : (data?.error?.message || `No se pudo obtener perfil (status ${res.status})`),
      }
      cache.set(k, { promise: null, resolved: result, controller, fetchedAt: Date.now() })
      return result
    } catch (e) {
      const result = {
        status: undefined,
        payload: null,
        errorMsg: e?.name !== 'AbortError' ? 'Error al conectar con Wazend (profile).' : null,
      }
      cache.set(k, { promise: null, resolved: result, controller, fetchedAt: Date.now() })
      return result
    }
  })()
  cache.set(k, { promise, resolved: null, controller, fetchedAt: null })
  return promise
}