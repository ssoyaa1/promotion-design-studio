import { useState, useEffect } from 'react'

/** 공항 코드별 로컬 이미지 경로 캐시 (세션 내 1회만 확인). null = 없음 */
const localCache = new Map<string, string | null>()
const EXTS = ['jpg', 'png', 'jpeg', 'webp']

function probeLocalImage(code: string): Promise<string | null> {
  return new Promise((resolve) => {
    let idx = 0
    const tryNext = () => {
      if (idx >= EXTS.length) { resolve(null); return }
      const src = `/assets/city/${code}.${EXTS[idx++]}`
      const img = new Image()
      img.onload = () => resolve(src)
      img.onerror = tryNext
      img.src = src
    }
    tryNext()
  })
}

/**
 * `/assets/city/{code}.{jpg|png|jpeg|webp}` 파일이 존재하면 그 경로를 반환하고,
 * 없으면 null을 반환한다. 결과는 메모리에 캐시된다.
 */
export function useLocalCityImage(code: string): string | null {
  const [src, setSrc] = useState<string | null>(() => localCache.get(code) ?? null)

  useEffect(() => {
    if (localCache.has(code)) {
      setSrc(localCache.get(code)!)
      return
    }
    let alive = true
    probeLocalImage(code).then((found) => {
      localCache.set(code, found)
      if (alive) setSrc(found)
    })
    return () => { alive = false }
  }, [code])

  return src
}

/**
 * Per-destination Unsplash image lookup. Given a city query and an Access
 * Key, returns one relevant landscape photo. Results are cached in memory
 * and localStorage so a city is fetched at most once (across sessions),
 * which keeps request counts under Unsplash's rate limit.
 */

const mem = new Map<string, string | null>()
const inflight = new Map<string, Promise<string | null>>()
const LS_PREFIX = 'mrt_unsplash_img:'

function readCache(norm: string): string | null | undefined {
  if (mem.has(norm)) return mem.get(norm)
  try {
    const ls = localStorage.getItem(LS_PREFIX + norm)
    if (ls) {
      mem.set(norm, ls)
      return ls
    }
  } catch {
    /* ignore */
  }
  return undefined
}

export async function searchCityImage(query: string, key: string): Promise<string | null> {
  const norm = query.trim().toLowerCase()
  if (!norm || !key) return null
  const cached = readCache(norm)
  if (cached !== undefined) return cached
  if (inflight.has(norm)) return inflight.get(norm)!

  const p = (async () => {
    try {
      const r = await fetch(
        `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&content_filter=high&query=${encodeURIComponent(
          query,
        )}&client_id=${encodeURIComponent(key)}`,
      )
      if (!r.ok) throw new Error(String(r.status))
      const j = await r.json()
      // full ≈ 2048px 폭 — regular(약 1080px)보다 고해상도.
      const url: string | null = j.results?.[0]?.urls?.full || j.results?.[0]?.urls?.regular || null
      mem.set(norm, url)
      if (url) {
        try {
          localStorage.setItem(LS_PREFIX + norm, url)
        } catch {
          /* ignore */
        }
      }
      return url
    } catch {
      // Cache the miss briefly in memory only (so we don't hammer the API),
      // but don't persist it — a later retry with a valid key can succeed.
      mem.set(norm, null)
      return null
    } finally {
      inflight.delete(norm)
    }
  })()
  inflight.set(norm, p)
  return p
}

/**
 * Hook: resolve a destination image URL. Returns null while loading, when
 * disabled, or when no key is set — callers fall back to a placeholder.
 */
export function useCityImage(query: string | undefined, enabled: boolean, key: string): string | null {
  const [url, setUrl] = useState<string | null>(() => {
    if (!enabled || !query || !key) return null
    const c = readCache(query.trim().toLowerCase())
    return typeof c === 'string' ? c : null
  })

  useEffect(() => {
    let alive = true
    if (!enabled || !query || !key) {
      setUrl(null)
      return
    }
    const cached = readCache(query.trim().toLowerCase())
    if (typeof cached === 'string') {
      setUrl(cached)
      return
    }
    searchCityImage(query, key).then((u) => {
      if (alive) setUrl(u)
    })
    return () => {
      alive = false
    }
  }, [query, enabled, key])

  return url
}
