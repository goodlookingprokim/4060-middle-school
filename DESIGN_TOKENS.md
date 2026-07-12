# DESIGN TOKENS — 두 블로그 공통 디자인 기준

적용 대상: 코너 속의 코너(goodlookingprokim.github.io) · 4060미들스쿨(goodlookingprokim.github.io/4060-middle-school)
버전: 1.0 (2026-07-12) · 이 문서는 두 저장소에 동일한 내용으로 존재해야 한다.

## 변경 절차 (AGENT_OPERATIONS_GUIDE.md 1장 4항)

테마 색·타이포그래피를 바꿀 때는 (1) 이 문서를 먼저 수정하고 (2) 해당 값이 있는 파일(`quartz.config.ts` 또는 `quartz/styles/custom.scss`)에 반영한 뒤 (3) 다른 저장소에도 이 문서를 복사한다. "블로그별 차이" 표에 없는 값은 두 블로그가 항상 같아야 한다.

## 공통 토큰

### 폰트 (quartz.config.ts)

| 용도 | 폰트 | 웨이트 |
|------|------|--------|
| 제목(title) | Noto Sans KR | 700 |
| 헤더(header) | Noto Sans KR | 500, 700 |
| 본문(body) | IBM Plex Sans KR | 400, 500, 600 |
| 코드(code) | JetBrains Mono | 400, 600 |

### 색상 팔레트 (quartz.config.ts)

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| light (바탕) | #f7f8f5 | #0f1419 |
| lightgray | #e6e9ee | #26313d |
| gray | #707783 | #9aa7b6 |
| darkgray (본문 글자) | #24292f | #dbe2ea |
| dark | #15191f | #f5f7fb |
| secondary (링크) | #2563eb | #8ab4ff |
| tertiary | #0f766e | #5eead4 |
| highlight | rgba(37,99,235,.1) | rgba(138,180,255,.16) |
| textHighlight | #dbeafe | #1e3a5f |

### 레이아웃 (custom.scss)

| 토큰 | 값 |
|------|----|
| --content-width | 780px |
| --side-width | 320px |
| --reading-line | 1.78 |

### 텍스트 줄바꿈·라벨 폰트 (공통, custom.scss)

| 규칙 | 값 | 이유 |
|------|----|------|
| body word-break | keep-all | 한글은 단어(어절) 단위로 줄바꿈. "모임인지"가 "모/임인지"로 잘리는 것 방지 |
| body overflow-wrap | break-word | 긴 영문·URL은 칸을 넘칠 때만 자름 (keep-all의 넘침 보완) |
| 한글 라벨 폰트 (브레드크럼·본문 메타·섹션 메타·허브 라벨·허브 칩) | var(--bodyFont) | 모노 폰트의 한글 폴백·넓은 공백 문제 제거. 주의: codeFont 뒤에 폰트를 덧붙이는 방식은 무효 — codeFont 스택 중간의 제네릭 monospace가 모든 글자를 가로챈다 |
| 영문 라벨 폰트 (킥커·태그 칩) | var(--codeFont) 유지 | 영문 전용 라벨은 모노 아이덴티티 유지 |
| 표 셀 (th, td) | word-break: break-word 유지 | 표 안 긴 링크가 컬럼을 밀어내지 않도록 keep-all 예외 |
| 코드 블록 (code) | 순수 var(--codeFont) 유지 | 코드는 모노스페이스가 정답 |

## 블로그별 차이 (의도된 차이만 기록)

| 토큰 | 코너 속의 코너 | 4060미들스쿨 | 이유 |
|------|----------------|--------------|------|
| --reading-size (데스크톱) | 16.5px | 18px | 4060 독자는 중장년층. 본문 한 단계 크게 |
| --reading-size (모바일 ≤800px) | 16px | 17px | 동일 |
| 링크 밑줄 색 농도 (a { text-decoration-color }) | link 45% | link 70% | 4060은 링크가 더 뚜렷이 보여야 함 |
| 갤러리 스타일 (.gallery-item, .gallery-scale-preview) | 없음 | 있음 | 갤러리는 4060 전용 (GALLERY_AGENT_GUIDE.md) |

위 표에 없는 차이를 발견하면 의도되지 않은 드리프트다. 이 문서를 기준으로 맞춘다. 단, 표 처리 규칙(table-layout: fixed, overflow-wrap 등)은 공통이다 — 2026-07-12에 코너 속의 코너의 검증된 규칙을 4060에도 이식했다.

## 변경 이력

- 1.2 (2026-07-12): 라벨 폰트 최종 확정 — 한글 라벨은 bodyFont, 영문 라벨은 codeFont. "codeFont 뒤 폴백 추가" 방식은 제네릭 monospace 때문에 무효임을 확인하고 폐기.
- 1.1 (2026-07-12): 한글 단어 단위 줄바꿈(keep-all)과 라벨 폰트 한글 폴백을 공통 규칙으로 추가 (홈 카드 음절 잘림 문제 후속).
- 1.0 (2026-07-12): 최초 작성. 4060 본문 18px 상향, 링크 밑줄 강화, 표 규칙 공통화와 함께 도입.
