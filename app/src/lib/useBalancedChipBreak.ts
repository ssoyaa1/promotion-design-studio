import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'

/**
 * flex-wrap 칩 목록이 자연스럽게 2줄로 꺾일 때, 마지막 줄에 칩이 1개만 단독으로
 * 남으면(고아 칩) 앞줄 일부를 뒤로 내려 두 줄의 개수를 최대한 균형 있게 맞춘다.
 * 컨테이너/칩 실측 너비로 자체 시뮬레이션해 자연 줄바꿈을 판단하므로, 강제로 삽입한
 * 줄바꿈 스페이서가 측정에 영향을 주지 않아(피드백 루프 없이) 안정적으로 동작한다.
 *
 * @returns 이 인덱스 앞에 강제 줄바꿈을 넣어야 하면 그 인덱스, 필요 없으면 null.
 */
export function useBalancedChipBreak(
  containerRef: RefObject<HTMLElement | null>,
  count: number,
  gap: number,
  chipSelector = '[data-chip="1"]',
): number | null {
  const [breakIndex, setBreakIndex] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el || count < 2) return

    const recompute = () => {
      const containerWidth = el.clientWidth
      const chips = Array.from(el.querySelectorAll<HTMLElement>(chipSelector))
      if (chips.length !== count || containerWidth === 0) return

      // 실제 flex-wrap과 동일한 규칙(누적 폭이 넘치면 줄바꿈)으로 자연 줄바꿈을 시뮬레이션한다.
      const rows: number[] = []
      let rowCount = 0
      let rowWidth = 0
      for (const chip of chips) {
        const w = chip.getBoundingClientRect().width
        const addW = rowCount === 0 ? w : w + gap
        if (rowCount > 0 && rowWidth + addW > containerWidth) {
          rows.push(rowCount)
          rowCount = 1
          rowWidth = w
        } else {
          rowCount += 1
          rowWidth += addW
        }
      }
      if (rowCount > 0) rows.push(rowCount)

      const next = rows.length === 2 && rows[1] === 1 && rows[0] > 1 ? Math.ceil(count / 2) : null
      setBreakIndex((prev) => (prev === next ? prev : next))
    }

    recompute()
    const ro = new ResizeObserver(recompute)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef.current, count, gap, chipSelector])

  return breakIndex
}
