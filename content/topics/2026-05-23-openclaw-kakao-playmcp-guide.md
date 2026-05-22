---
title: "2026년 5월 23일(토) OpenClaw에 Kakao PlayMCP 붙이고 실제로 써보는 방법"
description: "OpenClaw에 Kakao PlayMCP를 연결해 학교 급식 조회, 학교 시간표 조회, 카카오톡 메모 보내기까지 실제로 써보는 흐름을 처음부터 차분히 정리한 실전 가이드입니다."
tags:
  - middle-school
  - openclaw
  - playmcp
  - kakao
  - mcp
created: "2026-05-23"
modified: "2026-05-23"
publish: true
cssclasses:
  - field-note
---

# 2026년 5월 23일(토) OpenClaw에 Kakao PlayMCP 붙이고 실제로 써보는 방법

Claude와 Codex 쪽 이야기를 따라오다 보면, 어느 순간 마음 한쪽에 조금 더 묵직한 질문이 남습니다.
"그래서 이걸 내 쪽 흐름 안으로 끌어와 붙이려면 어떻게 해야 하지?"

앞 글에서는 Codex에서 Kakao PlayMCP를 붙이는 흐름을 먼저 정리했습니다. 그런데 거기서 한 걸음 더 가면 자연스럽게 이런 질문이 남습니다.

<strong>"그럼 OpenClaw에서는 이걸 어떻게 붙이고, 실제로 뭘 해볼 수 있나?"</strong>

이번 글은 바로 그 질문에서 출발합니다.

단순히 연결만 되는 수준이 아니라,

- PlayMCP에서 oneTimeToken을 준비하고
- `mcporter`로 `mcp-gateway`를 붙이고
- OpenClaw 쪽에 MCP 브리지를 등록한 뒤
- 실제로 급식 조회, 시간표 조회, 카카오톡 메모 보내기까지

한 번에 따라가되 너무 숨차지 않게, 한 단씩 짚어가며 정리해보겠습니다.

## 먼저 아주 쉽게 말하면

이번 연결에서 핵심은 이것 하나입니다.

> PlayMCP를 OpenClaw에 바로 꽂는 게 아니라, `mcporter`가 중간 다리 역할을 하게 만든다.

이 한 줄만 먼저 이해해도 훨씬 덜 헷갈립니다.

## 1. 이 글로 어디까지 할 수 있나

이번 글에서 다루는 범위는 아래까지입니다.

1. PlayMCP에서 oneTimeToken 준비
2. 공식 연결 가이드 확인
3. `mcporter` 설치
4. `mcp-gateway` 등록
5. OTT를 access token / refresh token으로 교환
6. `~/.mcporter/credentials.json` 저장
7. OpenClaw에 PlayMCP 브리지 등록
8. 재시작 후 도구 확인
9. 실제로 PlayMCP 도구 호출

즉, "설정이 들어갔다"가 아니라 <strong>OpenClaw 안에서 실제로 쓸 수 있는 상태까지</strong> 가는 흐름입니다.

## 2. 구조를 먼저 이해하자

처음에는 단계가 길어 보여도, 실제 구조는 두 층입니다.

### PlayMCP 쪽
- PlayMCP 웹사이트에 로그인합니다.
- 도구함에 쓸 도구를 담습니다.
- OpenClaw와 연결하기 위한 oneTimeToken을 발급받습니다.

### OpenClaw 쪽
- `mcporter`가 PlayMCP의 `mcp-gateway`를 읽습니다.
- OTT를 실제 토큰으로 교환합니다.
- 인증 정보를 `~/.mcporter/credentials.json`에 저장합니다.
- OpenClaw는 `mcporter serve`를 통해 그 도구들을 다시 읽습니다.

흐름으로 쓰면 이렇습니다.

```text
PlayMCP 도구함 / 카카오 인증
→ mcp-gateway
→ mcporter
→ OpenClaw
```

즉, OpenClaw가 직접 PlayMCP 내부 구조를 모두 처리하는 게 아니라,
<strong>`mcporter`가 중간에서 인증과 브리지 역할을 맡는 구조</strong>입니다.

## 3. 준비물

아래가 준비되어 있어야 합니다.

- PlayMCP 로그인 가능 상태
- PlayMCP 도구함 접근 가능 상태
- OpenClaw가 설치된 로컬 환경
- 셸에서 `npm` 실행 가능 상태
- PlayMCP에서 발급한 oneTimeToken

