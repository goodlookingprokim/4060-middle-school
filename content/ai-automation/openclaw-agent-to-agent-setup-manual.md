---
title: OpenClaw에서 새 에이전트를 붙이고 대화 테스트까지 끝내는 실전 메뉴얼
description: totobot을 main 대화에 연결하면서 막혔던 지점과 실제로 통과한 설정, 테스트 순서를 한 번에 정리한 실전 기록
tags:
  - openclaw
  - agents
  - telegram
  - workflow
  - automation
publish: true
---

# OpenClaw에서 새 에이전트를 붙이고 대화 테스트까지 끝내는 실전 메뉴얼

이번에 `main` 대화에 `totobot`을 붙이면서, “설정은 얼추 맞는 것 같은데 왜 실제 대화가 안 되지?” 하는 지점을 끝까지 밟아봤습니다.

결론부터 말하면, **에이전트 등록만으로는 부족했고 세션 가시성 + agent-to-agent 권한 + 맞는 테스트 순서**가 같이 필요했습니다.

이 글은 그 과정을 다음번에 바로 재사용할 수 있게 남겨두는 실전 정리입니다.

## 먼저 결론

새 agent를 main과 연결하려면 아래 세 가지를 먼저 확인하면 됩니다.

- `tools.sessions.visibility = "all"`
- `tools.agentToAgent.enabled = true`
- `tools.agentToAgent.allow = ["main", "새agent"]`

핵심은 **`visibility = "all"`만으로는 안 된다**는 점입니다.  
교차 agent 메시징 자체는 `tools.agentToAgent.enabled`가 따로 열려 있어야 했습니다.

## 실제로 먹힌 설정

`~/.openclaw/openclaw.json` 기준으로, 이번에 최종적으로 통과한 핵심 블록은 아래였습니다.

```json5
{
  tools: {
    sessions: {
      visibility: "all",
    },
    agentToAgent: {
      enabled: true,
      allow: ["main", "totobot"],
    },
  },
}
```

이 상태에서 `main ↔ totobot` 간 메시지 왕복이 정상 동작했습니다.

## 가장 크게 막혔던 지점

### 1) `gateway config.patch`로는 `tools.agentToAgent.*`를 못 바꿨다

가장 먼저 걸린 건 이 오류였습니다.

- `gateway config.patch cannot change protected config paths: tools.agentToAgent.allow, tools.agentToAgent.enabled`

즉, 아래 두 경로는 보호된 설정이어서 런타임 패치로는 수정할 수 없었습니다.

- `tools.agentToAgent.enabled`
- `tools.agentToAgent.allow`

그래서 다음부터는 이 구간에서 시간을 쓰지 말고, 바로 `~/.openclaw/openclaw.json`을 직접 수정하는 쪽이 빠릅니다.

## 두 번째 함정: 세션이 보여도 메시지는 안 갈 수 있다

이번에 `tools.sessions.visibility = "all"`은 이미 반영돼 있었는데도, 실제 `sessions_send`는 막혔습니다.

오류는 딱 이랬습니다.

- `Agent-to-agent messaging is disabled. Set tools.agentToAgent.enabled=true to allow cross-agent sends.`

이게 의미하는 바는 단순합니다.

- `tools.sessions.visibility`는 **보이는 범위**를 여는 설정
- `tools.agentToAgent.enabled`는 **실제로 말 걸 수 있게 하는 설정**

둘은 비슷해 보여도 역할이 다릅니다.

## 테스트는 이렇게 하는 게 제일 빨랐다

처음엔 지속 세션으로 바로 가보려 했는데, Telegram direct 문맥에서는 `sessions_spawn(mode:"session")`이 아래처럼 막혔습니다.

- `sessions_spawn(mode="session") requires thread=true`

이 경로는 지금 같은 검증용 흐름엔 오히려 돌아가는 길이었습니다.

가장 빨랐던 순서는 이거였습니다.

