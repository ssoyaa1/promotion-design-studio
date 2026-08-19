# Handoff: 프로모션 페이지 자동 생성 서비스 (Promotion Page Auto-Generator)

> **대상**: 이 문서와 번들만 보고 React/Vite 앱으로 구현하는 개발자(또는 Claude Code).
> **핵심**: 아래 `reference/` HTML은 **완성된 코드가 아니라 디자인 레퍼런스(프로토타입)** 입니다.
> DC(Design Component) 런타임(`support.js`) 위에서 도는 파일이므로 그대로 이식하지 말고,
> 여기 명세된 레이아웃·토큰·동작을 **React + Vite 프로젝트로 재구현**하세요.

---

## 1. Overview

정형화된 "프로모션 요청 시트"(Google Sheet CSV)를 읽어 실제 고객 노출용 **프로모션 페이지 초안**을 자동 생성하는 웹 도구.
운영자는 시트를 붙여넣거나 업로드 → 자동 파싱 → 페이지가 조립되고, 문구/순서/이미지/테마를 편집한 뒤
**각 섹션을 개별 JPEG로 내보내** CMS에 순서대로 업로드하고 앵커링을 연결한다.

두 가지 프로모션 타입을 지원한다:
- **라이브(live)** — 라이브 일정, 라이브 한정 혜택, 경품, 사전 알림 CTA 중심.
- **기획전(plan)** — 라이브 영역 숨김. 프로모션 기간, 핵심 혜택, 강조 노선, 전체 노선, 구매 CTA 중심.

## 2. Fidelity

**High-fidelity.** 색·타이포·간격·인터랙션이 확정된 픽셀 단위 목업이다.
UI는 아래 값 그대로 재현하되, 스타일링은 프로젝트의 기존 컴포넌트 라이브러리/디자인 시스템(MyRealTrip Web UI)이 있으면 그것으로 매핑한다.

## 3. Tech target

- **Vite + React 18** (TypeScript 권장).
- 상태관리: 로컬 컴포넌트 상태로 충분(외부 라이브러리 불필요). 필요 시 Zustand.
- 이미지 캡처(JPEG 내보내기): **`html2canvas`** (프로토타입과 동일). `dom-to-image-more`도 대안.
- 폰트: **Pretendard** (`pretendard.css` CDN 또는 npm `pretendard`).
- CSV 파싱: 자체 파서 포함(아래 5.5) — 외부 의존성 없음. 원하면 `papaparse`로 교체 가능.

권장 컴포넌트 분해:
```
<App>
 ├─ <TopBar>          타입 토글 / 디바이스 토글 / 이미지채우기 / 전체저장
 ├─ <SectionList>     좌측: 드래그 정렬 · 숨김 · 개별저장 · 검증
 ├─ <PreviewCanvas>   중앙: 디바이스 프레임 + 섹션 렌더 (캡처 루트)
 │    ├─ <HeroSection>
 │    ├─ <ScheduleSection>
 │    ├─ <PrizeSection>        (live only)
 │    ├─ <PurchaseSection>
 │    ├─ <HighlightSection>
 │    ├─ <CtaSection>
 │    └─ <RouteSection> × N    ((출발지 × 권역) 하나당 한 섹션)
 ├─ <SettingsPanel>   우측: 시트 불러오기 / 선택 섹션 편집 / 테마 / 요약 / CMS 내보내기
 └─ <UnsplashPicker>  모달
```

## 4. Screens / Views (3-pane editor, 단일 화면)

전체 화면: `display:flex; flex-direction:column; height:100vh; background:#f1f3f5`. Pretendard, `color:#101418`.

### 4.1 TopBar
- 높이 `60px`, `background:#fff`, `border-bottom:1px solid #e9ecef`, `padding:0 20px`, `gap:16px`, `align-items:center`.
- 좌측: MRT 워드마크(`height:20px`) · 세로 구분선(`1px×22px #e9ecef`) · "프로모션 자동 생성" (15px/700, `letter-spacing:-0.02em`).
- 우측 컨트롤(모두 pill):
  - **타입 토글** `라이브 / 기획전` — 컨테이너 `background:#f1f3f5; border-radius:99px; padding:3px`. 활성 탭 `background:#fff; color:#101418; box-shadow:0 1px 2px rgba(0,0,0,.08)`, 비활성 `color:#848c94`. 탭 높이 32px/13px/700.
  - **디바이스 토글** `📱 모바일 / 🖥 PC` — 동일 스타일.
  - **이미지 자동 채우기** 버튼(아웃라인 pill, 38px, `border:1px solid #e9ecef`). 라벨 토글: `🖼 이미지 자동 채우기` ↔ `플레이스홀더로`.
  - **전체 저장** 버튼(`background:#101418; color:#fff; border-radius:99px; height:38px`). 라벨 `⬇ 전체 저장 · MO|PC`.