여기서 제일 주의할 점은 oneTimeToken입니다.

이건 이름 그대로 <strong>한 번 쓰고 끝나는 토큰</strong>에 가깝습니다.
이미 사용했거나 시간이 지나 만료되면, 새로 다시 받아야 합니다.

## 4. 공식 가이드는 어디를 보면 되나

이번 작업에서 참고한 공식 진입점은 아래입니다.

- `https://playmcp.kakao.com/llms.txt`
- 그 안의 외부 에이전트용 MCP-GATEWAY 연결 가이드
- 실제 문서: `https://playmcp.kakao.com/llms/mcp-connection-guide.md`

여기서 안내하는 큰 흐름은 아래와 비슷합니다.

1. OTT 확인
2. `mcporter` 설치
3. `mcp-gateway` 서버 정의 추가
4. OTT를 access token / refresh token으로 교환
5. `credentials.json` 저장
6. `mcporter list mcp-gateway`로 확인

우리는 이 흐름을 OpenClaw 환경에 맞게 그대로 따라간 셈입니다.

## 5. 1단계 — `mcporter` 설치

먼저 `mcporter`가 이미 있는지 확인합니다.

```bash
command -v mcporter
```

없다면 설치합니다.

```bash
npm install -g mcporter
```

설치 확인은 아래처럼 해보면 됩니다.

```bash
mcporter --help
mcporter config --help
```

이 단계가 필요한 이유는 단순합니다.
PlayMCP의 `mcp-gateway`를 OpenClaw가 바로 붙잡기 전에,
<strong>MCP 연결과 인증을 중간에서 맡아줄 도구</strong>가 필요하기 때문입니다.

## 6. 2단계 — `mcp-gateway` 등록

다음으로 `mcporter`에 PlayMCP 쪽 서버를 등록합니다.

```bash
mcporter config add mcp-gateway https://playmcp.kakao.com/mcp --auth oauth --scope home
```

이 명령이 하는 일은 아래와 같습니다.

- 이름이 `mcp-gateway`인 원격 MCP 서버를 등록한다
- 인증 방식은 `oauth`로 잡는다
- 관련 설정을 `~/.mcporter/` 아래에 저장한다

정상 등록되면 `~/.mcporter/mcporter.json` 쪽에 서버 정보가 생깁니다.

## 7. 3단계 — OTT를 실제 토큰으로 바꾸기

이 단계가 실질적인 핵심입니다.
PlayMCP에서 받은 oneTimeToken을 access token과 refresh token으로 교환합니다.

기본 요청 형식은 아래와 같습니다.

```bash
curl -X POST 'https://playmcp.kakao.com/api/v1/auths/otts:exchange' \
 -H 'accept: */*' \
 -H 'Content-Type: application/json' \
 -d '{"tokenValue":"<ONE_TIME_TOKEN>"}'
```

성공하면 보통 아래 정보가 응답에 들어옵니다.

- `accessToken.tokenValue`
- `accessToken.expiresAt`
- `refreshToken.tokenValue`
- `refreshToken.expiresAt`

### 여기서 자주 막히는 경우
보통 둘 중 하나입니다.

- OTT가 이미 사용됨
- OTT가 만료됨

이럴 때는 괜히 같은 토큰으로 계속 다시 시도하지 말고,
<strong>PlayMCP에서 새 oneTimeToken을 다시 발급</strong>받는 게 빠릅니다.

## 8. 4단계 — `credentials.json` 저장

다음으로 교환한 토큰을 `~/.mcporter/credentials.json`에 저장해야 합니다.

공식 가이드 기준으로 엔트리 키는 이런 형식입니다.

```text
mcp-gateway|{hash}
```

이때 `{hash}`는 아래 문자열을 sha256으로 계산한 뒤 앞 16자리만 씁니다.

```bash
printf '{"name":"mcp-gateway","url":"https://playmcp.kakao.com/mcp","command":null}' | shasum -a 256 | cut -c1-16
```

실제로 연결했을 때는 아래 키가 잡혔습니다.

```text
mcp-gateway|92ef5a9fd655a681
```

예시는 대략 이렇게 생깁니다.

