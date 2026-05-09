---
title: 2026년 5월 9일(토) AI를 내 환경에 붙여보는 여섯 가지 이야기
description: 오늘 중급반에서는 블로그, 윈도우 환경, 로컬 LLM, 옵시디언, 코덱스 앱 이야기를 통해 AI를 내 환경에 어떻게 붙여볼지 함께 살펴봅니다.
tags:
  - middle-school
  - ai-tools
  - openclaw
  - local-llm
created: "2026-05-09"
modified: "2026-05-09"
publish: true
cssclasses:
  - field-note
---

# 2026년 5월 9일(토) AI를 내 환경에 붙여보는 여섯 가지 이야기

AI 이야기는 이제 어디서나 들을 수 있습니다. 그런데 막상 내 컴퓨터와 내 일하는 방식 안으로 가져오려 하면 그때부터 조금 막막해집니다. 오늘은 “이 도구가 좋다더라”를 넘어서, **내 환경에서는 어디부터 붙여보면 좋을까**를 같이 생각해보려 합니다.

## 먼저 짚고 가면

- 오늘 나눌 내용은 새 도구를 많이 소개하는 데보다, 각자 자기 환경에 맞는 시작점을 찾는 데 더 가깝습니다.
- 같은 AI 도구라도 블로그에 붙이느냐, 윈도우 환경에 붙이느냐, 로컬 LLM으로 돌리느냐에 따라 느낌이 꽤 다릅니다.
- 많이 아는 것보다 중요한 건, 오늘 하나라도 “이건 내가 해볼 수 있겠다”는 감을 가져가는 일입니다.

## 1. 블로그 발행은 한 번에 시키기보다 순서를 나눠서 시키는 편이 낫습니다

코난쌤(한준구)이 저술한 오픈클로 관련 최신 저서인 **《이게 되네? 오픈클로 미친 활용법 50제》**(골든래빗)에서 좋은 아이디어를 얻었습니다.

실습 때 정말 중요한 부분이라, 아래 프롬프트는 요약하지 않고 원문 그대로 남겨둡니다.

### 초보자용 Quartz 블로그 자동화 프롬프트 세트

#### 1. Quartz 설치 요청 프롬프트

```text
나는 초보자야.
내 컴퓨터에 Quartz 블로그를 설치하고 싶어.

조건:
- macOS 기준으로 설명해줘
- Git과 Node.js가 설치되어 있는지 먼저 확인해줘
- 없으면 설치 방법부터 알려줘
- Quartz를 설치하는 명령어를 순서대로 알려줘
- 각 명령어가 무슨 역할인지 한 줄씩 설명해줘
- 설치가 끝나면 어느 폴더에 무엇이 생겨야 정상인지도 알려줘

가능하면 아래 흐름으로 설명해줘:
1) 사전 준비 확인
2) Quartz 설치
3) 설치 완료 후 폴더 상태 확인
```

#### 2. 설치 확인 프롬프트

```text
나는 Quartz 설치를 마친 초보자야.
설치가 제대로 되었는지 확인하고 싶어.

다음 항목을 순서대로 점검하게 도와줘:
1) Git 설치 확인
2) Node.js 설치 확인
3) npm 설치 확인
4) Quartz 폴더가 정상인지 확인
5) Quartz 빌드가 되는지 확인

각 단계마다
- 실행할 명령어
- 정상일 때 기대 결과
- 문제가 있을 때 어떻게 해석하면 되는지
를 아주 쉽게 설명해줘.
```

#### 3. GitHub 저장소 + GitHub Pages 연결 프롬프트

