# 프로모션 페이지 자동 생성 — Web App

핸드오프 명세(`../README.md`)를 Vite + React 18 + TypeScript로 재구현한 앱입니다.
정형 프로모션 시트(Google Sheet CSV)를 읽어 고객 노출용 프로모션 페이지 초안을
조립하고, 각 섹션을 개별 JPEG로 내보내 CMS에 업로드합니다.

## 실행

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit && vite build → dist/
npm run preview    # 빌드 결과 미리보기
```

## 구조

```
src/
  main.tsx / App.tsx          3-pane 에디터 셸
  styles/tokens.css           MRT 디자인 토큰(CSS 변수)
  styles/global.css           reset · contentEditable · scrollbar
  types.ts                    데이터/상태 타입
  data/seed.ts                DATA·AIRPORTS·DEST_INTRO·CITY_IMG·THEMES·UNSPLASH
  state/useStudio.ts          상태 모델(useReducer): promoType/device/theme/
                              order/hidden/ov/importedData …
  lib/csv.ts                  CSV 파서 · 시트 URL 정규화 · 프록시 URL
  lib/parseSheet.ts           parseSheet/buildData (라우트 트리 조립)
  lib/routes.ts               (출발지×권역) 섹션 키 생성
  lib/derive.ts               파생 뷰모델(노출/순서/배지/검증/타이틀)
  lib/exportJpeg.ts           html2canvas 캡처 · 파일명 규칙
  components/                 TopBar · SectionList · PreviewCanvas ·
                              SettingsPanel · UnsplashPicker
  components/sections/        Hero · Schedule · Prize · Checklist(구매/항공사) ·
                              Highlight · Cta · Route
server/proxy.mjs              구글 시트 CSV 독립 프록시(무의존, Node 18+)
```

## 구글 시트 불러오기 (CORS 대비 3가지 경로)

1. **브라우저 직접 fetch** — 공개(뷰어) 시트면 gviz CSV를 그대로 가져옵니다.
2. **Vite dev proxy** — 우측 패널의 *프록시로 불러오기* 체크 시 `/gsheet?url=…`
   경로로 요청하며 `vite.config.ts`가 `docs.google.com`으로 포워딩합니다.
3. **독립 프록시** — 운영/비-Vite 환경에서 `npm run proxy` (기본 :8787).
   프론트가 같은 `/gsheet?url=…` 규약을 사용하므로 리버스 프록시로 붙이면 됩니다.

시트는 **공유 → 링크가 있는 모든 사용자(뷰어)** 로 공개해야 합니다.

## 시트 형식과 파서

`■ 섹션명` / `[항목]` 규칙을 따르며 가변 형식을 유연 매칭합니다.

- **날짜 조립**: `[프로모션 시작일]/[종료일]`, `[출발 시작일]/[종료일]`,
  `[라이브 시작일시]/[종료일시]`를 각각 판매기간·탑승기간·라이브일시로 합성.
  통짜 필드(`[판매 기간]` 등)가 있으면 그것을 우선합니다.
- **전체 노선**: `권역 / 출발지 / 도착지 / 가격` 컬럼을 유연 매칭해
  `(출발지 → 권역 → 도시[])` 트리로 조립합니다. 공항 코드는 한국어 도시명으로
  변환하며, 가격이 비어 있으면 카드에서 가격 줄을 생략합니다.
- **`■ 항공사 강조`**(명세 컴포넌트 목록 밖 항목): 데이터를 버리지 않고
  선택적 `airline` 섹션(구매 혜택과 동일한 ✓ 리스트, englishKey=`airline`)으로
  노출합니다. 시트에 값이 있을 때만 나타나며 명세의 고정 섹션/앵커링은 그대로입니다.

## 제약 (명세 준수)

- 최저가/무료/단독/선착순 등 과장 문구는 시트에 없으면 생성하지 않습니다.
- 이미지는 자동 삽입하지 않습니다. 기본은 플레이스홀더(그라디언트)이며
  업로드 · Unsplash 선택 · *이미지 자동 채우기* 토글로만 채워집니다.

## JPEG 내보내기

- 개별: 좌측 목록의 `⬇` → `#sec-*` 노드를 html2canvas(`scale:2`)로 캡처.
- 전체: 노출 순서대로 400ms 간격 순차 캡처.
- 파일명 `{NN}_{englishKey}_{MO|PC}.jpg`
  (`visual→hero, schedule→schedule, airline→airline, prize→prize,
  purchase→benefit, highlight→pick_routes, cta→cta, r_i_j→routes_{i+1}_{j+1}`).
- PC·모바일 뷰를 각각 전환해 두 세트를 내려받으세요.