### 4.2 SectionList (왼쪽, width 236px)
- `background:#fff; border-right:1px solid #e9ecef`.
- 헤더: `SECTIONS`(11px/700, `letter-spacing:.04em`, `#adb5bd`) + 안내 "드래그로 순서 변경 · 눈으로 숨기기"(13px/600 `#848c94`).
- 각 행: `display:flex; align-items:center; gap:9px; padding:9px 10px; border-radius:11px`. 선택 시 `background:{theme.soft}`.
  - 드래그 핸들 `⠿`(`#ced4da`, `cursor:grab`), 순번 배지(22×22, `border-radius:6px`; 선택 시 `background:{accent}/color:#fff`, 아니면 `{soft}/{deep}`), 라벨(13.5px/600, ellipsis), `⬇`(개별 저장), `👁/🚫`(숨김 토글).
- 하단 **검증** 블록: `border-top:1px solid #f1f3f5`. 경고 있으면 `⚠️ …`(`#f78000`), 없으면 `✓ 필수 항목 이상 없음`(`#27ab86`). (규칙은 5.6)

### 4.3 PreviewCanvas (중앙)
- `flex:1; overflow:auto; background:#e9ecef; display:flex; justify-content:center; padding:32px 24px 64px`.
- 디바이스 래퍼 폭: **모바일 390px / PC 900px** (`transition:width .25s`).
- 프레임: 모바일 `border-radius:30px` + 상태바(높이 34px, "9:41"), PC `border-radius:16px`. 둘 다 `box-shadow:0 20px 50px rgba(0,0,0,.14~.18); border:1px solid #e9ecef; overflow:hidden`.
- **캡처 루트**: `#promo-capture`, `background:#fff`. 안의 섹션들은 CSS `order`로 정렬(정렬 상태를 `order[key]=index`로 매핑) — React에서는 배열 순서대로 렌더하면 됨.

### 4.4 SettingsPanel (오른쪽, width 300px)
- `background:#fff; border-left:1px solid #e9ecef; overflow-y:auto`.
- **구글 시트 불러오기** 블록(맨 위): URL input + `CSV 불러오기` 버튼(검정 pill) + 상태 텍스트 + 안내. (동작 5.5)
- **SETTINGS** — 현재 선택된 섹션명 표시.
- 선택 섹션별 폼:
  - `visual` → 프로모션명 / 부제 / 항공사 / 판매 기간 / 탑승 기간 텍스트 인풋, 항공사 로고 업로드, 기체 이미지(투명 PNG) 업로드, 메인 이미지 업로드 + `🔍 Unsplash에서 선택`.
  - `schedule` → 라이브 일시 / 프로모션 기간 인풋.
  - 그 외(generic) → "미리보기에서 직접 클릭해 수정" 안내 카드.
- **스타일 테마**: 5개 스와치(아래 6). 클릭 시 accent/soft/deep 전체 교체.
- **생성 요약**: 타입 / 노출 섹션 수 / 강조 노선 수 / 전체 노선 수.
- **CMS 이미지 에셋 내보내기**: 설명 + 전체 저장 버튼. 파일명 규칙 `01_hero_MO.jpg` (5.7).

### 4.5 각 프로모션 섹션 (캡처 대상, 순서대로)

공통: 섹션 상단 중앙에 **HIGHLIGHT n** 배지(`background:{accent}; color:#fff; 12px/800; padding:5px 12px; border-radius:99px`). n은 노출 순서 기준 자동 채번(schedule/prize/purchase/highlight 대상). 제목 `h2` 22px/800, `letter-spacing:-0.03em`, **가운데 정렬**.

