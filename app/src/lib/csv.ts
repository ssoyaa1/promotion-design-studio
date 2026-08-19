/**
 * Minimal, dependency-free CSV parser + Google-Sheet URL helpers.
 * Ported from the reference prototype and kept framework-agnostic.
 */

/**
 * Split delimited text into a matrix, honoring quoted fields and escaped
 * quotes. Works for both CSV (comma) and TSV (tab) via `delim`.
 */
export function splitRows(text: string, delim = ','): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cur = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          q = false
        }
      } else {
        cur += c
      }
    } else {
      if (c === '"') q = true
      else if (c === delim) {
        row.push(cur)
        cur = ''
      } else if (c === '\n') {
        row.push(cur)
        rows.push(row)
        row = []
        cur = ''
      } else if (c === '\r') {
        // ignore
      } else cur += c
    }
  }
  row.push(cur)
  rows.push(row)
  return rows
}

/** Comma-delimited convenience wrapper. */
export function csvRows(text: string): string[][] {
  return splitRows(text, ',')
}

/**
 * Guess the delimiter: text copied straight out of a Google Sheet is
 * tab-separated; a downloaded/exported CSV is comma-separated. Any tab
 * present ⇒ treat as TSV (CSV exports never contain raw tabs).
 */
export function detectDelimiter(text: string): string {
  return text.includes('\t') ? '\t' : ','
}

/**
 * Turn any Google Sheets share/edit link into a gviz CSV export URL.
 * Already-CSV URLs pass through untouched.
 */
export function normalizeSheetUrl(u: string): string {
  if (/output=csv|tqx=out:csv/.test(u)) return u
  const idm = u.match(/\/spreadsheets\/d\/([\w-]+)/)
  if (!idm) return u
  const gidm = u.match(/[?#&]gid=(\d+)/)
  const gid = gidm ? gidm[1] : '0'
  return `https://docs.google.com/spreadsheets/d/${idm[1]}/gviz/tq?tqx=out:csv&gid=${gid}`
}

/**
 * Build the actual fetch URL. When `useProxy` is on, route through the
 * Vite dev proxy (`/gsheet?url=`) / standalone proxy to dodge CORS on
 * restricted sheets. Otherwise fetch the public CSV directly.
 */
export function sheetFetchUrl(normalized: string, useProxy: boolean): string {
  if (!useProxy) return normalized
  return `/gsheet?url=${encodeURIComponent(normalized)}`
}
