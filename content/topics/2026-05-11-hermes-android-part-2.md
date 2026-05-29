---
title: "2026년 5월 11일(월) Android 폰에서 Hermes Agent와 OpenClaw 팀 운영 연결하기 2편"
description: "Hermes를 Discord에 붙인 뒤, OpenClaw를 팀장 봇으로 추가해 팀장-팀원 구조로 협업시키는 방법과 2026-05-30 기준 복구 흐름을 초보자용으로 다시 정리한 운영편입니다."
tags:
  - middle-school
  - hermes
  - android
  - discord
  - openclaw
created: "2026-05-11"
modified: "2026-05-30"
publish: true
cssclasses:
  - field-note
---

# Android 폰에서 Hermes Agent와 OpenClaw 팀 운영 연결하기 2편

초보자를 위한 실습형 매뉴얼  
작성 기준: 2026-05-30 실습 기록, Android 12, Termux, macOS, scrcpy, Hermes Agent, OpenClaw

> 이 글은 2부작의 2편입니다. Hermes 설치와 Telegram·Discord 기본 연결은 [1편](./2026-05-11-hermes-android-part-1)에서 먼저 보시는 편이 좋습니다. 이번 글에서는 OpenClaw를 Discord 운영 팀장 봇으로 붙이고, Hermes를 팀원처럼 움직이게 만드는 구조와 복구 흐름을 다룹니다.

1편에서 Hermes가 Telegram과 Discord에서 실제로 답하는 상태까지 만들었다면,
이제부터는 혼자 답하는 봇을 함께 일하는 팀원으로 바꾸는 단계입니다.

## 먼저 큰 그림부터

이번 편의 구조는 이렇게 이해하면 됩니다.

```text
사람 운영자
 -> Discord 운영 채널에 요청

OpenClaw
 -> 요청을 먼저 판단하는 팀장
 -> 필요하면 @Hermes로 하위 작업 지시

Hermes
 -> Android Termux에서 계속 실행되는 팀원
 -> OpenClaw나 사람 운영자가 부르면 짧고 실행 가능한 답변
```

핵심은 봇 두 개를 아무렇게나 붙이는 것이 아닙니다.
누가 먼저 판단하고, 누가 실행 담당인지 역할을 나눠야 대화가 일처럼 정리됩니다.

## 이번 편에서 먼저 기억할 핵심

```text
1. OpenClaw는 MacBook에서 돌리고, Hermes는 Android Termux에서 돌리는 구성이 안정적이었다.
2. Hermes 쪽은 단독 운영 모드와 OpenClaw 팀장 모드를 구분해서 봐야 한다.
3. OpenClaw 팀장 모드에서는 Hermes의 DISCORD_FREE_RESPONSE_CHANNELS를 비워 둔다.
4. 봇끼리 무한 반복을 막으려면 bot-to-bot 대화를 무조건 열지 말고 mentions 조건으로 제한한다.
5. 상태 명령보다 실제 Discord 화면에서 새 메시지와 새 답장을 확인하는 것이 더 중요하다.
6. OpenClaw message read 오류 하나만 보고 토큰을 다시 재발급할 필요는 없다.
7. OpenClaw dashboard는 주소만 열지 말고 openclaw dashboard 명령으로 연다.
8. OpenClaw doctor/security audit 경고는 공유 채널 운영 경고와 실제 실행 위험을 나눠서 읽어야 한다.
```

## 1. 왜 OpenClaw는 MacBook에서 실행했나

처음에는 Android Termux 안에 OpenClaw까지 설치하려고 했습니다.
하지만 Android/Termux 환경에서는 Node native build가 자주 막힙니다.

이번 실습에서 특히 문제가 되었던 건 이런 쪽이었습니다.

```text
tree-sitter-bash
node-gyp
Android/Termux native build
Node.js 버전과 native package 조합
```

그래서 구조를 이렇게 정리했습니다.

```text
Hermes = Android 폰에서 계속 켜지는 현장 실행 봇
OpenClaw = MacBook에서 운영 판단과 지시를 담당하는 팀장 봇
Discord = 두 봇이 만나는 공용 작업 공간
```

쉽게 말하면,
현장 직원은 Android 폰에 두고,
팀장은 책상 넓은 MacBook에 앉힌 셈입니다.

## 2. OpenClaw 주요 경로

OpenClaw는 기본 설치 기준으로 아래 경로를 씁니다.

