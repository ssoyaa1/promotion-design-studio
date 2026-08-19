// ─── 라이브 혜택 ─────────────────────────────────────────────
const PRIZE_TEMPLATES = [
  '라이브에서 만나는\n특별한 혜택',
  '지금 라이브로\n혜택을 만나보세요',
  '라이브와 함께\n더 특별한 혜택',
  '놓치기 아쉬운\n라이브 혜택',
  '라이브로 즐기는\n여행의 특별함',
]

export const PRIZE_TITLE_COUNT = PRIZE_TEMPLATES.length

export function pickPrizeTitle(seed: number): string {
  return PRIZE_TEMPLATES[seed % PRIZE_TEMPLATES.length]
}

// ─── 구매 혜택 ───────────────────────────────────────────────
const PURCHASE_TEMPLATES = [
  '구매할수록 더해지는\n특별한 혜택',
  '여행 준비와 함께\n챙기는 혜택',
  '구매하면 따라오는\n기분 좋은 혜택',
  '여행도 준비하고\n혜택도 챙기세요',
  '놓치지 말아야 할\n구매 혜택',
]

export const PURCHASE_TITLE_COUNT = PURCHASE_TEMPLATES.length

export function pickPurchaseTitle(seed: number): string {
  return PURCHASE_TEMPLATES[seed % PURCHASE_TEMPLATES.length]
}

// ─── 강조 노선 타이틀 ─────────────────────────────────────────
/** 마지막 음절의 받침 유무에 따라 와/과 반환 */
function waga(name: string): string {
  if (!name) return '와'
  const code = name.charCodeAt(name.length - 1)
  if (code < 0xAC00 || code > 0xD7A3) return '와'
  return (code - 0xAC00) % 28 === 0 ? '와' : '과'
}

const TEMPLATES = [
  '지금 떠나기 좋은\n인기 노선',
  '여행객이 찾는\n핫한 인기 노선',
  '이번 여행지로\n눈여겨볼 노선',
  '다음 여행은\n여기 어때요?',
  '놓치기 아쉬운\n인기 노선을 만나보세요',
]

export const HIGHLIGHT_TITLE_COUNT = TEMPLATES.length

export function pickHighlightTitle(airline: string, seed: number): string {
  const idx = seed % TEMPLATES.length
  const wa = waga(airline)
  return TEMPLATES[idx].replace(/{A}/g, airline).replace(/{W}/g, wa)
}
