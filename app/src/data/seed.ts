import type { PromoData, Theme, ThemeKey, BaseSectionKey } from '../types'

/** Airport code → Korean city name. Extend as sheets introduce new codes. */
export const AIRPORTS: Record<string, string> = {
  // 한국
  ICN: '인천', GMP: '김포', PUS: '부산', CJU: '제주', CJJ: '청주',
  TAE: '대구', KWJ: '광주', RSU: '여수', USN: '울산', MWX: '무안',
  // 일본
  NRT: '도쿄', HND: '도쿄', KIX: '오사카', ITM: '오사카', FUK: '후쿠오카',
  CTS: '삿포로', OKA: '오키나와', NGO: '나고야', SDJ: '센다이', KOJ: '가고시마',
  KMQ: '가나자와', HIJ: '히로시마', TAK: '다카마쓰', MYJ: '마쓰야마',
  KMI: '미야자키', KMJ: '구마모토', OIT: '오이타', NGS: '나가사키',
  OKJ: '오카야마', KIJ: '니가타', SHI: '시즈오카', KKJ: '기타큐슈', FSZ: '시즈오카',
  ISG: '이시가키', HSG: '사가', TKS: '도쿠시마', OBO: '오비히로', IBR: '이바라키', UKB: '고베', YGJ: '요나고',
  // 중화권
  PEK: '베이징', PKX: '베이징', PVG: '상하이', SHA: '상하이',
  CAN: '광저우', SZX: '선전', CTU: '청두', TFU: '청두',
  XIY: '시안', CKG: '충칭', HGH: '항저우', NKG: '난징',
  WUH: '우한', TAO: '칭다오', DLC: '다롄', TSN: '톈진',
  XMN: '샤먼', KMG: '쿤밍', CSX: '창사', CGO: '정저우',
  SYX: '싼야', HAK: '하이커우', URC: '우루무치', SHE: '선양',
  HRB: '하얼빈', FOC: '푸저우', NNG: '난닝', KWE: '구이양', TNA: '제남', YNJ: '연길', YNT: '옌타이', CGQ: '창춘', WEH: '웨이하이', DYG: '장가계',
  HKG: '홍콩', MFM: '마카오', TPE: '타이베이', TSA: '타이베이',
  KHH: '가오슝', RMQ: '타이중',
  // 동남아시아
  BKK: '방콕', DMK: '방콕', HKT: '푸껫', CNX: '치앙마이',
  KBV: '끄라비', USM: '코사무이', SIN: '싱가포르',
  KUL: '쿠알라룸푸르', SZB: '쿠알라룸푸르', PEN: '페낭',
  BKI: '코타키나발루', KCH: '쿠칭', LGK: '랑카위',
  MNL: '마닐라', CEB: '세부', CRK: '클라크', DVO: '다바오', PPS: '푸에르토프린세사', KLO: '칼리보',
  HAN: '하노이', SGN: '호찌민', DAD: '다낭',
  CXR: '나트랑', PQC: '푸꾸옥', HPH: '하이퐁',
  DPS: '덴파사르', CGK: '자카르타', SUB: '수라바야', KNO: '메단', UPG: '마카사르',
  BWN: '반다르스리브가완', TAG: '보홀',
  PNH: '프놈펜', SAI: '시엠레아프',
  VTE: '비엔티안', LPQ: '루앙프라방',
  RGN: '양곤', MDL: '만달레이',
  GUM: '괌', SPN: '사이판', ROR: '팔라우',
  // 중앙아시아
  DEL: '델리', BOM: '뭄바이', BLR: '벵갈루루', MAA: '첸나이',
  HYD: '하이데라바드', CCU: '콜카타', COK: '코치', GOI: '고아',
  AMD: '아마다바드', NAG: '나그푸르',
  KTM: '카트만두', CMB: '콜롬보', DAC: '다카', MLE: '말레',
  ISB: '이슬라마바드', KHI: '카라치', LHE: '라호르',
  TBS: '트빌리시', GYD: '바쿠', ALA: '알마티', NQZ: '아스타나', TAS: '타슈켄트', UBN: '울란바토르', BSZ: '비슈케크',
  // 중동
  DXB: '두바이', DWC: '두바이', AUH: '아부다비', DOH: '도하',
  RUH: '리야드', JED: '제다', DMM: '담맘', BAH: '마나마',
  KWI: '쿠웨이트시티', MCT: '무스카트', AMM: '암만',
  TLV: '텔아비브', BEY: '베이루트',
  IST: '이스탄불', SAW: '이스탄불', AYT: '안탈리아',
  CAI: '카이로', SSH: '샤름엘셰이크',
  CMN: '카사블랑카', RAK: '마라케시', TUN: '튀니스', ALG: '알제',
  ADD: '아디스아바바', NBO: '나이로비', JNB: '요하네스버그', CPT: '케이프타운',
  DUR: '더반', LOS: '라고스', ABV: '아부자', ACC: '아크라',
  DAR: '다르에스살람', ZNZ: '잔지바르', MRU: '포트루이스', SEZ: '빅토리아',
  // 유럽
  LHR: '런던', LGW: '런던', STN: '런던', LTN: '런던', LCY: '런던',
  MAN: '맨체스터', EDI: '에든버러', BHX: '버밍엄', GLA: '글래스고', DUB: '더블린',
  CDG: '파리', ORY: '파리', NCE: '니스', LYS: '리옹', MRS: '마르세유',
  FRA: '프랑크푸르트', MUC: '뮌헨', BER: '베를린', DUS: '뒤셀도르프', HAM: '함부르크',
  FCO: '로마', MXP: '밀라노', LIN: '밀라노', VCE: '베네치아', NAP: '나폴리',
  MAD: '마드리드', BCN: '바르셀로나', AGP: '말라가', PMI: '팔마데마요르카',
  LIS: '리스본', OPO: '포르투',
  AMS: '암스테르담', BRU: '브뤼셀', ZRH: '취리히', GVA: '제네바', VIE: '빈',
  PRG: '프라하', BUD: '부다페스트', WAW: '바르샤바', KRK: '크라쿠프',
  CPH: '코펜하겐', ARN: '스톡홀름', OSL: '오슬로', HEL: '헬싱키', KEF: '레이캬비크',
  ATH: '아테네', SKG: '테살로니키', SOF: '소피아', OTP: '부쿠레슈티',
  BEG: '베오그라드', ZAG: '자그레브', SPU: '스플리트', LJU: '류블랴나',
  SJJ: '사라예보', SKP: '스코페', TIA: '티라나',
  RIX: '리가', TLL: '탈린', VNO: '빌뉴스',
  // 미주
  JFK: '뉴욕', LGA: '뉴욕', EWR: '뉴욕',
  LAX: '로스앤젤레스', SFO: '샌프란시스코', SJC: '산호세', SEA: '시애틀',
  ORD: '시카고', MDW: '시카고', DFW: '댈러스', DAL: '댈러스',
  IAH: '휴스턴', HOU: '휴스턴', ATL: '애틀랜타', MIA: '마이애미',
  FLL: '포트로더데일', MCO: '올랜도', BOS: '보스턴',
  IAD: '워싱턴', DCA: '워싱턴', BWI: '볼티모어', PHL: '필라델피아',
  DEN: '덴버', LAS: '라스베이거스', PHX: '피닉스', SAN: '샌디에이고',
  PDX: '포틀랜드', MSP: '미니애폴리스', DTW: '디트로이트', CLT: '샬럿',
  SLC: '솔트레이크시티', HNL: '호놀룰루', OGG: '카훌루이', ANC: '앵커리지',
  YYZ: '토론토', YTZ: '토론토', YVR: '밴쿠버', YUL: '몬트리올',
  YOW: '오타와', YYC: '캘거리', YEG: '에드먼턴', YHZ: '핼리팩스',
  MEX: '멕시코시티', NLU: '멕시코시티', CUN: '칸쿤',
  GDL: '과달라하라', MTY: '몬테레이',
  HAV: '아바나', SDQ: '산토도밍고', PUJ: '푼타카나', SJU: '산후안', NAS: '나소',
  PTY: '파나마시티', SJO: '산호세', GUA: '과테말라시티',
  BOG: '보고타', MDE: '메데인', LIM: '리마', CUZ: '쿠스코',
  SCL: '산티아고', EZE: '부에노스아이레스', AEP: '부에노스아이레스',
  GRU: '상파울루', CGH: '상파울루', GIG: '리우데자네이루', BSB: '브라질리아',
  // 대양주
  SYD: '시드니', MEL: '멜버른', BNE: '브리즈번', PER: '퍼스',
  ADL: '애들레이드', CNS: '케언스', OOL: '골드코스트', DRW: '다윈',
  AKL: '오클랜드', CHC: '크라이스트처치', WLG: '웰링턴', ZQN: '퀸스타운',
  NAN: '난디', PPT: '파페에테',
}