```json
{
  "version": 1,
  "entries": {
    "mcp-gateway|92ef5a9fd655a681": {
      "serverName": "mcp-gateway",
      "serverUrl": "https://playmcp.kakao.com/mcp",
      "tokens": {
        "access_token": "...",
        "token_type": "Bearer",
        "refresh_token": "..."
      },
      "clientInfo": {
        "client_id": "HElMUWdVoroTsrXxezeTSemg8gXzzCKWARb5MJux8gY"
      },
      "updatedAt": "2026-05-22T10:11:31Z"
    }
  }
}
```

여기서 중요한 건 딱 두 가지입니다.

- 실제 토큰 값은 문서나 채팅에 그대로 남기지 않기
- 같은 키가 이미 있으면 새 값으로 갱신하기

## 9. 5단계 — OpenClaw에 PlayMCP 브리지 등록

이제 OpenClaw 쪽 설정이 필요합니다.

여기서 실제로 한 번 걸릴 수 있는 부분이 있습니다.
우리가 확인했을 때는 OpenClaw의 `mcp.servers`가 protected config path여서,
`gateway config.patch`로 바로 추가가 안 되는 경우가 있었습니다.

그래서 이 경우에는 설정 파일에 직접 MCP 서버 블록을 넣는 쪽이 더 빨랐습니다.

대상 파일은 아래입니다.

```text
~/.openclaw/openclaw.json
```

핵심 설정은 아래처럼 들어갑니다.

```json
"mcp": {
  "servers": {
    "playmcp-gateway": {
      "command": "mcporter",
      "args": [
        "serve",
        "--servers",
        "mcp-gateway",
        "--stdio"
      ]
    }
  }
}
```

이미 다른 MCP 서버가 있다면, 그 안에 `playmcp-gateway` 블록을 추가하는 식으로 보면 됩니다.

### 이 설정이 뜻하는 것

- OpenClaw는 `playmcp-gateway`라는 MCP 서버를 보게 된다
- 실제 실행은 `mcporter serve --servers mcp-gateway --stdio`
- 즉, `mcporter`가 PlayMCP 쪽 도구를 OpenClaw가 읽을 수 있는 형태로 다시 내보낸다

이 구조가 이해되면 전체 흐름이 깔끔해집니다.

## 10. 6단계 — OpenClaw 재시작

설정을 바꿨으면 OpenClaw를 다시 읽혀야 합니다.

보통은 `gateway restart` 흐름으로 반영합니다.

재시작 뒤에는 두 가지를 확인하면 됩니다.

### 1) 설정이 실제로 들어갔는가
예를 들면 아래를 봅니다.

- `mcp.servers.playmcp-gateway`가 있는가
- `command`가 `mcporter`인가
- `args`에 `serve --servers mcp-gateway --stdio`가 들어갔는가

### 2) `mcporter`가 도구를 읽는가

```bash
mcporter list mcp-gateway --schema
```

여기서 처음에 당황하기 쉬운 장면이 하나 있습니다.

```text
mcp-gateway
Tools: <none>
0 tools
```

이렇게 나와도 꼭 실패는 아닙니다.
실제로도 처음엔 0 tools였다가, 잠시 뒤 다시 보니 도구 목록이 뜨기 시작한 경우가 있었습니다.

즉,
<strong>처음 0 tools가 떠도 바로 실패라고 단정하지 말고 한 번 더 확인</strong>하는 게 좋습니다.

## 11. 7단계 — 도구가 실제로 보이는지 확인

재확인 시점에는 아래 같은 도구들이 보일 수 있습니다.

- `KakaotalkChat-MemoChat`
- `SchoolMeal-get_school_meal`
- `ScheduleInfo-get_timetable`
- `UsStockInfo-get_historical_stock_prices`
- `UsStockInfo-get_stock_info`

이 상태가 되면 이제 OpenClaw에서 PlayMCP를 실제로 써볼 준비가 된 것입니다.

## 12. 실제로 해볼 수 있는 첫 테스트

처음 테스트는 조회형 하나, 전송형 하나 정도가 좋습니다.

### 예시 1. 학교 급식 조회
동명이교가 있을 수 있으니 처음에는 학교 식별이 필요할 수 있습니다.

```bash
mcporter call mcp-gateway.SchoolMeal-get_school_meal schoolName='영신여자고등학교' mealDate='20260522'
```

이후 `educationCode`, `schoolCode`를 확인한 뒤 다시 조회합니다.

```bash
mcporter call mcp-gateway.SchoolMeal-get_school_meal \
 schoolName='영신여자고등학교' \
 educationCode='B10' \
 schoolCode='7010215' \
 mealDate='20260522'
```