1. `agents_list`로 대상 agent id 확인
2. `sessions_spawn(mode:"run")`으로 짧은 고정 응답 테스트
3. 생성된 세션 키에 `sessions_send`로 실제 대화 테스트

예를 들면:

- 1차 고정 응답: `TEST_OK totobot`
- 2차 교차 send 확인: `A2A_SEND_OK`
- 3차 자연어 대화: 한국어 자기소개/인사 응답 확인

이렇게 가면 “설정이 맞는지”, “교차 send가 되는지”, “실제 대화까지 되는지”를 빠르게 나눠서 검증할 수 있습니다.

## 이번에 통과한 성공 기준

이번 연결에서 실제로 확인한 성공 상태는 아래였습니다.

- `tools.sessions.visibility = "all"` 반영 확인
- `tools.agentToAgent.enabled = true` 반영 확인
- `tools.agentToAgent.allow = ["main", "totobot"]` 반영 확인
- `main → totobot` `sessions_send` 성공
- 실제 한국어 대화형 메시지 왕복 성공

여기까지 통과하면 설정만 맞춘 상태가 아니라, **실사용 가능한 연결**로 봐도 무리가 없었습니다.

## 독립 agent, 서브에이전트, ACP는 구분해서 쓰는 게 좋다

이번에 다시 정리된 기준도 있습니다.

### 독립 agent

반복해서 불러야 하는 역할형 업무에 적합합니다.

예:
- 일정/할 일 정리
- 리서치 전담
- 문서 초안 전담
- 콘텐츠 초안 전담

`totobot`처럼 계속 말을 걸 상대라면 이쪽이 맞습니다.

### 서브에이전트 (`sessions_spawn`)

병렬로 돌릴 일회성 작업에 잘 맞습니다.

예:
- 요약 여러 개 동시 생성
- 비교 정리 여러 갈래 병렬 실행
- 짧은 실험성 태스크 fan-out

### ACP

복잡한 코딩, 외부 코딩 도구 활용, 긴 실행이 필요한 쪽에 더 맞습니다.

즉,
- 반복 역할 = 독립 agent
- 병렬/일회성 = `sessions_spawn`
- 외부 코딩 런타임 = ACP

이렇게 나누는 게 가장 덜 헷갈렸습니다.

## 구버전 자료를 볼 때 주의할 점

첨부 자료나 예전 문서에는 `allowAgents` 같은 표현이 보일 수 있습니다.  
그런데 현재 버전에서는 실제로 바로 먹히는 설정명이 다를 수 있습니다.

이번 환경에서 실제로 맞았던 기준은 아래였습니다.

- `tools.sessions.visibility`
- `tools.agentToAgent.enabled`
- `tools.agentToAgent.allow`

그래서 예전 글이나 책 내용을 볼 때는 **개념만 참고하고, 실제 적용은 현재 OpenClaw 설정 체계로 다시 매핑해서 확인하는 것**이 안전합니다.

## 다음에 바로 쓰는 10줄 체크리스트

1. 새 agent id 정하기
2. 설정에 agent 등록 확인
3. `~/.openclaw/openclaw.json` 열기
4. `tools.sessions.visibility = "all"` 확인
5. `tools.agentToAgent.enabled = true` 추가
6. `tools.agentToAgent.allow`에 `main`과 새 agent 추가
7. Gateway 반영/재시작
8. `openclaw config get tools.agentToAgent`로 반영 확인
9. `sessions_spawn(mode:"run")`으로 고정 응답 테스트
10. `sessions_send`로 실제 대화 테스트

## 마무리

이번에 정리한 흐름의 포인트는 거창하지 않습니다.

- 설정을 정확히 넣고
- 반영 여부를 실제 값으로 확인하고
- 짧은 테스트부터 단계적으로 검증하는 것

이 순서만 지키면, 새 agent를 붙이는 작업은 생각보다 금방 끝납니다.

다음에는 이 메뉴얼을 바탕으로 역할형 agent를 더 늘리거나, 병렬 작업 흐름까지 자연스럽게 확장해볼 생각입니다.