/** Airport code → English city name, used to query Unsplash accurately. */
export const AIRPORT_EN: Record<string, string> = {
  // 한국
  ICN: 'Incheon', GMP: 'Gimpo', PUS: 'Busan', CJU: 'Jeju', CJJ: 'Cheongju',
  TAE: 'Daegu', KWJ: 'Gwangju', RSU: 'Yeosu', USN: 'Ulsan', MWX: 'Muan',
  // 일본
  NRT: 'Tokyo', HND: 'Tokyo', KIX: 'Osaka', ITM: 'Osaka', FUK: 'Fukuoka',
  CTS: 'Sapporo', OKA: 'Okinawa', NGO: 'Nagoya', SDJ: 'Sendai', KOJ: 'Kagoshima',
  KMQ: 'Kanazawa', HIJ: 'Hiroshima', TAK: 'Takamatsu', MYJ: 'Matsuyama',
  KMI: 'Miyazaki', KMJ: 'Kumamoto', OIT: 'Oita', NGS: 'Nagasaki',
  OKJ: 'Okayama', KIJ: 'Niigata', SHI: 'Shizuoka', KKJ: 'Kitakyushu',
  ISG: 'Ishigaki', HSG: 'Saga', TKS: 'Tokushima', OBO: 'Obihiro', IBR: 'Ibaraki', UKB: 'Kobe',
  // 중화권
  PEK: 'Beijing', PKX: 'Beijing', PVG: 'Shanghai', SHA: 'Shanghai',
  CAN: 'Guangzhou', SZX: 'Shenzhen', CTU: 'Chengdu', TFU: 'Chengdu',
  XIY: "Xi'an", CKG: 'Chongqing', HGH: 'Hangzhou', NKG: 'Nanjing',
  WUH: 'Wuhan', TAO: 'Qingdao', DLC: 'Dalian', TSN: 'Tianjin',
  XMN: 'Xiamen', KMG: 'Kunming', CSX: 'Changsha', CGO: 'Zhengzhou',
  SYX: 'Sanya', HAK: 'Haikou', URC: 'Urumqi', SHE: 'Shenyang',
  HRB: 'Harbin', FOC: 'Fuzhou', NNG: 'Nanning', KWE: 'Guiyang', TNA: 'Jinan', YNJ: 'Yanji', YNT: 'Yantai', CGQ: 'Changchun',
  HKG: 'Hong Kong', MFM: 'Macau', TPE: 'Taipei', TSA: 'Taipei',
  KHH: 'Kaohsiung', RMQ: 'Taichung',
  // 동남아시아
  BKK: 'Bangkok', DMK: 'Bangkok', HKT: 'Phuket', CNX: 'Chiang Mai',
  KBV: 'Krabi', USM: 'Koh Samui', SIN: 'Singapore',
  KUL: 'Kuala Lumpur', SZB: 'Kuala Lumpur', PEN: 'Penang',
  BKI: 'Kota Kinabalu', KCH: 'Kuching', LGK: 'Langkawi',
  MNL: 'Manila', CEB: 'Cebu', CRK: 'Clark', DVO: 'Davao', PPS: 'Puerto Princesa',
  HAN: 'Hanoi', SGN: 'Ho Chi Minh City', DAD: 'Da Nang',
  CXR: 'Nha Trang', PQC: 'Phu Quoc', HPH: 'Haiphong',
  DPS: 'Bali', CGK: 'Jakarta', SUB: 'Surabaya', KNO: 'Medan', UPG: 'Makassar',
  BWN: 'Bandar Seri Begawan', TAG: 'Bohol',
  PNH: 'Phnom Penh', SAI: 'Siem Reap',
  VTE: 'Vientiane', LPQ: 'Luang Prabang',
  RGN: 'Yangon', MDL: 'Mandalay',
  GUM: 'Guam', SPN: 'Saipan',
  // 중앙아시아
  DEL: 'Delhi', BOM: 'Mumbai', BLR: 'Bangalore', MAA: 'Chennai',
  HYD: 'Hyderabad', CCU: 'Kolkata', COK: 'Kochi', GOI: 'Goa',
  AMD: 'Ahmedabad', NAG: 'Nagpur',
  KTM: 'Kathmandu', CMB: 'Colombo', DAC: 'Dhaka', MLE: 'Male',
  ISB: 'Islamabad', KHI: 'Karachi', LHE: 'Lahore',
  TBS: 'Tbilisi', GYD: 'Baku', ALA: 'Almaty', NQZ: 'Astana', TAS: 'Tashkent',
  // 중동
  DXB: 'Dubai', DWC: 'Dubai', AUH: 'Abu Dhabi', DOH: 'Doha',
  RUH: 'Riyadh', JED: 'Jeddah', DMM: 'Dammam', BAH: 'Manama',
  KWI: 'Kuwait City', MCT: 'Muscat', AMM: 'Amman',
  TLV: 'Tel Aviv', BEY: 'Beirut',
  IST: 'Istanbul', SAW: 'Istanbul', AYT: 'Antalya',
  CAI: 'Cairo', SSH: 'Sharm el-Sheikh',
  CMN: 'Casablanca', RAK: 'Marrakech', TUN: 'Tunis', ALG: 'Algiers',
  ADD: 'Addis Ababa', NBO: 'Nairobi', JNB: 'Johannesburg', CPT: 'Cape Town',
  DUR: 'Durban', LOS: 'Lagos', ABV: 'Abuja', ACC: 'Accra',
  DAR: 'Dar es Salaam', ZNZ: 'Zanzibar', MRU: 'Port Louis', SEZ: 'Victoria',
  // 유럽
  LHR: 'London', LGW: 'London', STN: 'London', LTN: 'London', LCY: 'London',
  MAN: 'Manchester', EDI: 'Edinburgh', BHX: 'Birmingham', GLA: 'Glasgow', DUB: 'Dublin',
  CDG: 'Paris', ORY: 'Paris', NCE: 'Nice', LYS: 'Lyon', MRS: 'Marseille',
  FRA: 'Frankfurt', MUC: 'Munich', BER: 'Berlin', DUS: 'Dusseldorf', HAM: 'Hamburg',
  FCO: 'Rome', MXP: 'Milan', LIN: 'Milan', VCE: 'Venice', NAP: 'Naples',
  MAD: 'Madrid', BCN: 'Barcelona', AGP: 'Malaga', PMI: 'Palma de Mallorca',
  LIS: 'Lisbon', OPO: 'Porto',
  AMS: 'Amsterdam', BRU: 'Brussels', ZRH: 'Zurich', GVA: 'Geneva', VIE: 'Vienna',
  PRG: 'Prague', BUD: 'Budapest', WAW: 'Warsaw', KRK: 'Krakow',
  CPH: 'Copenhagen', ARN: 'Stockholm', OSL: 'Oslo', HEL: 'Helsinki', KEF: 'Reykjavik',
  ATH: 'Athens', SKG: 'Thessaloniki', SOF: 'Sofia', OTP: 'Bucharest',
  BEG: 'Belgrade', ZAG: 'Zagreb', SPU: 'Split', LJU: 'Ljubljana',
  SJJ: 'Sarajevo', SKP: 'Skopje', TIA: 'Tirana',
  RIX: 'Riga', TLL: 'Tallinn', VNO: 'Vilnius',
  // 미주
  JFK: 'New York', LGA: 'New York', EWR: 'New York',
  LAX: 'Los Angeles', SFO: 'San Francisco', SJC: 'San Jose', SEA: 'Seattle',
  ORD: 'Chicago', MDW: 'Chicago', DFW: 'Dallas', DAL: 'Dallas',
  IAH: 'Houston', HOU: 'Houston', ATL: 'Atlanta', MIA: 'Miami',
  FLL: 'Fort Lauderdale', MCO: 'Orlando', BOS: 'Boston',
  IAD: 'Washington', DCA: 'Washington', BWI: 'Baltimore', PHL: 'Philadelphia',
  DEN: 'Denver', LAS: 'Las Vegas', PHX: 'Phoenix', SAN: 'San Diego',
  PDX: 'Portland', MSP: 'Minneapolis', DTW: 'Detroit', CLT: 'Charlotte',
  SLC: 'Salt Lake City', HNL: 'Honolulu', OGG: 'Maui', ANC: 'Anchorage',
  YYZ: 'Toronto', YTZ: 'Toronto', YVR: 'Vancouver', YUL: 'Montreal',
  YOW: 'Ottawa', YYC: 'Calgary', YEG: 'Edmonton', YHZ: 'Halifax',
  MEX: 'Mexico City', NLU: 'Mexico City', CUN: 'Cancun',
  GDL: 'Guadalajara', MTY: 'Monterrey',
  HAV: 'Havana', SDQ: 'Santo Domingo', PUJ: 'Punta Cana', SJU: 'San Juan', NAS: 'Nassau',
  PTY: 'Panama City', SJO: 'San Jose', GUA: 'Guatemala City',
  BOG: 'Bogota', MDE: 'Medellin', LIM: 'Lima', CUZ: 'Cusco',
  SCL: 'Santiago', EZE: 'Buenos Aires', AEP: 'Buenos Aires',
  GRU: 'Sao Paulo', CGH: 'Sao Paulo', GIG: 'Rio de Janeiro', BSB: 'Brasilia',
  // 대양주
  SYD: 'Sydney', MEL: 'Melbourne', BNE: 'Brisbane', PER: 'Perth',
  ADL: 'Adelaide', CNS: 'Cairns', OOL: 'Gold Coast', DRW: 'Darwin',
  AKL: 'Auckland', CHC: 'Christchurch', WLG: 'Wellington', ZQN: 'Queenstown',
  NAN: 'Nadi', PPT: 'Papeete',
}

