---
title: "2026년 6월 28일(일) Hermes 구조와 OpenClaw 운영 구조는 어떻게 나눠 잡으면 좋을까"
description: "Hermes에서는 어떤 폴더와 파일부터 잡아야 하고, OpenClaw에서는 어떤 검색 우선순위와 fallback 규칙부터 정리하면 좋은지 4060 회원분들이 바로 따라가기 쉽게 풀어쓴 2편 실전 안내입니다."
tags:
  - middle-school
  - hermes
  - openclaw
  - search
  - ai-workflow
  - platform-tools
created: "2026-06-28"
modified: "2026-06-28"
publish: true
cssclasses:
  - field-note
---

# 2026년 6월 28일(일) Hermes 구조와 OpenClaw 운영 구조는 어떻게 나눠 잡으면 좋을까

지난 글에서는 왜 검색 기능을 하나의 큰 검색기로 만들기보다, 플랫폼별 도구를 서랍처럼 나눠 붙이는 방식이 더 현실적인지 살펴봤습니다.

이번 글은 그다음 단계입니다.

- Hermes에서는 실제로 어떤 파일과 폴더부터 잡으면 좋은지
- OpenClaw에서는 어떤 운영 규칙과 fallback 흐름부터 정리하면 좋은지

이 둘을 나눠서 보겠습니다.

## 먼저 결론

- Hermes는 구조를 직접 만드는 쪽이라 `config`, `registry`, `invoker`, `platform adapters`가 먼저 보여야 합니다.
- OpenClaw는 이미 있는 도구 흐름을 정리하는 쪽이라 `우선순위`, `fallback`, `도구 선택 규칙`이 먼저 잡혀야 합니다.
- 같은 검색 시스템 이야기라도, Hermes는 폴더 구조 중심으로, OpenClaw는 운영 규칙 중심으로 접근하는 편이 덜 헷갈립니다.
- 처음 따라 할 때는 Hermes도 OpenClaw도 `web`, `github`, `youtube`만 먼저 안정화하는 편이 좋습니다.

## 1. Hermes 쪽은 왜 폴더 구조부터 보는 게 좋을까

Hermes에서는 보통 직접 손으로 구조를 만드는 일이 먼저 생깁니다.

예를 들면 이런 질문이 나옵니다.

- 플랫폼 목록은 어디에 적어둘까
- GitHub 호출은 어느 파일에서 분기할까
- YouTube 쪽은 어떤 adapter로 뺄까
- 새 플랫폼 추가용 스크립트는 어디에 둘까

즉, Hermes에서는 “무슨 도구를 쓰느냐”만큼 “어디에 둘 것이냐”도 중요합니다.

쉽게 말하면 Hermes는  
<strong>내가 검색용 서랍장을 직접 짜는 쪽</strong>에 가깝습니다.

그래서 아래처럼 파일 역할이 눈에 보여야 덜 헷갈립니다.

## 2. Hermes 기준 최소형 폴더 구조는 이렇게 잡으면 편하다

처음부터 거창하게 갈 필요는 없습니다.
아래 정도만 있어도 꽤 훌륭한 시작입니다.

```text
hermes-search/
├─ config/
│  └─ platforms.yaml
├─ core/
│  ├─ invoker.py
│  ├─ search_across.py
│  └─ result_types.py
├─ adapters/
│  ├─ web_reader.py
│  ├─ github_gh.py
│  ├─ youtube_ytdlp.py
│  └─ rss_reader.py
├─ scripts/
│  └─ add_platform.py
├─ docs/
│  ├─ usage.md
│  └─ add-platform.md
└─ tests/
   └─ test_search_across.py
```

이 구조를 아주 쉽게 풀면 이렇습니다.

- `config/`: 어떤 플랫폼을 어떤 도구에 연결할지 적는 곳
- `core/`: 실제로 호출하고 묶고 정리하는 핵심 부위
- `adapters/`: 플랫폼별 전용 도구 연결부
- `scripts/`: 새 플랫폼 붙일 때 도와주는 자동화 도구
- `docs/`: 다른 사람과 미래의 내가 다시 읽을 설명서
- `tests/`: 결과 형식이 안 깨지는지 확인하는 최소 점검

### 각 파일은 무슨 역할을 하나

#### `platforms.yaml`

여기에는 보통 이런 정보가 들어갑니다.

