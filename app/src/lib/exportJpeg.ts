import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import type { SectionKey } from '../types'

const CAPTURE_OPTS = {
  scale: 2,
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

/** Capture one `#sec-*` node → Blob. Returns null if node not found. */
async function captureBlob(key: SectionKey): Promise<Blob | null> {
  const node = document.getElementById('sec-' + key)
  if (!node) return null
  const restore = await flattenBenefitIcons(node)
  try {
    const canvas = await html2canvas(node, CAPTURE_OPTS)
    return await canvasToBlob(canvas)
  } finally {
    restore()
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
