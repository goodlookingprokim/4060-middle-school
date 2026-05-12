---
title: "2026년 5월 11일(월) Android 폰에서 Hermes Agent와 OpenClaw 팀 운영 연결하기 2편"
description: "Hermes를 Discord에 붙인 뒤, OpenClaw를 팀장 봇으로 추가해 팀장-팀원 구조로 협업시키는 방법과 복구 흐름을 정리합니다."
tags:
  - middle-school
  - hermes
  - android
  - discord
  - openclaw
created: "2026-05-11"
modified: "2026-05-13"
publish: true
cssclasses:
  - field-note
---

# Android 폰에서 Hermes Agent와 OpenClaw 팀 운영 연결하기 2편

초보자를 위한 실습형 매뉴얼  
작성 기준: 2026-05-13 실습 기록, Android 12, Termux, macOS, Hermes Agent, OpenClaw

> 이 글은 2부작의 2편입니다. Hermes 설치와 Telegram·Discord 기본 연결은 [1편](./2026-05-11-hermes-android-part-1)에서 먼저 보시는 편이 좋습니다. 이번 글에서는 그다음 단계인 OpenClaw 팀장 봇 연결, 공동 운영 채널 설정, 봇 간 협업, 복구 흐름을 다룹니다.

1편에서 Hermes가 Telegram과 Discord에서 실제로 답하는 상태까지 만들었다면, 이제부터는 **혼자 답하는 봇**을 **함께 일하는 운영 팀원**으로 바꾸는 단계입니다.

---

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

핵심은 “봇 두 개를 아무렇게나 붙이는 것”이 아닙니다.  
누가 먼저 판단하고, 누가 실행 담당인지 역할을 나눠야 대화가 일처럼 정리됩니다.

---

## 이번 편에서 먼저 기억할 핵심

```text
1. OpenClaw는 MacBook에서 돌리고, Hermes는 Android Termux에서 돌리는 구성이 안정적이었다.
2. Hermes 쪽은 단독 운영 모드와 OpenClaw 팀장 모드를 구분해서 봐야 한다.
3. OpenClaw 팀장 모드에서는 Hermes의 DISCORD_FREE_RESPONSE_CHANNELS를 비워 둔다.
4. 봇끼리 무한 반복을 막으려면 bot-to-bot 대화를 무조건 열지 말고 mentions 조건으로 제한한다.
5. OpenClaw 경로와 LaunchAgent 구성은 예전 방식 대신 기본 설치 기준으로 정리됐다.
6. 상태 명령보다 실제 Discord 화면에서 새 메시지와 새 답장을 확인하는 것이 더 중요하다.
```

---

## 1. 왜 OpenClaw는 MacBook에서 실행했나

처음에는 Android Termux 안에 OpenClaw까지 설치하려고 했습니다. 하지만 Android/Termux 환경에서는 Node native build가 막히는 경우가 많습니다.

이번 실습에서 특히 문제가 되었던 유형:

```text
tree-sitter-bash
node-gyp
Android/Termux native build
Node.js 버전과 native package 조합
```

Hermes는 Android Termux에서 정상 실행되고 있었으므로 그대로 두고, OpenClaw는 MacBook에서 실행하는 구조로 정리했습니다.

이 방식의 장점:

```text
Hermes = Android 폰에서 계속 켜지는 현장 실행 봇
OpenClaw = MacBook에서 운영 판단과 지시를 담당하는 팀장 봇
Discord = 두 봇이 만나는 공용 작업 공간
```

---

## 2. OpenClaw 주요 경로

2026년 5월 13일 정리 이후 OpenClaw는 기본 설치 방식처럼 `~/.openclaw` 폴더와 `openclaw` 명령을 사용합니다. 예전 긴 폴더명이나 프로필 옵션은 붙이지 않습니다.

주요 경로:

```bash
~/.openclaw
~/.openclaw/openclaw.json
~/.openclaw/runtime
openclaw
~/Library/LaunchAgents/<openclaw-launchagent>.plist
```

파인만식으로 말하면:

```text
~/.openclaw = OpenClaw의 집
openclaw.json = OpenClaw 행동 규칙표
runtime = OpenClaw 실행 도구 상자
node_modules/.bin/openclaw = 실제 OpenClaw 명령 실행 파일
LaunchAgents plist = Mac이 OpenClaw를 계속 켜 두게 하는 자동 실행 등록표
```

OpenClaw 명령은 어느 폴더에서든 바로 실행합니다.

```bash
openclaw --help
```

현재 MacBook의 LaunchAgent는 OpenClaw gateway를 안정적인 Node LTS 환경으로 실행하도록 정리했습니다.

```bash
plutil -p "$HOME/Library/LaunchAgents/<openclaw-launchagent>.plist"
```

의미:

```text
터미널에서 보이는 기본 node 버전과 별개로,
백그라운드에서 Discord와 연결되는 OpenClaw gateway는 터미널 기본 환경과 별도로 관리될 수 있다.
```

---

## 3. OpenClaw Discord 연결 상태 확인

OpenClaw가 Discord gateway에 정상 연결되어 있는지 확인합니다.

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

이번 실습에서는 OpenClaw가 Discord에 `OpenClaw bot` 봇으로 온라인 접속되어 있음을 확인했습니다.

