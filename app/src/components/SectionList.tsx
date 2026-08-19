import { useRef } from 'react'
import type { Studio } from '../state/useStudio'
import type { Derived } from '../lib/derive'
import type { SectionKey } from '../types'

export function SectionList({
  studio,
  d,
  onExportSection,
}: {
  studio: Studio
  d: Derived
  onExportSection: (key: SectionKey) => void
}) {
  const { state, reorder, toggleHidden, selectKey } = studio
  const { theme, app, warnings, isMobile } = d
  const dev = isMobile ? 'MO' : 'PC'
  const dragKey = useRef<SectionKey | null>(null)

  const rows = state.order.filter((k) => app.includes(k))

  return (
    <aside
      style={{
        width: 236,
        flexShrink: 0,
        background: '#fff',
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div style={{ padding: '16px 16px 10px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: '#adb5bd' }}>SECTIONS</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#848c94', marginTop: 3, letterSpacing: '-0.02em' }}>
          드래그로 순서 변경 · 눈으로 숨기기
        </div>
      </div>

      <div className="cap-scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 10px 12px' }}>
        {rows.map((k, idx) => {
          const sel = state.selectedKey === k
          const hiddenK = !!state.hidden[k]
          return (
            <div
              key={k}
              draggable
              onDragStart={() => (dragKey.current = k)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (dragKey.current) reorder(dragKey.current, k)
              }}
              onClick={() => selectKey(k)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '9px 10px',
                borderRadius: 11,
                cursor: 'pointer',
                marginBottom: 3,
                background: sel ? theme.soft : 'transparent',
                opacity: hiddenK ? 0.6 : 1,
              }}
            >
              <span style={{ cursor: 'grab', color: '#ced4da', fontSize: 13, userSelect: 'none' }}>⠿</span>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: sel ? theme.accent : theme.soft,
                  color: sel ? '#fff' : theme.deep,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 13.5,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: hiddenK ? '#adb5bd' : '#101418',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {dev}-{String(idx + 1).padStart(2, '0')}
              </span>
              <button
                title="이 섹션만 이미지로 저장"
                onClick={(e) => {
                  e.stopPropagation()
                  onExportSection(k)
                }}
                style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 2, fontSize: 12, color: '#adb5bd' }}
              >
                ⬇
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleHidden(k)
                }}
                style={{
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 2,
                  fontSize: 13,
                  opacity: hiddenK ? 1 : 0.55,
                }}
              >
                {hiddenK ? '🚫' : '👁'}
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ borderTop: '1px solid #f1f3f5', padding: '12px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: '#adb5bd', marginBottom: 8 }}>
          검증
        </div>
        {warnings.length > 0 ? (
          warnings.map((w, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 7,
                alignItems: 'flex-start',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: '#f78000',
                padding: '5px 0',
                lineHeight: 1.4,
              }}
            >
              <span style={{ flexShrink: 0 }}>⚠️</span>
              <span>{w}</span>
            </div>
          ))
        ) : (
          <div
            style={{
              display: 'flex',
              gap: 7,
              alignItems: 'center',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#27ab86',
            }}
          >
            <span>✓</span>
            <span>필수 항목 이상 없음</span>
          </div>
        )}
      </div>
    </aside>
  )
}
