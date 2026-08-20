import { benefitImageSrc } from './benefitImage'

/**
 * Keyword → line-icon matcher for benefit/prize rows. Free, offline,
 * deterministic. Icons are inline SVG (currentColor stroke) so they take
 * the theme accent color. Add keywords to RULES as new sheets introduce them.
 */

// Inner SVG markup per icon key (viewBox 0 0 24 24, stroke = currentColor).
const ICONS: Record<string, string> = {
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19"/><path d="M6 15h4"/>',
  baggage:
    '<rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V4.5h6V7"/><path d="M9.5 11v5M14.5 11v5"/>',
  sim: '<rect x="6" y="3" width="12" height="18" rx="2.5"/><path d="M9.5 8h5v4h-5z"/><path d="M12 16.5h.01"/>',
  wifi: '<path d="M4.5 9.5a11 11 0 0115 0"/><path d="M7.5 12.8a6.5 6.5 0 019 0"/><path d="M10.5 16a2.5 2.5 0 013 0"/><path d="M12 19h.01"/>',
  transport:
    '<path d="M4 13l1.4-4.6A2 2 0 017.3 7h9.4a2 2 0 011.9 1.4L20 13v5h-2v-2H6v2H4z"/><circle cx="7.5" cy="15.5" r="1.3"/><circle cx="16.5" cy="15.5" r="1.3"/>',
  hotel:
    '<path d="M3 20V6"/><path d="M3 18h18v2"/><path d="M21 18v-4.5a3 3 0 00-3-3H9a2 2 0 00-2 2V14"/><path d="M3 14h4"/><circle cx="9.5" cy="11.5" r="1.4"/>',
  coupon:
    '<path d="M4 7h16v3a2 2 0 100 4v3H4v-3a2 2 0 100-4V7z"/><path d="M14 7.5v9"/>',
  tag: '<path d="M4 12.8V5.5A1.5 1.5 0 015.5 4H13l7 7a1.6 1.6 0 010 2.3L13.3 20a1.6 1.6 0 01-2.3 0L4 13"/><circle cx="8" cy="8" r="1.3"/>',
  percent: '<circle cx="7.5" cy="7.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/><path d="M6 18L18 6"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8"/><path d="M12 8v12"/><path d="M12 8C11 8 8.5 8 8.5 6a2 2 0 013.5-1.3A2 2 0 0115.5 6c0 2-2.5 2-3.5 2z"/>',
  edu: '<path d="M12 4L2 9l10 5 10-5-10-5z"/><path d="M6 11v4.5c0 1.2 3 2.5 6 2.5s6-1.3 6-2.5V11"/>',
  spa: '<path d="M12 3.5c3 4 5 6.5 5 9a5 5 0 01-10 0c0-2.5 2-5 5-9z"/>',
  golf: '<path d="M12 3v13"/><path d="M12 3l5.5 2.3L12 7.6"/><path d="M6 20c1.6-1.1 10.4-1.1 12 0"/>',
  lounge:
    '<path d="M5 11V9a2 2 0 012-2h10a2 2 0 012 2v2"/><path d="M4 11a2 2 0 012 2v3h12v-3a2 2 0 012-2"/><path d="M6.5 19v1.2M17.5 19v1.2"/>',
  food: '<path d="M6 3v7M4.2 3v4.2a1.8 1.8 0 003.6 0V3M6 10v11"/><path d="M15.5 3c-1.4 0-2.4 2-2.4 4.8s.9 3.9 2.4 3.9 2.4-1.1 2.4-3.9S16.9 3 15.5 3zM15.5 11.7V21"/>',
  plane:
    '<path d="M21 15.5l-8-2.3V6.2a1.5 1.5 0 00-3 0v7L2 15.5v1.8l8-1.3v2.6l-2.4 1.4V22L12 21l4.4 1v-1.7L14 18.6V16l7 1.3z"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"/><path d="M9 12l2.2 2.2L15 10"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8.3 12.4l2.6 2.6 4.8-5.4"/>',
}

