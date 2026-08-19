/**
 * Normalize any date token (2026-07-15 / 2026.7.15 / 2026/07/15) to the
 * unified Korean form `2026년 07월 15일`. Times, day-of-week, and range
 * separators are left untouched.
 */
export function formatDatesKo(s: string): string {
  if (!s) return s
  return s
    .replace(
      /(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/g,
      (_m, y: string, mo: string, d: string) =>
        `${y.slice(-2)}년 ${mo.padStart(2, '0')}월 ${d.padStart(2, '0')}일`,
    )
    // 시트가 이미 "2026년"처럼 한글로 포맷된 날짜를 줄 때도 연도를 2자리로 줄인다.
    .replace(/\d{4}(?=\s*년)/g, (y) => y.slice(-2))
    // "일"과 뒤이은 요일 괄호 사이에 공백 한 칸을 보장한다. 예: "27일(목)" → "27일 (목)"
    .replace(/(일)\s*(\([월화수목금토일]\))/g, '$1 $2')
}

/** Extract just the time span from a string, e.g. "…20:00 – 21:00" → "20:00 – 21:00". */
export function timePart(s: string): string {
  const t = s.match(/\d{1,2}:\d{2}/g)
  return t && t.length ? t.join(' – ') : s
}

/**
 * `formatDatesKo` 결과("26년 07월 20일 …")에서 맨 앞 날짜만 뽑아 `YYMMDD`로 반환한다.
 * 매칭되는 날짜가 없으면 빈 문자열.
 */
export function extractYYMMDD(s: string): string {
  const m = /(\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일/.exec(s || '')
  if (!m) return ''
  const [, y, mo, d] = m
  return y + mo.padStart(2, '0') + d.padStart(2, '0')
}