---

## 4. OpenClaw 자동 실행 재시작

OpenClaw는 macOS LaunchAgent로 계속 실행되게 구성할 수 있습니다.

상태 확인:

```bash
launchctl print "gui/$(id -u)/<openclaw-launchagent-label>"
```

재시작:

```bash
launchctl kickstart -k "gui/$(id -u)/<openclaw-launchagent-label>"
```

LaunchAgent 파일 확인:

```bash
plutil -p "$HOME/Library/LaunchAgents/<openclaw-launchagent>.plist"
```

주의:

```text
plist 안에 토큰이 직접 들어 있으면 안 된다.
토큰은 OpenClaw의 secret 저장소나 안전한 런타임 설정으로 관리한다.
```

---

## 5. OpenClaw의 채널 운영 설정 원칙

OpenClaw도 Hermes와 마찬가지로 아무 채널에서나 말하게 만들면 위험합니다.

권장 원칙:

```text
1. 대상 Discord 서버와 채널을 명확히 제한한다.
2. 운영 채널에서는 OpenClaw가 사람 메시지를 읽을 수 있게 한다.
3. 다른 봇 메시지는 평소에는 무시한다.
4. 단, @OpenClaw bot처럼 직접 멘션된 봇 메시지는 처리한다.
5. Hermes를 부를 때는 반드시 @Hermes로 명시한다.
```

OpenClaw 설정에서 핵심은 아래와 같습니다.

```text
groupPolicy = allowlist # 허용한 서버/채널만 처리
contextVisibility = all
requireMention = false # 운영 채널에서는 사람의 일반 메시지도 볼 수 있게 함
users = ["*"] # 이 운영 채널 안에서는 참석자 전체가 사용 가능
allowBots = mentions # 봇 메시지는 OpenClaw가 직접 멘션될 때만 처리
mentionAliases = Hermes 관련 별칭 # Hermes, 헐미즈, 허미즈 같은 별칭을 Hermes bot ID로 연결
systemPrompt = OpenClaw 팀장 / Hermes 팀원 역할 설명
```

이때 `allowBots = mentions`가 매우 중요합니다.

```text
allowBots=false = OpenClaw가 Hermes의 말을 아예 무시할 수 있다.
allowBots=true = 봇끼리 끝없이 대화할 위험이 있다.
allowBots=mentions = 다른 봇이 OpenClaw를 직접 부를 때만 응답한다.
```

교육용으로 경고를 줄이기 위해 함께 적용한 안전 설정은 아래와 같습니다.

```text
대화 중심 도구 프로필 사용
실행 도구는 제한
파일 접근 범위는 워크스페이스 안으로 제한
높은 권한 도구는 비활성
```

중요:

```text
Docker가 설치되지 않은 Mac에서는 agents.defaults.sandbox.mode="all"을 켜지 않는다.
켜면 "Sandbox mode requires Docker" 오류로 OpenClaw가 답하지 못할 수 있다.
```

---

## 6. Hermes 설정: 단독 운영 모드 vs 팀 운영 모드

특정 Discord 채널 안에서 참석자 모두가 Hermes를 쓸 수 있게 하는 방법은 두 가지입니다.

첫 번째는 `Hermes 단독 운영 모드`입니다. OpenClaw 없이 Hermes 혼자 운영방의 일반 대화에 반응해야 할 때만 사용합니다.

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

두 번째는 이번 실습의 최종값인 `OpenClaw 팀장 / Hermes 팀원 모드`입니다. OpenClaw가 일반 대화를 먼저 보고, Hermes는 사람이나 OpenClaw가 직접 부를 때만 답합니다. 중복 답변과 봇끼리 반복 대화를 줄이려면 이 값을 권장합니다.

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

팀 운영 모드 설정의 뜻은 다음과 같습니다.

```text
DISCORD_ALLOW_ALL_USERS=true = Discord 사용자 허용 목록을 열어 둔다.
DISCORD_ALLOWED_CHANNELS=채널ID = 그래도 이 채널에서만 반응하게 막는다.
DISCORD_FREE_RESPONSE_CHANNELS= = Hermes는 일반 대화에 자동으로 끼어들지 않는다.
DISCORD_REQUIRE_MENTION=true = Hermes는 직접 멘션된 메시지에 반응한다.
DISCORD_IGNORE_NO_MENTION=true = 멘션 없는 메시지는 Hermes가 무시한다.
DISCORD_AUTO_THREAD=false = @Hermes 호출 때마다 새 스레드를 만들지 않는다.
DISCORD_NO_THREAD_CHANNELS=채널ID = 이 채널에서는 채널 본문에 바로 답한다.
DISCORD_HOME_CHANNEL=채널ID = Hermes가 기본으로 사용할 Discord 방이다.
DISCORD_ALLOW_BOTS=mentions = 다른 봇 메시지는 Hermes가 멘션될 때만 처리한다.
DISCORD_ALLOW_MENTION_USERS=true = 멘션된 사용자/봇을 대화 대상으로 인식하게 한다.
```

초보자에게 가장 중요한 주의점:

```text
DISCORD_REQUIRE_MENTION=false는 전체 서버의 모든 채널에서 봇이 대화에 끼어들 수 있으므로 처음에는 쓰지 않는 편이 안전합니다.
```

