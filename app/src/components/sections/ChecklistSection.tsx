import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Item } from '../../types'
import { Editable, EditableTitle, SectionBadge } from './common'
import { BenefitIcon, BenefitImage } from '../../lib/benefitIcons'

export type ChecklistVariant = 'list' | 'right' | 'grid'

/**
 * 한 줄로 표시 가능한 짧은 문구도 항상 2줄로 보이게 강제 줄바꿈을 넣는다(이미
 * \n이 있으면 그대로 둠). 공백 중 중앙에 가장 가까운 지점을 우선 쓰고(단어가
 * 잘리지 않도록), 공백이 전혀 없는 텍스트는 글자 수 중간 지점에서 나눈다.
 */
function forceTwoLines(text: string): string {
  const t = text.trim()
  if (!t || t.includes('\n')) return t
  const mid = t.length / 2
  let bestIdx = -1
  let bestDist = Infinity
  for (let i = 0; i < t.length; i++) {
    if (t[i] === ' ') {
      const dist = Math.abs(i - mid)
      if (dist < bestDist) { bestDist = dist; bestIdx = i }
    }
  }
  if (bestIdx !== -1) return t.slice(0, bestIdx) + '\n' + t.slice(bestIdx + 1)
  if (t.length < 2) return t
  const cut = Math.ceil(t.length / 2)
  return t.slice(0, cut) + '\n' + t.slice(cut)
}

/**
 * list/right(가로형 카드)의 텍스트 컬럼. 보이지 않는 측정용 span으로 서브 문구가
 * 실제로 한 줄에 들어가는지 실측(ResizeObserver)해서 부모에 보고한다 — 카드 하나라도
 * 넘치면 섹션 전체가 2줄 모드로, 아니면 전체가 1줄 모드로 통일되도록 하기 위함.
 */
function DetailColumn({
  index,
  rawDetail,
  fontSize,
  onOverflowChange,
  children,
}: {
  index: number
  rawDetail: string
  fontSize: number
  onOverflowChange: (index: number, overflow: boolean) => void
  children: React.ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const containerEl = containerRef.current
    const measureEl = measureRef.current
    if (!containerEl || !measureEl) return
    const check = () => onOverflowChange(index, measureEl.scrollWidth > containerEl.clientWidth)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(containerEl)
    return () => ro.disconnect()
  }, [index, rawDetail, fontSize, onOverflowChange])
  return (
    <div ref={containerRef} style={{ flex: 1, minWidth: 0, position: 'relative' }}>
      {children}
      <span
        ref={measureRef}
        style={{ position: 'absolute', top: 0, left: 0, visibility: 'hidden', whiteSpace: 'nowrap', fontSize, fontWeight: 600, letterSpacing: '-0.02em' }}
      >
        {rawDetail}
      </span>
    </div>
  )
}

/**
 * Benefit list section (구매 혜택 / 항공사 강조). `variant` changes the layout
 * so sibling benefit sections don't all look the same:
 *  - list : icon left, text left
 *  - right: text left, image right
 *  - grid : 2-col cards, icon top-center, text centered
 *
 * 모든 카드는 콘텐츠 길이와 무관하게 동일한 고정 크기 · 동일한 내부 여백을 가지며,
 * 이미지·텍스트는 카드 내부에 담긴다(밖으로 벗어나지 않음). 타이틀/상세는 각각
 * 최대 2줄로 말줄임 처리된다.
 */
