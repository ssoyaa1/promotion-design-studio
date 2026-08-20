import type { PromoData, Departure, City, Item, HighlightRoute } from '../types'
import { EMPTY_DATA, AIRPORTS } from '../data/seed'
import { splitRows, detectDelimiter } from './csv'
import { formatDatesKo } from './dates'

type Row = Record<string, string>

/** Case-insensitive-ish substring column lookup within a record. */
function col(o: Row, subs: string[]): string {
  for (const k in o) {
    if (subs.some((s) => k.includes(s))) return (o[k] || '').trim()
  }
  return ''
}

/** Look up a key-value field in the project-info block by substring. */
function g(o: Row, subs: string[]): string {
  for (const k in o) {
    if (subs.some((s) => k.includes(s))) return (o[k] || '').trim()
  }
  return ''
}

/** `start – end`, tolerating either side being blank. */
function range(start: string, end: string): string {
  const a = (start || '').trim()
  const b = (end || '').trim()
  if (a && b) return `${a} – ${b}`
  return a || b
}

/**
 * Read a benefit table into {t, d, cat}.
 * [메인 문구] / [서브 문구] 컬럼이 있으면 우선 사용하고,
 * 없으면 [혜택명]/[경품명]/[타이틀] → t, [내용]/[수량] → d 순으로 폴백.
 */
function benefitRows(rows: Row[]): Item[] {
  return rows
    .map((o) => {
      const keys = Object.keys(o)
      const catKey = keys.find((k) => /구분|카테고리|category/i.test(k))
      const titleKey = keys.find((k) => /혜택명|타이틀|제목|경품명|이름|title/i.test(k))
      const mainKey = keys.find((k) => /메인\s*문구/i.test(k))
      const subKey = keys.find((k) => /서브\s*문구/i.test(k))
      const detailKey = keys.find((k) => /내용|상세|설명|수량|비고/i.test(k))
      const rest = keys.filter((k) => k !== catKey && k !== titleKey && k !== mainKey && k !== subKey && k !== detailKey)
      const t = ((mainKey ? o[mainKey] : titleKey ? o[titleKey] : o[rest[0]]) || '').trim()
      const d = ((subKey ? o[subKey] : detailKey ? o[detailKey] : rest[1] ? o[rest[1]] : '') || '').trim()
      const cat = ((catKey ? o[catKey] : '') || '').trim()
      return { t, d, cat }
    })
    .filter((x) => x.t)
}

/** `수량`처럼 숫자만 있는 값을 경품 상세 문구로 다듬는다. */
function prizeDetail(d: string): string {
  const n = d.trim()
  return /^\d+$/.test(n) ? `· ${n}명` : d
}

/**
 * 라이브 경품 전용 파서: 서브 문구는 항상 [수량] 컬럼 값을 사용한다
 * (다른 혜택 테이블처럼 [서브 문구]/[내용]으로 대체되지 않도록 분리).
 */
function prizeRows(rows: Row[]): Item[] {
  return rows
    .map((o) => {
      const keys = Object.keys(o)
      const catKey = keys.find((k) => /구분|카테고리|category/i.test(k))
      const titleKey = keys.find((k) => /혜택명|타이틀|제목|경품명|이름|title/i.test(k))
      const mainKey = keys.find((k) => /메인\s*문구/i.test(k))
      const qtyKey = keys.find((k) => /수량/i.test(k))
      const rest = keys.filter((k) => k !== catKey && k !== titleKey && k !== mainKey && k !== qtyKey)
      const t = ((mainKey ? o[mainKey] : titleKey ? o[titleKey] : o[rest[0]]) || '').trim()
      const d = (qtyKey ? o[qtyKey] : '') || ''
      const cat = ((catKey ? o[catKey] : '') || '').trim()
      return { t, d: d.trim(), cat }
    })
    .filter((x) => x.t)
}

/**
 * 항공사 강조 전용 파서: 메인/서브 문구는 항상 [메인 문구]/[서브 문구] 컬럼 값을
 * 사용한다(다른 혜택 테이블처럼 [타이틀]/[내용]으로 대체되지 않도록 분리).
 */
function airlineHighlightRows(rows: Row[]): Item[] {
  return rows
    .map((o) => {
      const keys = Object.keys(o)
      const catKey = keys.find((k) => /구분|카테고리|category/i.test(k))
      const mainKey = keys.find((k) => /메인\s*문구/i.test(k))
      const subKey = keys.find((k) => /서브\s*문구/i.test(k))
      const t = (mainKey ? o[mainKey] : '').trim()
      const d = (subKey ? o[subKey] : '').trim()
      const cat = ((catKey ? o[catKey] : '') || '').trim()
      return { t, d, cat }
    })
    .filter((x) => x.t)
}

