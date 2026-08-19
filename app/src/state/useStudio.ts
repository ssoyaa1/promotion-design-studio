import { useReducer, useCallback, useMemo, useEffect } from 'react'
import type { StudioState, PromoData, PromoType, Device, ThemeKey, SectionKey } from '../types'
import { EMPTY_DATA, BASE_ORDER } from '../data/seed'
import { regenRoutes } from '../lib/routes'
import { HIGHLIGHT_TITLE_COUNT, PRIZE_TITLE_COUNT, PURCHASE_TITLE_COUNT } from '../lib/highlightTitles'

const initialRoutes = regenRoutes(EMPTY_DATA.departures)

/** localStorage keys for values we persist across sessions. */
export const LS = {
  sheetUrl: 'mrt_sheet_url',
  unsplashKey: 'mrt_unsplash_key',
} as const

function lsGet(key: string): string {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}
function lsSet(key: string, value: string): void {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

// 공용 기본 Unsplash 키(빌드 시 심어짐). 사용자가 우측 패널에 직접 입력하면 그 값이 우선한다.
const ENV_UNSPLASH_KEY = (import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string | undefined) || ''

const initialState: StudioState = {
  promoType: 'live',
  device: 'mobile',
  theme: 'blue',
  selectedKey: 'visual',
  order: [...BASE_ORDER, ...initialRoutes.routeKeys],
  hidden: {},
  imagesLoaded: false,
  ov: {},
  heroImage: null,
  airlineLogo: null,
  planeImage: null,
  planeOffsetY: 0,
  planeScale: 100,
  skyIndex: Math.floor(Math.random() * 8),
  highlightTitleSeed: Math.floor(Math.random() * HIGHLIGHT_TITLE_COUNT),
  prizeTitleSeed: Math.floor(Math.random() * PRIZE_TITLE_COUNT),
  purchaseTitleSeed: Math.floor(Math.random() * PURCHASE_TITLE_COUNT),
  importedData: null,
  sheetUrl: lsGet(LS.sheetUrl),
  sheetStatus: '',
  pickerOpen: false,
  pickerCat: '전체',
  pickerUrl: '',
  unsplashKey: lsGet(LS.unsplashKey) || ENV_UNSPLASH_KEY,
  searchQuery: '',
  searchResults: [],
  searching: false,
  searchError: '',
}

type Action =
  | { type: 'patch'; patch: Partial<StudioState> }
  | { type: 'reorder'; from: SectionKey; to: SectionKey }
  | { type: 'toggleHidden'; key: SectionKey }
  | { type: 'toggleImages' }
  | { type: 'setOv'; key: string; value: string }
  | { type: 'loadData'; data: PromoData; routeKeys: string[] }

function reducer(state: StudioState, action: Action): StudioState {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch }
    case 'reorder': {
      const o = [...state.order]
      const fi = o.indexOf(action.from)
      const ti = o.indexOf(action.to)
      if (fi < 0 || ti < 0 || fi === ti) return state
      o.splice(fi, 1)
      o.splice(ti, 0, action.from)
      return { ...state, order: o }
    }
    case 'toggleHidden':
      return { ...state, hidden: { ...state.hidden, [action.key]: !state.hidden[action.key] } }
    case 'toggleImages':
      return { ...state, imagesLoaded: !state.imagesLoaded }
    case 'setOv':
      return { ...state, ov: { ...state.ov, [action.key]: action.value } }
    case 'loadData':
      return {
        ...state,
        importedData: action.data,
        ov: {},
        hidden: {},
        selectedKey: 'visual',
        promoType: action.data.promoType || state.promoType,
        order: [...BASE_ORDER, ...action.routeKeys],
        sheetStatus: '불러오기 완료 ✓',
      }
    default:
      return state
  }
}

export function useStudio() {
  const [state, dispatch] = useReducer(reducer, initialState)

  // persist the sheet link + Unsplash key so they survive reloads
  useEffect(() => {
    lsSet(LS.sheetUrl, state.sheetUrl)
  }, [state.sheetUrl])
  useEffect(() => {
    lsSet(LS.unsplashKey, state.unsplashKey)
  }, [state.unsplashKey])

  const data: PromoData = state.importedData || EMPTY_DATA
  const routeInfo = useMemo(() => regenRoutes(data.departures), [data])

  const patch = useCallback((p: Partial<StudioState>) => dispatch({ type: 'patch', patch: p }), [])
  const setPromoType = useCallback(
    (t: PromoType) =>
      dispatch({
        type: 'patch',
        patch: { promoType: t, selectedKey: t === 'plan' ? 'visual' : 'visual' },
      }),
    [],
  )
  const setDevice = useCallback((d: Device) => patch({ device: d }), [patch])
  const setTheme = useCallback((t: ThemeKey) => patch({ theme: t }), [patch])
  const selectKey = useCallback((k: SectionKey) => patch({ selectedKey: k }), [patch])
  const reorder = useCallback(
    (from: SectionKey, to: SectionKey) => dispatch({ type: 'reorder', from, to }),
    [],
  )
  const toggleHidden = useCallback((k: SectionKey) => dispatch({ type: 'toggleHidden', key: k }), [])
  const toggleImages = useCallback(() => dispatch({ type: 'toggleImages' }), [])
  const setOv = useCallback((k: string, v: string) => dispatch({ type: 'setOv', key: k, value: v }), [])
  const loadData = useCallback(
    (d: PromoData) => dispatch({ type: 'loadData', data: d, routeKeys: regenRoutes(d.departures).routeKeys }),
    [],
  )

  const ovGet = useCallback(
    (k: string, def: string) => {
      const v = state.ov[k]
      return v != null && v !== '' ? v : def
    },
    [state.ov],
  )

  return {
    state,
    data,
    routeInfo,
    patch,
    setPromoType,
    setDevice,
    setTheme,
    selectKey,
    reorder,
    toggleHidden,
    toggleImages,
    setOv,
    loadData,
    ovGet,
  }
}

export type Studio = ReturnType<typeof useStudio>
