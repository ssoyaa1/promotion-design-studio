import { useRef, useEffect, createElement } from 'react'
import type { CSSProperties } from 'react'

/**
 * 최대 n줄로 말줄임 처리(카드 밖으로 텍스트가 벗어나지 않도록) + 여러 줄로 나뉠 때
 * 각 줄 길이를 비슷하게 균형 배분(text-wrap: balance) + 줄바꿈을 단어(띄어쓰기)
 * 단위로만 처리(word-break: keep-all — 단어가 중간에서 잘리지 않도록).
 */
export function clamp(lines: number): CSSProperties {
  return {
    display: '-webkit-box',
    WebkitLineClamp: lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textWrap: 'balance',
    wordBreak: 'keep-all',
  }
}

interface EditableProps {
  value: string
  onCommit: (text: string) => void
  as?: 'div' | 'span' | 'h1' | 'h2' | 'p'
  style?: CSSProperties
}

/**
 * Uncontrolled contentEditable. Writes on blur, and only syncs external
 * value changes into the DOM when the element is not focused — so typing
 * never loses the caret.
 */
export function Editable({ value, onCommit, as = 'div', style }: EditableProps) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (el && document.activeElement !== el && el.innerText !== value) {
      el.innerText = value
    }
  }, [value])
  return createElement(
    as,
    {
      ref,
      contentEditable: true,
      suppressContentEditableWarning: true,
      onBlur: (e: React.FocusEvent<HTMLElement>) => onCommit(e.currentTarget.innerText),
      style,
    },
    value,
  )
}

/** The centered "HIGHLIGHT n" pill above a section title. */
export function SectionBadge({ label, accent, scale = 1 }: { label?: string; accent: string; scale?: number }) {
  if (!label) return null
  return (
    <div style={{ textAlign: 'center', marginBottom: 14 }}>
      <span
        style={{
          display: 'inline-block',
          background: accent,
          color: '#fff',
          fontSize: 14 * scale,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          padding: '6px 10px',
          borderRadius: 99,
        }}
      >
        {label}
      </span>
    </div>
  )
}

/** Editable centered section h2. */
export function EditableTitle({
  value,
  onCommit,
  scale = 1,
  singleLine = false,
}: {
  value: string
  onCommit: (t: string) => void
  scale?: number
  singleLine?: boolean
}) {
  const displayValue = singleLine ? value.replace(/\n/g, ' ') : value
  const style: CSSProperties = {
    margin: '0 0 18px',
    fontSize: 24 * scale,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    textAlign: 'center',
    lineHeight: 1.3,
    whiteSpace: singleLine ? 'normal' : 'pre-line',
  }
  return <Editable as="h2" value={displayValue} onCommit={onCommit} style={style} />
}
