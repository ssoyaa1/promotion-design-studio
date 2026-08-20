import type { Studio } from '../../state/useStudio'
import type { Derived } from '../../lib/derive'
import { Editable, EditableTitle, SectionBadge } from './common'

/** 시각을 분 단위 없이 `NN시` 형식으로. "11:00" → "11시", "18:30" → "18시". */
function formatLiveTime(v: string): string {
  return v.replace(/(\d{1,2})\s*:\s*\d{2}/, '$1시')
}

/**
 * 기간 구분 기호(공백을 낀 -/–, 또는 ~)에서만 줄바꿈해 시작일/종료일을 각 줄로.
 * 날짜 내부의 하이픈(2026-07-15)은 앞뒤 공백이 없어 매칭되지 않는다.
 * "26년 07월 15일 – 26년 07월 21일" → "26년 07월 15일\n– 26년 07월 21일"
 */
function splitRange(v: string): string {
  return v.replace(/\s*[–~]\s*|\s+-\s+/, '\n– ')
}

function ScheduleRow({
  label,
  labelKey,
  value,
  valueKey,
  note,
  noteKey,
  range,
  deep,
  ovGet,
  setOv,
  fs,
}: {
  label: string
  labelKey: string
  value: string
  valueKey: string
  note?: string
  noteKey?: string
  /** 기간(시작–종료) 값 여부. 구분 기호 기준 2줄로 분리. */
  range?: boolean
  deep: string
  ovGet: (k: string, def: string) => string
  setOv: (k: string, v: string) => void
  fs: (px: number) => number
}) {
  const def = range ? splitRange(value) : value
  const whiteSpace: 'pre-line' | 'normal' = range ? 'pre-line' : 'normal'
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: fs(14) }}>
      <Editable
        as="span"
        value={ovGet(labelKey, label)}
        onCommit={(t) => setOv(labelKey, t)}
        style={{
          flexShrink: 0,
          width: fs(70),
          fontSize: fs(13.5),
          fontWeight: 600,
          color: '#848c94',
          letterSpacing: '-0.02em',
          lineHeight: 1.5,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Editable
          value={ovGet(valueKey, def)}
          onCommit={(t) => setOv(valueKey, t)}
          style={{
            fontSize: fs(15),
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: deep,
            lineHeight: 1.5,
            wordBreak: 'keep-all',
            whiteSpace,
          }}
        />
        {noteKey != null && !!ovGet(noteKey, note || '') && (
          <Editable
            value={ovGet(noteKey, note || '')}
            onCommit={(t) => setOv(noteKey, t)}
            style={{
              fontSize: fs(12),
              fontWeight: 600,
              color: '#adb5bd',
              marginTop: 3,
              letterSpacing: '-0.02em',
              lineHeight: 1.4,
              wordBreak: 'keep-all',
            }}
          />
        )}
      </div>
    </div>
  )
}

export function ScheduleSection({ studio, d }: { studio: Studio; d: Derived }) {
  const { data, ovGet, setOv } = studio
  const { theme, isLive, ord, badge, titles, padX, fontScale, fs, firstBadgeKey, lastBadgeKey } = d
  const padTop = firstBadgeKey === 'schedule' ? 56 : 36
  const padBottom = lastBadgeKey === 'schedule' ? 56 : 36

  return (
    <section
      id="sec-schedule"
      style={{ order: ord['schedule'], padding: `${padTop}px ${padX}px ${padBottom}px`, background: '#fff' }}
    >
      <SectionBadge label={badge['schedule']} accent={theme.accent} scale={fontScale} />
      <EditableTitle value={ovGet('schedTitle', titles.schedule)} onCommit={(t) => setOv('schedTitle', t)} scale={fontScale} />

      {/* 일정 카드 — 판매/출발 기간은 항상 노출. 라이브 일정 행은 Live ON에서만. */}
      <div
        style={{
          background: theme.soft,
          borderRadius: 16,
          padding: Math.round(20 * fontScale),
          display: 'flex',
          flexDirection: 'column',
          gap: Math.round(16 * fontScale),
        }}
      >
        {isLive && (
          <>
            <ScheduleRow
              label="라이브 일정"
              labelKey="liveLabel"
              value={formatLiveTime(data.liveTime)}
              valueKey="sched"

              deep={theme.deep}
              ovGet={ovGet}
              setOv={setOv}
              fs={fs}
            />
            <div style={{ height: 1, background: `${theme.accent}22` }} />
          </>
        )}
        <ScheduleRow
          label="판매 기간"
          labelKey="salesLabel"
          value={data.salesPeriod}
          valueKey="sales"
          range
          deep={theme.deep}
          ovGet={ovGet}
          setOv={setOv}
          fs={fs}
        />
        <div style={{ height: 1, background: `${theme.accent}22` }} />
        <ScheduleRow
          label="출발 기간"
          labelKey="boardingLabel"
          value={data.boardingPeriod}
          valueKey="boarding"
          note={data.boardingNote}
          noteKey="bnote"
          range
          deep={theme.deep}
          ovGet={ovGet}
          setOv={setOv}
          fs={fs}
        />
      </div>

      {/* 라이브 보러가기 버튼 — Live ON에서만 */}
      {isLive && (
        <div
          style={{
            marginTop: 20,
            width: '100%',
            height: 52,
            borderRadius: 14,
            background: theme.accent,
            color: '#fff',
            fontSize: fs(16),
            fontWeight: 700,
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span aria-hidden="true">🔴</span>
          <Editable value={ovGet('notifyBtn', '라이브 보러가기')} onCommit={(t) => setOv('notifyBtn', t)} />
        </div>
      )}
    </section>
  )
}
