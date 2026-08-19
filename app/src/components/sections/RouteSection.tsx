import { Fragment, useRef } from 'react'
import type { Studio } from '../../state/useStudio'
import type { Derived } from '../../lib/derive'
import type { City, Theme } from '../../types'
import { cityQuery } from '../../data/seed'
import { useCityImage, useLocalCityImage } from '../../lib/unsplashImages'
import { readFile } from '../../lib/readFile'
import { useBalancedChipBreak } from '../../lib/useBalancedChipBreak'
import { Editable } from './common'

const roundIconBtnStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: 'rgba(16,20,24,.55)',
  border: 'none',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 13,
  zIndex: 2,
}

function RouteCard({
  city,
  defaultName,
  wide,
  theme,
  enabled,
  unsplashKey,
  nameKey,
  priceKey,
  imageKey,
  fs,
  ovGet,
  setOv,
}: {
  city: City
  defaultName: string
  wide: boolean
  theme: Theme
  enabled: boolean
  unsplashKey: string
  nameKey: string
  priceKey: string
  /** 자동 매칭 이미지가 잘못 들어간 경우를 대비한 수동 교체 오버라이드 키. */
  imageKey: string
  fs: (px: number) => number
  ovGet: (k: string, def: string) => string
  setOv: (k: string, v: string) => void
}) {
  const name = ovGet(nameKey, defaultName)
  const price = ovGet(priceKey, city.price)
  const localIm = useLocalCityImage(city.code)
  const im = useCityImage(cityQuery(city.code, name), enabled && !localIm, unsplashKey)
  const override = ovGet(imageKey, '')
  const imgSrc = override || localIm || im
  const bg = imgSrc
    ? `linear-gradient(180deg,rgba(0,0,0,.05) 40%,rgba(0,0,0,.62)),url('${imgSrc}') center/cover`
    : `linear-gradient(150deg,${theme.accent},${theme.deep})`
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        aspectRatio: wide ? '16 / 6.5' : '1 / 1',
        background: bg,
        boxShadow: '0 1px 2px rgba(0,0,0,.05),0 6px 16px rgba(0,0,0,.06)',
      }}
    >
      <label data-no-export="true" style={{ ...roundIconBtnStyle, right: 8 }} title="이미지 교체">
        📷
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => readFile(e, (u) => setOv(imageKey, u))}
        />
      </label>
      {override && (
        <button
          type="button"
          data-no-export="true"
          onClick={() => setOv(imageKey, '')}
          title="자동 매칭 이미지로 되돌리기"
          style={{ ...roundIconBtnStyle, right: 42 }}
        >
          ↺
        </button>
      )}
      {!imgSrc && (
        <span
          style={{
            position: 'absolute',
            top: 10,
            right: 14,
            fontSize: fs(34),
            fontWeight: 900,
            color: 'rgba(255,255,255,.16)',
            letterSpacing: '-0.05em',
          }}
        >
          {name}
        </span>
      )}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            color: '#fff',
            fontSize: fs(17),
            fontWeight: 700,
            letterSpacing: '-0.03em',
            textShadow: '0 1px 8px rgba(0,0,0,.4)',
          }}
        >
          <Editable as="span" value={name} onCommit={(t) => setOv(nameKey, t)} />
          <span style={{ opacity: 0.85 }}>›</span>
        </div>
        <div
          style={{
            color: '#ffc929',
            fontSize: fs(15),
            fontWeight: 700,
            letterSpacing: '-0.03em',
            textShadow: '0 1px 8px rgba(0,0,0,.45)',
          }}
        >
          왕복 <Editable as="span" value={price} onCommit={(t) => setOv(priceKey, t)} />원~
        </div>
      </div>
    </div>
  )
}

