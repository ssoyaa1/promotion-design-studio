/**
 * 메인 비주얼 타이틀 전용 폰트 선택지. 앱의 다른 모든 텍스트는 Pretendard로
 * 통일되고, 이 4개 중 하나만 메인 타이틀(h1)에 선택적으로 적용된다.
 * 파일은 모두 Bold 단일 굵기라 타이틀의 fontWeight:700과 맞는다.
 */
export interface HeroTitleFont {
  key: string
  label: string
  family: string
}

export const HERO_TITLE_FONTS: HeroTitleFont[] = [
  { key: 'pretendard', label: 'Pretendard', family: "'Pretendard', sans-serif" },
  { key: 'flightsans', label: 'FlightSans', family: "'FlightSans', sans-serif" },
  { key: 'kakaobig', label: 'KakaoBigSans', family: "'KakaoBigSans', sans-serif" },
  { key: 'paperlogy', label: 'Paperlogy', family: "'Paperlogy', sans-serif" },
]

export const HERO_TITLE_FONT_COUNT = HERO_TITLE_FONTS.length

export function heroTitleFontFamily(key: string): string {
  return HERO_TITLE_FONTS.find((f) => f.key === key)?.family || HERO_TITLE_FONTS[0].family
}
