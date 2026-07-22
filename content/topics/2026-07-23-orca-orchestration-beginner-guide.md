---
title: "2026년 7월 23일(목) Orca 오케스트레이션은 AI를 많이 돌리는 기술이 아니라, 일을 잃어버리지 않는 기술이다"
description: "Orca 오케스트레이션을 처음 보는 사람도 terminal send와 task-dispatch의 차이, worker_done과 decision gate의 의미, reallygood83/orca 모드 팩의 쓰임새까지 한 흐름으로 이해할 수 있게 정리했습니다."
tags:
  - middle-school
  - orca
  - orchestration
  - ai-agent
  - cli
created: "2026-07-23"
modified: "2026-07-23"
publish: true
cssclasses:
  - field-note
---

# Orca 오케스트레이션은 AI를 많이 돌리는 기술이 아니라, 일을 잃어버리지 않는 기술이다

Orca를 처음 보면 보통 이런 생각부터 듭니다. "AI 에이전트를 여러 명 동시에 돌릴 수 있게 해주는 도구인가 보다." 틀린 말은 아니지만, 그 설명만으로는 핵심이 반쯤 비어 있습니다.

정작 중요한 것은 많이 돌리는 일이 아니라, **누가 무엇을 맡았고, 어디까지 끝났고, 어떤 결정은 아직 사람이 내려야 하는지 잃어버리지 않는 것**입니다. 오늘 글은 그 감각을 아주 초보자 기준으로 정리한 글입니다.

이 글은 Orca 공식 CLI 오케스트레이션 문서와 `reallygood83/orca` 저장소를 함께 참고해 정리했습니다. 글 하단에 참고 링크를 모두 남겨 둡니다.

## 먼저 결론

- `terminal send`는 옆 사람에게 툭 던지는 메모에 가깝고, 오케스트레이션은 담당자와 완료 기준이 붙은 업무 카드에 가깝습니다.
- Orca 오케스트레이션은 "여러 AI를 동시에 실행하는 기능"보다 "업무 소유권, 진행 상태, 완료 보고, 사람의 승인 지점"을 분명히 하는 기능으로 이해하는 편이 맞습니다.
- `reallygood83/orca`는 엔진 자체를 바꾸는 도구라기보다, 그 엔진을 내 방식대로 굴리기 위한 운영 모드 팩에 가깝습니다.

## 왜 한 명에게 다 시키면 나중에 더 헷갈릴까

예를 들어 결제 화면의 모바일 버그를 고친다고 해보겠습니다.

- 결제 버튼이 좁은 화면에서 밀려나는지 확인해야 합니다.
- 결제 API가 간헐적으로 실패하는 원인도 봐야 합니다.
- 수정 후 기존 테스트가 깨지지 않았는지도 확인해야 합니다.

이걸 AI 한 명에게 한 번에 다 시키면 처음엔 편해 보입니다.

> "결제 화면도 보고, API도 확인하고, 테스트도 챙겨 줘. 끝나면 알려 줘."

하지만 시간이 조금만 지나면 이런 질문이 생깁니다.

- 화면 조사는 끝났나, 아니면 아직 진행 중인가
- API 쪽은 막힌 건가, 단순히 오래 걸리는 건가
- 테스트는 실제로 돌린 건가, 아니면 "돌리면 될 것 같다" 수준인가
- 끝났다는 말 안에 변경 파일, 증거, 남은 위험까지 포함돼 있는가

이 지점에서 필요한 것은 더 똑똑한 한 명보다, **일을 나눠 맡기고 보고받는 방식**입니다. Orca 오케스트레이션은 바로 그 흐름을 터미널과 에이전트 기준으로 옮겨 놓은 것입니다.

## `terminal send`와 오케스트레이션은 무엇이 다를까

이 차이를 먼저 잡아두면 뒤가 훨씬 편합니다.

### `terminal send`

```bash
orca terminal send --terminal <terminalHandle> \
  --text "현재 변경 사항을 요약해 줘" \
  --enter --json
```

이건 복도에서 팀원에게 "이 파일 한 번만 봐 줄래?"라고 말하는 쪽에 가깝습니다. 빠르고 가볍지만, 업무 카드나 완료 보고 체계가 자동으로 생기지는 않습니다.

### 오케스트레이션

오케스트레이션은 조금 다릅니다.

- 해야 할 일이 카드처럼 먼저 만들어지고
- 누가 맡았는지가 기록되고
- 진행 중인지, 막혔는지, 끝났는지가 추적되고
- 중요한 결정 앞에서는 일부러 멈춰 설 수 있습니다

즉, **메신저보다 업무판**에 가깝습니다.

## Orca 오케스트레이션을 이루는 네 가지

처음에는 용어가 많아 보여도, 아래 네 가지만 잡으면 대부분 이해됩니다.

