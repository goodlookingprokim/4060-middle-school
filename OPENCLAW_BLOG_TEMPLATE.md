# OpenClaw Blog Publishing Template

이 Quartz 템플릿은 OpenClaw가 평범한 마크다운 노트를 푸시해도 읽기 편한 정보 설계형 테크 블로그로 바로 보이도록 구성되어 있습니다.

> **먼저 읽을 것**: 이 문서는 글 작성 형식 지침입니다. 발행 파이프라인, 발행 전 검증 체크리스트, 금지 사항, 디자인 토큰 관리는 상위 지침인 `AGENT_OPERATIONS_GUIDE.md`를 따릅니다. 갤러리·외부 자료를 다루는 작업은 `GALLERY_AGENT_GUIDE.md`를 추가로 따릅니다. 문서 간 충돌 시 상위 지침이 우선합니다.

## 글 작성 규칙

- 새 글은 `content/templates/openclaw-blog-post.md`의 frontmatter와 섹션 순서를 우선 사용합니다.
- 카테고리 인덱스는 `content/templates/openclaw-folder-index.md`를 사용합니다.
- `cssclasses`는 글 성격에 맞게 `field-note`, `playbook`, `quick-note`, `reference` 중 하나를 고릅니다.
- `description`은 OG 이미지와 검색 미리보기에 들어가므로 한 문장으로 완결합니다.
- 태그는 소문자 영문 kebab-case를 기본으로 쓰고, 3-6개 안에 멈춥니다.
- 강한 장식보다 문제, 결론, 절차, 재사용 가능한 판단이 먼저 보이게 씁니다.
- 홈 `index.md`의 `지금 먼저 보면 좋은 글` 목록은 최근 6건 이내로 유지합니다. 새 글을 목록 맨 위에 추가하면 가장 오래된 항목을 빼고, 전체 목록은 카테고리 허브에 맡깁니다.

## 권장 글 구조

1. 문제나 상황을 한 문단으로 설명합니다.
2. `먼저 결론`에서 재사용 가능한 판단을 먼저 둡니다.
3. 실제 설정, 명령, 오류, 해결 순서를 숨기지 않습니다.
4. 마지막에는 다음 작업에서 바로 쓸 체크리스트나 판단을 남깁니다.

## 지원되는 강조 블록

- `<div class="note-hero">...</div>`: 홈 또는 글 상단의 차분한 소개 블록
- `<p class="kicker">...</p>`: 섹션 성격을 짧게 표시하는 보조 라벨
- `<div class="topic-grid">`와 `<a class="topic-card">`: 3개 내외의 관련 글/주제 카드
- `<ul class="note-list">`: 체크리스트나 재사용 항목
- `<div class="action-row">`: 주요 이동 버튼 묶음
- `<div class="hub-hero">...</div>`: 카테고리 허브 상단의 가치 제안 블록
- `<div class="hub-grid">`와 `<div class="hub-card">`: 허브의 주제 축, 준비 중인 시리즈, 상태 카드
- `<span class="hub-status">...</span>`: 카드 상태나 성격 라벨
- `<div class="empty-state">...</div>`: 아직 글이 없는 섹션의 고급 빈 상태
- `<div class="reading-path">...</div>`: 실제 발행 글이나 관련 허브로 이어지는 읽기 경로
- `<div class="cta-panel">...</div>`: RSS, GitHub, 다음 발행 기준 같은 은은한 안내 패널

## 카테고리 허브 작성 규칙

- 카테고리 인덱스는 짧은 소개문으로 끝내지 말고 `hub-hero`, `hub-grid`, `reading-path`, `cta-panel`을 조합해 허브처럼 만듭니다.
- 실제 글이 없는 카테고리는 가짜 글 링크를 만들지 않습니다. 대신 `.empty-state`와 링크 없는 `.hub-card.is-pending`으로 앞으로 쌓을 주제를 보여줍니다.
- 실제 발행 글이 있는 카테고리는 `.reading-path`에서 대표 글을 2-3개만 고르고, 나머지는 Quartz의 자동 최근 글 목록에 맡깁니다.
- 준비 중인 카드는 `<a>`가 아니라 `<div class="hub-card is-pending">`을 사용합니다. 발행 후에만 실제 링크 카드로 바꿉니다.
- CTA는 강하게 판매하지 않습니다. RSS, GitHub, 대표 글, 다음에 발행될 시리즈를 조용히 안내합니다.

## 임베드 규칙

- 고정 높이 iframe(`height: 82vh` 같은 고정 높이 임베드)은 사용하지 않습니다. 데스크톱 폭으로 설계된 외부 문서를 좁은 본문 컬럼에 넣으면 글자 겹침, 표 잘림, 이중 스크롤이 발생합니다.
- 외부 HTML 자료는 "전체 화면으로 보기 링크 + 첫 화면 PNG 카드"(A형) 또는 축소(scale) 미리보기 `.gallery-scale-preview`(B형)만 사용합니다. 구체 형식은 `GALLERY_AGENT_GUIDE.md`를 따릅니다.
- 타인이 만든 파일은 어떤 경우에도 수정하지 않고 원문 그대로 보존합니다.

기존 글에 남아 있는 `.neo-*` 클래스는 호환 스타일로 계속 렌더링되지만, 새 글에는 위 클래스명을 사용합니다.

`content/templates`는 Quartz `ignorePatterns`에 포함되어 배포되지 않습니다.
