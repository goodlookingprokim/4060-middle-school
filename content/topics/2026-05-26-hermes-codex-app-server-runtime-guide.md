---
title: "2026년 5월 26일(화) Hermes에서 Codex app-server runtime을 붙이면 무엇이 달라질까"
description: "Hermes Agent 공식 문서의 Codex App-Server Runtime 설명을 바탕으로, 왜 이 기능이 생겼는지, 언제 쓰면 좋은지, 기존 Hermes 방식과 무엇이 다른지 초보자도 이해하기 쉽게 풀어쓴 정리입니다."
tags:
  - middle-school
  - hermes
  - codex
  - runtime
  - openai
created: "2026-05-26"
modified: "2026-05-26"
publish: true
cssclasses:
  - field-note
---

# 2026년 5월 26일(화) Hermes에서 Codex app-server runtime을 붙이면 무엇이 달라질까

출처: Hermes Agent 공식 문서  
<https://hermes-agent.nousresearch.com/docs/user-guide/features/codex-app-server-runtime>

Hermes를 조금 오래 보다 보면 이런 생각이 한 번쯤 듭니다.

"Hermes 안에서 OpenAI 쪽 작업을 할 때, Codex가 잘하는 그 작업 방식 자체를 그냥 가져다 쓸 수는 없을까?"

이번에 Hermes 공식 문서를 보다가 바로 그 질문에 대한 답이 되는 기능을 만났습니다.
바로 <strong>Codex app-server runtime</strong>입니다.

처음 이름만 보면 조금 딱딱합니다.
그런데 뜻은 생각보다 단순합니다.

> Hermes가 OpenAI 계열 작업을 직접 자기 방식으로 처리하는 대신, 필요할 때는 Codex의 작업 엔진 안으로 넘겨서 실행하게 하는 선택 기능입니다.

즉,
Hermes가 사라지는 것이 아니라,
<strong>Hermes 바깥 껍데기와 운영 구조는 그대로 두고, 실제 작업 엔진만 Codex 쪽으로 바꿔 끼우는 느낌</strong>에 가깝습니다.

## 먼저 가장 쉽게 말하면

기존 Hermes는 스스로 공구함을 들고 일하는 방식입니다.
반면 Codex app-server runtime을 켜면,
Hermes가 <strong>Codex의 공구함과 작업대</strong>를 빌려 쓰는 쪽에 가깝습니다.

그래서 바뀌는 건 이런 부분입니다.

- 터미널 명령 실행 방식
- 파일 읽기/쓰기/수정 방식
- 샌드박스 방식
- Codex 플러그인 사용 가능 여부
- ChatGPT 구독 인증 흐름 활용

반대로 그대로 남는 것도 있습니다.

- Hermes의 세션 관리
- slash command 구조
- gateway 연결
- 메모리/스킬 리뷰 같은 바깥 운영 흐름

이 차이를 잡고 읽으면 글이 훨씬 덜 어렵습니다.

## 1. 이 기능은 왜 생겼을까

공식 문서를 보면 이유가 꽤 분명합니다.

### 첫째, ChatGPT 구독 인증 흐름을 그대로 쓰고 싶을 때
Codex CLI는 ChatGPT 구독 기반 인증 흐름을 사용합니다.
즉, 별도 API 키 없이도 Codex 쪽 인증 구조를 활용할 수 있습니다.

Hermes 공식 문서도 이 점을 꽤 크게 잡고 있습니다.

쉽게 말하면,
<strong>Hermes 안에서 OpenAI 작업을 할 때, Codex가 이미 잘 깔아둔 로그인 문을 같이 쓰는 것</strong>에 가깝습니다.

### 둘째, Codex가 잘하는 작업 방식을 그대로 가져오고 싶을 때
Codex는 원래부터 아래 작업에 강한 흐름을 갖고 있습니다.

