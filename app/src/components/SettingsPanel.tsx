import { useState } from 'react'
import type { Studio } from '../state/useStudio'
import type { Derived } from '../lib/derive'
import { THEMES } from '../data/seed'
import type { SectionKey, ThemeKey } from '../types'
import { readFile } from '../lib/readFile'
import { HIGHLIGHT_TITLE_COUNT, PRIZE_TITLE_COUNT, PURCHASE_TITLE_COUNT } from '../lib/highlightTitles'
import { HERO_TITLE_FONTS } from '../lib/heroFonts'

/** 랜덤 시드로 고르는 섹션 타이틀 — 우측 패널에서 새로고침 버튼으로 다시 뽑을 수 있게 한다. */
const TITLE_SEED_CONFIG: Partial<Record<SectionKey, { key: 'prizeTitleSeed' | 'purchaseTitleSeed' | 'highlightTitleSeed'; count: number }>> = {
  prize: { key: 'prizeTitleSeed', count: PRIZE_TITLE_COUNT },
  purchase: { key: 'purchaseTitleSeed', count: PURCHASE_TITLE_COUNT },
  highlight: { key: 'highlightTitleSeed', count: HIGHLIGHT_TITLE_COUNT },
}

export interface SheetAuth {
  clientId: string
  setClientId: (v: string) => void
  authed: boolean
  onDisconnect: () => void
  tabs: { gid: string; title: string }[]
  selectedGid: string
  /** Pick a tab — reloads that tab immediately. */
  onSelectTab: (gid: string) => void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  marginTop: 5,
  padding: '0 12px',
  border: '1px solid #dee2e6',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  color: '#101418',
  letterSpacing: '-0.02em',
  outline: 'none',
}
const fieldLabel: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#666d75', letterSpacing: '-0.02em' }
const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#adb5bd',
  fontWeight: 600,
  marginTop: 6,
  letterSpacing: '-0.02em',
  lineHeight: 1.5,
}