/** Build an Unsplash search query for a destination (prefer English name). */
export function cityQuery(code: string, korean?: string): string {
  return AIRPORT_EN[code] || (korean && korean.trim()) || code
}

/** English section keys for export filenames. */
export const EN: Record<BaseSectionKey, string> = {
  visual: 'hero',
  schedule: 'schedule',
  airline: 'airline',
  prize: 'prize',
  purchase: 'benefit',
  highlight: 'pick_routes',
  cta: 'cta',
}

/** Default section order. `airline`/`prize` are conditionally applicable. */
export const BASE_ORDER: BaseSectionKey[] = [
  'visual', 'schedule', 'airline', 'prize', 'purchase', 'highlight', 'cta',
]

/** Index into the curated UNSPLASH list, used only when images are toggled on. */
export const CITY_IMG: Record<string, number> = {
  NRT: 0, HND: 0, HKG: 0, KIX: 1, FUK: 1, TPE: 1,
  CEB: 2, OKA: 2, DAD: 3, BKK: 4, CTS: 5, KMJ: 1, HSG: 2,
}

/** Short "~해요" destination blurbs. No pricing / superlative claims. */
export const DEST_INTRO: Record<string, string> = {
  FUK: '온천과 라멘, 짧은 일정에도 알차게 즐길 수 있어요',
  KIX: '먹거리와 볼거리가 가득해 처음 가도 실패 없어요',
  NRT: '쇼핑부터 감성 카페까지 하루가 짧게 느껴져요',
  HND: '쇼핑부터 감성 카페까지 하루가 짧게 느껴져요',
  CEB: '에메랄드빛 바다에서 온전히 쉬어갈 수 있어요',
  BKK: '이국적인 사원과 야시장을 밤늦게까지 즐겨요',
  DAD: '해변과 미케 비치, 여유로운 휴양을 즐겨요',
  TPE: '야시장 먹방과 근교 여행을 함께 즐겨요',
  HKG: '화려한 야경과 딤섬을 마음껏 만나요',
}