```text
나는 초보자야.
로컬에 설치한 Quartz 블로그를 GitHub Pages로 공개하고 싶어.

내 정보:
- GitHub 사용자명: goodlookingprokim
- 최종 블로그 주소 목표: https://goodlookingprokim.github.io

내가 하고 싶은 것:
1) GitHub 저장소 만들기
2) 로컬 Quartz 폴더와 GitHub 저장소 연결하기
3) GitHub Pages로 배포되게 설정하기
4) 최종적으로 https://goodlookingprokim.github.io 로 접속되게 만들기

조건:
- 초보자도 따라할 수 있게 순서대로 설명해줘
- 명령어와 GitHub 웹사이트에서 눌러야 할 것도 같이 구분해서 알려줘
- 자주 헷갈리는 부분은 “주의”라고 따로 표시해줘
```

#### 4. 배포 준비 상태 확인 프롬프트

```text
나는 Quartz 블로그를 GitHub Pages에 올리기 전에 준비 상태를 점검하고 싶어.

내 정보:
- GitHub 사용자명: goodlookingprokim
- 블로그 주소 목표: https://goodlookingprokim.github.io

다음 항목을 순서대로 점검할 수 있게 도와줘:
1) 현재 Quartz 폴더가 Git 저장소와 연결되어 있는지
2) origin 저장소 주소가 맞는지
3) 현재 브랜치가 무엇인지
4) Quartz 빌드가 정상 동작하는지
5) GitHub Pages 배포 준비가 끝났는지

각 단계마다
- 확인 명령어
- 정상 결과 예시
- 문제일 때 수정 방법
까지 함께 알려줘.
```

#### 5. LLM에게 블로그 글 초안 요청 프롬프트

```text
아래 주제로 Quartz 블로그에 올릴 글 초안을 써줘.

조건:
- 너무 AI처럼 쓰지 말고 사람처럼 자연스럽게 써줘
- 제목, 도입, 소제목 3개, 마무리 구조로 써줘
- 마크다운 형식으로 작성해줘
- Quartz에 바로 넣을 수 있게 frontmatter도 같이 작성해줘
- 첫 문단은 독자의 흥미를 끄는 강한 인트로로 시작해줘

frontmatter 예시는 이런 형태로 해줘:
---
title:
description:
tags:
created:
publish: true
---

주제: 내가 요즘 AI를 공부하고 정리하는 방법
```

#### 6. 새 글을 Quartz에 넣고 포스팅 올리는 프롬프트

```text
나는 초보자야.
LLM이 만들어준 마크다운 글을 Quartz 블로그에 넣고 GitHub Pages에 반영하고 싶어.

내 정보:
- GitHub 사용자명: goodlookingprokim
- 블로그 주소: https://goodlookingprokim.github.io

다음 흐름으로 아주 쉽게 설명해줘:
1) 마크다운 파일을 Quartz의 어디에 저장해야 하는지
2) npx quartz build 를 왜 실행하는지
3) git add / git commit / git push 를 왜 하는지
4) 어떤 순서로 명령어를 실행해야 하는지
5) 포스팅이 반영되기까지 어느 정도 기다리면 되는지

명령어와 설명을 같이 적어줘.
```

#### 7. 최종 블로그 주소 확인 프롬프트

```text
나는 GitHub Pages로 Quartz 블로그를 배포한 초보자야.
이제 실제 블로그 주소가 정상인지 확인하고 싶어.

내 정보:
- GitHub 사용자명: goodlookingprokim
- 블로그 주소: https://goodlookingprokim.github.io

다음 내용을 알려줘:
1) 실제 블로그 주소에 어떻게 접속하는지
2) 새 글 주소가 어떤 형태로 만들어지는지
3) 접속 후 무엇을 확인해야 하는지
4) 배포는 됐는데 주소가 안 열리면 무엇부터 점검해야 하는지

특히 아래 항목은 꼭 체크리스트로 정리해줘:
- 제목이 잘 보이는지
- 링크가 열리는지
- 마크다운 문법(**, #, 리스트)이 그대로 노출되지 않는지
- 모바일에서도 읽기 괜찮은지
```

좋은 프롬프트는 “블로그 만들어줘”가 아니라,
**“설치 → 확인 → 연결 → 작성 → 배포 → 검수”를 순서대로 시키는 프롬프트다.**

