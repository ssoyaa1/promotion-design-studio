import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Studio } from '../../state/useStudio'
import type { Derived } from '../../lib/derive'
import type { Theme, HighlightRoute } from '../../types'
import { Editable, EditableTitle, SectionBadge, forceTwoLines } from './common'
import { AIRPORTS, cityQuery } from '../../data/seed'
import { destIntro } from '../../lib/destCopy'
import { useCityImage, useLocalCityImage } from '../../lib/unsplashImages'

const cityOf = (c: string) => AIRPORTS[c] || c

function HighlightCard({
  route,
  index,
  theme,
  enabled,
  unsplashKey,
  destOnly,
  onOverflowChange,
  fs,
  ovGet,
  setOv,
}: {
  route: HighlightRoute
  index: number
  theme: Theme
  enabled: boolean
  unsplashKey: string
  /** 섹션 내 어느 한 카드라도 한 줄을 넘치면, 모든 카드에 동일하게 적용되는 도착지 전용 표시 모드. */
  destOnly: boolean
  onOverflowChange: (index: number, overflow: boolean) => void
  fs: (px: number) => number
  ovGet: (k: string, def: string) => string
  setOv: (k: string, v: string) => void
}) {
  const localIm = useLocalCityImage(route.to)
  const im = useCityImage(cityQuery(route.to), enabled && !localIm, unsplashKey)
  const imgSrc = localIm || im
  const imgStyle: React.CSSProperties = imgSrc
    ? { background: `linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.15)),url('${imgSrc}') center/cover` }
    : {
        background: `linear-gradient(135deg,${theme.accent}22,${theme.deep}22)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }

  const fromText = ovGet(`hl${index}from`, cityOf(route.from))
  const toText = ovGet(`hl${index}to`, cityOf(route.to))
  const titleRowRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)

  // 이 카드의 "출발 → 도착" 전체 텍스트가 카드 폭을 넘치는지 항상 측정해서 부모에 보고한다.
  // (destOnly가 적용돼 도착지만 보이는 중이어도, 숨겨둔 측정용 스팬은 항상 전체 텍스트 기준으로
  // 측정하므로 이름이 짧아지면 자동으로 다시 전체 표시로 돌아올 수 있다.)
  useLayoutEffect(() => {
    const rowEl = titleRowRef.current
    const measureEl = measureRef.current
    if (!rowEl || !measureEl) return
    const check = () => onOverflowChange(index, measureEl.scrollWidth > rowEl.clientWidth)
    check()
    const ro = new ResizeObserver(check)
    ro.observe(rowEl)
    return () => ro.disconnect()
  }, [index, fromText, toText, onOverflowChange])

  const titleFontSize = fs(18)

  return (
    <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ height: 112, ...imgStyle }} />
      <div style={{ padding: '13px 14px 16px' }}>
        <div
          ref={titleRowRef}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: titleFontSize, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.25, overflow: 'hidden', height: Math.round(1.25 * titleFontSize), flexShrink: 0 }}
        >
          <span
            ref={measureRef}
            style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap', fontSize: titleFontSize, fontWeight: 700, letterSpacing: '-0.03em' }}
          >
            {fromText} → {toText}
          </span>
          {destOnly ? (
            <>
              <svg width={Math.round(titleFontSize * 0.8)} height={Math.round(titleFontSize * 0.8)} viewBox="0 0 24 24" fill={theme.accent} style={{ flexShrink: 0 }}>
                <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.34 7.02 11.6a1 1 0 0 0 1.36 0C13 21.34 20 15.25 20 10c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
              </svg>
              <Editable as="span" value={toText} onCommit={(t) => setOv(`hl${index}to`, t)} />
            </>
          ) : (
            <>
              <Editable as="span" value={fromText} onCommit={(t) => setOv(`hl${index}from`, t)} />
              <span style={{ color: theme.accent, flexShrink: 0 }}>→</span>
              <Editable as="span" value={toText} onCommit={(t) => setOv(`hl${index}to`, t)} />
            </>
          )}
        </div>
        <Editable
          value={forceTwoLines(ovGet(`hl${index}intro`, route.label || destIntro(route.to, cityOf(route.to))))}
          onCommit={(t) => setOv(`hl${index}intro`, t)}
          style={{ fontSize: fs(15), fontWeight: 500, color: '#666d75', marginTop: 6, letterSpacing: '-0.02em', lineHeight: 1.45, whiteSpace: 'pre-line', overflow: 'hidden', height: Math.round(2 * 1.45 * fs(15)), wordBreak: 'keep-all', textAlign: 'center' }}
        />
      </div>
    </div>
  )
}

export function HighlightSection({ studio, d }: { studio: Studio; d: Derived }) {
  const { state, data, ovGet, setOv } = studio
  const { theme, isMobile, ord, badge, titles, padX, fontScale, fs, firstBadgeKey, lastBadgeKey } = d
  const padTop = firstBadgeKey === 'highlight' ? 82 : 62
  const padBottom = lastBadgeKey === 'highlight' ? 82 : 62

  const count = data.highlight.length
  // PC: 4개→2열, 나머지(3·5·6)→3열, 카드 폭 고정(190px) + 중앙 정렬
  const pcCols = count === 4 ? 2 : 3
  const wrapStyle: React.CSSProperties = isMobile
    ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: `0 ${padX}px` }
    : { display: 'grid', gridTemplateColumns: `repeat(${pcCols}, 190px)`, justifyContent: 'center', gap: 14 }

  // PC에서 마지막 줄이 꽉 차지 않으면(예: 5개 → 3+2) 그리드가 왼쪽 정렬로 남기 때문에,
  // 남는 카드만 따로 떼어 중앙 정렬된 줄로 렌더링한다.
  const remainder = !isMobile ? count % pcCols : 0
  const mainRoutes = remainder ? data.highlight.slice(0, count - remainder) : data.highlight
  const lastRowRoutes = remainder ? data.highlight.slice(count - remainder) : []

  // 출발지 노출 여부는 사용자가 우측 패널에서 직접 켜고 끌 수 있다(모든 카드에 일괄 적용).
  const showFrom = ovGet('hlShowFrom', 'off') === 'on'
  // 사용자가 켠 상태여도, 카드 중 하나라도 "출발 → 도착" 전체 텍스트가 한 줄을 넘치면
  // 섹션 내 모든 카드에 동일하게 도착지 전용 표시로 자동 전환하는 안전장치는 그대로 둔다.
  const [overflowMap, setOverflowMap] = useState<Record<number, boolean>>({})
  useEffect(() => setOverflowMap({}), [count])
  const autoOverflow = Object.values(overflowMap).some(Boolean)
  const destOnly = !showFrom || autoOverflow
  const handleOverflowChange = useCallback(
    (i: number, overflow: boolean) => setOverflowMap((prev) => (prev[i] === overflow ? prev : { ...prev, [i]: overflow })),
    [],
  )

  const card = (r: HighlightRoute, i: number) => (
    <HighlightCard
      key={i}
      route={r}
      index={i}
      theme={theme}
      enabled={state.imagesLoaded}
      unsplashKey={state.unsplashKey}
      destOnly={destOnly}
      onOverflowChange={handleOverflowChange}
      fs={fs}
      ovGet={ovGet}
      setOv={setOv}
    />
  )

  return (
    <section
      id="sec-highlight"
      style={{ order: ord['highlight'], padding: `${padTop}px 0 ${padBottom}px`, background: '#fff' }}
    >
      <div style={{ padding: `0 ${padX}px` }}>
        <SectionBadge label={badge['highlight']} accent={theme.accent} scale={fontScale} />
        <EditableTitle value={ovGet('highlightTitle', titles.highlight)} onCommit={(t) => setOv('highlightTitle', t)} scale={fontScale} singleLine={!isMobile} />
      </div>
      <div className="cap-scroll" style={wrapStyle}>
        {mainRoutes.map((r, i) => card(r, i))}
      </div>
      {lastRowRoutes.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 14 }}>
          {lastRowRoutes.map((r, i) => (
            <div key={mainRoutes.length + i} style={{ width: 190 }}>
              {card(r, mainRoutes.length + i)}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