이런 식으로 급식 메뉴를 뽑아볼 수 있습니다.

### 예시 2. 학교 시간표 조회
시간표는 보통 입력값이 조금 더 필요합니다.

```bash
mcporter call mcp-gateway.ScheduleInfo-get_timetable \
 schoolName='영신여자고등학교' \
 grade='2' \
 className='9' \
 educationCode='B10' \
 schoolCode='7010215' \
 schoolType='고등학교' \
 date='20260522'
```

### 예시 3. 카카오톡 메모 보내기
조회한 내용을 바로 메모로 보내보는 흐름도 가능합니다.

```bash
mcporter call mcp-gateway.KakaotalkChat-MemoChat \
 message='보낼 메시지 내용'
```

이렇게 보면 PlayMCP는 단순 조회용이 아니라,
<strong>조회한 결과를 다시 카카오톡으로 넘기는 데까지 이어지는 도구</strong>입니다.

## 13. OpenClaw에게는 어떻게 말하면 되나

매번 셸 명령을 치지 않아도 됩니다.
실제로는 OpenClaw에게 이렇게 자연스럽게 말해도 됩니다.

- "PlayMCP로 영신여고 오늘 급식 조회해줘"
- "PlayMCP로 2학년 9반 시간표 확인해줘"
- "조회한 내용 카카오톡 메모로 보내줘"
- "PlayMCP 도구 써서 미국 주식 AAPL 최근 가격 알려줘"

핵심은 정해진 주문 문장이 있는 게 아니라,
<strong>PlayMCP로 해달라는 의도만 분명하면 자연어로 말해도 충분하다</strong>는 점입니다.

## 14. 자주 막히는 지점

### `mcporter`가 없음
```bash
npm install -g mcporter
```

### OTT 교환 실패
- 이미 사용됨
- 만료됨

이 경우 새 oneTimeToken을 다시 받는 게 맞습니다.

### `config.patch`로 MCP 서버 추가가 안 됨
`mcp.servers.*`가 protected path일 수 있습니다.
이때는 `~/.openclaw/openclaw.json` 직접 수정 후 재시작이 더 빠를 수 있습니다.

### `mcporter list mcp-gateway`가 0 tools로 나옴
- PlayMCP 도구함 반영 지연일 수 있음
- 도구함에 실제 사용 가능한 툴이 아직 없을 수 있음

이럴 때는 잠시 뒤 다시 조회해보는 편이 좋습니다.

### 학교가 여러 개 나옴
동명이교일 가능성이 큽니다.
이때는 `educationCode`, `schoolCode`, 필요하면 `schoolType`까지 넣어 좁히면 됩니다.

## 15. 처음 세팅할 때 추천 순서

처음에는 아래 순서가 가장 덜 꼬입니다.

1. PlayMCP에서 도구함과 OTT 준비
2. `mcporter` 설치
3. `mcporter config add` 실행
4. OTT 교환 후 credentials 저장
5. OpenClaw에 `playmcp-gateway` 추가
6. 재시작
7. `mcporter list mcp-gateway --schema`로 툴 확인
8. 조회형 툴 하나 테스트
9. 전송형 툴 하나 테스트

즉,

```text
연결 확인 → 조회 확인 → 전송 확인
```

이 순서로 가는 게 가장 안정적입니다.

## 마무리

이번 연결 작업에서 제일 중요한 포인트는 세 가지였습니다.

1. PlayMCP 공식 가이드는 `mcporter` 중심으로 따라가면 된다
2. OpenClaw에서는 `mcporter serve`를 MCP 브리지로 등록하면 된다
3. 처음 0 tools가 떠도 바로 실패로 단정하지 말고 다시 확인해야 한다

그리고 실제 활용 단계에서는

- 학교 급식 조회
- 학교 시간표 조회
- 카카오톡 메모 보내기

까지 한 흐름으로 자연스럽게 이어질 수 있습니다.

이쯤 되면 PlayMCP는 OpenClaw 안에서 꽤 분명한 역할을 합니다.
<strong>외부 도구 묶음을 생활형 작업으로 끌어오는 연결 레이어</strong>처럼 쓸 수 있다는 뜻입니다.

다음 글에서는 이어서,
<strong>같은 Kakao PlayMCP를 Claude 쪽에서는 어떻게 연결하고 설명하면 좋은지</strong>까지 정리해보면 흐름이 거의 완성될 것 같습니다.