- 플랫폼 이름
- 기본 도구
- fallback 도구
- 직접 호출 여부

예를 들면 이런 느낌입니다.

```yaml
platforms:
  web:
    primary: reader
    fallback: raw_fetch
    direct_call: true
  github:
    primary: gh
    fallback: web_open
    direct_call: true
  youtube:
    primary: yt_dlp
    fallback: transcript_reader
    direct_call: true
```

이 파일은 검색 시스템의 운영표입니다.
무엇을 어디에 연결했는지 한눈에 보여야 합니다.

#### `invoker.py`

이 파일은 호출 창구입니다.

겉에서는 이런 식으로만 부릅니다.

```text
invoke("github", "search", "agent reach")
```

하지만 안에서는

- GitHub면 `gh`
- YouTube면 `yt-dlp`
- web이면 reader/fetch

처럼 각각 다른 도구로 갈라집니다.

즉, `invoker.py`는  
<strong>겉보기에는 단순하게, 속으로는 플랫폼별로 다르게</strong> 움직이게 해주는 파일입니다.

#### `adapters/`

여기는 플랫폼별 연결부입니다.

예를 들면,

- `github_gh.py`는 GitHub 전용
- `youtube_ytdlp.py`는 YouTube 전용
- `web_reader.py`는 웹문서 전용

이렇게 나눠 둬야
한 플랫폼을 바꿔도 다른 플랫폼을 덜 건드립니다.

#### `search_across.py`

이 파일은 여러 플랫폼 결과를 하나로 모으는 역할을 합니다.

여기서 중요한 건 많이 찾는 것이 아니라,  
결과를 같은 모양으로 맞춰 주는 일입니다.

예를 들면 아래처럼요.

- `title`
- `url`
- `snippet`
- `source_platform`

결국 이 파일은  
<strong>여러 서랍에서 꺼낸 물건을 같은 크기 상자에 다시 담는 역할</strong>이라고 생각하면 됩니다.

## 3. OpenClaw 쪽은 왜 운영 규칙부터 보는 게 좋을까

OpenClaw에서는 이미 있는 도구와 세션 흐름이 있는 경우가 많습니다.

그래서 아래 같은 질문이 더 먼저 나옵니다.

- 검색을 시킬 때 어떤 도구를 먼저 시도할까
- 실패하면 두 번째로 무엇을 시도할까
- 어떤 플랫폼은 그냥 기존 웹 도구로 충분한가
- 새 도구를 붙일 필요가 있는 플랫폼만 따로 분리할까

즉, OpenClaw에서는 “어디에 둘까”보다 “어떤 순서로 쓰게 할까”가 더 중요해집니다.

쉽게 말하면 OpenClaw는  
<strong>이미 있는 서랍장 안에 이름표와 사용 순서를 붙이는 쪽</strong>에 가깝습니다.

## 4. OpenClaw에서는 검색 우선순위 표가 먼저 있어야 한다

OpenClaw 쪽은 구조를 새로 만드는 일보다  
이미 있는 도구 중 무엇을 먼저 시도할지 정리하는 일이 핵심입니다.

처음에는 아래 정도 표만 있어도 꽤 실용적입니다.

| 상황 | 1순위 | 2순위 fallback | 비고 |
| --- | --- | --- | --- |
| 공개 웹문서 읽기 | 기본 웹 fetch/reader | raw URL, RSS | 별도 도구 없이 끝나는 경우 많음 |
| GitHub 저장소 보기 | GitHub 전용 도구, `gh` 계열 | 웹 열기 | 저장소 설명과 파일 탐색 정확도 중요 |
| YouTube 내용 보기 | 자막/메타데이터 도구 | 웹 설명문, 요약 페이지 | 영상 자체보다 자막 확보가 중요 |
| RSS 자료 수집 | 피드 파서 | raw XML | 반복 자료 수집에 유리 |
| 차단된 공개 페이지 | 기존 브라우저/웹 도구 | 우회용 공개 경로 | 로그인·페이월은 넘지 않음 |

이 표가 좋은 이유는 단순합니다.

- 검색할 때 매번 처음부터 판단하지 않아도 되고
- 도구를 바꿀 때도 표만 먼저 바꾸면 되고
- 다른 에이전트나 협업자도 흐름을 따라가기 쉽습니다

### OpenClaw에서 특히 중요한 질문

OpenClaw에서는 아래 질문을 먼저 답해 두는 편이 좋습니다.

