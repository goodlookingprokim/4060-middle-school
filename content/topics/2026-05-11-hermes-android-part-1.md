---
title: "2026년 5월 11일(월) Android 폰에서 Hermes Agent 설치하고 Telegram + Discord 연결하기 1편"
description: "Android 폰의 Termux 안에 Hermes Agent를 설치하고, Telegram과 Discord에서 실제로 답장하는 상태까지 만드는 과정을 초보자 기준으로 정리합니다."
tags:
  - middle-school
  - hermes
  - android
  - telegram
  - discord
created: "2026-05-11"
modified: "2026-05-13"
publish: true
cssclasses:
  - field-note
---

# Android 폰에서 Hermes Agent 설치하고 Telegram + Discord 연결하기 1편

초보자를 위한 실습형 매뉴얼  
작성 기준: 2026-05-13 실습 기록, Android 12, Termux, macOS, scrcpy, Hermes Agent

> 이 글은 2부작의 1편입니다. 1편에서는 Android 폰 안에 Hermes Agent를 설치하고, Telegram과 Discord에서 실제로 답하는 상태까지 만드는 데 집중합니다. OpenClaw를 붙여 팀장-팀원 구조로 운영하는 내용은 [2편](./2026-05-11-hermes-android-part-2)에서 이어집니다.

이번 글의 목표는 단순합니다.  
집에 놀고 있는 Android 폰 하나를 작은 실행 장치처럼 써서, Hermes가 Telegram과 Discord에서 실제로 응답하게 만드는 것입니다.

---

## 먼저 큰 그림부터

처음 보면 복잡해 보여도 구조는 단순합니다.

```text
MacBook
 -> scrcpy로 Android 화면을 보고 조작
 -> adb로 폰 연결 확인

Android Phone
 -> Termux 실행
 -> Hermes Agent 설치
 -> Hermes gateway 실행

Telegram / Discord
 -> 사용자가 봇에게 메시지 전송
 -> gateway가 메시지를 Hermes에게 전달
 -> Hermes가 답장을 다시 보냄
```

파인만식으로 말하면 이렇게 이해하면 됩니다.

- `Termux`는 Android 안에 만든 작은 Linux 작업실입니다.
- `Hermes Agent`는 그 작업실 안에 설치한 AI 비서입니다.
- `gateway`는 메시지를 받아서 Hermes에게 건네는 배달 창구입니다.
- `bot token`은 봇 계정으로 로그인하는 열쇠입니다.
- `ALLOWED_USERS`는 누가 봇을 쓸 수 있는지 정하는 출입 명단입니다.
- `scrcpy`는 Mac에서 Android 화면을 보며 조작하게 해주는 도구입니다.

---

## 오늘 실습에서 먼저 기억할 핵심

```text
1. 봇 토큰은 비밀번호다. 문서와 채팅에 남기지 않는다.
2. Discord bot token은 ~/.hermes/config.yaml이 아니라 ~/.hermes/.env에 둔다.
3. 봇이 서버에 초대돼 있어도 gateway가 실행되지 않으면 오프라인이다.
4. Discord의 Message Content Intent가 꺼져 있으면 봇이 채널 대화를 제대로 읽지 못한다.
5. Discord 서버 권한과 채널 권한은 둘 다 맞아야 한다.
6. Hermes가 한 사람에게만 답했다면 DISCORD_ALLOWED_USERS 설정부터 의심한다.
7. 상태 명령만 보지 말고 실제 Telegram, Discord 화면에서 답장이 오는지 확인한다.
```

초보자 기준으로는 아래처럼 짧게 풀어 보면 덜 헷갈립니다.

```text
.env = 비밀 열쇠 보관함
config.yaml = 행동 규칙표
Intents = 봇의 눈
Permissions = 봇이 드나드는 문
ALLOWED_USERS = 사람 출입 명단
```

---

## 1. 중요한 보안 원칙

봇 토큰은 비밀번호입니다.

절대 하지 말아야 할 것:

- 봇 토큰을 GitHub에 올리기
- 공개 문서에 토큰 적기
- 단체 채팅방에 토큰 붙여넣기
- 스크린샷에 토큰이 보이게 두기
- 설정 파일을 통째로 공유하기

이번 실습에서 특히 중요했던 결론은 이것입니다.

```text
Discord bot token은 ~/.hermes/config.yaml이 아니라 ~/.hermes/.env에 넣는다.
```