Hermes를 OpenClaw의 팀원처럼 쓰는 경우, 팀 운영 모드 설정 전체를 한 덩어리로 유지하는 것이 좋습니다.

특히 `DISCORD_ALLOW_BOTS=mentions`가 중요합니다.

```text
이 값이 없으면 OpenClaw가 @Hermes를 불러도 Hermes가 봇 메시지를 무시할 수 있다.
반대로 봇 메시지를 모두 허용하면 OpenClaw와 Hermes가 서로 끝없이 대답할 위험이 있다.
```

그래서 안전한 기본값은 아래입니다.

```bash
DISCORD_ALLOW_BOTS=mentions
```

뜻은 간단합니다.

```text
다른 봇의 말은 평소에는 듣지 않는다.
하지만 다른 봇이 @Hermes라고 직접 이름을 부르면 그때만 답한다.
```

---

## 7. `config.yaml`에서 공동 채널 역할 정하기

`~/.hermes/config.yaml`에는 공동 채널 맥락과 팀 역할을 쓰기 위해 아래 값을 둡니다. `free_response_channels: []`가 중요합니다. 이 값이 비어 있어야 Hermes가 일반 채널 메시지에 OpenClaw와 동시에 답하지 않습니다.

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
 OpenClaw는 사람의 일반 요청을 먼저 판단하고 정리하는 1차 응답자다.
 Hermes는 일반 채널 메시지에 자동으로 끼어들지 않고, 사람이나 OpenClaw가 직접 멘션했을 때만 팀원으로 응답한다.
 OpenClaw가 하위 작업, 보조 의견, 실행 점검을 맡기면 Hermes는 짧고 실행 가능한 답을 제공하고 최종 정리는 OpenClaw에게 넘긴다.
 다른 봇 메시지는 Hermes가 직접 멘션된 경우에만 답하고, 무한 반복을 피하기 위해 봇끼리 한 작업당 1회 답변을 기본으로 한다.
```

주의할 점:

```text
group_sessions_per_user: false는 같은 채널 안 대화 맥락을 공유하게 만든다.
운영 보조 봇에는 편하지만, 개인별 비밀 대화가 섞이면 안 되는 채널에는 쓰지 않는다.
channel_prompts는 봇에게 "이 방에서 너의 역할이 무엇인지" 알려 주는 역할표다.
```

토큰을 재발급한 뒤에는 아래 설정들이 지워지지 않았는지 다시 봅니다.

```bash
DISCORD_BOT_TOKEN=새로_받은_DISCORD_BOT_TOKEN
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

즉, 토큰은 새 값으로 바뀌어야 하지만 채널 제한 값은 유지되어야 합니다.

---

## 8. OpenClaw 팀장 프롬프트 예시

OpenClaw 쪽 채널 프롬프트에는 아래 의미가 들어가야 합니다.

```text
이 채널에서 OpenClaw는 운영 팀장이다.
Hermes는 운영 팀원이다.
OpenClaw는 먼저 사람의 요청을 판단한다.
필요하면 Hermes의 실제 Discord mention token, 예를 들어 <@HERMES_BOT_ID> 형식으로 구체적인 하위 작업을 맡긴다.
<@Hermes>, @Hermes, Hermes 텍스트만 쓰면 실제 멘션이 아닐 수 있으므로 쓰지 않는다.
Hermes가 답하면 OpenClaw는 그 답을 확인하고 다음 행동을 정리한다.
봇끼리 무한 대화하지 않도록 한 작업당 1~2회 왕복을 기본으로 한다.
최종 결정이 필요한 일은 사람 운영자에게 확인한다.
```

Hermes 쪽 `channel_prompts`에도 같은 역할 분담을 써야 합니다.

```yaml
discord:
 channel_prompts:
 "YOUR_DISCORD_CHANNEL_ID": >-
 이 Discord 채널에서는 OpenClaw가 운영 팀장이고 Hermes는 운영 팀원이다.
 OpenClaw가 @Hermes로 하위 작업을 맡기면 Hermes는 팀원으로서 짧고 실행 가능한 답을 한다.
 다른 봇 메시지는 Hermes가 직접 멘션된 경우에만 답하고, 무한 반복을 피하기 위해
 봇끼리 한 작업당 1회 답변을 기본으로 한다. 필요한 결정권은 사람 운영자에게 요청한다.
```

이 프롬프트가 없으면 두 봇은 단순히 "서로 대답 가능한 봇"일 뿐입니다. 프롬프트가 있어야 "팀장과 팀원"처럼 움직입니다.

---

## 9. Hermes 쪽 봇 간 대화 허용 설정

Hermes가 OpenClaw의 지시를 받으려면 `.env`에 아래 값이 있어야 합니다.

