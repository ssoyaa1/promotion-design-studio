import type { Studio } from '../state/useStudio'
import { UNSPLASH_LIB, PICKER_CATS, img } from '../data/seed'

export function UnsplashPicker({ studio }: { studio: Studio }) {
  const { state, patch } = studio
  if (!state.pickerOpen) return null

  const close = () => patch({ pickerOpen: false })
  const apply = (url: string) => patch({ heroImage: url, imagesLoaded: true, pickerOpen: false })

  async function doSearch() {
    const key = (state.unsplashKey || '').trim()
    const q = (state.searchQuery || '').trim()
    if (!key) {
      patch({ searchError: 'Unsplash Access Key를 입력해주세요' })
      return
    }
    if (!q) return
    patch({ searching: true, searchError: '' })
    try {
      const r = await fetch(
        `https://api.unsplash.com/search/photos?per_page=12&content_filter=high&query=${encodeURIComponent(q)}&client_id=${encodeURIComponent(key)}`,
      )
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const j = await r.json()
      const items = (j.results || []).map((p: { urls: { small: string; regular: string } }) => ({
        thumb: p.urls.small,
        full: p.urls.regular,
      }))
      try {
        localStorage.setItem('mrt_unsplash_key', key)
      } catch {
        /* ignore */
      }
      patch({ searchResults: items, searching: false, searchError: items.length ? '' : '검색 결과가 없어요' })
    } catch {
      patch({ searching: false, searchError: '검색 실패 — Access Key를 확인하거나 잠시 후 다시 시도하세요' })
    }
  }

  const hasResults = state.searchResults.length > 0
  const gridItems = hasResults
    ? state.searchResults.map((it, i) => ({ key: 's' + i, onClick: () => apply(it.full), bg: it.thumb }))
    : UNSPLASH_LIB.filter((it) => state.pickerCat === '전체' || it.c === state.pickerCat).map((it, i) => ({
        key: 'c' + i,
        onClick: () => apply(img(it.u, 900, 60)),
        bg: img(it.u, 400, 55),
      }))

  const status = state.searching ? '검색 중…' : state.searchError || ''

  return (
    <div
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(16,20,24,.55)',
        zIndex: 30000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '82vh',
          overflow: 'auto',
          background: '#fff',
          borderRadius: 18,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em' }}>Unsplash 이미지 선택</div>
          <button
            onClick={close}
            style={{ border: 0, background: '#f1f3f5', width: 32, height: 32, borderRadius: 99, cursor: 'pointer', fontSize: 15 }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={state.unsplashKey}
            onChange={(e) => patch({ unsplashKey: e.target.value })}
            placeholder="Unsplash Access Key (developers.unsplash.com 무료 발급)"
            style={pickerInput}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={state.searchQuery}
              onChange={(e) => patch({ searchQuery: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') doSearch()
              }}
              placeholder="도시·테마 검색 (예: tokyo, beach, airplane)"
              style={{ ...pickerInput, flex: 1, height: 40, fontSize: 13 }}
            />
            <button
              onClick={doSearch}
              style={{ height: 40, padding: '0 18px', border: 0, borderRadius: 10, background: '#2b96ed', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              🔍 검색
            </button>
          </div>
          {status && <div style={{ fontSize: 12, fontWeight: 600, color: '#848c94', letterSpacing: '-0.02em' }}>{status}</div>}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PICKER_CATS.map((cat) => {
            const on = state.pickerCat === cat
            return (
              <button
                key={cat}
                onClick={() => patch({ pickerCat: cat })}
                style={{
                  height: 32,
                  padding: '0 13px',
                  border: 0,
                  borderRadius: 99,
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  background: on ? '#101418' : '#f1f3f5',
                  color: on ? '#fff' : '#495056',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {gridItems.map((o) => (
            <button
              key={o.key}
              onClick={o.onClick}
              style={{
                border: 0,
                padding: 0,
                cursor: 'pointer',
                borderRadius: 10,
                overflow: 'hidden',
                aspectRatio: '4 / 3',
                backgroundImage: `url('${o.bg}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #f1f3f5', paddingTop: 14 }}>
          <input
            value={state.pickerUrl}
            onChange={(e) => patch({ pickerUrl: e.target.value })}
            placeholder="또는 이미지 URL 붙여넣기"
            style={{ ...pickerInput, flex: 1, height: 40, fontSize: 13 }}
          />
          <button
            onClick={() => {
              const u = (state.pickerUrl || '').trim()
              if (u) apply(u)
            }}
            style={{ height: 40, padding: '0 16px', border: 0, borderRadius: 10, background: '#101418', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            적용
          </button>
        </div>

        <div style={{ fontSize: 11, color: '#adb5bd', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.5 }}>
          라이브 검색은 API 키가 필요하며, 키가 없으면 큐레이션된 여행 이미지 중에서 선택합니다. 특정 사진은 URL을 붙여넣어
          사용하세요. 선택 시 메인 비주얼 배경으로 적용됩니다.
        </div>
      </div>
    </div>
  )
}

const pickerInput: React.CSSProperties = {
  height: 38,
  padding: '0 12px',
  border: '1px solid #dee2e6',
  borderRadius: 10,
  fontSize: 12.5,
  fontFamily: 'inherit',
  color: '#101418',
  outline: 'none',
}
