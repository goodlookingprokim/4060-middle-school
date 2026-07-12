# GALLERY AGENT GUIDE — 4060미들스쿨 갤러리·외부 자료 처리 지침

적용 대상: 4060미들스쿨 저장소(goodlookingprokim/4060-middle-school)의 갤러리 폴더 전체(이익상·이상수·윤영미 갤러리 및 이후 추가되는 모든 갤러리)
버전: 1.2 (2026-07-12) · 이 파일은 저장소 루트에 두고, 갤러리 자료를 접수·게시·수정하는 모든 작업 전에 반드시 읽는다.
상위 지침: `AGENT_OPERATIONS_GUIDE.md` (충돌 시 상위 지침 우선)

## 1. 대원칙

1. 발표자가 보내준 파일은 바이트 단위로 무수정 보존한다. 내용, 색, 레이아웃, 인코딩, 줄바꿈 어느 것도 바꾸지 않는다.
2. 가독성 문제는 원문이 아니라 "보여주는 액자"(항목 페이지의 임베드 방식)로만 해결한다.
3. 강사·발표자에게 파일 형식, 색상, 레이아웃에 관한 지침·가이드·요청을 일절 전달하지 않는다. 자료를 만들어 보내주신 것 자체가 호의이며, 조건을 붙이는 것은 예의에 어긋난다. 어떤 파일이 오든 게시 가능해야 하고, 가독성은 전적으로 블로그 쪽에서 해결한다.
4. 미리보기가 원문보다 나빠 보이면 미리보기를 빼고 전체 화면 링크만 남긴다. "안 보이는 미리보기"보다 "없는 미리보기"가 낫다.

## 2. 접수 절차 (자료 1건마다 순서대로)

1. 원문 저장 — 받은 HTML과 부속 파일(이미지 등)을 `quartz/static/<갤러리명>/`에 그대로 저장한다(빌드 시 `/static/` 경로로 배포된다). 파일명만 소문자 kebab-case로 지정하되, 파일 내용은 건드리지 않는다.
2. 사전 캡처 — 원문 URL을 headless 브라우저로 3장 캡처한다: 1280px 라이트, 1280px 다크(자료가 자체 배경색을 지정했으면 라이트와 동일하게 나온다 — 정상), 390px 모바일.
3. 판정 — 3장에서 아래를 확인한다.
   - 본문 글자가 배경에 묻히는 구간이 있는가 (대비 4.5:1 미만으로 보이는 구간)
   - 390px에서 요소가 겹치거나 글자가 잘리는가
   - 자료가 body 배경색을 지정하지 않아 투명 배경인가 (이 경우 흰 배경을 강제하는 A형 카드만 사용)
4. 유형 결정 — 판정 결과에 따라 3장의 A형 또는 B형 템플릿으로 항목 페이지를 만든다. 문제 구간이 있으면 무조건 A형(전체 화면 전용)이다.
5. 발행 전 검증 — 상위 지침 `AGENT_OPERATIONS_GUIDE.md` 3장의 체크리스트를 항목 페이지에 대해 수행한다.
6. 갤러리 인덱스 갱신 — 갤러리 index.md의 자료 카드 목록에 새 항목을 추가한다.

## 3. 항목 페이지 템플릿 (이 두 가지만 사용한다)

고정 높이 iframe(`height: 82vh` 등) 임베드는 사용 금지다. 기존 항목에서 발견하면 아래 형식으로 교체한다.

### A형 — 전체 화면 전용 (기본값, 판정에서 문제가 하나라도 나온 자료)

```markdown
---
title: (자료 제목)
description: (자료를 한 문장으로 설명)
publish: true
cssclasses:
  - field-note
---

# (자료 제목)

이 자료는 ○○○님이 보내주신 원문 HTML을 그대로 보존한 것입니다.
만든 분이 의도한 화면 그대로 보실 수 있게 전체 화면으로 열립니다.

<div class="gallery-item">
  <a class="gallery-open" href="(원문 static URL)" target="_blank" rel="noopener">
    <strong>원문 전체 화면으로 보기</strong>
  </a>
  <a href="(원문 static URL)" target="_blank" rel="noopener">
    <img src="./(자료명)-preview.png" alt="(자료 제목) 첫 화면 미리보기" loading="lazy" />
  </a>
</div>
```

미리보기 PNG는 접수 절차 2단계에서 찍은 1280px 라이트 캡처의 첫 화면을 사용한다. 원문은 손대지 않는다.

### B형 — 축소 미리보기 (판정을 모두 통과한 자료만)

`quartz/styles/custom.scss`에 아래 클래스가 있어야 한다(없으면 추가).