```bash
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

같이 유지해야 하는 채널 제한 값입니다. 여기서는 OpenClaw가 팀장이므로 Hermes의 free response는 비워 둡니다.

```bash
DISCORD_ALLOW_ALL_USERS=true
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=
DISCORD_REQUIRE_MENTION=true
DISCORD_IGNORE_NO_MENTION=true
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
```

뜻:

```text
Hermes는 운영 채널 안에서 직접 멘션된 사람 요청을 읽고 답할 수 있다.
Hermes는 다른 봇의 말은 평소에는 무시한다.
하지만 OpenClaw가 @Hermes라고 직접 부르면 팀원처럼 답한다.
```

---

## 10. 봇 ID 확인

OpenClaw가 Hermes를 정확히 부르려면 username보다 Discord bot ID를 쓰는 것이 안정적입니다.

OpenClaw CLI에서 Discord 사용자/봇을 찾습니다.

```bash
openclaw channels resolve --channel discord --kind user Hermes OpenClaw bot --json
```

Discord 메시지에서 직접 멘션할 때는 보통 아래 형식입니다.

```text
<@HERMES_BOT_ID>
<@OPENCLAW_BOT_ID>
```

교육 자료에 실제 bot ID를 그대로 넣을 필요는 없습니다. 배포용 문서에서는 `HERMES_BOT_ID`, `OPENCLAW_BOT_ID`처럼 바꿔 쓰는 것이 좋습니다.

---

## 11. 팀워크 실제 테스트

OpenClaw가 Hermes에게 일을 맡기는 테스트입니다. 핵심은 `HERMES_BOT_ID`를 실제 숫자 ID로 바꿔 Discord가 파란 `@Hermes` 멘션으로 렌더링하게 하는 것입니다.

```bash
openclaw message send \
 --channel discord \
 --target channel:YOUR_DISCORD_CHANNEL_ID \
 --message '<@HERMES_BOT_ID> 팀워크 연결 테스트입니다. OpenClaw는 팀장, Hermes는 팀원입니다. 짧게 응답해 주세요.'
```

성공 흐름:

```text
1. OpenClaw가 #수다방에 @Hermes 메시지를 보낸다.
2. Hermes가 OpenClaw에게 팀원으로 응답한다.
3. OpenClaw가 Hermes 응답을 확인하고 정리 답변을 한다.
4. 대화가 계속 무한 반복되지 않고 멈춘다.
```

이번 실습에서 실제로 확인한 성공 흐름:

```text
OpenClaw -> @Hermes 팀워크 연결 테스트
Hermes -> OpenClaw 팀장님, Hermes 팀원 응답 정상입니다
OpenClaw -> 확인했습니다, Hermes 팀원. 앞으로 운영 요청이 들어오면 제가 먼저 판단하고 필요하면 Hermes에게 하위 작업을 맡기겠습니다.
```

이 결과로 아래가 검증되었습니다.

```text
Hermes는 Android Termux에서 실행 중이다.
OpenClaw는 MacBook에서 실행 중이다.
두 봇 모두 Discord #수다방에 온라인이다.
OpenClaw가 Hermes를 멘션하면 Hermes가 응답한다.
Hermes 응답 뒤 OpenClaw가 팀장처럼 마무리한다.
무한 루프는 발생하지 않는다.
```

---

## 12. OpenClaw message read가 실패할 때

이번 실습에서 OpenClaw CLI의 `message read` 계열 명령이 아래 유형의 오류를 낸 적이 있습니다.

```text
Discord 계정 토큰 확인 경고
활성 runtime snapshot에서 SecretRef 확인 경고
```

이 오류는 "Discord gateway가 반드시 죽었다"는 뜻이 아닙니다.

의미는 더 좁습니다.

```text
OpenClaw 로컬 CLI가 현재 실행 중인 runtime snapshot에서 Discord token SecretRef를 읽지 못했다.
```

이때 확인 순서:

```bash
openclaw channels status --deep
```

그리고 Discord 브라우저 화면에서 직접 봅니다.

```text
OpenClaw bot가 온라인인가?
Hermes가 온라인인가?
OpenClaw가 보낸 메시지가 채널에 보이는가?
Hermes가 그 뒤에 응답했는가?
```

브라우저에서 실제 메시지 흐름이 보이고 gateway 상태가 connected이면, `message read` 오류만 보고 토큰을 다시 재발급할 필요는 없습니다.

---

## 13. 이번 실습에서 실제로 막혔던 문제와 해결

### 문제 1. Hermes가 나에게만 답하고 다른 참석자에게 답하지 않음

증상:

```text
운영자A이 @Hermes를 부르면 Hermes가 답한다.
참석자A, 참석자B가 @Hermes를 불러도 Hermes가 바로 답하지 않는다.
```

원인:

```text
~/.hermes/.env의 DISCORD_ALLOWED_USERS가 서버 주인 1명만 허용하고 있었다.
```

Hermes는 `ALLOWED_USERS`를 출입 명단처럼 봅니다. 명단에 없는 사용자가 말을 걸면, 봇이 온라인이어도 조용히 무시할 수 있습니다.

특정 사람만 추가하려면 쉼표로 사용자 ID를 더합니다.

```bash
DISCORD_ALLOWED_USERS=111111111111111111,222222222222222222,333333333333333333
```

현재 실습처럼 `참석자 누구나 @Hermes로 부를 수 있게` 하되, 일반 대화는 OpenClaw가 먼저 맡게 하려면 아래처럼 설정합니다.

```bash
DISCORD_ALLOW_ALL_USERS=true
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=
DISCORD_REQUIRE_MENTION=true
DISCORD_IGNORE_NO_MENTION=true
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

