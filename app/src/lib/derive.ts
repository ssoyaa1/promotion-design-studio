import type { StudioState, PromoData, SectionKey, Theme } from '../types'
import type { RouteInfo } from './routes'
import { THEMES, makeBrandTheme } from '../data/seed'
import { benefitImageKey, promoImgSrc } from './benefitImage'
import { pickAirlineTitle, pickHighlightTitle, pickPrizeTitle, pickPurchaseTitle } from './highlightTitles'
import { matchAirlineBrandColor } from './airlineBrandColor'

/** Keys that receive an auto-numbered "HIGHLIGHT n" badge, in this order. */
const BADGE_KEYS = ['schedule', 'airline', 'prize', 'purchase', 'highlight']

export interface Derived {
  theme: Theme
  /** 현재 항공사명으로 매칭된 브랜드 컬러(없으면 null). 설정 패널 안내문에 사용. */
  airlineBrandHex: string | null
  isLive: boolean
  isMobile: boolean
  deviceWidth: number
  /** Horizontal padding for content sections (hero is full-bleed, excluded). */
  padX: number
  /** Font scale multiplier (1 on mobile, larger on PC). */
  fontScale: number
  /** Scale a mobile px font size for the current device. */
  fs: (px: number) => number
  app: SectionKey[]
  visibleKeys: SectionKey[]
  ord: Record<string, number>
  show: Record<string, boolean>
  badge: Record<string, string>
  warnings: string[]
  sectionLabel: (k: SectionKey) => string
  /**
   * 혜택 이미지 경로 리졸버(페이지 전역 중복 최소화 적용).
   * id 규칙: 라이브 혜택 `lb{i}` · 라이브 경품 `pz{i}` · 구매 혜택 `pb{i}` · 항공사 강조 `ah{i}`.
   */
  benefitImg: (id: string) => string
  titles: {
    schedule: string
    prize: string
    purchase: string
    airline: string
    highlight: string
  }
  counts: { visibleCount: number; highlightCount: number; totalRouteCount: number }
  exportDevLabel: 'MO' | 'PC'
}

function baseLabel(k: SectionKey, isLive: boolean): string | null {
  switch (k) {
    case 'visual':
      return '메인 비주얼'
    case 'schedule':
      return isLive ? '라이브 일정' : '프로모션 기간'
    case 'airline':
      return '항공사 강조'
    case 'prize':
      return '라이브 혜택'
    case 'purchase':
      return '구매 혜택'
    case 'highlight':
      return '강조 노선'
    case 'cta':
      return '하단 CTA'
    default:
      return null
  }
}