### 1. Task

Task는 해야 할 일 카드입니다. "결제 화면 모바일 조사", "API 실패 로그 확인", "회귀 테스트 점검" 같은 것이 여기에 들어갑니다.

상태는 대략 이렇게 움직입니다.

```text
pending → ready → dispatched → completed
 ├────────→ failed
 └────────→ blocked
```

- `pending`: 아직 앞선 조건이 안 끝남
- `ready`: 지금 맡길 수 있음
- `dispatched`: 작업자에게 배정됨
- `completed`: 완료 보고를 받음
- `failed`: 현재 시도는 실패
- `blocked`: 사람의 결정이나 외부 조건을 기다림

### 2. Dispatch

Dispatch는 "이 Task를 이번에는 이 작업자에게 맡겼다"는 기록입니다.

이 구분이 왜 필요하냐면, 같은 일을 다시 맡길 수 있기 때문입니다. 첫 번째 시도가 중간에 막혔다면 두 번째 작업자에게 다시 맡길 수 있습니다. 그래서 완료 보고에는 보통 `taskId`뿐 아니라 `dispatchId`도 같이 붙습니다.

### 3. Message

Message는 Orca 안에서 오가는 업무 메모입니다.

대표적으로 이런 종류가 있습니다.

- `status`: 일반 진행 상황
- `dispatch`: 배정 관련 알림
- `worker_done`: 작업 완료 보고
- `escalation`: 혼자 해결 못 하는 문제 상향
- `decision_gate`: 사람 결정이 필요한 상태
- `heartbeat`: 아직 살아 있고 작업 중이라는 신호

### 4. Decision gate

이 기능이 생각보다 중요합니다.

예를 들어 작업자가 이런 갈림길에 섰다고 해보겠습니다.

- 공통 버튼 컴포넌트까지 바꿀까
- 현재 페이지에만 국소 수정할까

이런 판단은 영향 범위가 크기 때문에 AI가 혼자 밀어붙이는 것보다, 잠깐 멈추고 사람에게 묻는 편이 낫습니다. 그 "일부러 멈추는 문"이 decision gate입니다.

## 처음 시작할 때는 이 흐름만 따라가면 된다

오케스트레이션을 처음 쓸 때는 거창하게 DAG를 짜기보다, 아래 한 바퀴만 제대로 돌려도 충분합니다.

### 1. 런타임과 터미널 확인

```bash
orca status --json
orca worktree ps --json
orca terminal list --json
orca orchestration inbox --limit 20 --json
```

여기서 먼저 확인할 것은 네 가지입니다.

1. Orca 런타임이 살아 있는가
2. 작업할 worktree가 있는가
3. 작업자 터미널 handle이 무엇인가
4. 기존에 남아 있는 Task나 읽지 않은 메시지가 있는가

### 2. Task 만들기

```bash
orca orchestration task-create \
  --task-title "Billing mobile audit" \
  --display-name "Billing audit worker" \
  --spec "결제 설정 화면의 모바일 레이아웃 버그를 조사하고, 수정 파일과 스크린샷을 보고하라." \
  --json
```

좋은 `spec`은 대체로 네 가지가 들어갑니다.

- 무엇을 확인할지
- 어디까지 할지
- 어떤 결과물을 남길지
- 완료를 무엇으로 판단할지

단순히 "한 번 봐 줘"보다 훨씬 낫습니다.

### 3. 작업자 준비

```bash
orca worktree create \
  --name billing-mobile-audit \
  --agent codex \
  --json
```

초보자에게는 이 감각이 중요합니다.

> 작업자를 새로 만든다는 것은, 사람을 하나 더 앉히는 게 아니라 그 사람에게 자기 책상을 하나 주는 일에 가깝다.

그래야 다른 작업자의 변경과 섞이지 않습니다.

### 4. 배정하고 기다리기

```bash
orca orchestration dispatch \
  --task <taskId> \
  --to <workerHandle> \
  --inject \
  --json
```

그리고 무작정 붙잡고 있지 말고, 필요한 사건만 기다립니다.

```bash
orca orchestration check \
  --wait \
  --types worker_done,escalation,decision_gate \
  --timeout-ms 900000 \
  --json
```

여기서 꼭 기억할 점이 있습니다.

> timeout은 곧바로 실패라는 뜻이 아닙니다.

오래 걸리는 작업은 아직 진행 중일 수 있습니다. 이때는 `task-list`와 해당 터미널 출력을 같이 봐야 합니다.

## 좋은 완료 보고는 "끝났습니다"로 끝나지 않는다

오케스트레이션에서 제일 아쉬운 순간은, 구조는 잘 써 놓고 마지막 보고가 흐릿할 때입니다.