1. **Hero** (`#sec-visual`) — `position:relative; overflow:hidden`.
   - 배경: 이미지 있으면 `linear-gradient(180deg, rgba(16,20,24,.05), rgba(16,20,24,.72)) , url(...) center/cover`; 없으면 `linear-gradient(150deg, {accent}, {deep})`.
   - 상단 중앙 co-brand 락업: `myrealtrip(흰색 워드마크 17px) × {항공사 로고 또는 항공사명}`. **로고와 워드마크 높이 동일(17px)**.
   - 기체 PNG 슬롯(`planeNode`): 업로드 시 중앙 상단에 배치(`width:86%`, drop-shadow). 항상 항공기 자리를 비워둠.
   - 내용은 **세로 + 가운데 정렬**: 타입 배지(`LIVE 특가`/`기획전`) + 항공사 배지 → 프로모션명(`h1`, 모바일 30 / PC 38px, 800) → 부제(15~17px/600, `max-width:32em`) → (라이브면) `🔴 라이브 {일시}` 배지 → **판매 기간 / 탑승 기간** 카드(`background:rgba(16,20,24,.5); backdrop-filter:blur(4px); border-radius:14px`; 라벨 58px 고정폭 `rgba(255,255,255,.68)`, 값 14.5px/700 흰색 `white-space:nowrap`; 탑승 기간 아래 주석 `일부 일자 특가 제외`).
   - Hero `min-height`: 모바일 460 / PC 560px. `padding` 모바일 `70px 22px 24px` / PC `96px 32px 30px`.
2. **Schedule** (`#sec-schedule`) — `padding:36px 22px; background:#fff`. 강조 박스(`background:{soft}; border-radius:14px`)에 아이콘(라이브 📺 / 기획전 🗓) + 값 + 서브. **라이브 전용**: 혜택 리스트(번호 배지 24px pill) + `🔔 라이브 사전 알림 받기` 버튼(높이 52px, `background:{accent}`).
3. **Prize** (`#sec-prize`, **live only**) — `background:{soft}`. 카드 리스트(`background:#fff; border-radius:16px; box-shadow:0 4px 14px rgba(0,0,0,.05)`), 좌측 46px 아이콘 타일(`background:{soft}`).
4. **Purchase** (`#sec-purchase`) — `background:#fff`. `✓`(accent) + 문구 리스트, 항목 배경 `#f8f9fa; border-radius:13px`.
5. **Highlight routes** (`#sec-highlight`) — 카드 그리드. 모바일 2열 / PC 3열, `gap 12~14px`. 카드: `border:1px solid #e9ecef; border-radius:16px; overflow:hidden`; 상단 이미지 112px, 하단 `출발도시 → 도착도시`(15px/800, 화살표 accent) + **여행지 소개 문구**(12.5px/500 `#666d75`, "~해요" 톤; `DEST_INTRO` 맵, 없으면 fallback). **공항 코드 배지는 노출하지 않음**.
6. **CTA** (`#sec-cta`) — `background:{deep}`. 안내 문구 + 흰색 버튼(높이 56px, `color:{deep}`, 라벨 편집 가능, 예: "진에어 노선 보러 가기 ›").
7. **Route sections** (`#sec-r_{depIdx}_{regIdx}`, (출발지 × 권역) 조합마다 하나) — 각 섹션은 **자체 출발지 탭바 + 권역 칩 + 노선 카드 그리드**를 갖는 독립 이미지 단위.
   - 출발지 탭: 현재 출발지 활성(`border-bottom:2px solid {accent}; color:#101418`), 나머지 `#adb5bd`.
   - 권역 칩: 현재 권역 활성(`background:#101418; color:#fff`), 나머지 `#f1f3f5/#495056`, pill.
   - 카드 그리드: **도시 3개 이하 = 1열 가로 배너(`aspect-ratio:16/6.5`), 4개 이상 = 2열 정사각(`1/1`)**. 카드: 도시 이미지 배경 + 하단 오버레이 그라디언트, 도시명(17px/800 흰색) + `왕복 {가격}원~`(15px/800, `#ffc929`). 이미지 없으면 `{accent}→{deep}` 그라디언트 + 반투명 도시명 워터마크.

### 4.6 UnsplashPicker (모달)
- 오버레이 `rgba(16,20,24,.55)`, 카드 `max-width:560px; border-radius:18px; padding:22px`.
- Unsplash **Access Key** 입력(localStorage `mrt_unsplash_key`에 저장) + 검색어 + `🔍 검색`. 결과 12장 3열 그리드, 클릭 시 hero 배경 적용.
- 키 없이도: 큐레이션 이미지 그리드(카테고리 칩: 전체/하늘/도시/해변/자연/유럽) + 임의 이미지 URL 붙여넣기 지원.

## 5. Interactions & Behavior

### 5.1 타입 전환 (라이브 ↔ 기획전)
- `promoType: 'live'|'plan'`. `plan`이면 `prize` 섹션 제거(비노출), hero 타입 배지·일부 문구가 기획전 버전으로 바뀜.
- 적용 가능한 섹션 키: `['visual','schedule','prize','purchase','highlight','cta', ...routeKeys]`; `plan`이면 `prize` 제외.