- shell 명령 실행
- 파일 읽기/쓰기/검색
- 구조화된 patch 적용
- 내부 계획(update_plan) 관리
- 샌드박스 안에서 안전하게 작업

즉,
코드 다루는 실무 작업 자체는 Codex의 작업대가 꽤 잘 닦여 있다는 뜻입니다.

### 셋째, Codex 플러그인을 Hermes 세션 안에서도 쓰고 싶을 때
공식 문서 기준으로,
Codex 쪽에 이미 설치한 플러그인들(예: GitHub, Gmail, Calendar, Linear, Canva 등)을 Hermes 쪽으로 자동 이주해 쓸 수 있는 흐름이 들어 있습니다.

이건 꽤 중요합니다.
왜냐하면 사람 입장에서는 도구를 새로 다 다시 깔기보다,
<strong>이미 Codex에서 잘 쓰던 플러그인을 Hermes에서도 이어서 쓰고 싶은 마음</strong>이 자연스럽기 때문입니다.

## 2. 그러면 Hermes는 사라지는 걸까

아닙니다. 이 부분이 제일 중요합니다.

공식 문서 표현을 풀어 쓰면,
Hermes가 Codex runtime을 켜도 Hermes는 여전히 바깥 껍데기와 운영자 역할을 합니다.

즉,
- 세션 DB
- slash command
- gateway
- memory/skill review
- Hermes 쪽 도구 연결

이런 것들은 계속 Hermes가 잡고 있습니다.

쉽게 비유하면 이렇습니다.

- Hermes = 현장 관리자
- Codex runtime = 실제 작업을 수행하는 전문 작업대

즉,
Hermes가 "이번 작업은 네 작업대에서 해"라고 넘기는 구조에 더 가깝습니다.

## 3. 모델이 실제로 쓰는 도구는 무엇이 달라지나

공식 문서에서 가장 중요한 부분 중 하나가 바로 이것입니다.

Codex app-server runtime이 켜지면,
모델은 크게 세 갈래 도구를 쓰게 됩니다.

### 1) Codex 기본 도구
이건 Codex가 원래 갖고 있는 도구입니다.

대표적으로:
- `shell`
- `apply_patch`
- `update_plan`
- `view_image`
- `web_search`

쉽게 말하면,
파일 읽고 쓰고 찾고 실행하는 대부분의 일은 Codex가 자기 공구로 바로 처리합니다.

### 2) Codex 플러그인
이미 Codex에 설치된 플러그인을 Hermes 세션에서도 이어서 쓸 수 있습니다.

예를 들면:
- GitHub
- Linear
- Gmail
- Google Calendar
- Canva

이건 꽤 "와, 이건 실무에서 바로 쓰겠다" 싶은 부분입니다.

### 3) Hermes 도구 콜백
Codex에 없는 도구는 Hermes가 MCP 서버처럼 뒤에서 다시 받아 처리합니다.

공식 문서 기준으로 여기에 들어가는 예시는 아래와 같습니다.

- `web_search`, `web_extract`
- 브라우저 자동화 도구
- `vision_analyze`
- `image_generate`
- `skill_view`, `skills_list`
- `text_to_speech`

즉,
Codex가 모든 것을 다 갖고 있는 것이 아니라,
<strong>없는 것은 Hermes 쪽 도구함으로 다시 물어보는 구조</strong>입니다.

## 4. 반대로 안 되는 것도 있다

공식 문서는 이 부분도 분명히 말합니다.

Codex app-server runtime에서는 Hermes의 일부 "에이전트 루프 의존 기능"이 바로 안 됩니다.

대표적으로:
- `delegate_task`
- `memory`
- `session_search`
- `todo`

왜냐하면 이 도구들은 Hermes가 자기 루프 안에서 상태를 들고 직접 굴려야 하는데,
Codex runtime의 stateless callback 구조에서는 그걸 그대로 밀어 넣기 어렵기 때문입니다.

이 부분은 초보자 기준으로 이렇게 이해하면 됩니다.