```bash
~/.openclaw
~/.openclaw/openclaw.json
~/.openclaw/runtime
openclaw
~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

아주 쉽게 바꾸면:

- `~/.openclaw` = OpenClaw의 집
- `openclaw.json` = 행동 규칙표
- `runtime` = 실행 도구 상자
- `LaunchAgents plist` = Mac이 자동으로 다시 켜 주는 자동 시동 장치

## 3. OpenClaw Discord 연결 상태 확인

OpenClaw가 Discord에 실제로 붙어 있는지 먼저 봅니다.

```bash
openclaw channels status --deep
```

성공 기준:

```text
Discord channel enabled
Discord account configured
Gateway reachable
Gateway running
Gateway connected
Bot user 표시
```

중요한 건,
이 명령이 괜찮아 보여도 실제 Discord 화면에서 온라인과 새 답장을 같이 봐야 한다는 점입니다.

이번 실습에서 계속 확인된 교훈도 그거였습니다.

> 상태 명령만 믿지 말고 실제 화면에서 새 메시지와 새 답장을 보자.

## 4. OpenClaw 대시보드는 어떻게 열어야 하나

이 부분은 처음 보는 분들이 자주 헷갈립니다.

대시보드는 그냥 로컬 주소만 브라우저에 치면 안 됩니다.

반드시 아래 명령으로 엽니다.

```bash
openclaw dashboard
```

이 명령이 하는 일:

```text
1. 현재 gateway 주소를 확인한다.
2. gateway token이 포함된 인증 URL을 만든다.
3. 브라우저에 그 URL을 연다.
4. 같은 URL을 클립보드에도 복사한다.
```

토큰 포함 URL만 만들고 브라우저는 열지 않으려면:

```bash
openclaw dashboard --no-open
```

주의:

```bash
open http://127.0.0.1:18789/
```

처럼 주소만 열면,
아래 같은 오류가 뜰 수 있습니다.

```text
unauthorized: gateway token missing
```

쉽게 말하면,
건물 주소만 안다고 들어갈 수 있는 게 아니라,
출입증이 붙은 초대장이 따로 필요한 것과 같습니다.

## 5. OpenClaw의 채널 운영 설정 원칙

OpenClaw도 Hermes처럼 아무 채널에서나 말하게 만들면 위험합니다.

권장 원칙은 이렇습니다.

```text
1. 대상 Discord 서버와 채널을 분명히 제한한다.
2. 운영 채널에서는 OpenClaw가 사람 메시지를 읽을 수 있게 한다.
3. 다른 봇 메시지는 평소에는 무시한다.
4. 다만 직접 멘션된 봇 메시지는 처리한다.
5. Hermes를 부를 때는 반드시 실제 멘션으로 부른다.
```

OpenClaw 쪽 핵심 감각:

- 사람 말은 읽되
- 봇 말은 조심하고
- 운영 채널은 좁게 잡는다

쉽게 말하면,
가게 문은 열어 두되,
직원 출입문과 창고 문은 함부로 열지 않는 것과 비슷합니다.

## 6. Hermes 설정: 단독 운영 모드와 팀 운영 모드

이 부분은 꼭 구분해서 봐야 합니다.

### 6-1. Hermes 단독 운영 모드
OpenClaw 없이 Hermes 혼자 운영방의 일반 대화에 반응해야 할 때입니다.

```bash
DISCORD_ALLOW_ALL_USERS=true
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
DISCORD_IGNORE_NO_MENTION=false
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_HOME_CHANNEL=YOUR_DISCORD_CHANNEL_ID
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

### 6-2. OpenClaw 팀장 / Hermes 팀원 모드
이번 실습의 최종 운영값은 이쪽입니다.