이렇게 하면 `#수다방`에서는 참석자 전체가 `@Hermes`로 Hermes를 부를 수 있고, 멘션 없는 일반 대화는 OpenClaw가 먼저 처리합니다. Hermes 혼자 채널 전체 응답을 맡기는 경우에만 `DISCORD_FREE_RESPONSE_CHANNELS=YOUR_DISCORD_CHANNEL_ID`를 사용합니다.

Hermes 응답이 스레드 안에 있을 수 있습니다.

### 문제 2. Hermes가 "채널 대화를 읽을 수 없다"고 말함

가능한 원인은 세 가지입니다.

1. Discord Developer Portal에서 `Message Content Intent`가 꺼져 있음
2. Discord 채널 권한에서 봇 역할에 `View Channel` 또는 `Read Message History`가 없음
3. Hermes가 사용자별 세션을 분리하고 있어 채널 전체 맥락을 공유하지 않음

Developer Portal에서는 아래 3개 Intent를 켭니다.

```text
Presence Intent
Server Members Intent
Message Content Intent
```

Discord 채널 권한에서는 Hermes 역할에 최소한 아래 권한을 줍니다.

```text
View Channel
Send Messages
Read Message History
Add Reactions
Embed Links
Attach Files
Send Messages in Threads
Create Public Threads
Use Application Commands
```

OpenClaw 팀장 모드에서 Hermes를 공동 운영방 팀원 봇처럼 쓰려면 `~/.hermes/config.yaml`에 아래 값을 둡니다.

```yaml
group_sessions_per_user: false
```

그리고 `~/.hermes/.env`에는 아래 값을 둡니다.

```bash
DISCORD_ALLOW_ALL_USERS=true
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=
DISCORD_REQUIRE_MENTION=true
DISCORD_IGNORE_NO_MENTION=true
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

### 문제 3. OpenClaw가 @Hermes를 불러도 Hermes가 답하지 않음

증상:

```text
OpenClaw가 Discord 채널에 @Hermes 메시지를 보낸다.
Hermes는 온라인인데 답하지 않는다.
운영자A이 @Hermes를 부르면 Hermes가 답한다.
```

이번 실습에서 실제로 확인한 원인:

```text
OpenClaw가 <@Hermes> 라는 일반 텍스트를 보냈다.
Discord는 이것을 실제 @Hermes 멘션으로 처리하지 않았다.
따라서 Hermes 입장에서는 "내가 직접 멘션된 봇 메시지"가 아니어서 반응하지 않았다.
```

화면에서 구분하는 법:

```text
정상 멘션: 파란 @Hermes 버튼처럼 보인다.
실패 멘션: <@Hermes> 라는 글자가 그대로 보인다.
```

다른 흔한 원인:

```text
Hermes가 사람 메시지는 처리하지만, 다른 봇 메시지는 무시하도록 되어 있다.
```

해결:

`~/.hermes/.env`에 아래 값을 추가합니다.

```bash
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

그리고 Hermes gateway를 재시작합니다.

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
pkill -f "hermes gateway run" 2>/dev/null || true
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
sleep 10
hermes gateway status
```

OpenClaw 쪽도 같은 원칙이 필요합니다.

```text
OpenClaw allowBots = mentions
Hermes DISCORD_ALLOW_BOTS = mentions
```

그리고 OpenClaw 프롬프트에는 아래 지시를 넣습니다.

```text
Hermes를 부를 때는 반드시 정확한 Discord mention token <@HERMES_BOT_ID> 를 메시지에 그대로 포함한다.
<@Hermes>, @Hermes, Hermes 텍스트만 쓰면 실제 멘션이 아니므로 사용하지 않는다.
```

복구 테스트:

```bash
openclaw message send \
 --channel discord \
 --target channel:YOUR_DISCORD_CHANNEL_ID \
 --message '<@HERMES_BOT_ID> 팀워크 복구 테스트입니다. 한 문장으로 응답해 주세요.'