### 초보자용 추천 진행 순서

1. **Quartz 설치 프롬프트**
2. **설치 확인 프롬프트**
3. **GitHub Pages 연결 프롬프트**
4. **글 초안 생성 프롬프트**
5. **포스팅 업로드 프롬프트**
6. **최종 주소 확인 프롬프트**

### 마지막에 꼭 강조할 포인트

**포스팅은 push로 끝나는 게 아니라, 실제 주소 접속 확인까지 해야 끝난다.**

예:

- 블로그 홈: [https://goodlookingprokim.github.io](https://goodlookingprokim.github.io/)
- 새 글 주소 예시: https://goodlookingprokim.github.io/my-first-post

## 2. 윈도우에서는 WSL 없이도 OpenClaw를 붙여볼 수 있습니다

윈도우에서 AI 에이전트를 다루려 하면 많은 분들이 먼저 WSL을 떠올립니다. 그런데 WSL이 익숙하지 않은 분에게는 그 문턱도 생각보다 큽니다. 그래서 오히려 “내가 지금 쓰는 윈도우 환경에서 어디까지 바로 해볼 수 있나”가 더 현실적인 질문일 수 있습니다.

이번에 같이 볼 오픈소스는 바로 그 지점을 건드립니다. WSL을 따로 세팅하지 않고도 OpenClaw를 윈도우에 붙여보려는 시도입니다.

- 소개 페이지: [openclaw-windows-native](https://goodlookingprokim.github.io/openclaw-windows-native/)
- GitHub 저장소: [goodlookingprokim/openclaw-windows-native](https://github.com/goodlookingprokim/openclaw-windows-native)

특히 OMX(Oh My Codex)는 설치했지만 아직 무슨 대화를 시작할지 막막한 분이라면, 이런 식으로 자기 컴퓨터에 오픈소스를 내려받아 직접 만져보는 쪽이 훨씬 감이 빨리 올 수 있습니다.

## 3. LM Studio는 로컬 LLM을 부담 없이 맛보기에 좋습니다

로컬 LLM은 흥미롭지만, 처음부터 너무 무겁게 들어가면 금방 지칩니다. 그럴 때 LM Studio는 꽤 괜찮은 입구가 됩니다.

- 공식 사이트: [LM Studio](https://lmstudio.ai/)
- 참고 영상 요약: [LM Studio 소개 요약](https://lilys.ai/digest/9444232/10887872?s=1&noteVersionId=7402096&include_suggestion=true)

좋은 점은 분명합니다. 내 컴퓨터에서 돌아가니 프라이버시 면에서 마음이 조금 더 편하고, 매번 과금 걱정을 덜 수 있습니다. 반면 속도나 성능은 클라우드 AI보다 아쉬울 수 있습니다. 결국 중요한 것은 “어느 쪽이 더 좋다”보다, **내가 어떤 작업을 할 때 로컬이 어울리는가**를 가늠해보는 일입니다.

오늘 모임에서는 로컬 LLM을 거창한 기술 이야기로 풀기보다, “이 정도면 한 번 써볼 만하겠다”는 감각으로 소개해도 좋겠습니다.

## 4. 옵시디언과 Claudian은 정리 습관과 잘 붙습니다

옵시디언을 쓰는 분에게 AI는 자료를 더 많이 쌓게 만드는 도구라기보다, **이미 쌓인 자료를 더 잘 다루게 해주는 도구**가 될 수 있습니다.

Claudian 플러그인은 기존에 Claude 중심으로 쓰던 흐름에서 이제 Codex와 OpenCode까지 함께 볼 수 있게 된 점이 눈에 띕니다.

- GitHub 저장소: [YishenTu/claudian](https://github.com/YishenTu/claudian)

이건 “어느 모델이 최고냐”보다, 내가 평소 쓰던 노트 환경 안에서 AI를 얼마나 자연스럽게 불러올 수 있느냐의 문제에 더 가깝습니다. 이미 옵시디언을 쓰고 있는 분에게는 꽤 현실적인 주제가 될 수 있습니다.

## 5. Codex 앱은 업데이트보다 사용 맥락이 더 중요합니다

Codex 앱은 계속 바뀝니다. Plugins, Skills 같은 요소도 눈에 띕니다. 그런데 변화 목록을 길게 나열하는 것만으로는 크게 남는 게 없습니다.

오히려 오늘은 이런 질문이 더 나을 수 있습니다.

- 지금 업데이트가 내 작업 흐름에 실제로 도움이 되는가
- 단순히 새 기능이 생긴 것과, 내가 자주 쓰게 되는 것은 어떻게 다른가
- Plugins나 Skills를 붙였을 때 내가 덜 반복하게 되는 일은 무엇인가

결국 앱 업데이트도 “새로 나왔다”보다 “그래서 내가 어디에 써먹을 수 있나”가 중요합니다.

## 6. 흥미로운 기사들은 작은 시작거리로 좋습니다

오늘 초안에는 본 주제 외에도 흥미로운 기사들이 몇 가지 함께 들어 있습니다. 이런 자료는 메인 주제를 흐리지 않는 선에서, 각자 다음에 더 파볼 거리로 던져주면 좋겠습니다.

- 토스의 한글 처리 라이브러리 **es-hangul**
  - [요약 링크](https://lilys.ai/digest/9483964/10938043?s=1&noteVersionId=7456489&include_suggestion=true)
- Claude Code와 Codex CLI가 들어간 부팅형 LiveUSB **AICODE-OS**
  - [요약 링크](https://lilys.ai/digest/9483802/10937783?s=1&noteVersionId=7456224&include_suggestion=true)
- 안드로이드에서 Hermes와 Termux로 AI 에이전트 돌리기
  - [요약 링크](https://lilys.ai/digest/9466679/10941331?s=1&noteVersionId=7459870&include_suggestion=true)
- 애플워치나 모바일에서도 코덱스 흐름을 이어보는 **Agent Pulse**
  - [요약 링크](https://lilys.ai/digest/9412485/10847933?s=1&noteVersionId=7360972&include_suggestion=true)
- 맥에서 파일 경로 바로 복사하기
  - `Option + Command + C`
- OpenClaw에서 카카오톡 자동화를 붙이는 `openclaw-kakao` 스킬
  - [jkf87/openclaw-kakao](https://github.com/jkf87/openclaw-kakao)
  - macOS 카카오톡 메시지 자동화를 위해 `kmsg` CLI를 OpenClaw 스킬 형태로 묶어둔 자료입니다. 카톡 읽기, 보내기, 드라이런 테스트, MCP 연동 같은 흐름을 한 번에 살펴보기 좋습니다.

이런 자료는 한 번에 다 이해하려 하기보다, “아, 이런 방향도 있구나” 정도로 받아들이면 충분합니다. 오늘 다 소화하지 못해도 괜찮습니다.

## 오늘은 이런 질문으로 나눠봐도 좋겠습니다

<ul class="note-list">
  <li>나는 AI를 어디에 붙여보고 싶은가 — 블로그, 노트, 윈도우 환경, 로컬 LLM 중 어디가 가장 당기는가</li>
  <li>새로운 도구를 배울 때 나는 설치가 막막한 편인지, 활용이 막막한 편인지</li>
  <li>오늘 들은 것 중 이번 주 안에 가장 작게 시도해볼 수 있는 것은 무엇인지</li>
</ul>

## 마지막으로 남는 생각

오늘 나눔의 핵심은 “도구를 많이 아는 사람”이 되는 데 있지 않습니다. **내가 지금 쓰는 환경 안에 AI를 한 칸만 더 자연스럽게 들여오는 것**, 그게 더 중요합니다. 오늘 모임이 각자에게 맞는 시작점 하나를 찾는 시간이 되면 좋겠습니다.