즉, 인증 정보는 `.env`에 두고, `config.yaml`은 동작 규칙을 적는 쪽에 가깝다고 이해하면 됩니다.

---

## 2. 준비물

필수:

- macOS가 설치된 MacBook
- Android 폰
- 데이터 전송 가능한 USB 케이블
- Android 앱 `Termux`
- Telegram 계정
- Discord 계정
- 인터넷 연결
- Hermes에서 사용할 AI 모델 또는 API 설정

권장:

- Android 개발자 옵션 켜기
- USB 디버깅 켜기
- Termux 배터리 최적화 제외
- 설치 중 충전기 연결
- `scrcpy`로 Mac과 Android 화면을 같이 보며 작업

---

## 3. MacBook에서 Android 화면 미러링 준비

### 3.1 Homebrew 설치

Mac에 Homebrew가 없다면 아래를 실행합니다.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Apple Silicon Mac:

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Intel Mac:

```bash
eval "$(/usr/local/bin/brew shellenv)"
```

### 3.2 scrcpy와 adb 설치

```bash
brew install scrcpy android-platform-tools
```

확인:

```bash
scrcpy --version
adb version
```

### 3.3 Android에서 USB 디버깅 켜기

1. `설정`
2. `휴대전화 정보`
3. `빌드 번호` 7번 연속 터치
4. `개발자 옵션` 열기
5. `USB 디버깅` 켜기

USB 연결 뒤 폰에 `USB 디버깅 허용` 팝업이 뜨면 허용합니다.

### 3.4 adb 연결 확인

```bash
adb devices
```

정상 예시:

```text
List of devices attached
ABC123456 device
```

`unauthorized`가 보이면 폰 화면의 허용 팝업을 다시 확인합니다.

### 3.5 scrcpy 실행

```bash
scrcpy --stay-awake --window-title Hermes-Android-Debug
```

이제 Mac에서 Android 화면을 보고 마우스와 키보드로 조작할 수 있습니다.

---

## 4. Android에 Termux 준비

Termux는 Android 안에서 Linux 명령어를 실행하게 해주는 터미널 앱입니다. 루팅은 필요 없습니다.

패키지 업데이트:

```bash
pkg update
pkg upgrade -y
```

기본 도구 설치:

```bash
pkg install -y git python clang rust make pkg-config libffi openssl nodejs ripgrep ffmpeg curl
```

실습 중 안정화를 위해 추가로 설치한 패키지:

```bash
pkg install -y python-psutil
```

---

## 5. Hermes Agent 설치

### 5.1 저장소 받기

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git ~/.hermes/hermes-agent
cd ~/.hermes/hermes-agent
```

이미 clone했는데 submodule이 빠졌다면:

```bash
git submodule update --init --recursive
```

### 5.2 가상환경 만들기

```bash
python -m venv --system-site-packages venv-termux
source venv-termux/bin/activate
```

정상이라면 프롬프트 앞에 `(venv-termux)`가 붙습니다.

### 5.3 Android API 레벨 설정

```bash
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
echo "$ANDROID_API_LEVEL"
```

Android 12면 보통 `31`이 나옵니다.

### 5.4 pip 업그레이드

```bash
python -m pip install --upgrade pip setuptools wheel
```

### 5.5 Termux용 Hermes 설치

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

여기서 시간이 꽤 걸릴 수 있습니다. 특히 아래 패키지는 오래 빌드될 수 있습니다.

- `jiter`
- `pydantic-core`
- `cryptography`
- `rpds-py`
- `maturin`

멈춘 것처럼 보여도 실제로는 컴파일 중인 경우가 많습니다.

### 5.6 hermes 명령 확인

```bash
hermes --version
```

만약 명령 경로가 꼬였으면:

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
ln -sf "$PWD/venv-termux/bin/hermes" "$PREFIX/bin/hermes"
hash -r
hermes --version
```

---

## 6. Hermes 설정 파일 감각 잡기

Hermes는 보통 아래 두 파일을 많이 씁니다.

```text
~/.hermes/.env
 -> 토큰, API 키, 사용자 ID 같은 비밀값

~/.hermes/config.yaml
 -> 응답 방식, 채널 규칙 같은 구조화 설정
```

초보자는 이렇게 외우면 충분합니다.

```text
.env = 비밀값 보관함
config.yaml = 행동 규칙표
```