> Codex runtime은 코딩 작업대는 아주 좋지만, Hermes 고유의 내부 비서 기능 몇 가지는 그대로 가져오지 못한다.

그래서 모든 상황에서 무조건 Codex runtime이 더 좋은 것은 아닙니다.

## 5. 언제 이걸 켜면 좋을까

이건 실무 감각으로 보는 편이 좋습니다.

### 잘 맞는 경우
- OpenAI / Codex 계열 작업을 많이 한다
- 파일 읽기/쓰기/검색/패치 작업이 많다
- Codex 플러그인을 이미 잘 쓰고 있다
- ChatGPT 구독 인증 흐름을 살리고 싶다
- 브라우저나 비전 같은 Hermes 도구도 같이 붙여 쓰고 싶다

### 기본 Hermes가 더 나은 경우
- subagent 위임이 중요하다
- Hermes memory를 바로 쓰는 흐름이 중요하다
- session_search 같은 기능을 자주 쓴다
- Hermes todo 구조를 작업 핵심으로 쓴다

즉,
<strong>코드 작업 중심이면 Codex runtime이 끌리고, 에이전트 운영 중심이면 기본 Hermes가 더 자연스러울 수 있다</strong>고 보면 됩니다.

## 6. 공식 문서 기준 준비물은 무엇인가

공식 문서 기준으로는 먼저 아래 준비가 필요합니다.

### 1) Codex CLI 설치
```bash
npm i -g @openai/codex
codex --version
```

문서에는 `0.130.0` 이상을 권장하고 있습니다.

### 2) Codex 로그인
```bash
codex login
```

여기서 문서가 강조하는 포인트가 하나 있습니다.

- `codex login`으로 생기는 인증 정보와
- Hermes 자체 `hermes auth login codex`로 생기는 인증 정보는
같은 파일이 아닙니다.

즉,
Hermes에서 Codex를 쓴다고 해도 <strong>Codex 자체 로그인은 따로 해두는 편이 안전</strong>합니다.

### 3) 필요하면 Codex 플러그인 설치
문서 예시는 이런 흐름을 보여줍니다.

```bash
codex plugin marketplace add openai-curated
```

그 뒤 Codex 쪽에서 원하는 플러그인을 설치해 두면,
Hermes가 runtime 활성화 시 그것을 발견해 넘겨줍니다.

## 7. `/codex-runtime`은 정확히 무슨 명령일까

이 부분도 한 번 분명히 짚고 가면 좋습니다.

`/codex-runtime`은 제가 따로 설치한 요령이 아니라, <strong>Hermes 자체에 들어 있는 내장 슬래시 명령</strong>입니다.

로컬 소스 기준으로도 아래 흔적을 확인할 수 있습니다.

- `hermes_cli/commands.py`에 `codex-runtime` 명령 등록
- `cli.py`에 `/codex-runtime` 핸들러 구현
- `codex_runtime_switch.py`에 실제 전환 로직 정리

즉,
이 명령은 한마디로 말하면
<strong>"Hermes가 OpenAI/Codex 작업을 자기 기본 runtime으로 돌릴지, Codex app-server runtime으로 넘길지 정하는 스위치"</strong>입니다.

### 가장 자주 보는 형태

여기서 중요한 점이 하나 있습니다.

<strong>이건 서로 다른 명령 여러 개가 아니라, `/codex-runtime`이라는 하나의 내장 명령에 인자를 다르게 주는 방식</strong>입니다.

즉,
- `/codex-runtime` = 현재 상태 보기
- `/codex-runtime on` = `codex_app_server`로 켜기
- `/codex-runtime off` = `auto`로 끄기
- `/codex-runtime auto` = 기본 Hermes runtime으로 설정
- `/codex-runtime codex_app_server` = Codex runtime으로 설정

으로 이해하면 됩니다.

