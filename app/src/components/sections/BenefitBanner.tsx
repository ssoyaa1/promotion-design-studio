import { Editable } from './common'

/**
 * 레퍼런스형 혜택 배너.
 * 흰 배경 카드에 은은한 accent 외곽선을 두르고, [라벨 칩 · 헤드라인 · 보조문구]를
 * 왼쪽에, 일러스트를 오른쪽에 둔다. 말줄임 없이 모든 문구가 카드 내부에 노출되며,
 * 줄바꿈은 띄어쓰기(단어) 단위로만 처리된다(전역 word-break: keep-all). 카드 높이는
 * 콘텐츠 길이와 무관하게 고정 · 동일하며, 라벨·타이틀·서브·이미지의 위치와
 * 내부 패딩도 모든 카드에서 동일하다. 별도의 버튼은 없다.
 */
export function BenefitBanner({
  imgSrc,
  label,
  title,
  detail,
  accent,
  fs,
  onLabel,
  onTitle,
  onDetail,
}: {
  /** 페이지 전역 중복 최소화가 적용된 이미지 경로. */
  imgSrc: string
  label: string
  title: string
  detail: string
  accent: string
  fs: (px: number) => number
  onLabel: (v: string) => void
  onTitle: (v: string) => void
  onDetail: (v: string) => void
}) {
  const pad = fs(22)
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        height: fs(178),
        borderRadius: fs(22),
        background: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,.03), 0 10px 26px rgba(0,0,0,.06)',
        padding: pad,
        display: 'flex',
        alignItems: 'center',
        gap: fs(14),
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Editable
          as="span"
          value={label}
          onCommit={onLabel}
          style={{
            display: 'inline-block',
            maxWidth: '100%',
            background: `${accent}1f`,
            color: accent,
            fontSize: fs(12),
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            padding: '5px 11px',
            borderRadius: 99,
            whiteSpace: 'nowrap',
          }}
        />
        <Editable
          value={title}
          onCommit={onTitle}
          style={{
            width: '100%',
            color: '#101418',
            fontSize: fs(18),
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.3,
            marginTop: fs(10),
          }}
        />
        {detail ? (
          <Editable
            value={detail}
            onCommit={onDetail}
            style={{
              width: '100%',
              color: '#666d75',
              fontSize: fs(15),
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.45,
              marginTop: fs(7),
            }}
          />
        ) : null}
      </div>
      <img
        src={imgSrc}
        alt=""
        style={{
          flexShrink: 0,
          width: fs(94),
          height: fs(94),
          objectFit: 'contain',
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.14))',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
