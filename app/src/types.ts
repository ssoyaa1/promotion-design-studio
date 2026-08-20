export type PromoType = 'live' | 'plan'
export type Device = 'mobile' | 'pc'
export type ThemeKey = 'red' | 'orange' | 'blue' | 'lime' | 'teal' | 'dark' | 'purple' | 'pink'

export interface Theme {
  name: string
  accent: string
  soft: string
  deep: string
}

/** A single benefit / prize / highlight line item. */
export interface Item {
  t: string
  d: string
  icon?: string
  /** 혜택 구분 값 (카드/이심/쿠폰 …) — 이미지 자동 매칭에 사용. */
  cat?: string
}

export interface HighlightRoute {
  from: string // airport code
  to: string // airport code
  label?: string // [메인 문구] — 카드 설명 텍스트
  intro?: string // [서브 문구] — 더 긴 설명
}

export interface City {
  code: string
  name: string
  price: string
}

export interface Region {
  name: string
  cities: City[]
}

export interface Departure {
  name: string
  regions: Region[]
}

/** The full promotion data model — seed default or built from a sheet. */
export interface PromoData {
  promoType?: PromoType
  promoName: string
  subtitle: string
  airline: string
  liveTime: string
  period: string
  salesPeriod: string
  boardingPeriod: string
  boardingNote: string
  liveBenefits: Item[]
  prizes: Item[]
  purchaseBenefits: Item[]
  /** Optional — populated from the sheet's `■ 항공사 강조` block. */
  airlineHighlights: Item[]
  highlight: HighlightRoute[]
  departures: Departure[]
  ctaLabel: string
}

/** Base (non-route) section keys. Route keys are `r_{depIdx}_{regIdx}`. */
export type BaseSectionKey =
  | 'visual'
  | 'schedule'
  | 'airline'
  | 'prize'
  | 'purchase'
  | 'highlight'
  | 'cta'

export type SectionKey = BaseSectionKey | string

export interface RouteMeta {
  label: string
  depIdx: number
  regIdx: number
}

export interface StudioState {
  promoType: PromoType
  device: Device
  theme: ThemeKey
  /** 'auto' = 항공사 브랜드 컬러 자동 적용, 'custom' = 사용자가 테마를 직접 선택함. */
  themeMode: 'auto' | 'custom'
  selectedKey: SectionKey
  order: SectionKey[]
  hidden: Record<string, boolean>
  imagesLoaded: boolean
  /** Text overrides keyed by field id (name, sub, airline, lb0t, ...). */
  ov: Record<string, string>
  heroImage: string | null
  airlineLogo: string | null
  planeImage: string | null
  planeOffsetY: number
  planeScale: number
  skyIndex: number
  airlineTitleSeed: number
  highlightTitleSeed: number
  prizeTitleSeed: number
  purchaseTitleSeed: number
  /** 메인 비주얼 타이틀 폰트 랜덤 시드(HERO_TITLE_FONTS 인덱스). */
  heroTitleFontSeed: number
  importedData: PromoData | null
  sheetUrl: string
  sheetStatus: string
  // Unsplash picker
  pickerOpen: boolean
  pickerCat: string
  pickerUrl: string
  unsplashKey: string
  searchQuery: string
  searchResults: { thumb: string; full: string }[]
  searching: boolean
  searchError: string
}