다시 말해, <strong>`on`은 `codex_app_server`의 쉬운 별칭이고, `off`는 `auto`의 쉬운 별칭</strong>입니다.
별도의 두 번째 유사 명령을 또 써야 하는 구조가 아닙니다.

내부적으로는 결국 `model.openai_runtime` 값을 바꾸는 흐름으로 이해하면 됩니다.

```text
auto = Hermes 기본 실행
codex_app_server = Codex subprocess / app-server 쪽으로 작업 위임
```

즉,
겉으로는 슬래시 명령이지만,
안쪽에서는 <strong>"OpenAI 계열 turn을 어떤 엔진에서 처리할지"를 고르는 설정 변경</strong>에 가깝습니다.

### 같이 기억하면 좋은 특징

- Codex CLI가 설치되어 있는지 먼저 검사합니다.
- 켜더라도 보통 현재 진행 중인 세션이 아니라 <strong>다음 세션부터 적용</strong>되는 감각으로 보는 편이 안전합니다.
- Codex 쪽에서 쓸 수 있도록 MCP 서버와 플러그인 이주 흐름도 함께 만집니다.

한 줄로 다시 줄이면 이렇습니다.

> `/codex-runtime`은 Codex를 Hermes 안에서 쓸지, Hermes 기본 runtime으로 쓸지 정하는 내장 스위치입니다.

여기서 특히 헷갈리기 쉬운 부분을 아주 짧게 다시 정리하면 이렇습니다.

- `on` = `codex_app_server`와 같은 뜻
- `off` = `auto`와 같은 뜻
- 즉, `off`가 별도의 세 번째 모드가 아니라 <strong>기본 Hermes 쪽으로 되돌리는 쉬운 표현</strong>입니다.

그리고 이 명령은 CLI 쪽에만 따로 있는 것이 아니라, Hermes의 CLI와 gateway 쪽에서 같은 전환 로직을 공유하도록 만들어져 있습니다.
즉, 표면은 달라도 핵심 동작은 같은 명령이라고 보면 됩니다.

## 8. 실제로 켜는 방법은 어렵지 않다

Hermes 세션 안에서 아래처럼 켭니다.

```text
/codex-runtime codex_app_server
```

문서 기준으로 이 명령은 대략 아래 일을 합니다.

- codex CLI 설치 확인
- `config.yaml`에 runtime 설정 저장
- Hermes 쪽 MCP 서버 설정을 Codex 쪽으로 이주
- 설치된 Codex 플러그인 탐색 및 반영
- Hermes 도구를 Codex에서 다시 부를 수 있게 MCP 서버 등록
- workspace 쓰기 권한 기본값 정리

즉,
그냥 스위치 하나만 켜는 느낌이 아니라,
<strong>Hermes와 Codex가 함께 일할 수 있게 배경 정리를 한 번 해주는 명령</strong>에 가깝습니다.

현재 상태 확인은 이렇게 합니다.

```text
/codex-runtime
```

끄거나 기본값으로 돌리는 쪽은 아래처럼 봅니다.

- `/codex-runtime on`
- `/codex-runtime off`
- `/codex-runtime auto`

## 8-1. 켰다가 다시 Hermes 기본 runtime으로 돌아올 수 있을까

네, 가능합니다.

다만 여기서 한 가지를 꼭 기억해야 합니다.

> `/codex-runtime codex_app_server`로 Codex runtime을 켠 뒤 코딩하고, 이후 `/codex-runtime auto`로 Hermes 기본 runtime으로 돌아올 수는 있지만, 이 전환은 보통 현재 세션에 즉시 덮어씌워지는 느낌보다 <strong>다음 세션부터 적용되는 흐름</strong>에 가깝습니다.

즉, 이렇게 이해하는 편이 가장 안전합니다.

1. Codex runtime 켜기
2. 그 세션에서 코딩 작업하기
3. 새 세션으로 넘어가거나 다시 시작하기
4. `/codex-runtime auto`로 Hermes 기본 runtime 복귀시키기
5. 그다음 Hermes 고유 기능 쓰기