// Ordered keyword rules — first match wins (specific before generic).
const RULES: [RegExp, string][] = [
  [/카드/i, 'card'],
  [/수하물|수화물|캐리어|위탁|짐/i, 'baggage'],
  [/e-?sim|esim|유심|심카드|sim|데이터|로밍/i, 'sim'],
  [/와이?파이|wi-?fi/i, 'wifi'],
  [/그랩|우버|패스|교통|렌터카|택시|버스|기차|철도|이동/i, 'transport'],
  [/숙박|호텔|숙소|리조트|게스트하우스/i, 'hotel'],
  [/라운지/i, 'lounge'],
  [/공항|터미널|탑승|항공권|왕복|편도/i, 'plane'],
  [/스파|마사지|온천|풀|스킨|뷰티/i, 'spa'],
  [/골프/i, 'golf'],
  [/식사|라멘|맛집|뷔페|다이닝|레스토랑|음식|먹거리/i, 'food'],
  [/구독|스픽|강의|클래스|멤버십|프리미엄|어학|교육/i, 'edu'],
  [/상품권|기프티콘|기프트|경품|바우처|증정|사은품/i, 'gift'],
  [/보험/i, 'shield'],
  [/면제|수수료|tasf|발권/i, 'percent'],
  [/쿠폰/i, 'coupon'],
  [/할인|세일|%|퍼센트|특가/i, 'tag'],
]

function iconKeyFor(title: string): string {
  const t = title || ''
  for (const [re, key] of RULES) if (re.test(t)) return key
  return 'check'
}

/** Lighten a #rrggbb hex toward white by ratio (0..1). */
function lighten(hex: string, ratio: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const mix = (c: number) => Math.round(c + (255 - c) * ratio)
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

/**
 * Rounded tile with the matched line icon.
 *  - default : soft-tinted background, accent-colored glyph
 *  - gradient: accent→light gradient fill, white glyph + colored glow
 *    (the eye-catching style used on benefit cards)
 */
export function BenefitIcon({
  title,
  accent,
  soft,
  size = 46,
  radius = 14,
  gradient = false,
  forceKey,
  plain = false,
}: {
  title: string
  accent: string
  soft: string
  size?: number
  radius?: number
  gradient?: boolean
  /** 지정하면 title 키워드 매칭을 건너뛰고 이 아이콘 키를 그대로 쓴다(예: 'check'). */
  forceKey?: string
  /** 배경 타일 없이 아이콘만(둥근 사각형 박스 없이 라인 아이콘만 노출). */
  plain?: boolean
}) {
  const inner = ICONS[forceKey || iconKeyFor(title)]
  if (plain) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={accent}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    )
  }
  const icon = Math.round(size * 0.52)
  const tile: React.CSSProperties = gradient
    ? {
        background: `linear-gradient(135deg, ${lighten(accent, 0.22)} 0%, ${accent} 100%)`,
        color: '#fff',
      }
    : { background: soft, color: accent }
  return (
    <span
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...tile,
      }}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={gradient ? 2 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    </span>
  )
}

/**
 * Illustration tile for a benefit row — resolves the `구분` (category) value to
 * an SVG in public/assets/promotion-benefit-img and shows it on a soft-tinted
 * rounded tile. Used when the sheet provides a benefit category; otherwise the
 * SVG `BenefitIcon` (keyword-matched) is used as a fallback.
 */
export function BenefitImage({
  cat,
  title,
  src,
  soft,
  size = 54,
  radius = 16,
  plain = false,
}: {
  cat?: string
  title?: string
  /** 페이지 전역 중복 최소화가 적용된 이미지 경로(있으면 cat/title 매칭보다 우선). */
  src?: string
  soft: string
  size?: number
  radius?: number
  /** 배경 박스 없이 큰 이미지만(카드 내부에 그대로 담아 크게 보이게). */
  plain?: boolean
}) {
  const resolved = src ?? benefitImageSrc(cat, title)
  if (plain) {
    return (
      <img
        src={resolved}
        alt=""
        style={{
          flexShrink: 0,
          width: size,
          height: size,
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.16))',
          pointerEvents: 'none',
        }}
      />
    )
  }
  return (
    <span
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: radius,
        background: soft,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: Math.round(size * 0.13),
      }}
    >
      <img
        src={resolved}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </span>
  )
}
