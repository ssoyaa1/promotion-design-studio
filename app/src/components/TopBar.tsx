import type { Studio } from '../state/useStudio'
import type { Derived } from '../lib/derive'

const tabBase: React.CSSProperties = {
  height: 32,
  border: 0,
  borderRadius: 99,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
const tabActive: React.CSSProperties = {
  background: '#fff',
  color: '#101418',
  boxShadow: '0 1px 2px rgba(0,0,0,.08)',
}
const tabIdle: React.CSSProperties = { background: 'transparent', color: '#848c94' }
const pillGroup: React.CSSProperties = {
  display: 'flex',
  background: '#f1f3f5',
  borderRadius: 99,
  padding: 3,
  gap: 2,
}

export function TopBar({
  studio,
  d,
  onExportAll,
}: {
  studio: Studio
  d: Derived
  onExportAll: () => void
}) {
  const { state, setPromoType, setDevice, toggleImages } = studio
  const isLive = state.promoType === 'live'
  const isMobile = state.device === 'mobile'

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        height: 60,
        flexShrink: 0,
        padding: '0 20px',
        background: '#fff',
        borderBottom: '1px solid #e9ecef',
        zIndex: 10,
      }}
    >
      <img src="/assets/my_logo.webp" alt="MyRealTrip" style={{ height: 20, width: 'auto' }} />
      <div style={{ width: 1, height: 22, background: '#e9ecef' }} />
      <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', color: '#101418', whiteSpace: 'nowrap' }}>
        [FLIGHT] 프로모션 페이지 제작
      </span>

      <div style={{ flex: 1 }} />

      {/* Live ON/OFF 토글 — OFF 시 라이브 관련 요소만 숨김 */}
      <button
        onClick={() => setPromoType(isLive ? 'plan' : 'live')}
        title="라이브 관련 요소 노출 여부"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
          height: 34,
          padding: '0 8px 0 14px',
          border: '1px solid #e9ecef',
          background: '#fff',
          borderRadius: 99,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em', color: '#101418' }}>
          Live <span style={{ color: isLive ? d.theme.accent : '#adb5bd' }}>{isLive ? 'ON' : 'OFF'}</span>
        </span>
        <span
          style={{
            position: 'relative',
            width: 40,
            height: 22,
            borderRadius: 99,
            background: isLive ? d.theme.accent : '#ced4da',
            transition: 'background .18s',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 2,
              left: 2,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,.25)',
              transform: isLive ? 'translateX(18px)' : 'translateX(0)',
              transition: 'transform .18s',
            }}
          />
        </span>
      </button>

      <div style={pillGroup}>
        <button
          onClick={() => setDevice('mobile')}
          style={{ ...tabBase, padding: '0 12px', ...(isMobile ? tabActive : tabIdle) }}
        >
          📱 모바일
        </button>
        <button
          onClick={() => setDevice('pc')}
          style={{ ...tabBase, padding: '0 12px', ...(!isMobile ? tabActive : tabIdle) }}
        >
          🖥 PC
        </button>
      </div>

      <button
        onClick={toggleImages}
        style={{
          height: 38,
          padding: '0 15px',
          border: '1px solid #e9ecef',
          background: '#fff',
          color: '#495056',
          borderRadius: 99,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {state.imagesLoaded ? '플레이스홀더로' : '🖼 이미지 자동 채우기'}
      </button>

      <button
        onClick={onExportAll}
        style={{
          height: 38,
          padding: '0 16px',
          border: 0,
          background: '#101418',
          color: '#fff',
          borderRadius: 99,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        ⬇ 전체 저장 · {d.exportDevLabel}
      </button>
    </header>
  )
}
