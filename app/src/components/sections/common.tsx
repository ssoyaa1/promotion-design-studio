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

/**
 * 한 줄로 표시 가능한 짧은 문구도 항상 2줄로 보이게 강제 줄바꿈을 넣는다(이미
 * \n이 있으면 그대로 둠). 공백 중 중앙에 가장 가까운 지점을 우선 쓰고(단어가
 * 잘리지 않도록), 공백이 전혀 없는 텍스트는 글자 수 중간 지점에서 나눈다.
 */
export function forceTwoLines(text: string): string {
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
