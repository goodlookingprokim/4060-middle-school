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
modified: "2026-05-11"
publish: true
cssclasses:
  - field-note
---

# Android 폰에서 Hermes Agent와 OpenClaw 팀 운영 연결하기 2편

초보자를 위한 실습형 매뉴얼  
작성 기준: 2026-05-11 실습 기록, Android 12, Termux, macOS, Hermes Agent, OpenClaw

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
 -> 짧고 실행 가능한 답변
```

핵심은 “봇 두 개를 아무렇게나 붙이는 것”이 아닙니다.  
누가 먼저 판단하고, 누가 실행 담당인지 역할을 나눠야 대화가 일처럼 정리됩니다.

---

## 이번 편에서 먼저 기억할 핵심

```text
1. OpenClaw는 MacBook에서 돌리고, Hermes는 Android Termux에서 돌리는 구성이 안정적이었다.
2. Hermes가 다른 봇 말을 들으려면 DISCORD_ALLOW_BOTS=mentions가 중요하다.
3. 봇끼리 무한 반복을 막으려면 bot-to-bot 대화를 무조건 열지 말고 mentions 조건으로 제한한다.
4. 운영 채널은 넓게 열지 말고 특정 채널로 좁힌다.
5. channel_prompts로 OpenClaw=팀장, Hermes=팀원 역할을 써줘야 한다.
6. 상태 명령보다 실제 Discord 화면에서 새 메시지와 새 답장을 확인하는 것이 더 중요하다.
```

---

## 1. 왜 OpenClaw는 MacBook에서 실행했나

처음에는 Android Termux 안에 OpenClaw까지 넣어보려고 하기 쉽습니다.  
하지만 실제로는 Android/Termux에서 Node native build가 꽤 자주 발목을 잡습니다.

이번 실습에서 특히 걸리기 쉬운 유형은 이런 쪽이었습니다.

```text
tree-sitter-bash
node-gyp
Android/Termux native build
Node.js 버전과 native package 조합
```

그래서 더 실용적인 구조는 아래였습니다.

```text
Hermes = Android 폰에서 계속 켜져 있는 실행 담당 봇
OpenClaw = MacBook에서 운영 판단과 지시를 맡는 팀장 봇
Discord = 두 봇이 만나는 공용 작업 공간
```

이렇게 나누면 역할도 분명하고, 장애가 났을 때 어디를 봐야 하는지도 훨씬 분명해집니다.

---

## 2. OpenClaw 주요 경로 감각 잡기

이번 실습 기준 OpenClaw 프로필 이름은 `openclaw`였습니다.

주요 경로:

```bash
~/.openclaw-openclaw
~/.openclaw-openclaw/openclaw.json
~/.openclaw-openclaw/runtime
~/.openclaw-openclaw/runtime/node_modules/.bin/openclaw
~/Library/LaunchAgents/ai.openclaw.openclaw.plist
```

쉽게 말하면:

```text
~/.openclaw-openclaw = OpenClaw의 집
openclaw.json = 행동 규칙표
runtime = 실행 도구 상자
node_modules/.bin/openclaw = 실제 실행 파일
LaunchAgents plist = Mac이 계속 켜두게 하는 자동 실행 등록표
```

OpenClaw 명령이 PATH에 안 잡혀 있으면 이렇게 실행하면 됩니다.

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw --help
```

---

## 3. OpenClaw Discord 연결 상태 확인

