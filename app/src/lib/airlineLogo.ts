/**
 * 항공사명 → 로고 자동 매칭.
 * 로고 SVG는 public/assets/airline-logo/{항공사명}.svg 에 있으며(한글 파일명),
 * 시트의 항공사명과 매칭되면 해당 로고를 자동 삽입한다. 매칭 실패 시 null을
 * 반환하여, 호출부가 사용자 업로드/텍스트 대체로 폴백하도록 한다.
 */

const BASE = '/assets/airline-logo'

/** public/assets/airline-logo 에 존재하는 로고 파일명(확장자 제외). */
const LOGOS = new Set<string>([
  'ANA항공', '네덜란드항공', '대한항공', '루프트한자', '마이리얼트립',
  '말레이시아항공', '베트남항공', '스칸디나비아항공', '스쿠트항공', '싱가포르항공',
  '아메리칸항공', '아시아나', '에미레이트항공', '에바항공', '에어뉴질랜드',
  '에어로케이', '에어마카오', '에어부산', '에어서울', '에어캐나다',
  '에어프랑스', '에어프레미아', '에티하드', '이스타', '제주항공',
  '중국남방항공', '중국동방항공', '진에어', '카타르항공', '캐세이퍼시픽항공',
  '티웨이', '파라타항공', '폴란드항공', '핀에어', '필리핀항공',
  '하와이안항공', '하이난항공', '홍콩항공',
])

/** 항공사명에 대응하는 로고 파일명을 찾는다(공백 제거 · 항공 접미사 유연 매칭). */
export function matchAirlineLogo(name?: string): string | null {
  const n = (name || '').replace(/\s+/g, '')
  if (!n) return null
  const stripped = n.replace(/항공$/, '')
  const candidates = [n, stripped, stripped + '항공']
  for (const c of candidates) if (LOGOS.has(c)) return c
  return null
}

/** 매칭되는 로고의 경로(없으면 null). 한글 파일명은 URL 인코딩한다. */
export function airlineLogoSrc(name?: string): string | null {
  const match = matchAirlineLogo(name)
  return match ? `${BASE}/${encodeURIComponent(match)}.svg` : null
}

// ---- 기체 이미지 자동 매칭 ----

const PLANE_BASE = '/assets/airline-plane'

/** public/assets/airline-plane 에 존재하는 기체 파일 기준 항공사명(확장자·번호 제외). */
const PLANES = new Set<string>([
  '대한항공', '아시아나', '에어로케이', '에어마카오', '에어부산',
  '에어서울', '에어프레미아', '이스타', '제주항공', '진에어', '티웨이', '파라타',
])

/** 매칭되는 기체 이미지 경로(없으면 null). 기본 _1 변형을 반환한다. */
export function airlinePlaneSrc(name?: string): string | null {
  const n = (name || '').replace(/\s+/g, '')
  if (!n) return null
  const stripped = n.replace(/항공$/, '')
  const match = [n, stripped, stripped + '항공'].find((c) => PLANES.has(c))
  return match ? `${PLANE_BASE}/${encodeURIComponent(match)}_1.png` : null
}