이 흐름이 왜 중요하냐면,
많은 분들이 "작업 중간에 버튼 바꾸듯 즉시 왔다 갔다 할 수 있나?"를 먼저 떠올리기 때문입니다.

그런데 실제 감각은 그보다는 <strong>세션 단위로 작업 모드를 바꿔 쓰는 것</strong>에 더 가깝습니다.

그리고 여기서 말하는 "다음 세션부터 적용"도 조금 더 풀면 오해가 줄어듭니다.

이 뜻은 보통 <strong>지금 이미 진행 중인 작업 한가운데서 엔진이 즉시 갈아끼워진다기보다, 설정을 바꿔 두고 다음 대화/새 세션/재시작 뒤에 새 runtime 감각으로 들어간다</strong>는 쪽에 가깝습니다.

즉,
작업 도중에 바로 기어를 바꾸는 느낌보다,
다음 출발부터 다른 차를 타는 느낌으로 이해하면 편합니다.

## 8-2. 그러면 어떤 기능은 되고, 어떤 기능은 안 되나

이 차이도 다시 한 번 짧게 잡고 가면 좋습니다.

### Codex runtime에서 잘 되는 것
- 코딩
- 파일 수정
- 셸 명령
- `apply_patch`
- Codex 플러그인
- Hermes 도구의 일부(MCP callback 경유)

### Codex runtime에서 바로 안 되는 것
- `delegate_task`
- `memory`
- `session_search`
- `todo`

즉,
<strong>"Codex로 코딩하고, 그다음 Hermes 고유 기능을 쓰고 싶다"는 흐름 자체는 가능</strong>합니다.

다만 그걸 한 세션 안에서 즉시 스위칭하는 느낌으로 보기보다,
<strong>코딩용 세션과 Hermes 운영용 세션을 나눠 쓰는 패턴</strong>으로 이해하는 편이 훨씬 덜 헷갈립니다.

## 8-3. 실전에서는 어떻게 나눠 쓰면 좋을까

실무 감각으로 가장 단순하게 줄이면 이렇게 쓸 수 있습니다.

### 코딩 작업용 세션
```text
/codex-runtime codex_app_server
```

이 세션에서는 아래에 집중합니다.
- 코드 읽기
- 파일 수정
- 패치 적용
- 셸 명령 실행
- Codex 플러그인 활용

### Hermes 기능용 세션
```text
/codex-runtime auto
```

이 세션에서는 아래에 집중합니다.
- delegate_task
- memory
- session_search
- Hermes todo 성격의 운영 기능

즉,
작업대를 두 개 둔다고 생각하면 편합니다.

- 한쪽 책상은 코딩용
- 다른 한쪽 책상은 운영용

같은 사람이라도,
문서 정리할 때 앉는 자리와 공구 펼쳐놓고 손으로 작업할 때 앉는 자리가 다를 수 있듯이,
Hermes와 Codex runtime도 그렇게 나눠 보는 편이 자연스럽습니다.

## 9. 승인과 권한은 어떻게 움직이나

이 부분도 꽤 중요합니다.

공식 문서 기준으로,
Codex가 shell 명령이나 patch 적용을 하려고 할 때 Hermes의 표준 위험 명령 승인 화면으로 번역되어 나옵니다.

즉,
Codex 안에서 일이 벌어져도 사람 입장에서는 Hermes의 승인 흐름처럼 보입니다.

권한 프로필은 대표적으로 이렇게 나뉩니다.

- `:read-only`
- `:workspace`
- `:danger-no-sandbox`

문서에서는 보통 `:workspace`를 기본으로 두는 흐름을 설명합니다.
이건 현재 작업 폴더 안에서는 비교적 자연스럽게 쓰게 하고,
밖으로 크게 벗어나는 작업은 여전히 조심하게 만드는 감각입니다.

