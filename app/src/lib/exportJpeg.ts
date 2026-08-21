import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import type { SectionKey } from '../types'

const CAPTURE_OPTS = {
  scale: 3,
  backgroundColor: '#ffffff',
  useCORS: true,
  logging: false,
  // 이미지 교체 버튼 등 편집 전용 UI는 다운로드본에 포함하지 않는다.
  ignoreElements: (el: Element) => el.hasAttribute('data-no-export'),
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.95)
  })
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.download = filename
  a.href = url
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

/**
 * 혜택 아이콘(`/assets/promotion-benefit-img/*.svg`)은 SVG `<pattern>` 안에 PNG를
 * 감싼 형태라 html2canvas가 그리지 못해(패턴 미지원) 다운로드 시 흰 칸으로 빠진다.
 * 캡처 직전 해당 이미지를 캔버스에 실제 렌더 픽셀 그대로 그려 PNG로 굽고, 그 결과를
 * `src`에 임시로 꽂아 html2canvas가 일반 래스터 이미지로 인식하게 한 뒤 원복한다.
 */
async function flattenBenefitIcons(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(
    root.querySelectorAll<HTMLImageElement>('img[src*="/assets/promotion-benefit-img/"]'),
  )
  const originals = imgs.map((img) => img.src)
  await Promise.all(
    imgs.map(async (img) => {
      const w = img.naturalWidth || img.width
      const h = img.naturalHeight || img.height
      if (!w || !h) return
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, w, h)
      img.src = canvas.toDataURL('image/png')
      await img.decode().catch(() => {})
    }),
  )
  return () => imgs.forEach((img, i) => { img.src = originals[i] })
}

/**
 * Unsplash 등 외부 이미지는 `<img>`에 crossOrigin이 없으면 캔버스에 그리는 순간
 * "오염(tainted)"되어 이후 toDataURL()이 SecurityError로 실패한다. 같은 origin이거나
 * data: URL이면 원본 엘리먼트를 그대로 쓰고, 외부 이미지는 crossOrigin="anonymous"로
 * 새로 로드한 사본을 그려야 안전하다.
 */
function loadCorsSafeImage(img: HTMLImageElement): Promise<HTMLImageElement> {
  const isSafe = img.src.startsWith('data:') || new URL(img.src, location.href).origin === location.origin
  if (isSafe) return Promise.resolve(img)
  return new Promise((resolve, reject) => {
    const copy = new Image()
    copy.crossOrigin = 'anonymous'
    copy.onload = () => resolve(copy)
    copy.onerror = () => reject(new Error('cors-load-failed'))
    copy.src = img.src
  })
}

/**
 * html2canvas는 CSS `object-fit`을 지원하지 않아 `object-fit: cover` 이미지를
 * 화면에서 보이는 크롭 없이 컨테이너 크기로 그냥 늘려버린다(비율 깨짐). 캡처
 * 직전 실제 크롭 결과를 캔버스에 구워 `src`에 임시로 꽂고, 캡처 후 원복한다.
 */
async function flattenCoverImages(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img')).filter(
    (img) => img.style.objectFit === 'cover',
  )
  const originals = imgs.map((img) => img.src)
  await Promise.all(
    imgs.map(async (img) => {
      try {
        const rect = img.getBoundingClientRect()
        if (!rect.width || !rect.height) return
        const source = await loadCorsSafeImage(img)
        const natW = source.naturalWidth
        const natH = source.naturalHeight
        if (!natW || !natH) return
        // object-fit: cover와 동일하게 짧은 쪽을 채우도록 확대한 뒤 중앙을 기준으로 크롭.
        const coverScale = Math.max(rect.width / natW, rect.height / natH)
        const sw = rect.width / coverScale
        const sh = rect.height / coverScale
        const sx = (natW - sw) / 2
        const sy = (natH - sh) / 2
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(rect.width * CAPTURE_OPTS.scale)
        canvas.height = Math.round(rect.height * CAPTURE_OPTS.scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(source, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
        img.src = canvas.toDataURL('image/png')
        await img.decode().catch(() => {})
      } catch {
        // CORS 등으로 실패하면 이 이미지는 원본 그대로 두고 다른 이미지/섹션 캡처는 계속한다.
      }
    }),
  )
  return () => imgs.forEach((img, i) => { img.src = originals[i] })
}

/** Capture one `#sec-*` node → Blob. Returns null if node not found. */
async function captureBlob(key: SectionKey): Promise<Blob | null> {
  const node = document.getElementById('sec-' + key)
  if (!node) return null
  const restoreBenefit = await flattenBenefitIcons(node)
  const restoreCover = await flattenCoverImages(node)
  try {
    const canvas = await html2canvas(node, CAPTURE_OPTS)
    return await canvasToBlob(canvas)
  } finally {
    restoreCover()
    restoreBenefit()
  }
}

/** Export a single section using its position in the visible order. */
export async function exportSection(
  key: SectionKey,
  visibleKeys: SectionKey[],
  dev: 'MO' | 'PC',
): Promise<void> {
  const blob = await captureBlob(key)
  if (!blob) return
  const idx = visibleKeys.indexOf(key)
  const filename = `${dev}-${String(idx >= 0 ? idx + 1 : 1).padStart(2, '0')}.jpg`
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

/**
 * Phase 1: capture all sections sequentially.
 * Phase 2: bundle into a ZIP and download as a single file.
 * @param folderName ZIP 파일명(확장자 제외). 예: `260720_에어프레미아_MO`.
 */
export async function exportAll(visibleKeys: SectionKey[], dev: 'MO' | 'PC', folderName: string): Promise<void> {
  const zip = new JSZip()

  for (let i = 0; i < visibleKeys.length; i++) {
    const blob = await captureBlob(visibleKeys[i])
    if (blob) {
      const filename = `${dev}-${String(i + 1).padStart(2, '0')}.jpg`
      zip.file(filename, blob)
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
  const url = URL.createObjectURL(zipBlob)
  triggerDownload(url, `${folderName}.zip`)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