```scss
.gallery-scale-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 1px solid var(--lightgray);
  border-radius: 8px;

  iframe {
    width: 1280px;
    height: 800px;
    border: 0;
    background: #fff;
    transform-origin: top left;
    transform: scale(0.345); /* 본문 컬럼 실측 폭 441px ÷ 1280 */
    pointer-events: none;    /* 미리보기 스크롤 잠금 → 이중 스크롤 제거 */
  }
}

/* 모바일에서는 미리보기를 숨기고 전체 화면 링크만 남긴다 */
@media (max-width: 600px) {
  .gallery-scale-preview {
    display: none;
  }
}
```

항목 페이지 본문:

```html
<p><a href="(원문 static URL)" target="_blank" rel="noopener"><strong>원문 전체 화면으로 보기</strong></a></p>

<div class="gallery-scale-preview">
  <iframe src="(원문 static URL)" loading="lazy" title="(자료 제목) 미리보기"></iframe>
</div>
```

B형에서도 기본 동선은 항상 "전체 화면으로 보기" 링크이고, 미리보기는 보조다. 링크를 미리보기 아래에 두지 않는다.

## 4. 판정 기준 상세

| 검사 | 방법 | 실패 시 |
|------|------|---------|
| 대비 | 1280px 캡처에서 본문 글자가 배경 이미지·색과 뚜렷이 구분되는지 확인. 기준은 WCAG 2.1 SC 1.4.3의 4.5:1 | A형으로 게시 |
| 모바일 붕괴 | 390px 캡처에서 겹침·잘림 확인 | A형으로 게시 |
| 투명 배경 | 원문 `<body>`에 배경색 지정이 없으면 iframe 밖 색이 비쳐 보일 수 있음 | A형으로 게시 |
| 표 폭 | 1280px에서 표가 화면 안에 들어가는지 | 1280px에서도 잘리면 A형 |

## 5. 기존 항목 교체 작업 — 완료 (2026-07-12)

고정 높이 iframe 5건을 판정 후 아래와 같이 교체했다.

1. `lee-sangsu-gallery/aside-browser-beginner-manual.md` — 히어로 대비 문제 → **A형** (미리보기 PNG는 아직 없음. headless 브라우저를 쓸 수 있는 환경에서 1280px 첫 화면 캡처를 `aside-browser-beginner-manual-preview.png`로 추가하고 카드에 넣을 것)
2. `lee-sangsu-gallery/aside-browser-practical-manual.md` — 1280px 판정 통과 → **B형**
3. `yoon-youngmi-gallery/lazycodex-omo-technical-report-v2.md` — 자체 다크 테마, 1280px 정상 → **B형**
4. `lee-iksang-gallery/hermes-understanding-slides.md` — 크림 배경 정상 → **B형**
5. `lee-sangsu-gallery/aside-lazycodex-second-story.md` — 리다이렉트 방식에서 **A형** 카드로 통일 (뒤로 가기가 막히는 리다이렉트 대신 카드에서 새 창으로 열림)

새 자료는 2장의 접수 절차를 따르면 이 작업을 반복할 일이 없다.

## 6. 강사 응대 원칙

강사에게는 감사 인사와 게시 완료 알림(게시된 URL) 외에 어떤 것도 전달하지 않는다. 파일 형식 안내, 권장 사양, 색상 가이드, 수정·재제출 요청은 금지다. 자료의 어떤 특성도 문제 삼지 않는다 — 판정(4장)에서 걸리는 자료는 강사의 문제가 아니라 우리 임베드 환경의 한계이며, A형(전체 화면 전용)으로 게시하면 원작자가 의도한 화면 그대로 완벽하게 보인다.

## 7. 4060 가독성 기본값 (갤러리 외 전체 적용)

4060 독자는 중장년층이다. 본문 기준 글자 크기는 코너 속의 코너보다 한 단계 크게(17~18px 상당), 줄 간격 1.7 이상, 링크는 색과 밑줄을 병행한다. 이 값은 `DESIGN_TOKENS.md`에 기록하고, 변경 시 상위 지침 5장의 절차를 따른다.

## 변경 이력

- 1.2 (2026-07-12): 원문 보존 경로를 실제 저장소 구조(`quartz/static/`)에 맞게 수정. B형 미리보기에 모바일 숨김 규칙 추가.
- 1.1 (2026-07-12): 강사 안내 문구 삭제. 강사에게는 어떤 지침·가이드도 전달하지 않으며 가독성은 전적으로 블로그 쪽에서 해결하는 것으로 원칙 강화.
- 1.0 (2026-07-12): 최초 작성. 갤러리 iframe 가독성 진단(4060-gallery-readability-review-2026-07-12.md)의 후속 조치.