/**
 * Completely empty promotion — the app's initial (pre-import) state and the
 * parse-time base template (see buildData). Real values always come from the
 * loaded sheet; no sample content is bundled.
 */
export const EMPTY_DATA: PromoData = {
  promoType: 'live',
  promoName: '',
  subtitle: '',
  airline: '',
  liveTime: '',
  period: '',
  salesPeriod: '',
  boardingPeriod: '',
  boardingNote: '',
  liveBenefits: [],
  prizes: [],
  purchaseBenefits: [],
  airlineHighlights: [],
  highlight: [],
  departures: [],
  ctaLabel: '',
}

/* ---- theme color helpers: derive soft/deep tints from an accent hex ---- */
type RGB = [number, number, number]
function hexToRgb(h: string): RGB {
  const s = h.replace('#', '')
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
}
function rgbToHex(rgb: RGB): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return '#' + c(rgb[0]) + c(rgb[1]) + c(rgb[2])
}
function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}
/** Build a full theme from a single accent hex. */
function makeTheme(name: string, accentHex: string): Theme {
  const acc = hexToRgb(accentHex)
  const lum = (acc[0] + acc[1] + acc[2]) / 3 / 255
  const accent = rgbToHex(acc)
  // very dark accents (ink) keep themselves as `deep` and use a neutral soft
  if (lum < 0.15) return { name, accent, soft: '#f1f3f5', deep: accent }
  return {
    name,
    accent,
    soft: rgbToHex(mix(acc, [255, 255, 255], 0.88)),
    deep: rgbToHex(mix(acc, [0, 0, 0], 0.55)),
  }
}