export function SettingsPanel({
  studio,
  d,
  useProxy,
  setUseProxy,
  onLoadSheet,
  onExportAll,
  auth,
}: {
  studio: Studio
  d: Derived
  useProxy: boolean
  setUseProxy: (v: boolean) => void
  onLoadSheet: () => void
  onExportAll: () => void
  auth: SheetAuth
}) {
  const { state, patch, setTheme, setThemeMode, ovGet, setOv } = studio
  const { exportDevLabel, sectionLabel, app, airlineBrandHex } = d
  const selKey = state.selectedKey
  const selIsVisual = selKey === 'visual'
  const titleSeedCfg = TITLE_SEED_CONFIG[selKey]
  // 좌측 섹션 목록과 동일한 순번 매기기 기준(state.order 중 app에 포함된 것만) 재사용.
  const orderedKeys = state.order.filter((k) => app.includes(k))
  const selIdx = orderedKeys.indexOf(selKey)
  const selNumberLabel = selIdx >= 0 ? `${exportDevLabel}-${String(selIdx + 1).padStart(2, '0')}` : ''
  // Open "고급 설정" by default only on first run (no saved link to load yet).
  const [authOpen, setAuthOpen] = useState(!state.sheetUrl.trim())

  return (
    <aside
      className="cap-scroll"
      style={{
        width: 300,
        flexShrink: 0,
        background: '#fff',
        borderLeft: '1px solid #e9ecef',
        overflowY: 'auto',
        minHeight: 0,
      }}
    >
      {/* Google Sheet loader — one-click: paste link → 불러오기 */}
      <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #f1f3f5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#666d75', letterSpacing: '-0.02em' }}>📄 구글 시트</span>
          {state.sheetStatus && /실패/.test(state.sheetStatus) ? (
            <span style={{ fontSize: 14, color: '#e03131' }} title={state.sheetStatus}>✕</span>
          ) : state.sheetStatus && /완료/.test(state.sheetStatus) ? (
            <span style={{ fontSize: 14, color: '#2f9e44' }} title={state.sheetStatus}>✓</span>
          ) : null}
        </div>
        {/* Tab select + small refresh. 🔄 does the load (auth → tabs → data);
            picking a tab reloads it. Tabs populate after the first refresh. */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <select
            value={auth.selectedGid}
            onChange={(e) => auth.onSelectTab(e.target.value)}
            disabled={auth.tabs.length === 0}
            style={{
              flex: 1,
              height: 38,
              padding: '0 10px',
              border: '1px solid #dee2e6',
              borderRadius: 10,
              fontSize: 12.5,
              fontFamily: 'inherit',
              fontWeight: 600,
              color: auth.tabs.length ? '#101418' : '#adb5bd',
              background: '#fff',
              outline: 'none',
            }}
          >
            {auth.tabs.length === 0 ? (
              <option value="">🔄로 시트를 불러오세요</option>
            ) : (
              auth.tabs.map((t) => (
                <option key={t.gid} value={t.gid}>
                  {t.title}
                </option>
              ))
            )}
          </select>
          <button
            onClick={onLoadSheet}
            title="시트 새로고침 (불러오기)"
            style={{
              width: 40,
              height: 38,
              flexShrink: 0,
              border: 0,
              borderRadius: 10,
              background: '#101418',
              color: '#fff',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            🔄
          </button>
        </div>

        {state.sheetStatus && !/실패|완료/.test(state.sheetStatus) && (
          <div style={{ marginTop: 8, fontSize: 11.5, fontWeight: 600, color: '#666d75', letterSpacing: '-0.02em' }}>
            {state.sheetStatus}
          </div>
        )}

        {/* Advanced — auth details most users never need to open */}
        <button
          onClick={() => setAuthOpen((v) => !v)}
          style={{
            border: 0,
            background: 'transparent',
            padding: '10px 0 0',
            fontSize: 11,
            fontWeight: 700,
            color: '#adb5bd',
            letterSpacing: '-0.02em',
            cursor: 'pointer',
          }}
        >
          고급 설정 (링크 · OAuth · 이미지) {authOpen ? '▲' : '▼'}
        </button>
        {authOpen && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* sheet link — entered once, persisted; the 시트 불러오기 button uses it */}
            <div>
              <span style={fieldLabel}>구글 시트 링크</span>
              <input
                value={state.sheetUrl}
                onChange={(e) => patch({ sheetUrl: e.target.value })}
                placeholder="구글 시트 공유 링크 붙여넣기"
                style={{ ...inputStyle, height: 36, marginTop: 5, fontSize: 11.5, fontWeight: 500 }}
              />
            </div>

            {/* connection status + disconnect */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                background: auth.authed ? '#e6f8f3' : '#f8f9fa',
                borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 13 }}>{auth.authed ? '🟢' : '⚪'}</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 700, letterSpacing: '-0.02em', color: auth.authed ? '#137b5e' : '#666d75' }}>
                {auth.authed ? '구글 계정 연결됨' : '구글 계정 미연결'}
              </span>
              {auth.authed && (
                <button
                  onClick={auth.onDisconnect}
                  style={{
                    border: 0,
                    borderRadius: 99,
                    padding: '0 12px',
                    height: 28,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    cursor: 'pointer',
                    background: '#dee2e6',
                    color: '#495056',
                  }}
                >
                  해제
                </button>
              )}
            </div>

            {/* OAuth 클라이언트 ID는 앱 전체가 공유하는 값(.env)이라 사용자별 입력 UI를
                두지 않는다. 원본 등록 안내만 남긴다. */}
            <div style={hintStyle}>
              구글 클라우드 콘솔에 승인된 JS 원본으로 등록: <b>{location.origin}</b>
            </div>

            {/* Unsplash Access Key — 공용 기본 키가 빌드에 심어져 있어 평소엔 비워둬도 된다.
                여기 입력하면 이 브라우저에서만 그 값으로 덮어써서 쓴다(개인 한도로 쓰고 싶을 때). */}
            <div>
              <span style={fieldLabel}>Unsplash Access Key (선택)</span>
              <input
                type="password"
                value={state.unsplashKey}
                onChange={(e) => patch({ unsplashKey: e.target.value })}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                autoComplete="off"
                placeholder="Unsplash Access Key (developers.unsplash.com 무료 발급)"
                style={{ ...inputStyle, height: 36, marginTop: 5, fontSize: 11.5, fontWeight: 500, userSelect: 'none' }}
              />
              <div style={hintStyle}>
                "🖼 이미지 자동 채우기"는 공용 키로 기본 동작합니다. 요청 한도(시간당 50회)를
                다른 사용자와 나눠 쓰기 싫다면 본인 키를 여기 입력하세요 — 이 브라우저에만 저장됩니다.
              </div>
            </div>

            {/* proxy — only relevant for the public CSV path (no client id) */}
            {!auth.clientId.trim() && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#666d75',
                  letterSpacing: '-0.02em',
                  cursor: 'pointer',
                }}
              >
                <input type="checkbox" checked={useProxy} onChange={(e) => setUseProxy(e.target.checked)} />
                프록시로 불러오기
              </label>
            )}
          </div>
        )}
      </div>

      {/* selected-section header */}
      <div style={{ padding: '16px 18px 8px' }}>
        <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em' }}>
          {selNumberLabel && (
            <span style={{ color: '#adb5bd', fontWeight: 700, marginRight: 6 }}>{selNumberLabel}</span>
          )}
          {sectionLabel(selKey)}
        </div>
      </div>

      {/* selected-section form */}
      <div style={{ padding: '6px 18px 18px', borderBottom: '1px solid #f1f3f5' }}>
        {selIsVisual && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 메인 타이틀 폰트 — 4종 중 선택(기본은 세션마다 랜덤) */}
            <div>
              <span style={fieldLabel}>메인 타이틀 폰트</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                {HERO_TITLE_FONTS.map((f) => {
                  const on = ovGet('heroTitleFont', HERO_TITLE_FONTS[state.heroTitleFontSeed]?.key || 'pretendard') === f.key
                  return (
                    <button
                      key={f.key}
                      onClick={() => setOv('heroTitleFont', f.key)}
                      style={{
                        height: 44,
                        border: on ? 'none' : '1px solid #dee2e6',
                        borderRadius: 10,
                        background: on ? '#101418' : '#fff',
                        color: on ? '#fff' : '#101418',
                        cursor: 'pointer',
                        letterSpacing: '-0.02em',
                        fontFamily: f.family,
                      }}
                    >
                      Aa {f.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 항공사 로고 / 기체 이미지 — 2열 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <span style={fieldLabel}>항공사 로고</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  <label style={uploadTile}>
                    업로드
                    <input type="file" accept="image/*" onChange={(e) => readFile(e, (u) => patch({ airlineLogo: u }))} style={{ display: 'none' }} />
                  </label>
                  {state.airlineLogo && (
                    <button onClick={() => patch({ airlineLogo: null })} style={resetBtn}>
                      초기화
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span style={fieldLabel}>기체 이미지</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                  <label style={uploadTile}>
                    업로드
                    <input type="file" accept="image/*" onChange={(e) => readFile(e, (u) => patch({ planeImage: u }))} style={{ display: 'none' }} />
                  </label>
                  {state.planeImage && (
                    <button onClick={() => patch({ planeImage: null })} style={resetBtn}>
                      초기화
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 기체 위치·크기 슬라이더 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#495057' }}>세로 위치</span>
                  <span style={{ fontSize: 12, color: '#868e96' }}>{state.planeOffsetY > 0 ? '+' : ''}{state.planeOffsetY}%</span>
                </div>
                <input
                  type="range" min={-30} max={30} step={1}
                  value={state.planeOffsetY}
                  onChange={(e) => patch({ planeOffsetY: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#495057' }}>크기</span>
                  <span style={{ fontSize: 12, color: '#868e96' }}>{state.planeScale}%</span>
                </div>
                <input
                  type="range" min={40} max={160} step={5}
                  value={state.planeScale}
                  onChange={(e) => patch({ planeScale: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <button
                onClick={() => patch({ planeOffsetY: 0, planeScale: 100 })}
                style={{ height: 32, border: '1px solid #dee2e6', borderRadius: 8, background: '#fff', fontSize: 12, fontWeight: 600, color: '#495057', cursor: 'pointer', letterSpacing: '-0.02em' }}
              >
                위치·크기 초기화
              </button>
            </div>

            {/* 배경 이미지 — 2열 (업로드 / 다음 이미지) */}
            <div>
              <span style={fieldLabel}>배경 이미지</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                <label style={uploadTile}>
                  업로드
                  <input type="file" accept="image/*" onChange={(e) => readFile(e, (u) => patch({ heroImage: u, imagesLoaded: true }))} style={{ display: 'none' }} />
                </label>
                <button onClick={() => patch({ heroImage: null, skyIndex: ((state.skyIndex ?? 0) + 1) % 8 })} style={secondaryBtn}>
                  다음 이미지
                </button>
              </div>
            </div>
          </div>
        )}

        {!selIsVisual && (selKey === 'highlight' || titleSeedCfg) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selKey === 'highlight' && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  height: 40,
                  padding: '0 2px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#101418', letterSpacing: '-0.02em' }}>
                  출발지 노출
                </span>
                <input
                  type="checkbox"
                  checked={ovGet('hlShowFrom', 'on') === 'on'}
                  onChange={(e) => setOv('hlShowFrom', e.target.checked ? 'on' : 'off')}
                />
              </label>
            )}
            {titleSeedCfg && (
              <button
                onClick={() =>
                  patch({ [titleSeedCfg.key]: ((state[titleSeedCfg.key] ?? 0) + 1) % titleSeedCfg.count })
                }
                style={{
                  width: '100%',
                  height: 40,
                  border: '1px solid #dee2e6',
                  borderRadius: 10,
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#101418',
                  cursor: 'pointer',
                  letterSpacing: '-0.02em',
                }}
              >
                🔄 타이틀 새로고침
              </button>
            )}
          </div>
        )}
      </div>

      {/* theme */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f3f5' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#666d75', letterSpacing: '-0.02em', marginBottom: 11 }}>
          스타일 테마
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button
            onClick={() => setThemeMode('auto')}
            disabled={!airlineBrandHex}
            title={airlineBrandHex ? '항공사 브랜드 컬러를 테마로 자동 적용' : '매칭되는 항공사 브랜드 컬러가 없습니다'}
            style={{
              flex: 1,
              height: 32,
              borderRadius: 99,
              border: '1px solid #e9ecef',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              cursor: airlineBrandHex ? 'pointer' : 'not-allowed',
              opacity: airlineBrandHex ? 1 : 0.45,
              background: state.themeMode === 'auto' ? '#101418' : '#fff',
              color: state.themeMode === 'auto' ? '#fff' : '#495056',
            }}
          >
            🎨 브랜드 컬러 자동
          </button>
          <button
            onClick={() => setThemeMode('custom')}
            style={{
              flex: 1,
              height: 32,
              borderRadius: 99,
              border: '1px solid #e9ecef',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              cursor: 'pointer',
              background: state.themeMode === 'custom' ? '#101418' : '#fff',
              color: state.themeMode === 'custom' ? '#fff' : '#495056',
            }}
          >
            직접 선택
          </button>
        </div>
        <div style={hintStyle}>
          {airlineBrandHex
            ? state.themeMode === 'auto'
              ? `현재 항공사 브랜드 컬러(${airlineBrandHex})가 자동 적용 중입니다.`
              : '아래에서 원하는 색상을 직접 선택할 수 있어요.'
            : '매칭되는 항공사 브랜드 컬러가 없어 기본 테마 색상을 사용합니다.'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, justifyItems: 'center', marginTop: 10 }}>
          {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
            const t = THEMES[key]
            const on = state.theme === key
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                title={t.name}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 99,
                  cursor: 'pointer',
                  background: t.accent,
                  border: `3px solid ${on ? '#fff' : 'transparent'}`,
                  boxShadow: on ? `0 0 0 2px ${t.accent}` : '0 0 0 1px #e9ecef',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* CMS export */}
      <div style={{ padding: '16px 18px', borderTop: '1px solid #f1f3f5' }}>
        <button
          onClick={onExportAll}
          style={{ width: '100%', height: 44, border: 0, borderRadius: 12, background: '#101418', color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', cursor: 'pointer' }}
        >
          ⬇ 전체 섹션 저장 · {exportDevLabel}
        </button>
      </div>
    </aside>
  )
}

const uploadTile: React.CSSProperties = {
  display: 'flex',
  width: '100%',
  height: 40,
  border: '1px dashed #ced4da',
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 600,
  color: '#666d75',
  cursor: 'pointer',
  letterSpacing: '-0.02em',
}

/** 항공사 로고/기체 이미지 옆의 "초기화" 버튼 — uploadTile과 같은 크기·정렬로 통일. */
const resetBtn: React.CSSProperties = {
  width: '100%',
  height: 40,
  border: 0,
  borderRadius: 10,
  background: '#ffe3e3',
  fontSize: 13,
  fontWeight: 700,
  color: '#c92a2a',
  cursor: 'pointer',
  letterSpacing: '-0.02em',
}

/** 배경 이미지 "다음 이미지" 버튼 — uploadTile과 같은 크기·정렬로 통일. */
const secondaryBtn: React.CSSProperties = {
  width: '100%',
  height: 40,
  border: '1px solid #dee2e6',
  borderRadius: 10,
  background: '#fff',
  fontSize: 13,
  fontWeight: 700,
  color: '#101418',
  cursor: 'pointer',
  letterSpacing: '-0.02em',
}