export function ChecklistSection({
  id,
  order,
  padX,
  badge,
  title,
  titleKey,
  items,
  ovPrefix,
  accent,
  soft,
  variant = 'list',
  scale = 1,
  ovGet,
  setOv,
  benefitImg,
  extraTopPad = false,
  extraBottomPad = false,
}: {
  id: string
  order: number
  padX: number
  badge?: string
  title: string
  titleKey: string
  items: Item[]
  ovPrefix: string
  accent: string
  soft: string
  variant?: ChecklistVariant
  scale?: number
  ovGet: (k: string, def: string) => string
  setOv: (k: string, v: string) => void
  /** 페이지 전역 중복 최소화 이미지 리졸버. id = `${ovPrefix}${i}`. */
  benefitImg?: (id: string) => string
  /** 이 섹션이 현재 HIGHLIGHT 배지 중 첫/마지막일 때 상/하단 여백을 조금 더 넓힌다. */
  extraTopPad?: boolean
  extraBottomPad?: boolean
}) {
  const pad = Math.round(20 * scale)
  // list/right(가로형 카드, 예: 항공사 강조)는 서브 문구가 모든 카드에서 한 줄에
  // 들어가는지 실측해서, 하나라도 넘치면 섹션 전체를 2줄로, 아니면 전체를 1줄로 통일한다.
  const isRowVariant = variant !== 'grid'
  const [rowDetailOverflowMap, setRowDetailOverflowMap] = useState<Record<number, boolean>>({})
  useEffect(() => setRowDetailOverflowMap({}), [items.length, variant])
  const handleRowDetailOverflow = useCallback(
    (i: number, overflow: boolean) => setRowDetailOverflowMap((prev) => (prev[i] === overflow ? prev : { ...prev, [i]: overflow })),
    [],
  )
  const anyRowDetailOverflow = Object.values(rowDetailOverflowMap).some(Boolean)
  // 상세 문구가 없는 섹션(예: 구매 혜택)은 더 컴팩트한 카드로, 있는 섹션(예: 항공사
  // 강조)은 텍스트가 잘리지 않도록 조금 더 높게. 카드 크기는 섹션 내에서 항상 동일.
  const gridHasDetails = items.some((b, i) => !!ovGet(`${ovPrefix}${i}d`, b.d))
  const gridPad = Math.round(18 * scale)
  const gridHeight = Math.round((gridHasDetails ? 255 : 226) * scale)
  // 박스 높이는 동일하게 유지. 상세 문구가 없는 그리드(구매 혜택)는 여백이 있어
  // 이미지를 더 크게, 상세가 있는 그리드(항공사 강조)는 잘림 방지를 위해 작게.
  const gridImg = Math.round((gridHasDetails ? 72 : 88) * scale)
  // list/right(가로형 카드)는 타이틀이 한 줄로 고정 노출된다(항공사 강조 등).
  // grid(구매 혜택)는 텍스트 길이와 무관하게 항상 2줄로 강제 노출된다.
  const titleSingleLine = variant !== 'grid'
  const titleEl = (i: number, b: Item, center: boolean, topGap = 0) => {
    const raw = ovGet(`${ovPrefix}${i}t`, b.t)
    const value = titleSingleLine ? raw : forceTwoLines(raw)
    return (
      <Editable
        value={value}
        onCommit={(t) => setOv(`${ovPrefix}${i}t`, t)}
        style={{
          fontSize: 18 * scale,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1.35,
          marginTop: topGap,
          overflow: 'hidden',
          wordBreak: 'keep-all',
          ...(titleSingleLine
            ? { whiteSpace: 'nowrap' as const, textOverflow: 'ellipsis' as const, height: Math.round(1.35 * 18 * scale) }
            : { whiteSpace: 'pre-line' as const, height: Math.round(2 * 1.35 * 18 * scale) }),
          ...(center ? { textAlign: 'center' as const } : null),
        }}
      />
    )
  }
  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #e9ecef',
    borderRadius: 20,
  }
  // grid(구매 혜택)는 서브 문구를 항상 2줄로 강제 노출한다. list/right(항공사 강조 등)는
  // 실측 결과 하나라도 한 줄을 넘치면 2줄, 전부 한 줄에 들어가면 1줄로 통일한다.
  const detailForceTwoLines = variant === 'grid' ? true : anyRowDetailOverflow
  const detailSingleLine = isRowVariant && !detailForceTwoLines
  const detailEl = (i: number, b: Item, center: boolean, topGap = 3) => {
    const raw = ovGet(`${ovPrefix}${i}d`, b.d)
    if (!raw) return null
    const value = detailForceTwoLines ? forceTwoLines(raw) : raw
    return (
      <Editable
        value={value}
        onCommit={(t) => setOv(`${ovPrefix}${i}d`, t)}
        style={{
          fontSize: 16 * scale,
          fontWeight: 600,
          color: '#848c94',
          marginTop: topGap,
          letterSpacing: '-0.02em',
          lineHeight: 1.4,
          overflow: 'hidden',
          wordBreak: 'keep-all',
          ...(detailSingleLine
            ? { whiteSpace: 'nowrap' as const, textOverflow: 'ellipsis' as const, height: Math.round(1.4 * 16 * scale) }
            : { height: Math.round(2 * 1.4 * 16 * scale), ...(detailForceTwoLines ? { whiteSpace: 'pre-line' as const } : null) }),
          ...(center ? { textAlign: 'center' as const } : null),
        }}
      />
    )
  }

  // 개수가 홀수일 때만, 사용자가 카드 1개를 골라 최상단에 가로 전체 폭 카드로 뺄 수 있다.
  const isOdd = variant === 'grid' && items.length % 2 === 1
  const featuredRaw = isOdd ? ovGet(`${ovPrefix}Featured`, '') : ''
  const featuredIdx = featuredRaw !== '' ? Number(featuredRaw) : null
  const validFeaturedIdx = featuredIdx != null && featuredIdx >= 0 && featuredIdx < items.length ? featuredIdx : null

  // 대표 카드가 맨 앞으로 옮겨진 화면상 순서 기준으로 번호를 다시 매긴다.
  const displayNumber = (i: number): number => {
    if (validFeaturedIdx == null) return i + 1
    if (i === validFeaturedIdx) return 1
    return i < validFeaturedIdx ? i + 2 : i + 1
  }

  const gridCard = (i: number, b: Item, featured: boolean) => (
    <div
      key={i}
      style={{
        ...cardStyle,
        position: 'relative',
        height: gridHeight,
        padding: gridPad,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Math.round(12 * scale),
        overflow: 'hidden',
        ...(featured ? { gridColumn: '1 / -1' } : null),
      }}
    >
      {isOdd && (
        <button
          type="button"
          data-no-export="true"
          onClick={() => setOv(`${ovPrefix}Featured`, featured ? '' : String(i))}
          title={featured ? '대표 카드 해제' : '이 카드를 최상단 대표 카드로 지정'}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 26,
            height: 26,
            border: 'none',
            background: 'transparent',
            fontSize: 16,
            lineHeight: 1,
            padding: 0,
            cursor: 'pointer',
            color: featured ? accent : '#ced4da',
          }}
        >
          {featured ? '★' : '☆'}
        </button>
      )}
      <span
        style={{
          flexShrink: 0,
          width: Math.round(26 * scale),
          height: Math.round(26 * scale),
          borderRadius: '50%',
          background: accent,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13 * scale,
          fontWeight: 700,
        }}
      >
        {displayNumber(i)}
      </span>
      {b.cat ? (
        <BenefitImage src={benefitImg?.(`${ovPrefix}${i}`)} cat={b.cat} title={b.t} soft={soft} size={gridImg} plain />
      ) : (
        <BenefitIcon title={b.t} accent={accent} soft={soft} size={gridImg - 4} radius={16} gradient />
      )}
      <div style={{ width: '100%' }}>
        {titleEl(i, b, true)}
        {detailEl(i, b, true)}
      </div>
    </div>
  )

  return (
    <section
      id={id}
      style={{ order, padding: `${extraTopPad ? 56 : 36}px ${padX}px ${extraBottomPad ? 56 : 36}px`, background: '#fff' }}
    >
      <SectionBadge label={badge} accent={accent} scale={scale} />
      <EditableTitle value={ovGet(titleKey, title)} onCommit={(t) => setOv(titleKey, t)} scale={scale} />

      {variant === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {validFeaturedIdx != null && gridCard(validFeaturedIdx, items[validFeaturedIdx], true)}
          {items.map((b, i) => (i === validFeaturedIdx ? null : gridCard(i, b, false)))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((b, i) => {
            const imgSize = Math.round(76 * scale)
            const img = b.cat ? (
              <BenefitImage src={benefitImg?.(`${ovPrefix}${i}`)} cat={b.cat} title={b.t} soft={soft} size={imgSize} plain />
            ) : (
              <BenefitIcon title={b.t} accent={accent} soft={soft} size={Math.round(44 * scale)} radius={16} forceKey="check" plain />
            )
            const rawDetail = ovGet(`${ovPrefix}${i}d`, b.d)
            const column = (
              <DetailColumn index={i} rawDetail={rawDetail} fontSize={16 * scale} onOverflowChange={handleRowDetailOverflow}>
                {titleEl(i, b, false)}
                {detailEl(i, b, false)}
              </DetailColumn>
            )
            return (
              <div
                key={i}
                style={{
                  ...cardStyle,
                  height: anyRowDetailOverflow ? Math.round(128 * scale) : Math.round(104 * scale),
                  padding: pad,
                  display: 'flex',
                  alignItems: 'center',
                  gap: Math.round(16 * scale),
                }}
              >
                {variant === 'right' ? (
                  <>
                    {column}
                    {img}
                  </>
                ) : (
                  <>
                    {img}
                    {column}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
