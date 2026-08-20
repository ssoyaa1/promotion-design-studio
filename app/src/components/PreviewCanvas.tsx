import { useRef, useEffect } from 'react'
import type { Studio } from '../state/useStudio'
import type { Derived } from '../lib/derive'
import type { SectionKey } from '../types'
import { HeroSection } from './sections/HeroSection'
import { ScheduleSection } from './sections/ScheduleSection'
import { LiveBenefitSection } from './sections/LiveBenefitSection'
import { ChecklistSection } from './sections/ChecklistSection'
import { HighlightSection } from './sections/HighlightSection'
import { CtaSection } from './sections/CtaSection'
import { RouteSection } from './sections/RouteSection'

export function PreviewCanvas({ studio, d }: { studio: Studio; d: Derived }) {
  const { data, ovGet, setOv, selectKey } = studio
  const { theme, isMobile, deviceWidth, ord, badge, titles, visibleKeys, padX, firstBadgeKey, lastBadgeKey } = d

  const mainRef = useRef<HTMLElement>(null)
  const isAutoScrolling = useRef(false) // 자동 스크롤 중 → scroll 이벤트 무시
  const isScrollTriggered = useRef(false) // 스크롤로 selectedKey 변경 → 역방향 스크롤 건너뜀
  const activeKey = useRef(studio.state.selectedKey)

  // 스크롤 → selectedKey 업데이트
  useEffect(() => {
    const root = mainRef.current
    if (!root) return
    const handleScroll = () => {
      if (isAutoScrolling.current) return
      const rootRect = root.getBoundingClientRect()
      const hitLine = rootRect.top + rootRect.height * 0.35
      let bestKey: string | null = null
      let bestTop = -Infinity
      root.querySelectorAll<HTMLElement>('[id^="sec-"]').forEach((el) => {
        const rect = el.getBoundingClientRect()
        if (rect.top <= hitLine && rect.top > bestTop) {
          bestTop = rect.top
          bestKey = el.id.slice(4)
        }
      })
      if (bestKey && bestKey !== activeKey.current) {
        activeKey.current = bestKey
        isScrollTriggered.current = true
        selectKey(bestKey as SectionKey)
      }
    }
    root.addEventListener('scroll', handleScroll, { passive: true })
    return () => root.removeEventListener('scroll', handleScroll)
  }, [selectKey])

  // selectedKey 변경 → 해당 섹션으로 스크롤 (SectionList 클릭 시)
  useEffect(() => {
    if (isScrollTriggered.current) {
      isScrollTriggered.current = false
      return
    }
    const key = studio.state.selectedKey
    const el = document.getElementById(`sec-${key}`)
    const root = mainRef.current
    if (!el || !root) return
    isAutoScrolling.current = true
    const elRect = el.getBoundingClientRect()
    const rootRect = root.getBoundingClientRect()
    root.scrollTo({ top: root.scrollTop + (elRect.top - rootRect.top), behavior: 'smooth' })
    setTimeout(() => { isAutoScrolling.current = false }, 800)
  }, [studio.state.selectedKey])

  const frameStyle: React.CSSProperties = {
    borderRadius: isMobile ? 30 : 16,
    overflow: 'hidden',
    boxShadow: isMobile
      ? '0 4px 8px rgba(0,0,0,.05),0 20px 50px rgba(0,0,0,.18)'
      : '0 4px 8px rgba(0,0,0,.05),0 20px 50px rgba(0,0,0,.14)',
    border: '1px solid #e9ecef',
    background: '#fff',
  }

  // 동일한 depIdx가 연속되면 첫 번째 섹션에만 탭을 표시
  const showDepTabsFor = new Set<string>()
  let prevDepIdx: number | null = null
  for (const k of visibleKeys) {
    if (k.charAt(0) === 'r') {
      const depIdx = studio.routeInfo.routeMeta[k]?.depIdx ?? -1
      if (depIdx !== prevDepIdx) { showDepTabsFor.add(k); prevDepIdx = depIdx }
    } else {
      prevDepIdx = null
    }
  }

  const lastRouteKey = [...visibleKeys].reverse().find((k) => k.charAt(0) === 'r')

  const renderSection = (k: SectionKey) => {
    if (k.charAt(0) === 'r') return <RouteSection key={k} studio={studio} d={d} routeKey={k} showDepTabs={showDepTabsFor.has(k)} isLast={k === lastRouteKey} />
    switch (k) {
      case 'visual':
        return <HeroSection key={k} studio={studio} d={d} />
      case 'schedule':
        return <ScheduleSection key={k} studio={studio} d={d} />
      case 'prize':
        return <LiveBenefitSection key={k} studio={studio} d={d} />
      case 'purchase':
        return (
          <ChecklistSection
            key={k}
            id="sec-purchase"
            order={ord['purchase']}
            padX={padX}
            badge={badge['purchase']}
            title={titles.purchase}
            titleKey="purchaseTitle"
            items={data.purchaseBenefits}
            ovPrefix="pb"
            accent={theme.accent}
            soft={theme.soft}
            variant="grid"
            scale={d.fontScale}
            ovGet={ovGet}
            setOv={setOv}
            benefitImg={d.benefitImg}
            extraTopPad={firstBadgeKey === 'purchase'}
            extraBottomPad={lastBadgeKey === 'purchase'}
          />
        )
      case 'airline':
        return (
          <ChecklistSection
            key={k}
            id="sec-airline"
            order={ord['airline']}
            padX={padX}
            badge={badge['airline']}
            title={titles.airline}
            titleKey="airlineTitle"
            items={data.airlineHighlights}
            ovPrefix="ah"
            accent={theme.accent}
            soft={theme.soft}
            variant="list"
            scale={d.fontScale}
            ovGet={ovGet}
            setOv={setOv}
            benefitImg={d.benefitImg}
            extraTopPad={firstBadgeKey === 'airline'}
            extraBottomPad={lastBadgeKey === 'airline'}
          />
        )
      case 'highlight':
        return <HighlightSection key={k} studio={studio} d={d} />
      case 'cta':
        return <CtaSection key={k} studio={studio} d={d} />
      default:
        return null
    }
  }

  return (
    <main
      ref={mainRef}
      className="cap-scroll"
      style={{
        flex: 1,
        minWidth: 0,
        overflow: 'auto',
        background: '#e9ecef',
        display: 'flex',
        justifyContent: 'center',
        padding: '32px 24px 64px',
      }}
    >
      <div style={{ width: deviceWidth, flexShrink: 0, transition: 'width .25s ease' }}>
        <div style={frameStyle}>
          {isMobile && (
            <div
              style={{
                height: 34,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 18px',
                fontSize: 11,
                fontWeight: 700,
                color: '#101418',
                flexShrink: 0,
              }}
            >
              <span>9:41</span>
              <span style={{ letterSpacing: 1 }}>● ● ●&nbsp;&nbsp;&nbsp;▮</span>
            </div>
          )}

          <div
            id="promo-capture"
            style={{ background: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {visibleKeys.map(renderSection)}
          </div>
        </div>
      </div>
    </main>
  )
}