export const THEMES: Record<ThemeKey, Theme> = {
  red: makeTheme('레드', '#ca3436'),
  orange: makeTheme('오렌지', '#ff6600'),
  blue: makeTheme('블루', '#1ab2e5'),
  lime: makeTheme('라임', '#98b700'),
  teal: makeTheme('민트', '#24c6a9'),
  dark: makeTheme('다크', '#101418'),
  purple: makeTheme('퍼플', '#7c3aed'),
  pink: makeTheme('핑크', '#ec4899'),
}

/** Curated hero + card images (only used when the user toggles images on). */
export const UNSPLASH = [
  'https://images.unsplash.com/photo-1503899036084-c55cdd92da26',
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186',
  'https://images.unsplash.com/photo-1506929562872-bb421503ef21',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e',
]

export const HERO_IMG = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05'

export const UNSPLASH_LIB: { u: string; c: string }[] = [
  { u: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05', c: '하늘' },
  { u: 'https://images.unsplash.com/photo-1474302770737-173ee21bab63', c: '하늘' },
  { u: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26', c: '도시' },
  { u: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf', c: '도시' },
  { u: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390', c: '도시' },
  { u: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', c: '해변' },
  { u: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186', c: '해변' },
  { u: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21', c: '해변' },
  { u: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e', c: '자연' },
  { u: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05', c: '자연' },
  { u: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34', c: '유럽' },
  { u: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9', c: '유럽' },
]

export const PICKER_CATS = ['전체', '하늘', '도시', '해변', '자연', '유럽']

/** Append Unsplash sizing params. */
export function img(u: string, w = 900, q = 60): string {
  return `${u}?auto=format&fit=crop&w=${w}&q=${q}`
}