```bash
DISCORD_ALLOW_ALL_USERS=true
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=
DISCORD_REQUIRE_MENTION=true
DISCORD_IGNORE_NO_MENTION=true
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_HOME_CHANNEL=YOUR_DISCORD_CHANNEL_ID
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

이 설정의 핵심은 딱 하나입니다.

> Hermes는 운영 채널 안에 있되, 일반 대화에 먼저 끼어들지 않는다.

그래서 `DISCORD_FREE_RESPONSE_CHANNELS`를 비워 둡니다.

쉽게 말하면,
직원이 매번 먼저 끼어들지 않고,
팀장이 불렀을 때만 옆에서 도와주는 구조입니다.

## 7. 왜 `DISCORD_ALLOW_BOTS=mentions`가 중요한가

이건 정말 중요합니다.

값이 없으면:
- OpenClaw가 Hermes를 불러도 Hermes가 봇 메시지를 무시할 수 있습니다.

값을 너무 넓게 열면:
- OpenClaw와 Hermes가 서로 끝없이 대답할 위험이 있습니다.

그래서 안전한 기본값이 이것입니다.

```bash
DISCORD_ALLOW_BOTS=mentions
```

뜻은 간단합니다.

```text
다른 봇의 말은 평소에는 듣지 않는다.
하지만 다른 봇이 @Hermes라고 직접 이름을 부르면 그때만 답한다.
```

이건 마치,
사무실 안에서 옆 팀 대화에는 끼어들지 않다가,
내 이름을 불렀을 때만 돌아보는 것과 비슷합니다.

## 8. `config.yaml`에서 같이 봐야 할 값

OpenClaw 팀장 모드에서는 `config.yaml`에도 운영 채널 역할이 들어가야 합니다.

```yaml
group_sessions_per_user: false
discord:
  require_mention: true
  free_response_channels: []
  auto_thread: false
  no_thread_channels:
    - "YOUR_DISCORD_CHANNEL_ID"
  reactions: true
  channel_prompts:
    "YOUR_DISCORD_CHANNEL_ID": >-
      이 Discord 채널에서는 OpenClaw가 운영 팀장이고 Hermes는 운영 팀원이다.
      OpenClaw는 먼저 판단하고 정리한다.
      Hermes는 직접 멘션되었을 때만 팀원으로 응답한다.
      봇끼리 무한 반복을 피하기 위해 한 작업당 1회 답변을 기본으로 한다.
```

여기서 중요한 건 두 가지입니다.

### `group_sessions_per_user: false`
같은 채널 안 대화 맥락을 공유하게 합니다.
운영 보조 채널에는 편하지만,
개인 비밀 대화가 섞이면 안 되는 채널에는 조심해야 합니다.

### `channel_prompts`
이건 봇에게 주는 역할표입니다.

이게 없으면 그냥 서로 말할 수 있는 두 봇일 뿐이고,
이게 있어야 팀장과 팀원처럼 움직입니다.

## 9. OpenClaw가 Hermes를 부를 때 주의할 점

이번 실습에서 실제로 막혔던 핵심 중 하나입니다.

문제:

```text
OpenClaw가 <@Hermes> 같은 일반 텍스트를 보냈다.
Discord는 이것을 실제 멘션으로 처리하지 않았다.
Hermes는 "내가 직접 멘션된 봇 메시지"로 보지 못했다.
```

화면에서 구분하는 법:

- 정상 멘션: 파란 `@Hermes` 버튼처럼 보임
- 실패 멘션: `<@Hermes>` 글자가 그대로 보임

그래서 OpenClaw 프롬프트에는 아래 원칙을 넣는 편이 좋습니다.

```text
Hermes를 부를 때는 반드시 정확한 Discord mention token <@HERMES_BOT_ID>를 사용한다.
@Hermes 같은 일반 텍스트만 쓰지 않는다.
```

쉽게 말하면,
현관 초인종을 눌러야 하는데,
문 앞에서 이름만 적어놓고 가는 것과 비슷합니다.

## 10. 팀워크 테스트는 이렇게 본다

예시:

```bash
openclaw message send \
 --channel discord \
 --target channel:YOUR_DISCORD_CHANNEL_ID \
 --message '<@HERMES_BOT_ID> 팀워크 연결 테스트입니다. OpenClaw는 팀장, Hermes는 팀원입니다. 짧게 응답해 주세요.'