export function RouteSection({
  studio,
  d,
  routeKey,
  showDepTabs = true,
  isLast = false,
}: {
  studio: Studio
  d: Derived
  routeKey: string
  showDepTabs?: boolean
  isLast?: boolean
}) {
  const { state, data, routeInfo, ovGet, setOv } = studio
  const { theme, ord, padX, fs } = d
  const m = routeInfo.routeMeta[routeKey]
  const dep = m ? data.departures[m.depIdx] : undefined
  const reg = dep && m ? dep.regions[m.regIdx] : undefined
  const chipRef = useRef<HTMLDivElement>(null)
  const chipBreak = useBalancedChipBreak(chipRef, dep?.regions.length ?? 0, 8)
  if (!m || !dep || !reg) return null
  const wide = reg.cities.length <= 3

  // 같은 region 안에서 동일한 도시명이 둘 이상이면 "(코드)" 추가
  const dupNames = new Set<string>()
  const _seen = new Set<string>()
  for (const c of reg.cities) {
    if (_seen.has(c.name)) dupNames.add(c.name)
    _seen.add(c.name)
  }
  const resolvedName = (c: City) => dupNames.has(c.name) ? `${c.name} (${c.code})` : c.name

  const depTabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: fs(14),
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: active ? '#101418' : '#adb5bd',
    borderBottom: `2px solid ${active ? theme.accent : 'transparent'}`,
  })

  const chipStyle = (active: boolean): React.CSSProperties => ({
    flex: '0 0 auto',
    height: 36,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    borderRadius: 99,
    background: active ? '#101418' : '#f1f3f5',
    color: active ? '#fff' : '#495056',
    fontSize: fs(13),
    fontWeight: 700,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
  })

  return (
    <section
      id={`sec-${routeKey}`}
      style={{
        order: ord[routeKey],
        padding: `32px ${padX}px ${isLast ? 56 : 36}px`,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {showDepTabs && (() => {
        const depCount = data.departures.length
        // 5개 이상이면 3열 그리드. 마지막 줄이 꽉 차지 않으면(예: 5개 → 3+2) 그리드에
        // 남겨두면 왼쪽 정렬되므로, 남는 탭만 떼어내 같은 폭으로 중앙 정렬한다.
        const remainder = depCount >= 5 ? depCount % 3 : 0
        const mainDeps = remainder ? data.departures.slice(0, depCount - remainder) : data.departures
        const lastDeps = remainder ? data.departures.slice(depCount - remainder) : []
        return (
          <div style={{ borderBottom: '1px solid #e9ecef' }}>
            <div style={depCount >= 5 ? { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' } : { display: 'flex' }}>
              {mainDeps.map((dd, i) => (
                <div key={i} style={depTabStyle(i === m.depIdx)}>
                  <Editable as="span" value={ovGet(`depName${i}`, dd.name)} onCommit={(t) => setOv(`depName${i}`, t)} />
                </div>
              ))}
            </div>
            {lastDeps.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {lastDeps.map((dd, k) => {
                  const i = mainDeps.length + k
                  return (
                    <div key={i} style={{ ...depTabStyle(i === m.depIdx), flex: '0 0 33.3333%' }}>
                      <Editable as="span" value={ovGet(`depName${i}`, dd.name)} onCommit={(t) => setOv(`depName${i}`, t)} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })()}
      <div ref={chipRef} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {dep.regions.map((rr, j) => (
          <Fragment key={j}>
            {chipBreak === j && <div style={{ flexBasis: '100%', height: 0 }} />}
            <div data-chip="1" style={chipStyle(j === m.regIdx)}>
              <Editable
                as="span"
                value={ovGet(`regName${m.depIdx}_${j}`, rr.name)}
                onCommit={(t) => setOv(`regName${m.depIdx}_${j}`, t)}
              />
            </div>
          </Fragment>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: wide ? '1fr' : '1fr 1fr', gap: 12 }}>
        {reg.cities.map((c, i) => (
          <RouteCard
            key={i}
            city={c}
            defaultName={resolvedName(c)}
            wide={wide}
            theme={theme}
            enabled={state.imagesLoaded}
            unsplashKey={state.unsplashKey}
            nameKey={`cityName${m.depIdx}_${m.regIdx}_${i}`}
            priceKey={`cityPrice${m.depIdx}_${m.regIdx}_${i}`}
            imageKey={`cityImg${m.depIdx}_${m.regIdx}_${i}`}
            fs={fs}
            ovGet={ovGet}
            setOv={setOv}
          />
        ))}
      </div>
    </section>
  )
}