```

성공하면 Discord 화면에서 OpenClaw 메시지의 `@Hermes`가 파란 멘션으로 보이고, Hermes가 OpenClaw에게 답장합니다.

둘 중 한쪽만 열려 있으면 한 방향 대화만 되거나, 답장은 보냈는데 상대가 읽지 못하는 상태가 됩니다.

### 문제 4. OpenClaw와 Hermes가 서로 끝없이 대화할까 봐 걱정됨

봇끼리 협업할 때 가장 조심해야 하는 부분입니다.

위험한 설정:

```text
모든 채널에서 requireMention=false
모든 봇 메시지를 무조건 허용
팀장/팀원 역할 프롬프트 없음
```

안전한 설정:

```bash
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=
DISCORD_REQUIRE_MENTION=true
DISCORD_IGNORE_NO_MENTION=true
DISCORD_ALLOW_BOTS=mentions
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
```

그리고 `channel_prompts`에 아래 원칙을 명시합니다.

```text
봇끼리 한 작업당 1회 답변을 기본으로 한다.
필요한 결정권은 사람 운영자에게 요청한다.
계속 이어질 수 있는 대화는 사람 운영자에게 정리해서 넘긴다.
```

실전 성공 기준:

```text
OpenClaw가 @Hermes로 업무를 맡긴다.
Hermes가 한 번 응답한다.
OpenClaw가 확인하고 정리한다.
그 뒤 같은 테스트가 자동으로 계속 반복되지 않는다.
```

### 문제 5. OpenClaw security audit에 multi-user 경고가 남음

증상:

```text
openclaw security audit --deep
공유 채널 운영 경고
```

이번 실습의 최종 상태:

```text
0 critical
1 warn
No unguarded runtime/process tools were detected
No unguarded runtime/filesystem contexts detected
tools.elevated: disabled
```

뜻:

```text
OpenClaw가 #수다방을 여러 참석자가 쓰는 공유 Discord 채널로 보고 있다.
이 알림은 "누군가 MacBook 명령을 실행할 수 있다"는 뜻이 아니다.
```

왜 완전히 없어지지 않는가:

```text
OpenClaw의 기본 보안 모델은 개인 비서 모델이다.
따라서 Discord 서버 채널을 여러 참석자에게 열어 두면, 도구를 잠가도 "공유 채널입니다"라는 설계 경고를 남긴다.
```

이번 교육에서 실제로 제거한 위험:

```text
실행 도구 차단
파일 범위 제한
높은 권한 차단
채널 범위 제한
운영 채널 제한
```

경고를 진짜 0으로 만들 수 있는 방법:

```text
1. Discord 공유 채널 운영을 포기하고 DM 전용으로 쓴다.
2. 참석자별로 별도 gateway, 별도 OS 계정, 별도 자격 증명을 둔다.
3. Docker를 설치하고 샌드박스 격리까지 구성한다.
```

하지만 이번 실습 목표는 `#수다방에서 OpenClaw 팀장 + Hermes 팀원` 운영입니다. 그래서 이 경고는 교육 자료에서 “설정 실패”가 아니라 “공유 채널 운영 알림”으로 설명합니다.

### 문제 6. OpenClaw doctor에 Codex OAuth 모델 경고가 보임

증상:

```text
Codex OAuth 모델 경로 보존 경고
```

의미:

```text
현재 OpenClaw가 OpenAI API key가 아니라 Codex OAuth 구독 경로로 gpt-5.5를 쓰고 있다는 뜻이다.
```

중요:

```text
이 경고를 없애려고 openai/gpt-5.5로 바꾸면 OPENAI_API_KEY가 필요하다.
OPENAI_API_KEY가 없으면 OpenClaw가 답변하지 못한다.
```

이번 실습에서 확인한 결과:

```text
OpenAI API key 경로로 바꾸기 -> API 키가 없으면 응답 실패 가능
Codex OAuth 경로 유지 -> 현재 실습 환경에서는 정상 응답 확인
```

따라서 교육용 기본값은 `openai-codex/gpt-5.5` 유지입니다.

---

## 14. 전체 복구용 명령 모음

문제가 생겼을 때 아래 순서로 확인합니다.

### 14.1 Termux에서 Hermes 환경 진입

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
```

### 14.2 Hermes 버전 확인

```bash
hermes --version
```

### 14.3 Python 패키지 확인

```bash
python - <<'PY'
import importlib

for name in ("openai", "telegram", "discord", "aiohttp"):
 try:
 mod = importlib.import_module(name)
 print(f"{name}: OK {getattr(mod, '__version__', '')}")
 except Exception as exc:
 print(f"{name}: FAIL {type(exc).__name__}: {exc}")
PY
```

### 14.4 Discord `.env` 마스킹 확인

```bash
python - <<'PY'
from pathlib import Path

path = Path.home() / ".hermes" / ".env"
keys = (
 "TELEGRAM_BOT_TOKEN",
 "TELEGRAM_ALLOWED_USERS",
 "DISCORD_BOT_TOKEN",
 "DISCORD_ALLOWED_USERS",
 "DISCORD_ALLOW_ALL_USERS",
 "DISCORD_ALLOWED_CHANNELS",
 "DISCORD_FREE_RESPONSE_CHANNELS",
 "DISCORD_HOME_CHANNEL",
 "DISCORD_REQUIRE_MENTION",
 "DISCORD_IGNORE_NO_MENTION",
 "DISCORD_AUTO_THREAD",
 "DISCORD_NO_THREAD_CHANNELS",
 "DISCORD_ALLOW_BOTS",
 "DISCORD_ALLOW_MENTION_USERS",
)

for key in keys:
 value = None
 if path.exists():
  for raw in path.read_text().splitlines():
   if raw.startswith(key + "="):
    value = raw.split("=", 1)[1]
    break
 if value is None:
  print(f"{key}: missing")
 elif not value:
  print(f"{key}: empty")
 else:
  print(f"{key}: set len={len(value)}")
PY
```

### 14.5 Hermes gateway 재시작

```bash
pkill -f "hermes gateway run" 2>/dev/null || true
sleep 2
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
sleep 10
hermes gateway status
tail -n 120 ~/.hermes/gateway-discord.log
```

### 14.6 Hermes 공동 운영 설정 확인

Hermes가 운영 채널에서 사람과 OpenClaw 모두에게 적절히 반응하는지 확인합니다.

```bash
python - <<'PY'
from pathlib import Path
import yaml

env_path = Path.home() / ".hermes" / ".env"
config_path = Path.home() / ".hermes" / "config.yaml"

env = {}
if env_path.exists():
 for raw in env_path.read_text().splitlines():
  if "=" in raw and not raw.strip().startswith("#"):
   key, value = raw.split("=", 1)
   env[key.strip()] = value.strip()