---

## 7. Telegram bot 만들기

### 7.1 BotFather에서 bot 생성

Telegram에서 `@BotFather`를 열고 아래 순서로 진행합니다.

```text
/newbot
```

- 봇 이름 입력
- 봇 username 입력
- BotFather가 보여주는 token 보관

### 7.2 내 Telegram user ID 찾기

Hermes는 Telegram username이 아니라 숫자 ID를 씁니다.

`@userinfobot` 같은 봇에게 메시지를 보내 user ID를 확인합니다.

예시:

```text
123456789
```

---

## 8. Hermes에 Telegram 연결하기

### 8.1 설정 마법사 사용

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
hermes gateway setup
```

여기서 Telegram을 선택하고 아래 값을 넣습니다.

- BotFather가 준 token
- 내 Telegram 숫자 user ID

### 8.2 직접 `.env`에 넣는 방법

```bash
nano ~/.hermes/.env
```

예시:

```bash
TELEGRAM_BOT_TOKEN=1234567890:YOUR_TELEGRAM_BOT_TOKEN
TELEGRAM_ALLOWED_USERS=123456789
```

저장:

```text
Ctrl + O -> Enter -> Ctrl + X
```

---

## 9. Discord bot 만들기

### 9.1 Discord Developer Portal에서 앱 생성

브라우저에서 아래로 들어갑니다.

```text
https://discord.com/developers/applications
```

순서:

1. `New Application`
2. 이름 입력
3. `Bot` 메뉴로 이동
4. Bot 생성 또는 기존 Bot 설정 확인

### 9.2 Privileged Gateway Intents 켜기

아래 세 가지를 켭니다.

```text
Presence Intent
Server Members Intent
Message Content Intent
```

특히 중요한 것은 `Message Content Intent`입니다. 이게 꺼져 있으면 봇이 메시지 내용을 제대로 읽지 못할 수 있습니다.

### 9.3 Bot token 받기

`Reset Token` 또는 `Copy Token`으로 token을 받습니다.

다시 한 번, 이 토큰은 비밀번호입니다.

### 9.4 Bot을 서버에 초대

필요 scope:

```text
bot
applications.commands
```

권장 권한:

```text
View Channels
Send Messages
Read Message History
Embed Links
Attach Files
Send Messages in Threads
Add Reactions
```

권한은 두 곳을 다 확인해야 합니다.

- `Server Settings -> Roles`
- `Channel Settings -> Permissions`

즉,

```text
Developer Portal의 Intent = 메시지를 볼 수 있는 눈
Discord 권한 = 들어가고 말할 수 있는 문
```

둘 중 하나라도 막히면 봇은 온라인이어도 제대로 못 움직입니다.

---

## 10. Discord user ID와 channel ID 찾기

Hermes는 Discord에서도 username보다 숫자 ID를 많이 씁니다.

### 10.1 Developer Mode 켜기

```text
User Settings -> Advanced -> Developer Mode ON
```

### 10.2 user ID 복사

프로필이나 메시지를 우클릭해 `Copy User ID`

### 10.3 channel ID 복사

채널을 우클릭해 `Copy Channel ID`

---

## 11. Hermes에 Discord 연결하기

이번 실습에서 가장 중요하게 수정된 부분입니다.

핵심은 이겁니다.

```text
Discord bot token을 config.yaml에 넣는 것이 핵심이 아니다.
권장 위치는 `~/.hermes/.env`입니다.
```

### 11.1 `.env` 열기

```bash
nano ~/.hermes/.env
```

### 11.2 기본 Discord 설정 넣기

```bash
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
DISCORD_ALLOWED_USERS=YOUR_DISCORD_USER_ID
DISCORD_HOME_CHANNEL=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
```

여러 사용자를 허용하려면 쉼표로 구분합니다.

```bash
DISCORD_ALLOWED_USERS=111111111111111111,222222222222222222
```

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

두 번째는 `OpenClaw 팀장 / Hermes 팀원 모드`입니다. OpenClaw가 일반 대화를 먼저 보고, Hermes는 사람이나 OpenClaw가 직접 부를 때만 답합니다. 중복 답변과 봇끼리 반복 대화를 줄이려면 이 값을 권장합니다.

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

이 차이는 2편에서 조금 더 자세히 설명합니다.

### 11.3 값이 들어갔는지 길이만 확인

```bash
python - <<'PY'
from pathlib import Path