- 웹 도구만으로 어디까지 가능한가
- GitHub와 YouTube는 별도 도구가 꼭 필요한가
- 실패했을 때 두 번째 선택지는 무엇인가
- 검색 결과를 어디에서 다시 요약하고 비교할 것인가

즉, OpenClaw는  
“무슨 파일을 만들까”보다  
“무슨 순서로 시도하게 할까”가 더 중요합니다.

## 5. fallback 규칙은 짧게라도 문서로 남겨야 한다

검색 시스템은 잘 될 때보다  
안 될 때의 규칙이 더 중요합니다.

예를 들면 이런 식입니다.

1. 웹문서는 먼저 기본 reader/fetch를 시도한다  
2. 안 열리면 raw, RSS, 공개 API를 본다  
3. GitHub는 전용 도구를 먼저 본다  
4. YouTube는 자막이나 메타데이터를 먼저 본다  
5. 로그인이나 페이월이 보이면 거기서 멈춘다  

이 정도만 적어 두어도
나중에 “왜 여기서 갑자기 다른 도구를 썼지?” 하는 혼란이 많이 줄어듭니다.

특히 OpenClaw처럼 여러 도구가 이미 있는 환경에서는  
fallback 규칙을 안 적어두면 사람도 에이전트도 흐름이 흔들리기 쉽습니다.

## 6. Hermes와 OpenClaw를 아주 짧게 비교하면

| 구분 | Hermes | OpenClaw |
| --- | --- | --- |
| 시작점 | 구조를 직접 만든다 | 기존 도구를 정리한다 |
| 먼저 보일 것 | 폴더와 파일 역할 | 우선순위와 fallback 규칙 |
| 핵심 문서 | `platforms.yaml`, invoker 설명 | 검색 우선순위 표, 운영 규칙 |
| 처음 목표 | 최소형 검색 레이어 만들기 | 도구 선택 흐름 안정화 |

회원분들 입장에서는 이렇게 떠올리면 편합니다.

- Hermes는 “검색 시스템을 조립하는 쪽”
- OpenClaw는 “검색 흐름을 운영하는 쪽”

둘 다 필요하지만, 손대는 지점이 다릅니다.

## 7. 처음 따라 하는 분들은 어디까지 하면 충분할까

처음부터 모든 플랫폼을 붙일 필요는 없습니다.

아래 정도면 충분합니다.

### Hermes 최소 MVP

- `platforms.yaml`
- `invoker.py`
- `web`, `github`, `youtube` adapter 세 개
- 결과 형식 통일

### OpenClaw 최소 MVP

- 웹문서 읽기 1순위 정리
- GitHub와 YouTube fallback 규칙 정리
- 간단한 검색 우선순위 표 문서화

즉,
처음에는 기능을 넓히기보다  
<strong>자주 쓰는 세 플랫폼을 안정적으로 굴리는 것</strong>이 더 중요합니다.

## 8. 회원분들이 바로 가져가면 좋은 체크리스트

<ul class="note-list">
  <li>Hermes에서는 먼저 `platforms` 표를 만들고, 파일 역할이 겹치지 않게 나눈다.</li>
  <li>OpenClaw에서는 먼저 기존 도구를 점검하고, 검색 우선순위와 fallback 규칙부터 적는다.</li>
  <li>`web`, `github`, `youtube` 세 가지만 먼저 안정화한다.</li>
  <li>검색 결과는 `title`, `url`, `snippet`, `source_platform`처럼 같은 형식으로 맞춘다.</li>
  <li>새 플랫폼 추가는 손작업으로만 하지 말고, 가능하면 스캐폴딩 스크립트로 흔적을 남긴다.</li>
</ul>

## 마무리

지난 글이 “왜 플랫폼별 서랍이 필요한가”를 설명하는 글이었다면,
이번 글은 “그 서랍을 실제로 어떻게 짜고 어떻게 운영할까”를 나누어 본 글입니다.

핵심은 단순합니다.

- Hermes는 구조를 먼저 잡고
- OpenClaw는 운영 규칙을 먼저 잡습니다

이 감각만 잡아도
회원분들이 실제로 따라갈 때 훨씬 덜 복잡해집니다.

## 참고

이 글은 앞선 1편  
`Hermes에 검색 기능을 붙일 때 왜 플랫폼별 서랍부터 나눠야 할까`  
에서 이어지는 2편입니다.
