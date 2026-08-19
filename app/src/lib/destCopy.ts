/**
 * Free, offline, rule-based destination blurb generator for 강조 노선 cards.
 * Composes a natural "~해요" sentence from per-city trait keywords + a small
 * set of templates. Deterministic (same city → same line) so the preview and
 * the exported JPEG never disagree. No API, no cost.
 *
 * Guardrail: keywords describe the place only — no price / superlative /
 * scarcity claims (최저가·무료·단독·선착순 등 금지).
 */

/** Airport code → 2-3 trait noun phrases used to build the sentence. */
const CITY_TRAITS: Record<string, string[]> = {
  // Japan
  FUK: ['온천', '라멘', '근교 소도시 여행'],
  KIX: ['도톤보리 먹거리', '오사카성', '근교 교토 여행'],
  NRT: ['쇼핑', '감성 카페', '도심 명소'],
  HND: ['쇼핑', '감성 카페', '도심 명소'],
  CTS: ['설경', '신선한 해산물', '드넓은 자연'],
  OKA: ['에메랄드빛 바다', '해변 드라이브', '느긋한 휴양'],
  KMJ: ['웅장한 성', '온천', '목가적인 풍경'],
  HSG: ['도자기 마을', '온천', '조용한 시골 정취'],
  TAK: ['쫄깃한 우동', '세토내해 섬 여행', '정원 산책'],
  SHI: ['후지산 전망', '녹차밭', '온천'],
  KKJ: ['레트로 거리', '바다 전망', '소박한 미식'],
  ISG: ['산호빛 바다', '스노클링', '남국의 정취'],
  NGO: ['미식', '근교 여행', '도심 관광'],
  // Greater China
  TPE: ['야시장 먹방', '근교 온천', '골목 카페'],
  RMQ: ['예술 거리', '근교 자연', '디저트 카페'],
  HKG: ['화려한 야경', '딤섬', '거리 쇼핑'],
  PVG: ['화려한 야경', '근대 건축', '골목 미식'],
  // Southeast Asia
  CEB: ['에메랄드빛 바다', '아일랜드 호핑', '휴양 리조트'],
  BKK: ['화려한 사원', '활기찬 야시장', '길거리 미식'],
  DAD: ['미케 비치', '바나힐', '여유로운 휴양'],
  PQC: ['한적한 해변', '붉은 노을', '휴양 리조트'],
  GUM: ['투명한 바다', '워터 액티비티', '가족 휴양'],
  BKI: ['석양 해변', '섬 투어', '열대 자연'],
  CRK: ['여유로운 골프', '근교 자연', '한적한 휴양'],
  CXR: ['부드러운 해변', '머드 스파', '신선한 해산물'],
  CNX: ['고즈넉한 사원', '야시장', '산속 자연'],
  TAG: ['초콜릿 힐', '안경원숭이', '한적한 해변'],
}

/** True if the last Hangul syllable has a final consonant (받침). */
function hasBatchim(word: string): boolean {
  const ch = word.trim().slice(-1)
  const c = ch.charCodeAt(0)
  if (c < 0xac00 || c > 0xd7a3) return false
  return (c - 0xac00) % 28 !== 0
}

/** Attach the correct Korean particle. */
function j(word: string, withB: string, withoutB: string): string {
  return word + (hasBatchim(word) ? withB : withoutB)
}

type Tmpl = (a: string, b: string, c: string) => string
const TEMPLATES: Tmpl[] = [
  (a, b, c) => `${j(a, '과', '와')} ${b}, ${c}까지 알차게 즐겨요`,
  (a, b, c) => `${a}부터 ${b}까지, ${c} 가득한 여행이 기다려요`,
  (a, b, c) => `${j(a, '과', '와')} ${j(b, '을', '를')} 즐기고 ${c}도 만나요`,
]

/** Stable small hash of a string → non-negative int. */
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff
  return h
}

/**
 * Build a fitting one-line blurb for a destination.
 * @param code   airport code (keys CITY_TRAITS)
 * @param cityKo Korean city name, used for the generic fallback
 */
export function destIntro(code: string, cityKo: string): string {
  const traits = CITY_TRAITS[code]
  if (!traits || traits.length < 3) {
    return `${cityKo}에서 여유로운 하루를 보내보세요`
  }
  const tmpl = TEMPLATES[hash(code) % TEMPLATES.length]
  return tmpl(traits[0], traits[1], traits[2])
}