for key in (
 "DISCORD_ALLOW_ALL_USERS",
 "DISCORD_ALLOWED_CHANNELS",
 "DISCORD_FREE_RESPONSE_CHANNELS",
 "DISCORD_REQUIRE_MENTION",
 "DISCORD_IGNORE_NO_MENTION",
 "DISCORD_AUTO_THREAD",
 "DISCORD_NO_THREAD_CHANNELS",
 "DISCORD_ALLOW_BOTS",
 "DISCORD_ALLOW_MENTION_USERS",
):
 value = env.get(key)
 print(f"{key}: {'missing' if value is None else value}")

config = yaml.safe_load(config_path.read_text()) if config_path.exists() else {}
discord = config.get("discord", {}) if isinstance(config, dict) else {}
print("group_sessions_per_user:", config.get("group_sessions_per_user"))
print("discord.free_response_channels:", discord.get("free_response_channels"))
print("discord.no_thread_channels:", discord.get("no_thread_channels"))
print("discord.channel_prompts:", list((discord.get("channel_prompts") or {}).keys()))
PY
```

성공 기준:

```text
DISCORD_ALLOW_ALL_USERS=true
DISCORD_ALLOWED_CHANNELS=운영 채널 ID
DISCORD_FREE_RESPONSE_CHANNELS=빈 값
DISCORD_REQUIRE_MENTION=true
DISCORD_IGNORE_NO_MENTION=true
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=운영 채널 ID
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
group_sessions_per_user: False
channel_prompts에 운영 채널 ID가 있음
```

### 14.7 OpenClaw 상태 확인과 재시작

MacBook에서 실행합니다.

```bash
openclaw channels status --deep
```

LaunchAgent 재시작:

```bash
launchctl kickstart -k "gui/$(id -u)/<openclaw-launchagent-label>"
sleep 5
openclaw channels status --deep
```

### 14.8 OpenClaw -> Hermes 팀워크 테스트

Discord bot ID는 본인 환경의 값으로 바꿉니다.

```bash
openclaw message send \
 --channel discord \
 --target channel:YOUR_DISCORD_CHANNEL_ID \
 --message '<@HERMES_BOT_ID> 팀워크 연결 테스트입니다. OpenClaw는 팀장, Hermes는 팀원입니다. 짧게 응답해 주세요.'