### 5.2 섹션 순서 변경 / 숨김
- 좌측 목록에서 드래그. `order: string[]`를 splice로 재배열.
- 숨김: `hidden: Record<key, boolean>`. 노출 여부 = `applicable && !hidden[key]`.
- **HIGHLIGHT n 배지**는 노출 순서 기준으로 매 렌더 재계산(대상 키: schedule/prize/purchase/highlight).

### 5.3 인라인 텍스트 편집
- 미리보기의 편집 대상은 `contentEditable`, `onBlur`에 텍스트 저장.
- 저장은 **override 맵** `ov: Record<string,string>`에 키별로. 표시 값 = `ov[key] ?? 데이터기본값`. (React에서는 `contentEditable` 대신 제어 컴포넌트나 `onBlur`로 dangerouslySet 없이 관리 권장)
- override 키 예: `name, sub, airline, cta, sales, boarding, sched, lb{i}t/lb{i}d, pz{i}t/pz{i}d, pb{i}t/pb{i}d`.

### 5.4 이미지 교체
- hero 배경 / 항공사 로고 / 기체 PNG: `<input type=file>` → `FileReader.readAsDataURL` → state의 dataURL.
- "이미지 자동 채우기" 토글: 켜면 hero + 카드에 큐레이션 Unsplash URL 사용, 끄면 플레이스홀더(그라디언트).
- **외부 이미지를 임의로 자동 삽입하지 않는다.** 기본은 플레이스홀더, 사용자가 명시적으로 채우기/선택/업로드해야 함.

### 5.5 구글 시트 불러오기 (CSV)
- 입력 URL 정규화: 공유 링크에서 `/spreadsheets/d/{id}` 와 `gid`를 뽑아
  `https://docs.google.com/spreadsheets/d/{id}/gviz/tq?tqx=out:csv&gid={gid}` 로 변환(이미 csv면 그대로).
- `fetch` → 텍스트 → CSV 파싱(따옴표·개행 처리하는 자체 파서) → 데이터 빌드.
- 실패 시: "시트를 링크가 있는 모든 사용자(뷰어)로 공개했는지 확인" 안내.
- **CORS 주의**: gviz CSV는 공개 시트에 대해 브라우저에서 직접 fetch 가능. 사설/조직 제한 시트는 실패 → 웹 게시(CSV) 링크 안내. 필요하면 서버 프록시 엔드포인트를 두는 것을 권장.

**파싱 규칙**
- `■`로 시작하는 행 = 섹션 제목.
- `[항목명]` 하나만 있는 행 = 단일 key-value.
- `[..]`가 2개 이상인 행 = 표 헤더(이후 행은 그 헤더 기준 레코드).
- 빈 행/공백 제거.
- 공항 코드 → 한국어 도시명 변환(아래 `AIRPORTS` 맵) 후 노출.
- 섹션명: `프로젝트 정보 / 강조 노선 / 라이브 혜택 / 라이브 경품 / 구매 혜택 / 전체 노선`.
- 전체 노선 표는 `출발지 / 권역(지역·대륙) / 도시 / 공항코드 / 왕복(가격)` 컬럼을 유연 매칭해 `(출발지 → 권역 → 도시[])` 트리로 조립.

### 5.6 검증 (필수 항목 · 날짜)
- 프로모션명 비었으면 경고, 항공사 없으면 경고.
- 날짜 문자열이 `YYYY[.\-/]MM[.\-/]DD` 패턴을 포함하지 않으면 "날짜 형식 확인" 경고.
- 경고가 있으면 좌측 검증 블록에 노란 목록으로 표시(생성은 막지 않되 경고).

### 5.7 JPEG 내보내기 (CMS 에셋)
- **핵심 운영 요구**: 하나의 긴 페이지가 아니라 **섹션별 개별 이미지**로 저장한다.
- 개별: 좌측 목록의 `⬇` → 해당 `#sec-*` 노드를 html2canvas(`scale:2`)로 캡처 → JPEG 다운로드.
- 전체: 노출 순서대로 순차 캡처(각 400ms 간격), 파일명 `{NN}_{englishKey}_{MO|PC}.jpg`.
  - englishKey 맵: `visual→hero, schedule→schedule, prize→prize, purchase→benefit, highlight→pick_routes, cta→cta, r_i_j→routes_{i+1}_{j+1}`.
- PC/모바일 각각 뷰를 바꿔 **두 세트** 내보내도록 안내.