const cityName = (code: string, fallback?: string): string =>
  (fallback && fallback.trim()) || AIRPORTS[code] || code

/**
 * Parse a promotion-request sheet (CSV/TSV text) into a full PromoData model.
 * Handles the reference field names AND the variable sheet format
 * (split start/end date fields, `■ 항공사 강조` block, code-only routes).
 */
export function parseSheet(text: string): PromoData {
  return parseMatrix(splitRows(text, detectDelimiter(text)))
}

/**
 * Same as parseSheet but takes an already-split 2D matrix — used by the
 * Google Sheets API path (values.get returns rows directly, no CSV).
 */
export function parseMatrix(matrix: string[][]): PromoData {
  const rows = matrix.map((r) => r.map((c) => (c || '').trim()))
  // 헤더 셀은 "[필드명]" 뒤에 "- 16자 이내"처럼 안내용 텍스트가 덧붙는 경우가 있어,
  // 끝까지 완전히 "[...]" 형태일 필요 없이 앞쪽 대괄호 블록만 있으면 필드로 인정한다.
  const isField = (c: string) => /^\[[^[\]]*\]/.test(c)
  const strip = (s: string) => {
    const m = /^\[([^[\]]*)\]/.exec(s)
    return (m ? m[1] : s.replace(/^\[|\]$/g, '')).trim()
  }

  // 시트 첫 행의 첫 번째 셀 (예: "대한항공_마이썸머페스타") — 항공사명 추출에 사용
  const firstRow = rows.find((r) => r[0] && r[0].charAt(0) !== '■' && !isField(r[0]))
  const sheetTitle = firstRow ? firstRow[0] : ''

  let sec = ''
  let headers: string[] | null = null
  const kv: Record<string, Row> = {}
  const tables: Record<string, Row[]> = {}

  rows.forEach((cells) => {
    if (!cells.some((c) => c !== '')) return
    if ((cells[0] || '').charAt(0) === '■') {
      sec = cells[0].replace(/^■\s*/, '').trim()
      headers = null
      return
    }
    const brackets = cells.filter(isField)
    if (brackets.length >= 2) {
      headers = cells.map((c) => (isField(c) ? strip(c) : ''))
      return
    }
    if (brackets.length === 1) {
      const li = cells.findIndex(isField)
      const val = cells.slice(li + 1).find((c) => c !== '') || ''
      ;(kv[sec] = kv[sec] || {})[strip(cells[li])] = val
      return
    }
    if (headers) {
      const obj: Row = {}
      headers.forEach((h, i) => {
        if (h) obj[h] = cells[i] || ''
      })
      ;(tables[sec] = tables[sec] || []).push(obj)
      return
    }
    // 브래킷 없는 plain "키\t값" 행 (새 시트 형식: ■ 프로모션 개요 등)
    if (cells[0]) {
      const rawKey = cells[0].replace(/^[\s└]+/, '').trim()
      if (rawKey) {
        const val = cells.slice(1).find((c) => c !== '') || ''
        ;(kv[sec] = kv[sec] || {})[rawKey] = val
      }
    }
  })

  return buildData(kv, tables, sheetTitle)
}

