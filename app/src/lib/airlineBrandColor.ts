/**
 * 항공사명 → 브랜드 컬러(accent hex) 자동 매칭.
 * matchAirlineLogo와 동일한 패턴(공백 제거 · '항공' 접미사 유연 매칭 · 영문
 * 약칭 대소문자 무시)으로 매칭하며, 실패 시 null을 반환해 호출부가 기존
 * 기본 테마로 폴백하도록 한다.
 */

// [항공사명(+영문 약칭 등 별칭), 대표 브랜드 컬러 hex]
const BRAND_COLORS: [string[], string][] = [
  [['네덜란드항공', 'KLM'], '#049CDC'],
  [['대한항공'], '#041464'],
  [['루프트한자'], '#04245C'],
  [['말레이시아항공'], '#042C5C'],
  [['베트남항공'], '#046C84'],
  [['스칸디나비아항공', 'SAS'], '#14049C'],
  [['스쿠트항공'], '#FCEC04'],
  [['싱가포르항공'], '#002569'],
  [['아메리칸항공'], '#0D73B1'],
  [['아시아나항공', '아시아나'], '#C21E3F'],
  [['에미레이트항공'], '#D42424'],
  [['에바항공', 'EVAAIR', 'EVA'], '#04A44C'],
  [['에어뉴질랜드'], '#241C24'],
  [['에어로케이'], '#1C2C4C'],
  [['에어마카오'], '#342464'],
  [['에어부산'], '#1E409A'],
  [['에어서울'], '#18B597'],
  [['에어캐나다'], '#F01428'],
  [['에어프랑스'], '#042454'],
  [['에어프레미아'], '#EC542C'],
  [['에티하드'], '#C4921B'],
  [['이스타항공', '이스타'], '#D12149'],
  [['제주항공'], '#F45424'],
  [['중국남방항공'], '#0494D4'],
  [['중국동방항공'], '#D70819'],
  [['진에어'], '#BBD304'],
  [['카타르항공'], '#64043C'],
  [['캐세이퍼시픽항공'], '#045C64'],
  [['티웨이항공', '티웨이'], '#D43434'],
  [['파라타항공', '파라타'], '#041CE4'],
  [['폴란드항공', 'LOT'], '#1C2C5C'],
  [['핀에어'], '#0C1464'],
  [['필리핀항공'], '#EC2C2C'],
  [['하와이안항공'], '#4B2D89'],
  [['하이난항공'], '#E40414'],
  [['홍콩항공'], '#E40414'],
  [['ANA항공', 'ANA'], '#0C338C'],
]

/** 별칭까지 모두 포함해, 정규화된 이름 → hex 조회 맵을 만든다. */
const COLOR_MAP = new Map<string, string>()
for (const [names, hex] of BRAND_COLORS) {
  for (const n of names) COLOR_MAP.set(n.toUpperCase(), hex)
}

/** 항공사명에 대응하는 브랜드 컬러 hex를 찾는다(없으면 null). */
export function matchAirlineBrandColor(name?: string): string | null {
  const n = (name || '').replace(/\s+/g, '')
  if (!n) return null
  const stripped = n.replace(/항공$/, '')
  const candidates = [n, stripped, stripped + '항공']
  for (const c of candidates) {
    const hit = COLOR_MAP.get(c.toUpperCase())
    if (hit) return hit
  }
  return null
}