```

성공 흐름:

```text
1. OpenClaw가 운영 채널에 @Hermes 메시지를 보낸다.
2. Hermes가 팀원으로 응답한다.
3. OpenClaw가 그 응답을 확인하고 정리한다.
4. 대화가 끝없이 반복되지 않는다.
```

## 11. 자주 막히는 문제와 해결

### 1) OpenClaw가 Hermes를 불러도 Hermes가 답하지 않음
먼저 아래를 봅니다.

- `DISCORD_ALLOW_BOTS=mentions`가 있는가
- `DISCORD_ALLOW_MENTION_USERS=true`가 있는가
- 실제 멘션이 파란 버튼으로 보이는가
- gateway를 재시작했는가

### 2) OpenClaw와 Hermes가 끝없이 대화할까 걱정됨
위험한 설정은 보통 이렇습니다.

- 모든 채널에서 `requireMention=false`
- 모든 봇 메시지를 무조건 허용
- 역할 프롬프트 없음

안전한 쪽은 이렇습니다.

```text
채널 제한
멘션 조건
1회 답변 원칙
팀장/팀원 역할표
```

### 3) OpenClaw `message read` 오류
예를 들어 이런 메시지가 뜰 수 있습니다.

```text
Discord bot token configured for account "default" is unavailable
resolve SecretRefs against the active runtime snapshot
```

이건 곧바로 "OpenClaw가 죽었다"는 뜻은 아닙니다.

먼저:

```bash
openclaw channels status --deep
```

그리고 실제 Discord 화면에서 아래를 같이 봅니다.

- OpenClaw가 온라인인가
- Hermes가 온라인인가
- OpenClaw 메시지가 채널에 보이는가
- Hermes가 그 뒤에 응답했는가

쉽게 말하면,
전화기 진단 화면에 작은 경고가 떴다고 바로 전화선부터 갈아엎지 말고,
실제 통화가 되는지 먼저 보는 것과 비슷합니다.

### 4) OpenClaw security audit 경고
예:

```text
Potential multi-user setup detected
```

이건 공유 Discord 채널 운영 경고일 수 있습니다.
즉,
여러 사람이 쓰는 채널이 열려 있다는 뜻이지,
곧바로 누군가 Mac 명령을 실행할 수 있다는 뜻으로 단정하면 안 됩니다.

이번 실습에서는 아래를 같이 잠갔습니다.

- 실행 도구 제한
- 파일 범위 제한
- 높은 권한 도구 비활성
- 허용 채널 제한

### 5) OpenClaw dashboard에서 `gateway token missing`
이건 대개 주소만 열었을 때 생깁니다.

올바른 명령:

```bash
openclaw dashboard
```

잘못된 감각:
- 주소만 열기

올바른 감각:
- 토큰이 붙은 초대장으로 열기

## 12. 팀장 모드에서 꼭 기억할 한 줄

> OpenClaw는 먼저 판단하고, Hermes는 불렸을 때 짧고 실행 가능한 답을 한다.

이 한 줄이 흐트러지면,
둘 다 먼저 말하려 들고,
대화가 다시 어수선해집니다.

## 13. 2편 핵심 정리

- OpenClaw는 MacBook에서, Hermes는 Android에서 돌리는 구성이 안정적이다
- Hermes 단독 모드와 팀장 모드를 구분해야 한다
- 팀장 모드에서는 `DISCORD_FREE_RESPONSE_CHANNELS`를 비워 둔다
- `DISCORD_ALLOW_BOTS=mentions`가 핵심이다
- OpenClaw는 실제 Discord 멘션으로 Hermes를 불러야 한다
- 대시보드는 `openclaw dashboard`로 연다
- 상태 명령만 보지 말고 실제 Discord 화면에서 팀워크 흐름을 확인한다

## 생활 속 쉬운 예시로 표현하는 용어 설명

### 팀장 봇 / 팀원 봇
한 사람은 먼저 상황을 보고 정리하고,
다른 한 사람은 불렸을 때 필요한 실행을 돕는 구조입니다.
사무실에서 팀장과 실무 담당자가 나눠 일하는 것과 비슷합니다.

### `DISCORD_FREE_RESPONSE_CHANNELS`
이 채널에서 이름을 안 불러도 먼저 말할지 정하는 값입니다.
회의실에서 손을 안 들어도 먼저 끼어들 수 있는지 정하는 규칙과 비슷합니다.

### `mentions`
내 이름을 직접 불렀을 때만 돌아보는 방식입니다.
복도에서 아무 대화에나 끼지 않고, 누가 "김 선생님" 하고 불렀을 때만 돌아보는 것과 비슷합니다.

### `channel prompt`
이 방에서는 누가 어떤 역할을 맡는지 적어둔 역할표입니다.
행사장 벽에 붙은 "사회자", "안내", "촬영" 표지판 같은 느낌입니다.

### allowlist
아무 데나 들어가는 게 아니라,
허락된 방만 들어가게 하는 출입 명단입니다.
아파트 공동현관 비밀번호를 아무 집에나 쓰지 못하게 하는 것과 비슷합니다.

### dashboard token
대시보드에 들어갈 수 있게 붙어 있는 출입증입니다.
건물 주소만 안다고 들어가는 게 아니라, 출입카드가 같이 있어야 문이 열리는 것과 비슷합니다.

### runtime snapshot / SecretRef 오류
지금 보고 있는 실행 상태와 비밀값 연결이 잠깐 어긋난 상태로 보면 됩니다.
가게 계산대는 켜져 있는데 카드 단말기 연결이 잠깐 꼬인 느낌과 비슷합니다.

### `group_sessions_per_user: false`
이 채널 안에서는 사람마다 대화를 따로따로 끊지 않고, 방 전체 흐름을 같이 보게 하는 설정입니다.
회의록을 개인별로 따로 쓰는 대신, 회의실 칠판 하나에 같이 적어두는 느낌으로 이해하면 됩니다.
