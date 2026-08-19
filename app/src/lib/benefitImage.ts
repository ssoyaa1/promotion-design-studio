/**
 * 혜택 구분(카드/이심/쿠폰 …) → 일러스트 이미지 매핑.
 * 이미지는 public/assets/promotion-benefit-img/*.svg 에 있으며 Vite public
 * 루트로 서빙되므로 `/assets/...` 절대 경로로 참조한다. 자동 삽입이 아니라
 * 시트의 [구분] 값과 매칭되는 경우에만 사용한다(매칭 실패 시 etc).
 */

const BASE = '/assets/promotion-benefit-img'

/** 사용 가능한 이미지 키(확장자 제외 파일명). */
const KEYS = new Set([
  'card', 'coupon', 'discount', 'etc', 'gift', 'hotel',
  'lounge', 'sim', 'subscribe', 'tax', 'tour', 'transport', 'wifi',
])

/** 시트 [구분] 한글 값 → 이미지 키. */
const CAT_MAP: Record<string, string> = {
  카드: 'card',
  발권수수료: 'tax',
  이심: 'sim',
  쿠폰: 'coupon',
  교통: 'transport',
  할인: 'discount',
  구독: 'subscribe',
  숙소: 'hotel',
  투어: 'tour',
  와이파이: 'wifi',
  라운지: 'lounge',
  경품: 'gift',
  기타: 'etc',
}

/** [구분]이 정확한 카테고리가 아닌 자유 텍스트일 때의 키워드 대체 규칙. */
const KW: [RegExp, string][] = [
  [/카드/, 'card'],
  [/발권|수수료|tasf/i, 'tax'],
  [/e-?sim|esim|이심|유심|심카드/i, 'sim'],
  [/와이?파이|wi-?fi/i, 'wifi'],
  [/쿠폰/, 'coupon'],
  [/교통|그랩|우버|택시|버스|기차|철도|패스|렌터카|이동/i, 'transport'],
  [/숙소|숙박|호텔|리조트|게스트하우스/i, 'hotel'],
  [/라운지/, 'lounge'],
  [/구독|멤버십|프리미엄|스픽|어학|클래스/i, 'subscribe'],
  [/투어|입장|티켓|액티비티|체험/i, 'tour'],
  [/상품권|기프티콘|기프트|경품|증정|사은품|선물/i, 'gift'],
  [/할인|세일|퍼센트|특가|%/i, 'discount'],
]

/** 혜택 구분/키워드를 이미지 키로 해석(실패 시 'etc'). */
export function benefitImageKey(cat?: string, title?: string): string {
  const c = (cat || '').trim()
  if (c) {
    if (CAT_MAP[c]) return CAT_MAP[c]
    const lc = c.toLowerCase()
    if (KEYS.has(lc)) return lc // 시트가 이미 영문 키를 쓴 경우
  }
  const hay = `${c} ${title || ''}`
  for (const [re, key] of KW) if (re.test(hay)) return key
  return 'etc'
}

/** 혜택 구분/키워드에 매칭되는 이미지 경로. */
export function benefitImageSrc(cat?: string, title?: string): string {
  return `${BASE}/${benefitImageKey(cat, title)}.svg`
}

/** 이미지 키(예: 'card', 'etc')로 직접 경로를 만든다. */
export function promoImgSrc(key: string): string {
  return `${BASE}/${key}.svg`
}