OpenClaw가 Discord gateway에 제대로 연결됐는지 먼저 봅니다.

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw channels status --deep
```

성공 기준은 대체로 아래와 같습니다.

```text
Discord channel enabled
Discord account configured
Gateway reachable
Gateway running
Gateway connected
Bot user 표시
```

실전에서는 이 명령만 보지 말고, Discord 멤버 목록에서 `OpenClawYSGH`가 실제 온라인으로 보이는지도 꼭 함께 확인하는 편이 좋습니다.

---

## 4. OpenClaw 자동 실행 재시작

OpenClaw를 macOS LaunchAgent로 계속 켜두는 구조라면 아래 명령이 유용합니다.

상태 확인:

```bash
launchctl print "gui/$(id -u)/ai.openclaw.openclaw"
```

재시작:

```bash
launchctl kickstart -k "gui/$(id -u)/ai.openclaw.openclaw"
```

LaunchAgent 확인:

```bash
plutil -p "$HOME/Library/LaunchAgents/ai.openclaw.openclaw.plist"
```

주의할 점은 분명합니다.

```text
plist 안에 토큰을 직접 박아두는 방식은 피하는 것이 좋다.
```

---

## 5. 운영 채널을 어떻게 잡을까

OpenClaw도 Hermes도 아무 채널에서나 말하게 만들면 금방 지저분해집니다.  
그래서 “누구에게 열 것인가”보다 먼저 “어느 채널로 좁힐 것인가”를 보는 편이 낫습니다.

권장 원칙:

```text
1. 대상 Discord 서버와 채널을 명확히 제한한다.
2. 운영 채널에서는 사람 메시지를 읽을 수 있게 한다.
3. 다른 봇 메시지는 평소엔 무시한다.
4. 직접 멘션된 봇 메시지만 처리한다.
5. Hermes를 부를 때는 정확한 멘션을 쓴다.
```

이 기준이 없으면 봇 둘이 “똑똑한데 시끄러운 조수”가 되기 쉽습니다.

---

## 6. Hermes를 공동 운영 채널용으로 바꾸는 핵심 설정

Hermes가 특정 운영 채널에서 참석자 전체에게 반응하고, OpenClaw의 호출도 받을 수 있게 하려면 `.env` 쪽 설정이 중요합니다.

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

이걸 쉽게 풀면 이렇습니다.

```text
ALLOW_ALL_USERS = 사람 명단을 넓게 연다
ALLOWED_CHANNELS = 그래도 특정 방으로 가둔다
FREE_RESPONSE_CHANNELS = 그 방에서는 굳이 @Hermes 없이도 반응 가능
REQUIRE_MENTION = 다른 방에서는 여전히 함부로 끼어들지 않음
AUTO_THREAD=false = 매번 새 스레드 만들지 않음
ALLOW_BOTS=mentions = 다른 봇은 직접 부를 때만 반응
```

이 중에서 특히 중요한 건 이겁니다.

```bash
DISCORD_ALLOW_BOTS=mentions
```

이게 없으면 OpenClaw가 Hermes를 불러도 Hermes가 봇 메시지를 무시할 수 있습니다.  
반대로 너무 넓게 열면 둘이 끝없이 대화할 위험이 있습니다.

---

## 7. config.yaml에서 공동 채널 역할 정하기

`.env`가 출입문이라면, `config.yaml`은 그 방 안에서 어떻게 행동할지 정하는 규칙표입니다.

예시:

```yaml
group_sessions_per_user: false
discord:
  require_mention: true
  free_response_channels:
    - "YOUR_DISCORD_CHANNEL_ID"
  auto_thread: false
  no_thread_channels:
    - "YOUR_DISCORD_CHANNEL_ID"
  reactions: true
  channel_prompts:
    "YOUR_DISCORD_CHANNEL_ID": >-
      이 Discord 채널에서는 OpenClaw가 운영 팀장이고 Hermes는 운영 팀원이다.
      OpenClaw가 @Hermes로 하위 작업을 맡기면 Hermes는 팀원으로서 짧고 실행 가능한 답을 한다.
      다른 봇 메시지는 Hermes가 직접 멘션된 경우에만 답하고,
      무한 반복을 피하기 위해 봇끼리 한 작업당 1회 답변을 기본으로 한다.
      필요한 결정권은 사람 운영자에게 요청한다.
```

여기서 중요한 두 가지:

```text
group_sessions_per_user: false
channel_prompts
```

- `group_sessions_per_user: false`는 같은 채널 안에서 맥락을 공유하게 도와줍니다.
- `channel_prompts`는 “이 방에서 너는 어떤 역할이냐”를 알려주는 역할표입니다.

---

## 8. OpenClaw 쪽 역할도 같이 잡아주기

Hermes만 팀원 역할을 알면 반쪽짜리입니다. OpenClaw도 팀장 역할을 알아야 합니다.

OpenClaw 쪽 프롬프트에 들어가야 할 뜻은 대략 이렇습니다.

```text
이 채널에서 OpenClaw는 운영 팀장이다.
Hermes는 운영 팀원이다.
OpenClaw는 먼저 사람의 요청을 판단한다.
필요하면 Hermes의 실제 Discord mention token <@HERMES_BOT_ID> 형태로 하위 작업을 맡긴다.
Hermes가 답하면 OpenClaw는 그 답을 확인하고 다음 행동을 정리한다.
봇끼리 무한 대화하지 않도록 한 작업당 1~2회 왕복을 기본으로 한다.
최종 결정이 필요한 일은 사람 운영자에게 확인한다.
```

핵심은 `@Hermes`라는 글자를 예쁘게 쓰는 게 아니라, **실제 Discord 멘션 토큰을 정확히 쓰는 것**입니다.

---

## 9. Hermes bot ID 확인과 정확한 멘션

OpenClaw가 Hermes를 제대로 부르려면 username보다 bot ID 기반 멘션이 더 안정적입니다.

예시:

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw channels resolve --channel discord --kind user Hermes OpenClawYSGH --json
```