완료 보고에는 최소한 아래 네 가지가 있으면 좋습니다.

1. 무엇을 했는지
2. 무엇을 발견했는지
3. 변경한 파일 또는 남긴 보고서 경로
4. 실행한 테스트와 결과

예를 들면 이런 식입니다.

```bash
orca orchestration send \
  --to <coordinatorHandle> \
  --type worker_done \
  --subject "Completed mobile audit" \
  --body "좁은 화면에서 결제 설정 페이지를 점검했고, Billing.tsx의 푸터 겹침을 수정했다." \
  --task-id <taskId> \
  --dispatch-id <dispatchId> \
  --files-modified "src/app/settings/Billing.tsx" \
  --report-path "artifacts/billing-mobile-audit.md" \
  --json
```

그리고 장시간 작업이면 `worker_done`만 기다리지 말고 `heartbeat`도 받는 편이 좋습니다. 조용하다고 끝난 것이 아니기 때문입니다.

## 언제 작업자를 멈추고 사람에게 물어보게 해야 할까

다음 같은 상황은 ask나 gate를 쓰는 편이 안전합니다.

- 공통 컴포넌트나 여러 파일에 영향을 주는 선택
- 되돌리기 어렵거나 비용이 큰 선택
- 보안, 배포, 데이터 삭제가 걸린 선택
- 요구사항이 두 방향으로 모두 읽히는 선택

반대로 로그 확인, 테스트 실행, 현재 파일 조사처럼 되돌릴 수 있는 작은 일은 작업자가 계속 진행해도 괜찮습니다.

이 구분이 생기면 AI가 더 똑똑해진다기보다, **사람이 어디서 끼어들어야 하는지가 분명해집니다.**

## 여러 작업을 동시에 돌릴 때 가장 많이 하는 실수

초보자가 가장 많이 하는 실수는 "동시에 돌리면 무조건 빨라진다"는 생각입니다.

그렇지 않습니다.

- 같은 파일을 두 작업자가 건드리면 충돌이 늘어납니다.
- API 계약이 확정되기 전에 구현을 시작하면 다시 고쳐야 합니다.
- 테스트보다 구현을 먼저 믿으면 완료 보고가 품질을 보장하지 못합니다.

그래서 기준은 단순합니다.

> 서로 영향을 주지 않는 일만 동시에 시작하고, 앞선 결과가 필요한 일은 그 결과를 받은 뒤 시작한다.

이 감각이 잡히면 오케스트레이션이 훨씬 덜 복잡해집니다.

## `reallygood83/orca`는 여기에 무엇을 더해줄까

여기서부터는 공식 Orca 엔진 위에 하나의 운영 레이어를 덧씌우는 이야기입니다.

`reallygood83/orca`는 오케스트레이션 엔진을 새로 만드는 저장소라기보다,

- 어떤 역할의 작업자를 쓸지
- 동시에 몇 명까지 돌릴지
- 결과를 어떤 FINAL 형식으로 모을지
- Quick Command를 어떻게 만들지

같은 **운영 모드 팩**을 만드는 쪽에 가깝습니다.

쉽게 말하면:

- Orca 공식 오케스트레이션: 주방의 주문 처리 시스템
- `reallygood83/orca`: 우리 주방이 어떤 역할 분담으로 일할지 적은 운영 매뉴얼

이렇게 이해하면 편합니다.

## Mode Studio를 볼 때 꼭 구분할 것

초보자가 가장 헷갈리는 부분 중 하나입니다.

웹 스튜디오에서 설정을 만들었다고 해서, 바로 작업자가 실행된 것은 아닙니다.

구분은 이렇습니다.

- 웹 스튜디오: 설정을 짜고 내려받는 화면
- 로컬 모드 팩: `$HOME/.orca/<mode>/` 아래에 저장된 운영 규칙
- Orca 런타임: 실제 worktree, 터미널, task 상태를 관리하는 실행 환경

즉, 스튜디오는 설계도에 가깝고, 실제 실행은 Orca 런타임이 맡습니다.

## `supervised`와 `handoff`는 섞지 않는 편이 좋다

이 둘은 이름보다 책임 구조가 다릅니다.

### supervised

- 조정자가 끝까지 본다
- `worker_done`을 기다린다
- 결과를 모아 FINAL을 만든다

### handoff

- 다른 담당자에게 넘기고 멈춘다
- 원래 조정자는 끝까지 추적하지 않는다

그래서 `handoff` 흐름인데도 끝까지 `dispatch --inject`와 `check --wait`를 같이 쓰면 책임 경계가 흐려집니다. 처음에는 `supervised`부터 익히는 편이 훨씬 안전합니다.

## 초보자 기준으로 가장 실용적인 운영 원칙

