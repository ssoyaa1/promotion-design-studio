import type { PromoData, RouteMeta } from '../types'
import { EN } from '../data/seed'

export interface RouteInfo {
  routeKeys: string[]
  routeMeta: Record<string, RouteMeta>
  /** englishKey map for exports, base keys + route keys. */
  en: Record<string, string>
}

/** Build route section keys `r_{depIdx}_{regIdx}` from a data model. */
export function regenRoutes(departures: PromoData['departures']): RouteInfo {
  const routeKeys: string[] = []
  const routeMeta: Record<string, RouteMeta> = {}
  const en: Record<string, string> = { ...EN }
  ;(departures || []).forEach((d, i) =>
    d.regions.forEach((r, j) => {
      const k = `r_${i}_${j}`
      routeKeys.push(k)
      routeMeta[k] = { label: `${d.name} · ${r.name}`, depIdx: i, regIdx: j }
      en[k] = `routes_${i + 1}_${j + 1}`
    }),
  )
  return { routeKeys, routeMeta, en }
}
