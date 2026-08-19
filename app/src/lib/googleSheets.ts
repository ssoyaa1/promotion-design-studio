/**
 * Read a (possibly private) Google Sheet by link using OAuth — Google
 * Identity Services (GIS) token flow + Sheets API v4. Works for any sheet
 * the signed-in user can open, without making the sheet public.
 *
 * The Sheets API is CORS-enabled for browsers, so no proxy is needed here.
 */

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
const LS_TOKEN = 'mrt_gsheet_token'

function persistToken() {
  try {
    localStorage.setItem(LS_TOKEN, JSON.stringify({ t: accessToken, e: tokenExpiry }))
  } catch {
    /* ignore */
  }
}

/** Restore a still-valid token from a previous session. */
export function restoreToken(): boolean {
  try {
    const raw = localStorage.getItem(LS_TOKEN)
    if (!raw) return false
    const { t, e } = JSON.parse(raw)
    if (t && typeof e === 'number' && Date.now() < e) {
      accessToken = t
      tokenExpiry = e
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type TokenResponse = { access_token?: string; expires_in?: number; error?: string }

let gisPromise: Promise<void> | null = null
let tokenClient: any = null
let clientIdInUse = ''
let accessToken: string | null = null
let tokenExpiry = 0
let pending: { resolve: (t: string) => void; reject: (e: Error) => void } | null = null

/** Load the GIS client script once. Safe to call eagerly on mount. */
export function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise
  gisPromise = new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.oauth2) return resolve()
    const s = document.createElement('script')
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('구글 인증 스크립트 로드 실패'))
    document.head.appendChild(s)
  })
  return gisPromise
}

/** Create (or reuse) the token client for a given client id. */
export async function initAuth(clientId: string): Promise<void> {
  await loadGis()
  if (tokenClient && clientIdInUse === clientId) return
  const g = (window as any).google
  clientIdInUse = clientId
  tokenClient = g.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPE,
    callback: (resp: TokenResponse) => {
      if (!pending) return
      const p = pending
      pending = null
      if (resp.error || !resp.access_token) {
        p.reject(new Error(resp.error || 'no-token'))
        return
      }
      accessToken = resp.access_token
      tokenExpiry = Date.now() + (Number(resp.expires_in || 3600) - 60) * 1000
      persistToken()
      p.resolve(accessToken)
    },
  })
}

export function isSignedIn(): boolean {
  return !!accessToken && Date.now() < tokenExpiry
}

export function getAccessToken(): string | null {
  return isSignedIn() ? accessToken : null
}

export function signOut(): void {
  accessToken = null
  tokenExpiry = 0
  try {
    localStorage.removeItem(LS_TOKEN)
  } catch {
    /* ignore */
  }
}

/** Try to get a token with no UI (works if the Google session is still active). */
export function silentToken(): Promise<string> {
  return requestToken('none')
}

/**
 * Trigger the token request. MUST be called from a user gesture (click) so
 * the consent popup isn't blocked. `initAuth` must have run first.
 * `prompt: 'consent'` forces the account/consent dialog (use on retry).
 */
export function requestToken(prompt: '' | 'none' | 'consent' | 'select_account' = ''): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('구글 인증이 아직 준비되지 않았어요. 잠시 후 다시 시도해주세요.'))
      return
    }
    pending = { resolve, reject }
    tokenClient.requestAccessToken({ prompt })
  })
}

/** Pull spreadsheet id + gid out of any Google Sheets URL. */
export function extractSheetIds(url: string): { id: string; gid: string } | null {
  const idm = url.match(/\/spreadsheets\/d\/([\w-]+)/)
  if (!idm) return null
  const gidm = url.match(/[#?&]gid=(\d+)/)
  return { id: idm[1], gid: gidm ? gidm[1] : '0' }
}

async function api(url: string, token: string): Promise<any> {
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } })
  if (r.status === 401) throw new Error('401')
  if (r.status === 403) throw new Error('403')
  if (r.status === 404) throw new Error('404')
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

export interface SheetTab {
  gid: string
  title: string
}

/** List every tab (gid + title) in a spreadsheet. */
export async function fetchSheetTabs(id: string, token: string): Promise<SheetTab[]> {
  const meta = await api(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=sheets(properties(sheetId,title))`,
    token,
  )
  return (meta.sheets || []).map((s: any) => ({
    gid: String(s.properties?.sheetId ?? '0'),
    title: String(s.properties?.title ?? ''),
  }))
}

/** Fetch a sheet tab (by gid) as a 2D string matrix via Sheets API v4. */
export async function fetchSheetMatrix(id: string, gid: string, token: string): Promise<string[][]> {
  const meta = await api(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}?fields=sheets(properties(sheetId,title))`,
    token,
  )
  const sheets = meta.sheets || []
  const match = sheets.find((s: any) => String(s.properties?.sheetId) === String(gid)) || sheets[0]
  const title: string | undefined = match?.properties?.title
  if (!title) throw new Error('시트 탭을 찾을 수 없어요')
  const range = encodeURIComponent(`'${title.replace(/'/g, "''")}'`)
  const vals = await api(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}?majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE`,
    token,
  )
  return (vals.values || []) as string[][]
}

/** Human-readable message for a fetch/auth error code. */
export function describeError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e)
  if (m === '401') return '인증이 만료됐어요. 다시 로그인해주세요.'
  if (m === '403') return '이 계정은 시트 접근 권한이 없거나 Sheets API가 비활성화됐어요.'
  if (m === '404') return '시트를 찾을 수 없어요. 링크와 탭(gid)을 확인해주세요.'
  if (m === 'popup_closed_by_user' || m === 'access_denied') return '로그인이 취소됐어요.'
  return m
}