Discord에서 실제 멘션은 보통 이런 모양입니다.

```text
<@HERMES_BOT_ID>
<@OPENCLAW_BOT_ID>
```

문자열 `<@Hermes>`처럼 이름만 적으면 실제 멘션이 아닐 수 있습니다.

---

## 10. 팀워크 실제 테스트

OpenClaw가 Hermes를 부르는 테스트 예시:

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw message send \
 --channel discord \
 --target channel:YOUR_DISCORD_CHANNEL_ID \
 --message '<@HERMES_BOT_ID> 팀워크 연결 테스트입니다. OpenClaw는 팀장, Hermes는 팀원입니다. 짧게 응답해 주세요.'
```

성공 흐름은 이렇습니다.

```text
1. OpenClaw가 운영 채널에 @Hermes 메시지를 보낸다.
2. Hermes가 OpenClaw에게 팀원처럼 응답한다.
3. OpenClaw가 Hermes 응답을 보고 사람 운영자에게 정리한다.
4. 대화가 자동으로 무한 반복되지 않고 멈춘다.
```

실습에서 확인한 성공 흐름을 사람말로 옮기면 거의 이런 모습이었습니다.

```text
OpenClaw -> @Hermes 팀워크 연결 테스트
Hermes -> OpenClaw 팀장님, Hermes 팀원 응답 정상입니다
OpenClaw -> 확인했습니다. 앞으로 운영 요청이 들어오면 제가 먼저 판단하고 필요하면 Hermes에게 하위 작업을 맡기겠습니다.
```

이 정도면 구조가 제대로 붙었다고 봐도 됩니다.

---

## 11. 자주 막히는 문제들

### 문제 1. Hermes가 한 사람에게만 답하고 다른 참석자에게는 조용함

원인 후보:

```text
DISCORD_ALLOWED_USERS가 한 사람만 들어 있음
```

해결 방향은 둘 중 하나입니다.

1. 특정 사람들만 추가
2. 특정 채널 전체를 열고 채널로 제한

채널 전체 운영 쪽이 실무적으로는 더 편한 경우가 많습니다.

---

### 문제 2. Hermes가 “채널 대화를 못 읽는다”고 보임

가능한 원인:

1. `Message Content Intent` 꺼짐
2. `View Channel`, `Read Message History` 권한 없음
3. 채널 맥락 공유 설정 부족

먼저 볼 곳:

- Discord Developer Portal Intents
- Discord 서버/채널 권한
- `group_sessions_per_user: false`

---

### 문제 3. OpenClaw가 Hermes를 불렀는데 Hermes가 무시함

실습에서 실제로 있었던 대표 원인은 이쪽이었습니다.

```text
OpenClaw가 실제 Discord 멘션이 아니라 텍스트처럼 보이는 <@Hermes> 를 보냈다.
```

즉, 화면에서 파란 멘션처럼 보여야 하는데 그냥 글자로만 보이면 실패입니다.

또 하나 중요한 점:

```bash
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

이 값이 없으면 Hermes가 봇 메시지를 무시할 수 있습니다.

---

### 문제 4. 봇끼리 끝없이 대화할까 걱정됨

그 걱정은 맞는 걱정입니다.  
실제로 설정을 잘못 열면 그런 일이 생길 수 있습니다.

위험한 설정:

```text
모든 채널에서 requireMention=false
모든 봇 메시지를 무조건 허용
역할 프롬프트 없음
```

조금 더 안전한 설정:

```bash
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
DISCORD_ALLOW_BOTS=mentions
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
```

그리고 프롬프트에 이런 원칙을 적어두는 편이 좋습니다.

```text
봇끼리 한 작업당 1회 답변을 기본으로 한다.
필요한 결정권은 사람 운영자에게 요청한다.
계속 이어질 수 있는 대화는 사람 운영자에게 정리해서 넘긴다.
```

---

### 문제 5. OpenClaw CLI의 `message read`가 SecretRef 오류를 냄

실습 중 이런 오류가 날 수 있습니다.

```text
Discord bot token configured for account "default" is unavailable
resolve SecretRefs against the active runtime snapshot
```

이건 바로 “Discord gateway가 죽었다”는 뜻은 아닙니다.

더 정확히 말하면:

