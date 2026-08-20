import type { Studio } from '../../state/useStudio'
import type { Derived } from '../../lib/derive'
import { Editable } from './common'
import { airlineLogoSrc, airlinePlaneSrc } from '../../lib/airlineLogo'
import { HERO_TITLE_FONTS, heroTitleFontFamily } from '../../lib/heroFonts'

const SKY_COUNT = 8
const SKY_IMAGES = Array.from({ length: SKY_COUNT }, (_, i) => `/assets/sky/sky_${i + 1}.jpg`)

export function HeroSection({ studio, d }: { studio: Studio; d: Derived }) {
  const { state, data, ovGet, setOv } = studio
  const { theme, isLive, isMobile, ord, fs } = d
  const heroImage = state.heroImage
  const airline = ovGet('airline', data.airline)
  const titleFontKey = ovGet('heroTitleFont', HERO_TITLE_FONTS[state.heroTitleFontSeed]?.key || 'pretendard')
  const titleFontFamily = heroTitleFontFamily(titleFontKey)

  const bgImage = heroImage || SKY_IMAGES[(state.skyIndex ?? 0) % SKY_COUNT]
  const heroBg = bgImage
    ? `linear-gradient(180deg,rgba(16,20,24,0) 0%,rgba(16,20,24,.08) 45%,rgba(16,20,24,.62) 100%),url('${bgImage}') center/cover`
    : `linear-gradient(150deg,${theme.accent} 0%,${theme.deep} 100%)`
  const heroShadow = '0 1px 12px rgba(0,0,0,.35)'
  // 업로드 로고 우선 → 항공사명 자동 매칭 로고 → (둘 다 없으면) 텍스트 폴백
  const logoSrc = state.airlineLogo || airlineLogoSrc(airline)
  // 업로드 기체 우선 → 항공사명 자동 매칭 기체
  const planeSrc = state.planeImage || airlinePlaneSrc(airline)
  const planeTop = `${(isMobile ? 13 : 15) + state.planeOffsetY}%`
  const planeWidth = `${86 * state.planeScale / 100}%`
  const planeMaxWidth = Math.round((isMobile ? 350 : 580) * state.planeScale / 100)

  return (
    <section
      id="sec-visual"
      style={{
        order: ord['visual'],
        position: 'relative',
        overflow: 'hidden',
        background: heroBg,
      }}
    >
      {/* co-brand lockup */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          zIndex: 3,
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <img src="/assets/mrt_wordmark_white.png" alt="myrealtrip" style={{ height: 17, width: 'auto' }} />
          <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, fontWeight: 700 }}>×</span>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={airline}
              style={{ height: 18, width: 'auto', maxWidth: 130, objectFit: 'contain' }}
            />
          ) : (
            <Editable
              as="span"
              value={airline}
              onCommit={(t) => setOv('airline', t)}
              style={{ fontSize: fs(15), fontWeight: 700, letterSpacing: '-0.03em', color: '#fff' }}
            />
          )}
        </div>
      </div>

      {/* aircraft PNG slot */}
      {planeSrc && (
        <img
          src={planeSrc}
          alt="aircraft"
          style={{
            position: 'absolute',
            top: planeTop,
            left: '50%',
            transform: 'translateX(-50%)',
            width: planeWidth,
            maxWidth: planeMaxWidth,
            objectFit: 'contain',
            zIndex: 2,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 14px 28px rgba(0,0,0,.3))',
          }}
        />
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: isMobile ? '80px 22px 42px' : '108px 32px 52px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: isMobile ? 18 : 22,
          minHeight: isLive ? (isMobile ? 528 : 636) : (isMobile ? 472 : 572),
          justifyContent: 'flex-end',
        }}
      >
        {/* 라이브: 라이브 방송 뱃지를 타이틀 상단에 배치 */}
        {isLive && (
          <div style={{ marginBottom: 0 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: fs(9),
                background: '#fff',
                borderRadius: 99,
                padding: '6px 15px 6px 7px',
                boxShadow: '0 6px 18px rgba(0,0,0,.22)',
                verticalAlign: 'middle',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: fs(6),
                  background: '#101418',
                  color: '#fff',
                  borderRadius: 99,
                  padding: '5px 11px',
                  fontSize: fs(13),
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                }}
              >
                <span
                  style={{
                    width: fs(7),
                    height: fs(7),
                    borderRadius: '50%',
                    background: '#ec4937',
                    animation: 'livePulse 1.6s ease-out infinite',
                  }}
                />
                LIVE
              </span>
              <Editable
                as="span"
                value={ovGet('liveBadge', '지금 방송 중')}
                onCommit={(t) => setOv('liveBadge', t)}
                style={{ color: '#101418', fontSize: fs(14), fontWeight: 700, letterSpacing: '-0.02em' }}
              />
            </span>
          </div>
        )}

        <Editable
          as="p"
          value={ovGet('sub', data.subtitle)}
          onCommit={(t) => setOv('sub', t)}
          style={{
            margin: '0 auto',
            fontSize: 18,
            fontWeight: 600,
            lineHeight: 1.4,
            letterSpacing: '-0.02em',
            color: 'rgba(255,255,255,.9)',
            textShadow: heroShadow,
            maxWidth: '32em',
          }}
        />

        {/* 라이브·기획전 공통: [항공사] / 단독 특가 프로모션 2줄 고정 타이틀 */}
        <h1
          style={{
            margin: 0,
            marginTop: isMobile ? -6 : -10,
            fontSize: isMobile ? 37 : 52,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.035em',
            color: '#fff',
            textShadow: heroShadow,
            fontFamily: titleFontFamily,
          }}
        >
          <Editable as="span" value={airline} onCommit={(t) => setOv('airline', t)} style={{ display: 'block' }} />
          <Editable
            as="span"
            value={ovGet('heroTitle2', '단독 특가 프로모션')}
            onCommit={(t) => setOv('heroTitle2', t)}
            style={{ display: 'block' }}
          />
        </h1>
      </div>

      {/* 하단 CTA — 화면 폭 전체를 차지하는 바. 텍스트 클릭은 편집, 그 외 영역 클릭은 스크롤. */}
      <div
        onClick={() => studio.selectKey('cta')}
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: fs(6),
          background: theme.accent,
          color: '#fff',
          padding: isMobile ? '17px 20px' : '19px 20px',
          fontSize: fs(16),
          fontWeight: 700,
          letterSpacing: '-0.02em',
          cursor: 'pointer',
        }}
      >
        <span onClick={(e) => e.stopPropagation()}>
          <Editable
            as="span"
            value={ovGet('heroCta', '특가 노선 보러가기')}
            onCommit={(t) => setOv('heroCta', t)}
            style={{ display: 'inline' }}
          />
        </span>
        <svg width={fs(16)} height={fs(16)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  )
}