path = Path.home() / ".hermes" / ".env"
for key in (
 "DISCORD_BOT_TOKEN",
 "DISCORD_ALLOWED_USERS",
 "DISCORD_HOME_CHANNEL",
 "DISCORD_REQUIRE_MENTION",
):
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

토큰 원문을 그대로 출력하지 않는 것이 중요합니다.

---

## 12. Discord 의존성 확인과 설치

이번 실습에서 Discord bot이 오프라인이었던 실제 원인 하나는 `discord.py` 미설치였습니다.

확인:

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
python - <<'PY'
import importlib

for name in ("discord", "discord.ext", "aiohttp", "openai"):
    try:
        mod = importlib.import_module(name)
        print(f"{name}: OK {getattr(mod, '__version__', '')}")
    except Exception as exc:
        print(f"{name}: FAIL {type(exc).__name__}: {exc}")
PY
```

설치:

```bash
python -m pip install 'discord.py>=2.7.1,<3'
```

재확인:

```bash
python - <<'PY'
import discord
print("discord.py:", discord.__version__)
PY
```

---

## 13. Hermes gateway 실행

### 13.1 foreground 실행

처음에는 로그가 보이게 실행하는 편이 좋습니다.

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
hermes gateway run
```

예상 로그:

```text
Hermes Gateway Starting...
Messaging platforms + cron scheduler
Press Ctrl+C to stop
```

### 13.2 background 실행

계속 켜두고 싶으면:

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
```

상태 확인:

```bash
hermes gateway status
```

로그 확인:

```bash
tail -n 120 ~/.hermes/gateway-discord.log
```

### 13.3 재시작

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
pkill -f "hermes gateway run" 2>/dev/null || true
sleep 2
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
sleep 10
hermes gateway status
tail -n 120 ~/.hermes/gateway-discord.log
```

---

## 14. Telegram 테스트

Telegram bot에게 아래처럼 보내봅니다.

```text
ping
```

성공 예시:

```text
사용자: ping
Hermes: pong.
```

이 응답이 오면 Telegram 연결은 정상입니다.

---

## 15. Discord 온라인 확인과 ping 테스트

### 15.1 온라인 확인

Discord 멤버 목록에서 `Hermes`가 온라인으로 보이는지 확인합니다.

실패 상태:

```text
온라인 — 1: 운영자A
오프라인 — 1: Hermes
```

성공 상태:

```text
온라인 — 2
운영자A
Hermes
```

### 15.2 ping 테스트

```text
@Hermes ping
```

성공 예시:

```text
운영자A: @Hermes ping
Hermes: pong
```

실습에서는 Hermes가 자동으로 `ping` 스레드를 만들고 그 안에서 답한 경우도 있었습니다. 그러니 채널 본문에 바로 안 보이면 스레드도 꼭 확인하는 편이 좋습니다.

---

## 여기까지 되면 기본 연결은 끝입니다

여기까지 성공하면, 적어도 아래 상태는 확보된 것입니다.

- Android 폰 안의 Termux에서 Hermes가 실행된다.
- Telegram에서 Hermes가 답한다.
- Discord에서 Hermes가 온라인으로 보인다.
- `@Hermes ping`에 응답한다.

즉, 아직 팀 운영 구조는 아니어도 **Hermes 단독 실행 bot**으로는 이미 충분히 쓸 수 있는 상태입니다.

---

## 2편에서 이어지는 내용

이제 다음 단계는 Hermes 혼자 답하는 수준을 넘어서, **OpenClaw를 팀장 봇으로 붙여 함께 일하게 만드는 것**입니다.

2편에서는 아래 내용을 다룹니다.

- OpenClaw를 MacBook에서 Discord bot으로 연결하기
- Hermes와 OpenClaw를 같은 운영 채널에 붙이기
- `DISCORD_ALLOW_BOTS=mentions`로 봇 간 대화 제한하기
- 팀장/팀원 역할 프롬프트 넣기
- 참석자 전체가 쓰게 할 때의 채널 제한 방식
- 무한 루프 없이 협업시키는 운영 원칙
- 실전 복구 명령 모음

이어 읽기: [Android 폰에서 Hermes Agent 설치하고 Telegram + Discord + OpenClaw 팀 운영까지 연결하기 2편](./2026-05-11-hermes-android-part-2)