```

브라우저에서 확인할 것:

```text
OpenClaw 메시지가 보인다.
Hermes가 OpenClaw에게 답한다.
OpenClaw가 Hermes 응답을 확인하고 마무리한다.
같은 메시지가 반복 전송되지 않는다.
```

### 14.9 실습에서 만든 Hermes Discord room-mode 스크립트

이 프로젝트 폴더에는 오늘 설정을 다시 적용하기 위한 보조 스크립트가 있습니다.

```bash
hermes-discord-room-mode.sh
```

이 스크립트가 하는 일:

```text
1. ~/.hermes/.env를 백업한다.
2. 운영 채널 전체 응답 설정을 다시 쓴다.
3. DISCORD_ALLOW_BOTS=mentions를 넣는다.
4. DISCORD_ALLOW_MENTION_USERS=true를 넣는다.
5. ~/.hermes/config.yaml에 group_sessions_per_user=false를 설정한다.
6. Hermes channel_prompts에 OpenClaw 팀장 / Hermes 팀원 역할을 넣는다.
7. Hermes gateway를 재시작한다.
8. 토큰은 출력하지 않고 설정 여부와 길이만 보여 준다.
```

이 파일은 MacBook 프로젝트 폴더에 있으므로, 먼저 Termux 안으로 옮긴 뒤 Android Termux에서 실행해야 합니다.

```bash
bash hermes-discord-room-mode.sh
```

파일 전송이 막히면 이 문서의 `문제 16. ADB로 Termux에 긴 스크립트를 넣을 때 중간에 끊김`을 참고해 base64 조각 방식으로 넣습니다.

주의:

```text
스크립트 안의 CHANNEL_ID는 본인 Discord 운영 채널 ID로 바꿔야 한다.
배포용 자료에는 실제 채널 ID가 보이지 않게 YOUR_DISCORD_CHANNEL_ID로 치환한다.
```

---

## 15. 성공 기준 체크리스트

### Discord

- `discord.py` import가 성공한다.
- `~/.hermes/.env`에 `DISCORD_BOT_TOKEN`이 있다.
- `~/.hermes/.env`에 `DISCORD_ALLOWED_USERS`가 있다.
- 참석자 전체가 `@Hermes`로 부를 수 있게 하려면 `DISCORD_ALLOW_ALL_USERS=true`가 있다.
- OpenClaw 팀장 모드에서는 `DISCORD_ALLOWED_CHANNELS`에 운영 채널 ID가 있고 `DISCORD_FREE_RESPONSE_CHANNELS`는 빈 값이다.
- OpenClaw 팀장 모드에서는 `DISCORD_IGNORE_NO_MENTION=true`가 있다.
- Hermes 단독 채널 전체 응답 모드에서만 `DISCORD_FREE_RESPONSE_CHANNELS`가 운영 채널 ID를 가리킨다.
- OpenClaw와 협업하려면 `DISCORD_ALLOW_BOTS=mentions`가 있다.
- OpenClaw와 협업하려면 `DISCORD_ALLOW_MENTION_USERS=true`가 있다.
- 스레드 대신 채널 본문 답장을 원하면 `DISCORD_AUTO_THREAD=false`가 있다.
- 스레드 대신 채널 본문 답장을 원하면 `DISCORD_NO_THREAD_CHANNELS`에 운영 채널 ID가 있다.
- `~/.hermes/config.yaml`에 `group_sessions_per_user: false`가 있다.
- `~/.hermes/config.yaml`의 `discord.channel_prompts`에 운영 채널 역할 설명이 있다.
- Discord 서버 멤버 목록에서 `Hermes`가 온라인이다.
- `@Hermes ping`에 `pong` 응답이 온다.
- OpenClaw 팀장 모드에서는 일반 메시지는 OpenClaw가 먼저 답하고, Hermes는 직접 멘션될 때 답한다.

### OpenClaw

- `~/.openclaw` 폴더가 있다.
- `openclaw` 명령이 실행된다.
- `~/Library/LaunchAgents/<openclaw-launchagent>.plist`가 있다.
- `openclaw channels status --deep`에서 Discord gateway가 connected로 보인다.
- Discord 서버 멤버 목록에서 `OpenClaw bot`가 온라인이다.
- OpenClaw 설정에서 `channels.discord.groupPolicy`가 `allowlist`이다.
- OpenClaw 설정에 운영 서버와 운영 채널 제한이 들어 있다.
- 운영 채널 설정에서 참석자 전체가 OpenClaw에게 말할 수 있다.
- 운영 채널 설정에서 일반 메시지도 읽고 답할 수 있다.
- OpenClaw 설정에서 봇 메시지는 `mentions` 조건으로만 허용되어 있다.
- OpenClaw 설정에서 대화 중심 도구 프로필을 사용한다.
- OpenClaw 설정에서 실행 도구는 제한되어 있다.
- OpenClaw 설정에서 파일 접근 범위는 워크스페이스 안으로 제한되어 있다.
- OpenClaw 설정에서 높은 권한 도구는 비활성이다.
- OpenClaw 채널 프롬프트에 "OpenClaw는 팀장, Hermes는 팀원" 역할이 들어 있다.
- `openclaw doctor --fix --non-interactive` 실행 뒤 치명적 channel security 오류가 없어야 한다.
- `openclaw security audit --deep`의 공유 채널 운영 경고는 공개 운영 채널 사용에 따른 알림으로 설명할 수 있다.
- `openclaw agent --agent main --message "ping"`에 짧은 응답이 온다.

### OpenClaw + Hermes 팀워크

- OpenClaw가 운영 채널에 `<@HERMES_BOT_ID>` 메시지를 보낼 수 있다.
- Hermes가 OpenClaw의 멘션에 팀원처럼 응답한다.
- OpenClaw가 Hermes 응답을 확인하고 사람 운영자에게 정리한다.
- 같은 요청으로 봇끼리 무한 반복하지 않는다.
- 브라우저 Discord 화면에서 `운영자A`, `Hermes`, `OpenClaw bot`가 모두 온라인으로 보인다.

---

## 16. 초보자용 핵심 요약

한 문장 요약:

> Android 폰 안에 Termux라는 작은 Linux 작업실을 만들고, 그 안에서 Hermes gateway를 켜면 Telegram과 Discord 봇이 Hermes AI 비서와 연결됩니다. 여기에 MacBook에서 OpenClaw를 팀장 봇으로 켜면 OpenClaw가 운영을 판단하고 Hermes에게 하위 작업을 맡기는 팀 운영 구조를 만들 수 있습니다.

외워야 할 핵심:

```text
Termux = 작업실
Hermes = AI 비서
gateway = 메시지 배달부
bot token = 문 열쇠
allowed users = 출입 명단
allowed channels = 출입 가능한 방
free response channels = Hermes 단독 모드에서 이름을 부르지 않아도 대답하는 방
allow bots = 다른 봇 말을 들을지 정하는 규칙
mentions = 이름을 직접 불렀을 때만
.env = 비밀 열쇠 보관함
config.yaml = 행동 규칙표
channel prompt = 이 방의 역할 분담표
OpenClaw = 팀장
Hermes = 팀원
```

가장 많이 틀리는 부분:

```text
Discord token은 config.yaml이 아니라 ~/.hermes/.env에 넣는다.
다른 참석자가 답을 못 받으면 DISCORD_ALLOWED_USERS 또는 DISCORD_ALLOW_ALL_USERS를 확인한다.
OpenClaw가 Hermes에게 말을 걸지 못하면 DISCORD_ALLOW_BOTS=mentions와 OpenClaw allowBots=mentions를 확인한다.
봇끼리 계속 대화하면 채널 제한, 멘션 조건, channel prompt의 1회 답변 원칙을 확인한다.
OpenClaw 팀장 모드에서는 Hermes의 DISCORD_FREE_RESPONSE_CHANNELS를 빈 값으로 둔다.
```

앞 글 다시 보기: [Android 폰에서 Hermes Agent 설치하고 Telegram + Discord 연결하기 1편](./2026-05-11-hermes-android-part-1)