export function buildData(
  kv: Record<string, Row>,
  tables: Record<string, Row[]>,
  sheetTitle = '',
): PromoData {
  const D: PromoData = JSON.parse(JSON.stringify(EMPTY_DATA))
  const proj = kv['프로모션 개요'] || kv['프로젝트 정보'] || kv['프로젝트정보'] || {}
  const T = (k: string): Row[] => tables[k] || []

  // ---- project info (key-value) ----
  const set = (v: string, f: keyof PromoData) => {
    if (v) (D[f] as unknown as string) = v
  }
  set(g(proj, ['프로모션 명', '프로모션명', '제목']), 'promoName')
  set(g(proj, ['부제', '서브']), 'subtitle')
  // 시트 명시 항공사 필드 우선, 없으면 시트 첫 행 제목에서 추출.
  // 새 형식: "8.25 제주항공 라이브" — 공백 분리 후 [0]=날짜, [1]=항공사, [2]=유형.
  // 구 형식: "대한항공_8월 단독 특가_PDR" — 첫 _ 앞이 항공사.
  let airlineFromTitle = ''
  if (sheetTitle) {
    const sp = sheetTitle.trim().split(/\s+/)
    if (/^\d+[./]\d+/.test(sp[0]) && sp.length >= 2) {
      // 새 형식: 날짜로 시작
      airlineFromTitle = sp[1]
    } else if (sheetTitle.includes('_')) {
      // 구 형식: 언더바 구분
      airlineFromTitle = sheetTitle.split('_')[0]
    } else {
      // 폴백: 첫 토큰
      airlineFromTitle = sp[0]
    }
  }
  set(g(proj, ['항공사']) || airlineFromTitle, 'airline')

  // dates: prefer whole-range fields, else compose split start/end fields.
  // All date tokens are normalized to `YYYY년 MM월 DD일`.
  // '└ 라이브' 키는 파싱 시 '라이브'로 정규화됨
  const liveWhole = g(proj, ['라이브 일시', '라이브 시간', '라이브'])
  const liveTime = liveWhole || range(g(proj, ['라이브 시작']), g(proj, ['라이브 종료']))
  set(formatDatesKo(liveTime), 'liveTime')

  // '본 프로모션 기간' → 판매 기간(salesPeriod)
  const salesWhole = g(proj, ['판매', '본 프로모션'])
  const promoRange = range(g(proj, ['프로모션 시작']), g(proj, ['프로모션 종료']))
  set(formatDatesKo(salesWhole || promoRange), 'salesPeriod')

  const periodWhole = g(proj, ['프로모션 기간'])
  set(formatDatesKo(periodWhole || promoRange), 'period')

  const boardingWhole = g(proj, ['탑승', '출발 기간'])
  const departRange = range(g(proj, ['출발 시작']), g(proj, ['출발 종료']))
  set(formatDatesKo(boardingWhole || departRange), 'boardingPeriod')

  const pt = g(proj, ['타입', '유형'])
  if (pt) {
    D.promoType = /기획/.test(pt) ? 'plan' : 'live'
  }

  // ---- 항공사 강조 (optional) ----
  const air = airlineHighlightRows(T('항공사 강조').concat(T('항공사강조')))
  D.airlineHighlights = air

  // ---- 강조 노선 ----
  const hl = T('강조 노선').concat(T('강조노선'))
  if (hl.length) {
    const arr: HighlightRoute[] = hl
      .map((o) => {
        const keys = Object.keys(o)
        const mainKey = keys.find((k) => /메인\s*문구/i.test(k))
        const subKey = keys.find((k) => /서브\s*문구/i.test(k))
        return {
          from: col(o, ['출발']),
          to: col(o, ['도착']),
          label: mainKey ? (o[mainKey] || '').trim() || undefined : undefined,
          intro: subKey ? (o[subKey] || '').trim() || undefined : undefined,
        }
      })
      .filter((x) => x.from && x.to)
    if (arr.length) D.highlight = arr
  }

  // ---- benefit / prize / purchase tables ----
  // 라이브 혜택 · 구매 혜택: [구분][혜택명][내용] → 구분으로 이미지 매칭.
  const lb = benefitRows(T('라이브 혜택'))
  if (lb.length) D.liveBenefits = lb
  // 라이브 경품: [구분][경품명][수량] → 구분으로 이미지 매칭(혜택/구매와 동일 방식).
  // 서브 문구는 항상 [수량] 컬럼 값(prizeRows가 고정 소싱).
  const pz = prizeRows(T('라이브 경품'))
  if (pz.length) D.prizes = pz.map((p) => ({ ...p, d: prizeDetail(p.d) }))
  const pb = benefitRows(T('구매 혜택'))
  if (pb.length) D.purchaseBenefits = pb

  // 명시적 타입 필드가 없을 때: 라이브 시간·혜택·경품이 모두 비어 있으면 기획전
  if (!pt) {
    const hasLiveData = D.liveTime || D.liveBenefits.length > 0 || D.prizes.length > 0
    D.promoType = hasLiveData ? 'live' : 'plan'
  }

  // ---- 전체 노선 → (departure → region → cities) tree ----
  const ar = T('전체 노선').concat(T('전체노선'))
  if (ar.length) {
    const byDep: Record<string, Record<string, City[]>> = {}
    ar.forEach((o) => {
      const depCode = col(o, ['출발지', '출발'])
      const reg = col(o, ['권역', '지역', '대륙']) || '기타'
      const toCode = col(o, ['도착지', '도착', '목적지'])
      const explicitCity = col(o, ['도시', '노선'])
      const code = toCode || col(o, ['공항', '코드'])
      const price = col(o, ['왕복', '가격', '운임']).replace(/[^0-9,]/g, '')
      const depCity = cityName(depCode)
      const name = cityName(code, explicitCity)
      if (!depCode || !code) return
      byDep[depCity] = byDep[depCity] || {}
      byDep[depCity][reg] = byDep[depCity][reg] || []
      byDep[depCity][reg].push({ code, name, price: price || '' })
    })
    const departures: Departure[] = Object.keys(byDep).map((dep) => ({
      name: /출발\s*$/.test(dep) ? dep : dep + ' 출발',
      regions: Object.keys(byDep[dep]).map((reg) => ({
        name: reg,
        cities: byDep[dep][reg],
      })),
    }))
    if (departures.length) D.departures = departures
  }

  return D
}
