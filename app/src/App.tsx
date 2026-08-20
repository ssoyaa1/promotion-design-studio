import { useState, useMemo, useCallback, useEffect } from 'react'
import { useStudio } from './state/useStudio'
import { derive } from './lib/derive'
import { normalizeSheetUrl, sheetFetchUrl } from './lib/csv'
import { parseSheet, parseMatrix } from './lib/parseSheet'
import { exportAll as runExportAll, exportSection as runExportSection } from './lib/exportJpeg'
import { extractYYMMDD } from './lib/dates'
import {
  loadGis,
  initAuth,
  requestToken,
  restoreToken,
  isSignedIn,
  getAccessToken,
  signOut,
  extractSheetIds,
  fetchSheetMatrix,
  fetchSheetTabs,
  describeError,
  type SheetTab,
} from './lib/googleSheets'
import type { SectionKey } from './types'
import { TopBar } from './components/TopBar'
import { SectionList } from './components/SectionList'
import { PreviewCanvas } from './components/PreviewCanvas'
import { SettingsPanel } from './components/SettingsPanel'
import { UnsplashPicker } from './components/UnsplashPicker'

const CLIENT_ID_KEY = 'mrt_gsheet_client_id'
const ENV_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || ''

export default function App() {
  const studio = useStudio()
  const { state, data, routeInfo, ovGet, patch, loadData } = studio
  const [useProxy, setUseProxy] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [clientId, setClientId] = useState<string>(
    () => localStorage.getItem(CLIENT_ID_KEY) || ENV_CLIENT_ID,
  )
  const [authed, setAuthed] = useState(false)
  const [tabs, setTabs] = useState<SheetTab[]>([])
  const [selectedGid, setSelectedGid] = useState<string>('')

  const d = useMemo(() => derive(state, data, routeInfo, ovGet), [state, data, routeInfo, ovGet])

  // Preload GIS, restore a saved token, and silently refresh if possible —
  // so a page reload never forces the login popup again.
  useEffect(() => {
    let alive = true
    ;(async () => {
      await loadGis().catch(() => {})
      const cid = clientId.trim()
      if (!cid) return
      await initAuth(cid).catch(() => {})
      if (!alive) return
      if (restoreToken()) {
        setAuthed(true)
        return
      }
    })()
    return () => {
      alive = false
    }
  }, [clientId])

  const setClientIdPersist = useCallback((v: string) => {
    setClientId(v)
    try {
      if (v.trim()) localStorage.setItem(CLIENT_ID_KEY, v.trim())
      else localStorage.removeItem(CLIENT_ID_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  // Ensure a usable access token — reuse a live one, try silent, then popup.
  const ensureToken = useCallback(async (): Promise<string> => {
    await initAuth(clientId.trim())
    if (isSignedIn()) return getAccessToken()!
    return await requestToken('')
  }, [clientId])

  // Fetch one tab (by gid) and apply it. Re-auths once on a 401.
  const loadGid = useCallback(
    async (id: string, gid: string, token: string) => {
      patch({ sheetStatus: '시트 불러오는 중…' })
      let matrix: string[][]
      try {
        matrix = await fetchSheetMatrix(id, gid, token)
      } catch (e) {
        if (e instanceof Error && e.message === '401') {
          signOut()
          const t2 = await requestToken('consent')
          matrix = await fetchSheetMatrix(id, gid, t2)
        } else throw e
      }
      loadData(parseMatrix(matrix))
      setAuthed(true)
    },
    [patch, loadData],
  )

  // Switch tabs from the dropdown — reloads immediately, no extra click.
  const onSelectTab = useCallback(
    async (gid: string) => {
      setSelectedGid(gid)
      const ids = extractSheetIds((state.sheetUrl || '').trim())
      if (!ids) return
      try {
        const token = await ensureToken()
        await loadGid(ids.id, gid, token)
      } catch (e) {
        patch({ sheetStatus: '실패 — ' + describeError(e) })
      }
    },
    [state.sheetUrl, ensureToken, loadGid, tabs, patch],
  )

  const onDisconnect = useCallback(() => {
    signOut()
    setAuthed(false)
    setTabs([])
    patch({ sheetStatus: '연결 해제됨' })
  }, [patch])

  const loadViaPublic = useCallback(
    async (raw: string) => {
      const normalized = normalizeSheetUrl(raw)
      patch({ sheetStatus: '불러오는 중…' })
      try {
        const r = await fetch(sheetFetchUrl(normalized, useProxy))
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const text = await r.text()
        if (/<html/i.test(text)) throw new Error('not-csv')
        loadData(parseSheet(text))
      } catch {
        patch({
          sheetStatus: useProxy
            ? '실패 — 프록시 서버가 실행 중인지, 시트 공개 상태를 확인해주세요'
            : '실패 — 공개 시트가 아니면 위에서 구글 계정을 연결하거나, 프록시를 켜보세요',
        })
      }
    },
    [useProxy, patch, loadData],
  )

  // Refresh: auth → list tabs → (re)load the current tab. Prefers the
  // already-selected tab so 🔄 re-pulls it; else the URL's tab, else the first.
  const loadSheet = useCallback(async () => {
    const raw = (state.sheetUrl || '').trim()
    if (!raw) {
      patch({ sheetStatus: '고급 설정에서 시트 링크를 먼저 입력해주세요' })
      return
    }
    const ids = extractSheetIds(raw)
    // No OAuth client id (or an unrecognized link) → public CSV path.
    if (!clientId.trim() || !ids) {
      loadViaPublic(raw)
      return
    }
    try {
      const token = await ensureToken()
      const list = await fetchSheetTabs(ids.id, token)
      setTabs(list)
      setAuthed(true)
      const preferred = selectedGid || ids.gid
      const match = list.find((t) => t.gid === preferred)
      const gid = match ? match.gid : list[0]?.gid || ids.gid
      setSelectedGid(gid)
      await loadGid(ids.id, gid, token)
    } catch (e) {
      patch({ sheetStatus: '실패 — ' + describeError(e) })
    }
  }, [state.sheetUrl, clientId, selectedGid, ensureToken, loadGid, loadViaPublic, patch])

  const onExportAll = useCallback(() => {
    // 폴더(zip)명: YYMMDD_항공사명_디바이스 — 기준일은 라이브면 라이브 일시, 아니면 판매 시작일.
    const basisDateRaw = d.isLive ? ovGet('sched', data.liveTime) : ovGet('sales', data.salesPeriod)
    const yymmdd = extractYYMMDD(basisDateRaw) || 'YYMMDD'
    const airline = (ovGet('airline', data.airline) || '항공사').trim().replace(/[\\/:*?"<>|]/g, '')
    const folderName = `${yymmdd}_${airline}_${d.exportDevLabel}`
    setExporting(true)
    runExportAll(d.visibleKeys, d.exportDevLabel, folderName).finally(() => setExporting(false))
  }, [d.visibleKeys, d.exportDevLabel, d.isLive, data.liveTime, data.salesPeriod, data.airline, ovGet])

  const onExportSection = useCallback(
    (key: SectionKey) => {
      setExporting(true)
      runExportSection(key, d.visibleKeys, d.exportDevLabel).finally(() => setExporting(false))
    },
    [d.visibleKeys, d.exportDevLabel],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden', background: '#f1f3f5' }}>
      <TopBar studio={studio} d={d} onExportAll={onExportAll} />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <SectionList studio={studio} d={d} onExportSection={onExportSection} />
        {state.importedData ? (
          <PreviewCanvas studio={studio} d={d} />
        ) : (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#e9ecef',
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: '#868e96', letterSpacing: '-0.02em' }}>
              우측 패널에서 시트를 선택해주세요.
            </span>
          </div>
        )}
        <SettingsPanel
          studio={studio}
          d={d}
          useProxy={useProxy}
          setUseProxy={setUseProxy}
          onLoadSheet={loadSheet}
          onExportAll={onExportAll}
          auth={{
            clientId,
            setClientId: setClientIdPersist,
            authed,
            onDisconnect,
            tabs,
            selectedGid,
            onSelectTab,
          }}
        />
      </div>
      <UnsplashPicker studio={studio} />
      {exporting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(16,20,24,.45)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 14,
              padding: '28px 36px',
              borderRadius: 16,
              background: '#fff',
              boxShadow: '0 12px 32px rgba(0,0,0,.2)',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                border: '3px solid #e9ecef',
                borderTopColor: '#101418',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#101418', letterSpacing: '-0.02em' }}>
              저장 중…
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