```text
현재 CLI 실행 환경에서 SecretRef를 제대로 못 읽었다.
```

이럴 때는 아래를 먼저 봅니다.

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw channels status --deep
```

그리고 Discord 화면에서 직접 확인합니다.

- OpenClawYSGH가 온라인인가?
- Hermes가 온라인인가?
- OpenClaw 메시지가 실제 채널에 보이는가?
- Hermes가 응답했는가?

즉, CLI 오류 하나만 보고 토큰 재발급부터 하는 건 너무 급합니다.

---

## 12. 전체 복구용 확인 순서

문제가 생기면 순서를 정해두는 편이 훨씬 덜 흔들립니다.

### 12.1 Hermes 환경 진입

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
```

### 12.2 Hermes 버전 확인

```bash
hermes --version
```

### 12.3 패키지 확인

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

### 12.4 `.env` 마스킹 확인

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

### 12.5 Hermes gateway 재시작

```bash
pkill -f "hermes gateway run" 2>/dev/null || true
sleep 2
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
sleep 10
hermes gateway status
tail -n 120 ~/.hermes/gateway-discord.log
```

### 12.6 Hermes 공동 운영 설정 확인

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
 "DISCORD_AUTO_THREAD",
 "DISCORD_NO_THREAD_CHANNELS",
 "DISCORD_ALLOW_BOTS",
 "DISCORD_ALLOW_MENTION_USERS",
):
    print(f"{key}: {env.get(key, 'missing')}")

config = yaml.safe_load(config_path.read_text()) if config_path.exists() else {}
discord = config.get("discord", {}) if isinstance(config, dict) else {}
print("group_sessions_per_user:", config.get("group_sessions_per_user"))
print("discord.free_response_channels:", discord.get("free_response_channels"))
print("discord.no_thread_channels:", discord.get("no_thread_channels"))
print("discord.channel_prompts:", list((discord.get("channel_prompts") or {}).keys()))
PY
```

### 12.7 OpenClaw 상태 확인

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw channels status --deep
```

### 12.8 OpenClaw 재시작

```bash
launchctl kickstart -k "gui/$(id -u)/ai.openclaw.openclaw"
sleep 5
"$OPENCLAW_BIN" --profile openclaw channels status --deep
```

### 12.9 OpenClaw -> Hermes 팀워크 테스트

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw message send \
 --channel discord \
 --target channel:YOUR_DISCORD_CHANNEL_ID \
 --message '<@HERMES_BOT_ID> 팀워크 연결 테스트입니다. 짧게 응답해 주세요.'
```

브라우저 Discord 화면에서 꼭 봐야 할 것:

- OpenClaw 메시지가 실제로 보이는가
- Hermes가 답하는가
- 반복 전송 없이 멈추는가

---

## 13. 성공 기준 체크리스트

### Hermes 쪽

- Android Termux에서 `hermes --version`이 정상 실행된다.
- Telegram에서 `ping -> pong`이 된다.
- Discord에서 `Hermes`가 온라인이다.
- `@Hermes ping`에 응답한다.
- 운영 채널에서 필요한 사람들에게 반응한다.

### OpenClaw 쪽

- OpenClaw 실행 파일이 정상 동작한다.
- `channels status --deep`에서 Discord gateway가 connected로 보인다.
- Discord 멤버 목록에서 `OpenClawYSGH`가 온라인이다.
- 운영 채널 설정이 좁혀져 있다.
- 봇 메시지는 `mentions` 조건으로만 처리하게 돼 있다.

### 팀 운영 쪽

- OpenClaw가 Hermes를 실제 멘션으로 부른다.
- Hermes가 팀원처럼 응답한다.
- OpenClaw가 결과를 정리한다.
- 같은 요청으로 봇끼리 무한 반복하지 않는다.

---

## 마지막으로 남길 한 줄

1편이 “Hermes가 실제로 살아 움직이게 만드는 글”이었다면, 2편은 “그 Hermes를 혼자 일하는 봇이 아니라 운영 팀원으로 바꾸는 글”에 가깝습니다.

결국 중요한 것은 기술을 많이 붙이는 것보다,  
**누가 먼저 판단하고, 누가 실행하고, 어디서 멈출지 정해두는 것**입니다.

그래야 봇 둘을 붙여도 시끄러운 장난감이 아니라, 실제 운영에 도움이 되는 구조가 됩니다.

앞 글 다시 보기: [Android 폰에서 Hermes Agent 설치하고 Telegram + Discord 연결하기 1편](./2026-05-11-hermes-android-part-1)