<ul class="note-list">
  <li>작업 내용보다 완료 조건을 먼저 쓴다. "조사해 줘"보다 "재현 단계, 변경 파일, 테스트 결과를 보고해 줘"가 훨씬 낫다.</li>
  <li>독립 작업만 병렬로 돌린다. 같은 파일을 만질 가능성이 크면 먼저 순서를 정한다.</li>
  <li>장시간 작업에는 heartbeat를 요구한다. 조용하다고 끝난 것으로 착각하지 않기 위해서다.</li>
  <li>중요한 선택은 gate나 ask로 멈춘다. 사람이 결정해야 할 경계를 따로 둔다.</li>
  <li>worker_done을 곧바로 출시 가능으로 해석하지 않는다. 변경 파일, 테스트, 남은 위험을 함께 본다.</li>
</ul>

## 처음 쓰는 사람에게 추천하는 시작 순서

너무 큰 팀 구성을 바로 만들기보다, 아래 순서가 가장 무난합니다.

1. 작업자 한 명에게 작은 버그 조사 하나를 맡겨 본다
2. `task-create → dispatch → worker_done` 한 바퀴를 직접 본다
3. 다음에는 조사와 테스트를 둘로 나눠 본다
4. 그 뒤에야 `review`나 `research` 역할을 붙인다
5. 모드 팩은 실제로 몇 번 돌려 본 뒤에 만든다

즉, 처음부터 "AI 팀장 시스템"을 완성하려 하기보다, **작은 업무 카드 한 장을 제대로 돌리는 것**이 먼저입니다.

## 다음에 바로 써볼 체크리스트

<ul class="note-list">
  <li>이번 요청이 단순 메모인지, 담당자와 완료 기준이 필요한 진짜 Task인지 먼저 구분한다.</li>
  <li>Task를 만들 때는 무엇, 범위, 결과물, 완료 조건을 한 번에 적는다.</li>
  <li>worker_done만 보지 말고 변경 파일, 테스트 결과, blocked 상태, 미해결 gate를 같이 확인한다.</li>
  <li>`reallygood83/orca`를 쓸 때는 엔진과 모드 팩을 구분하고, 생성된 `PLAYBOOK.md`와 `meta.json`을 직접 읽어 본다.</li>
</ul>

## 남겨둘 판단

Orca 오케스트레이션은 AI를 많이 붙이는 기술이라기보다, **일의 주인과 상태를 잃어버리지 않게 만드는 기술**에 가깝습니다. 그래서 초보자에게도 생각보다 빨리 도움이 됩니다. 일이 커질수록, 사실 필요한 것은 더 똑똑한 한 명보다 "누가 무엇을 맡았는지 보이는 구조"인 경우가 많기 때문입니다.

그리고 `reallygood83/orca`는 그 구조 위에 우리 팀만의 운영 습관을 덧입히는 도구로 보면 좋습니다. 엔진을 먼저 익히고, 그다음 모드 팩으로 내 방식에 맞게 다듬는 순서가 가장 부담이 적습니다.

## 출처 및 참고

<ul class="note-list">
  <li><a href="https://www.onorca.dev/docs/cli/orchestration" target="_blank" rel="noopener">Orca CLI Orchestration 공식 문서</a> (블로그 밖 · 새 창)</li>
  <li><a href="https://www.onorca.dev/docs/cli/overview" target="_blank" rel="noopener">Orca CLI Overview</a> (블로그 밖 · 새 창)</li>
  <li><a href="https://www.onorca.dev/docs/cli/reference" target="_blank" rel="noopener">Orca CLI Reference</a> (블로그 밖 · 새 창)</li>
  <li><a href="https://github.com/reallygood83/orca" target="_blank" rel="noopener">reallygood83/orca 저장소</a> (블로그 밖 · 새 창)</li>
  <li><a href="https://github.com/reallygood83/orca/blob/c501bd494c4232e9433306434b8f003db6cef4f8/README.md" target="_blank" rel="noopener">README.md</a> (블로그 밖 · 새 창)</li>
  <li><a href="https://github.com/reallygood83/orca/blob/c501bd494c4232e9433306434b8f003db6cef4f8/pack/SKILL.md" target="_blank" rel="noopener">pack/SKILL.md</a> (블로그 밖 · 새 창)</li>
  <li><a href="https://github.com/reallygood83/orca/blob/c501bd494c4232e9433306434b8f003db6cef4f8/generate-pack.sh" target="_blank" rel="noopener">generate-pack.sh</a> (블로그 밖 · 새 창)</li>
  <li><a href="https://github.com/reallygood83/orca/blob/c501bd494c4232e9433306434b8f003db6cef4f8/templates/mode-pack.schema.json" target="_blank" rel="noopener">mode-pack.schema.json</a> (블로그 밖 · 새 창)</li>
</ul>