export function derive(
  state: StudioState,
  data: PromoData,
  routeInfo: RouteInfo,
  ovGet: (k: string, def: string) => string,
): Derived {
  // 테마 결정 우선순위: 사용자 지정 색상 > 항공사 자동 브랜드 컬러 > 기존 기본 테마.
  const airlineName = ovGet('airline', data.airline)
  const airlineBrandHex = matchAirlineBrandColor(airlineName)
  const theme =
    state.themeMode === 'auto' && airlineBrandHex
      ? makeBrandTheme(airlineName, airlineBrandHex)
      : THEMES[state.theme]
  const isLive = state.promoType === 'live'
  const isMobile = state.device === 'mobile'
  const fontScale = isMobile ? 1 : 1.15

  // applicable keys. Live OFF(기획전)에서는 라이브 관련 섹션을 숨긴다:
  // 라이브 혜택(prize) · 구매 혜택(purchase). airline · highlight는 데이터 있을 때만.
  const base: SectionKey[] = ['visual', 'schedule', 'airline', 'prize', 'purchase', 'highlight', 'cta']
  const app = [...base, ...routeInfo.routeKeys].filter((k) => {
    if (k === 'airline') return data.airlineHighlights.length > 0
    if (k === 'prize') return isLive
    if (k === 'purchase') return isLive
    if (k === 'highlight') return data.highlight.length > 0
    return true
  })

  const ord: Record<string, number> = {}
  state.order.forEach((k, i) => {
    ord[k] = i
  })

  const show: Record<string, boolean> = {}
  app.forEach((k) => {
    show[k] = !state.hidden[k]
  })

  const visibleKeys = state.order.filter((k) => app.includes(k) && !state.hidden[k])

  const badge: Record<string, string> = {}
  state.order
    .filter((k) => BADGE_KEYS.includes(k) && app.includes(k) && !state.hidden[k])
    .forEach((k, i) => {
      badge[k] = `HIGHLIGHT ${i + 1}`
    })

  // 페이지 전역 혜택 이미지 배정(중복 최소화). 노출 순서(visibleKeys)대로 훑으며,
  // [구분]/키워드로 매칭된 이미지가 아직 페이지에서 안 쓰였으면 그대로, 이미 쓰였으면
  // etc로 대체. 'etc'는 catch-all이라 중복을 허용한다.
  const usedImg = new Set<string>()
  const imgKeyById: Record<string, string> = {}
  const assignImg = (id: string, cat?: string, title?: string): void => {
    const key = benefitImageKey(cat, title)
    let chosen = 'etc'
    if (key !== 'etc' && !usedImg.has(key)) {
      chosen = key
      usedImg.add(key)
    }
    imgKeyById[id] = chosen
  }
  visibleKeys.forEach((k) => {
    if (k === 'prize') {
      data.liveBenefits.forEach((b, i) => assignImg(`lb${i}`, b.cat, b.t))
      data.prizes.forEach((b, i) => assignImg(`pz${i}`, b.cat, b.t))
    } else if (k === 'purchase') {
      // 그리드 카드는 [구분]이 있을 때만 이미지를 노출(없으면 라인 아이콘)
      data.purchaseBenefits.forEach((b, i) => b.cat && assignImg(`pb${i}`, b.cat, b.t))
    } else if (k === 'airline') {
      data.airlineHighlights.forEach((b, i) => b.cat && assignImg(`ah${i}`, b.cat, b.t))
    }
  })
  const benefitImg = (id: string): string => promoImgSrc(imgKeyById[id] || 'etc')

  // validation (필수 항목 · 날짜)
  const warnings: string[] = []
  if (!ovGet('name', data.promoName)) warnings.push('프로모션 명이 비어 있습니다.')
  if (!data.airline) warnings.push('항공사 정보가 없습니다.')
  const dateStr = isLive ? ovGet('sched', data.liveTime) : ovGet('sched', data.period)
  const hasDate =
    /\d{2,4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일/.test(dateStr) ||
    /\d{4}[.\-/]\s?\d{1,2}[.\-/]\s?\d{1,2}/.test(dateStr)
  if (!hasDate) warnings.push('날짜 형식을 확인해주세요 (YY년 MM월 DD일).')

  const sectionLabel = (k: SectionKey): string =>
    baseLabel(k, isLive) ?? routeInfo.routeMeta[k]?.label ?? String(k)

  const totalRouteCount = data.departures.reduce(
    (a, d) => a + d.regions.reduce((x, r) => x + r.cities.length, 0),
    0,
  )

  return {
    theme,
    airlineBrandHex,
    isLive,
    isMobile,
    deviceWidth: isMobile ? 390 : 1060,
    padX: isMobile ? 22 : 330,
    fontScale,
    fs: (px: number) => Math.round(px * fontScale * 10) / 10,
    app,
    visibleKeys,
    ord,
    show,
    badge,
    warnings,
    sectionLabel,
    benefitImg,
    titles: {
      schedule: isLive ? '이 시간, 라이브에서 만나요' : '지금이 딱, 떠나기 좋은 기간',
      prize: pickPrizeTitle(state.prizeTitleSeed ?? 0),
      purchase: pickPurchaseTitle(state.purchaseTitleSeed ?? 0),
      airline: pickAirlineTitle(airlineName, state.airlineTitleSeed ?? 0),
      highlight: pickHighlightTitle(data.airline, state.highlightTitleSeed ?? 0),
    },
    counts: {
      visibleCount: app.filter((k) => !state.hidden[k]).length,
      highlightCount: data.highlight.length,
      totalRouteCount,
    },
    exportDevLabel: isMobile ? 'MO' : 'PC',
  }
}
