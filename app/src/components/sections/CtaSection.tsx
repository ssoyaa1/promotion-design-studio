import type { Studio } from '../../state/useStudio'
import type { Derived } from '../../lib/derive'
import { Editable } from './common'

export function CtaSection({ studio, d }: { studio: Studio; d: Derived }) {
  const { data, ovGet, setOv } = studio
  const { theme, ord, padX, fs } = d
  const airline = ovGet('airline', data.airline)

  return (
    <section id="sec-cta" style={{ order: ord['cta'], padding: `32px ${padX}px`, background: theme.deep }}>
      <div style={{ textAlign: 'center' }}>
        <Editable
          value={ovGet('ctaLead', '지금 바로 특가 노선을 확인하세요')}
          onCommit={(t) => setOv('ctaLead', t)}
          style={{
            fontSize: fs(15),
            fontWeight: 700,
            color: 'rgba(255,255,255,.72)',
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        />
        <button
          style={{
            width: '100%',
            height: 58,
            border: 0,
            borderRadius: 999,
            background: theme.soft,
            color: theme.accent,
            fontSize: fs(17),
            fontWeight: 700,
            letterSpacing: '-0.03em',
            cursor: 'pointer',
          }}
        >
          <Editable
            as="span"
            value={ovGet('cta', data.ctaLabel || (airline ? `${airline} 특가 노선 보러가기` : '특가 노선 보러가기'))}
            onCommit={(t) => setOv('cta', t)}
            style={{ display: 'inline' }}
          />
        </button>
      </div>
    </section>
  )
}