초보자 기준에서는 이렇게 이해하면 됩니다.

> 집 안에서는 메모해도 되지만, 집 밖 벽까지 뜯으려 하면 다시 물어보는 방식

## 10. 메모리와 스킬 리뷰는 완전히 끊기는가

이건 좀 흥미롭습니다.

공식 문서에 따르면,
Hermes의 background self-improvement 흐름, 즉 메모리/스킬 리뷰는 계속 살아 있습니다.

다만 그 방식이 약간 우회적입니다.
Codex 쪽에서 나온 이벤트를 Hermes가 자기 메시지 모양으로 다시 투영해서,
리뷰 에이전트가 보기에는 평소 Hermes 대화처럼 보이게 만든다는 설명이 나옵니다.

쉽게 말하면,
<strong>밖에서는 Codex가 일하고 있지만, 기록장은 Hermes 형식으로 다시 정리해 두는 느낌</strong>입니다.

이 설명은 꽤 Hermes답습니다.
겉으로는 다른 엔진을 붙였지만,
배움과 복기 흐름은 계속 놓치지 않겠다는 쪽이니까요.

## 10. 4060미들스쿨 식으로 다시 줄이면

이 글을 다 읽고 나서 남았으면 하는 감각은 이것입니다.

- Hermes는 원래 자기 방식대로도 잘 일한다
- 그런데 OpenAI / Codex 계열 작업에서는 Codex 작업대를 빌려 쓰는 선택지도 생겼다
- 이걸 켜면 shell, patch, sandbox, plugin 쪽은 더 Codex답게 간다
- 대신 Hermes 고유의 몇몇 내부 기능은 바로 안 맞을 수 있다
- 그래서 "무조건 더 좋다"가 아니라, 어떤 일을 시키는지에 따라 고르는 옵션이다

즉,
이 기능은 새 AI 하나를 추가하는 느낌보다,
<strong>Hermes라는 몸체에 Codex라는 작업 엔진을 갈아 끼울 수 있게 해준 선택 기능</strong>으로 이해하는 편이 가장 쉽습니다.

## 누구에게 특히 잘 맞을까

이런 분들에게는 꽤 잘 맞습니다.

- Codex CLI를 이미 쓰고 있는 사람
- ChatGPT 구독 기반으로 코딩 작업을 많이 하는 사람
- GitHub, Gmail, Calendar 같은 Codex 플러그인을 같이 쓰고 싶은 사람
- Hermes 안에서도 좀 더 Codex다운 코딩 작업 흐름을 원한 사람

반대로,
Hermes의 memory, subagent, session search 같은 운영 감각이 더 중요하다면 기본 runtime이 더 자연스러울 수 있습니다.

## 출처 및 참고

- Hermes Agent 공식 문서: Codex App-Server Runtime (optional)  
  <https://hermes-agent.nousresearch.com/docs/user-guide/features/codex-app-server-runtime>

이 글은 위 공식 문서를 바탕으로,
4060미들스쿨에서 처음 읽는 분들도 따라올 수 있게 용어를 조금 풀고, 실무 감각 위주로 다시 정리한 글입니다.

## 마무리

AI 도구를 오래 쓰다 보면,
결국 질문은 "누가 더 똑똑하냐"보다 "어떤 작업대에서 일하게 할 거냐"로 옮겨갑니다.

Hermes의 Codex app-server runtime은 바로 그 질문에 대한 흥미로운 답처럼 보입니다.

Hermes라는 운영 틀은 그대로 두면서,
코드 작업이 필요한 순간에는 Codex의 손과 공구함을 빌리는 것.

이 감각이 맞는 사람에게는 꽤 시원한 선택지가 될 수 있습니다.

특히 OpenAI 쪽 작업이 많고,
Codex의 shell, patch, plugin 흐름을 좋아했다면,
이 기능은 그냥 "옵션 하나 추가"보다 더 크게 느껴질 수 있습니다.