## 6. Design Tokens

`reference/colors_and_type.css`에 전체 토큰이 있다. 아래는 이 화면이 실제로 쓰는 값.

**브랜드/중립**
- 브랜드 블루 `#2B96ED` (hover `#1583db`), 잉크 `#101418`.
- 회색조: `#f1f3f5`(canvas), `#e9ecef`(border), `#dee2e6`, `#ced4da`, `#adb5bd`, `#848c94`, `#666d75`, `#495056`, `#f8f9fa`.
- 상태: 경고 `#f78000`, 성공 `#27ab86`, 가격 강조 옐로우 `#ffc929`.

**테마(5종)** — `{accent, soft, deep}`:
| key | 이름 | accent | soft | deep |
|---|---|---|---|---|
| blue | 브랜드 블루 | `#2b96ed` | `#e7f4fd` | `#01457d` |
| red | 딜 레드 | `#ec4937` | `#fbf1ef` | `#8d2115` |
| green | 그린 | `#27ab86` | `#e6f8f3` | `#0a4534` |
| purple | 퍼플 | `#8238fa` | `#f6f0ff` | `#29085e` |
| dark | 다크 | `#101418` | `#f1f3f5` | `#101418` |

**타이포** — Pretendard. 대표 스케일: h1 30/38px·800, h2 22px·800, 본문 13~15px, 캡션 11~12.5px. `letter-spacing:-0.02em ~ -0.03em`(헤드라인일수록 타이트), 굵기 600/700/800 위주.

**Radius**: 카드 16px, 중형 13~14px, 소형 10~11px, pill 99px.
**Shadow**: 카드 `0 1px 2px rgba(0,0,0,.04), 0 4px 14px rgba(0,0,0,.05)`; 디바이스 프레임 `0 20px 50px rgba(0,0,0,.14~.18)`.
**Spacing**: 섹션 상하 `36px`(노선 섹션 `32/36`), 요소 gap 8~16px.

## 7. Reference data (샘플 시드)

프로토타입의 시드 데이터(`DATA`)는 진에어 여름 특가 예시다. 실제 값은 시트에서 오지만, 시트 없이 개발/테스트할 기본값으로 그대로 사용 가능. `reference/*.dc.html`의 `DATA`, `AIRPORTS`, `DEST_INTRO`, `CITY_IMG`, `THEMES` 객체를 그대로 참고/이식하라.

- `AIRPORTS`: ICN 인천, GMP 김포, PUS 부산, CJU 제주, CJJ 청주, FUK 후쿠오카, KIX 오사카, NRT/HND 도쿄, CEB 세부, BKK 방콕, DAD 다낭, TPE 타이베이, HKG 홍콩, OKA 오키나와, CTS 삿포로, KMJ 구마모토, HSG 사가.
- 문구는 임의 과장 금지: `최저가/무료/단독/선착순` 등은 시트에 없으면 만들지 않는다. 부제만 여행 자극형 카피로 생성 허용.

## 8. Assets

- `reference/assets/logo_mrt_wordmark.svg`, `logo_mrt.svg` — 브랜드 워드마크(근사 재현본; 공식 SVG로 교체 권장).
- `reference/assets/mrt_wordmark_white.png` — hero용 흰색 워드마크.
- `reference/assets/icons/` — 24×24 currentColor 아이콘 세트.
- 이미지: Unsplash(사용자 선택/자동 채우기). 없으면 업로드 슬롯 또는 플레이스홀더. 우선순위: ① 디자인 시스템 이미지 → ② 항공사 이미지 → ③ 도시/노선 이미지 → ④ 플레이스홀더.

## 9. Files in this bundle

- `reference/프로모션 페이지 자동 생성.dc.html` — 메인 프로토타입(모든 로직·마크업·시드 데이터 포함). **구현 시 1차 레퍼런스.**
- `reference/colors_and_type.css` — MyRealTrip 디자인 토큰 전체.
- `reference/assets/` — 로고·아이콘.
- `screenshots/01_editor_live_mobile.png` — 라이브 타입 · 모바일 프리뷰 3-pane 에디터.
- `screenshots/02_editor_plan_pc.png` — 기획전 타입 · PC 프리뷰(섹션 목록에서 라이브 경품이 빠진 상태).

> DC 파일을 브라우저에서 직접 열려면 `support.js` 런타임과 로컬 서버가 필요하지만, **React 재구현에는 필요 없다.** 이 파일은 값·구조·동작을 읽기 위한 참조용이다.
