import type { Studio } from '../../state/useStudio'
import type { Derived } from '../../lib/derive'
import { Editable, EditableTitle, SectionBadge, clamp } from './common'
import { BenefitBanner } from './BenefitBanner'
import { BenefitImage } from '../../lib/benefitIcons'

/**
 * HIGHLIGHT 2 — 라이브 혜택 + 라이브 경품을 하나의 섹션으로 묶는다.
 * 각 카드 안의 순번 칩("라이브 혜택 1" / "퀴즈 경품 1")으로 어떤 그룹인지
 * 바로 알 수 있게 한다.
 */
const chipStyle = (accent: string, fs: (px: number) => number): React.CSSProperties => ({
  display: 'inline-block',
  maxWidth: '100%',
  background: `${accent}1f`,
  color: accent,
  fontSize: fs(12),
  fontWeight: 600,
  letterSpacing: '-0.02em',
  padding: '5px 11px',
  borderRadius: 99,
  whiteSpace: 'nowrap',
})

export function LiveBenefitSection({ studio, d }: { studio: Studio; d: Derived }) {
  const { data, ovGet, setOv } = studio
  const { theme, ord, badge, titles, padX, fontScale, fs, firstBadgeKey, lastBadgeKey } = d
  const padTop = firstBadgeKey === 'prize' ? 56 : 36
  const padBottom = lastBadgeKey === 'prize' ? 56 : 36

  return (
    <section id="sec-prize" style={{ order: ord['prize'], padding: `${padTop}px ${padX}px ${padBottom}px`, background: theme.soft }}>
      <SectionBadge label={badge['prize']} accent={theme.accent} scale={fontScale} />
      <EditableTitle value={ovGet('prizeTitle', titles.prize)} onCommit={(t) => setOv('prizeTitle', t)} scale={fontScale} />

      {/* 그룹 1 — 라이브 혜택 (섹션 타이틀과의 간격 확보) */}
      <div style={{ marginTop: Math.round(22 * fontScale), display: 'flex', flexDirection: 'column', gap: 20 }}>
        {data.liveBenefits.map((b, i) => (
          <BenefitBanner
            key={i}
            imgSrc={d.benefitImg(`lb${i}`)}
            label={ovGet(`lb${i}c`, `라이브 혜택 ${i + 1}`)}
            title={ovGet(`lb${i}t`, b.t)}
            detail={ovGet(`lb${i}d`, b.d)}
            accent={theme.accent}
            fs={fs}
            onLabel={(t) => setOv(`lb${i}c`, t)}
            onTitle={(t) => setOv(`lb${i}t`, t)}
            onDetail={(t) => setOv(`lb${i}d`, t)}
          />
        ))}
      </div>

      {/* 두 영역을 잇는 + 커넥터 */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: `${Math.round(24 * fontScale)}px 0` }}>
        <span
          style={{
            width: fs(30),
            height: fs(30),
            borderRadius: '50%',
            background: theme.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width={fs(20)} height={fs(20)} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </span>
      </div>

      {/* 그룹 2 — 퀴즈 경품 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {data.prizes.map((p, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: Math.round(16 * fontScale),
              height: Math.round(120 * fontScale),
              padding: Math.round(20 * fontScale),
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 2px 4px rgba(0,0,0,.03), 0 10px 26px rgba(0,0,0,.06)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 순번 칩 + 추첨 수량을 같은 줄에 나란히 노출(뱃지 안에 포함하지 않음) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Editable
                  value={ovGet(`pz${i}c`, '퀴즈 경품')}
                  onCommit={(t) => setOv(`pz${i}c`, t)}
                  style={chipStyle(theme.accent, fs)}
                />
                <Editable
                  value={ovGet(`pz${i}d`, p.d)}
                  onCommit={(t) => setOv(`pz${i}d`, t)}
                  style={{ fontSize: fs(14), fontWeight: 700, color: theme.accent, letterSpacing: '-0.02em', ...clamp(1) }}
                />
              </div>
              <Editable
                value={ovGet(`pz${i}t`, p.t)}
                onCommit={(t) => setOv(`pz${i}t`, t)}
                style={{ fontSize: fs(18), fontWeight: 700, color: '#101418', marginTop: 6, letterSpacing: '-0.03em', lineHeight: 1.3, ...clamp(2) }}
              />
            </div>
            <BenefitImage src={d.benefitImg(`pz${i}`)} title={p.t} soft={theme.soft} size={Math.round(72 * fontScale)} plain />
          </div>
        ))}
      </div>
    </section>
  )
}
