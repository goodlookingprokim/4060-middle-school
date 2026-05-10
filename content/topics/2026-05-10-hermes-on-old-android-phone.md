---
title: "2026년 5월 11일(월) Android 폰에서 Hermes Agent 설치하고 Telegram + Discord까지 연결하기"
description: "집에서 놀고 있는 안드로이드폰에 Hermes Agent를 설치하고, Telegram과 Discord에서 실제로 대화가 오가도록 연결하는 과정을 초보자 기준으로 아주 쉽게 풀어 설명합니다."
tags:
  - middle-school
  - hermes
  - android
  - telegram
  - discord
created: "2026-05-10"
modified: "2026-05-11"
publish: true
cssclasses:
  - field-note
---

# 2026년 5월 11일(월) Android 폰에서 Hermes Agent 설치하고 Telegram + Discord까지 연결하기

집에 한동안 쓰지 않고 놓아둔 안드로이드폰이 있다면, 그냥 서랍에 넣어두기보다 다른 식으로 다시 써볼 수 있습니다. 이번 글은 그 폰을 작은 AI 작업 장치로 바꾸는 방법을 정리한 글입니다. 목표는 단순합니다. 안드로이드폰 안에 Hermes Agent를 설치하고, Telegram과 Discord에서 메시지를 보내면 실제로 답이 오게 만드는 것입니다.

처음 이 말을 들으면 어렵게 느껴질 수 있습니다. 하지만 겁먹을 필요는 없습니다. 이 작업은 “폰 안에 작은 작업실을 만들고, 그 안에 AI 비서를 앉힌 뒤, 메신저 창구를 열어주는 일”이라고 생각하면 됩니다. 이렇게 보면 꽤 단순합니다.

## 먼저 결론

- 안드로이드폰에서 Hermes를 쓰는 핵심은 **Termux 안에 Hermes를 설치하고, gateway로 Telegram과 Discord를 연결하는 것**입니다.
- 초보자에게는 폰만 들여다보며 하기보다 **MacBook으로 화면을 보며 조작하는 방식**이 훨씬 쉽습니다.
- 이번 글에서 가장 중요한 실전 포인트는 **Discord 토큰은 `config.yaml`이 아니라 `.env`에 넣는다는 점**, 그리고 **`discord.py`가 없으면 Discord 봇이 온라인조차 되지 않을 수 있다는 점**입니다.

## 0. 이 작업을 5살에게 설명하면

어려운 말을 빼고 정말 쉽게 설명해보겠습니다.

- 안드로이드폰은 작은 사무실입니다.
- Termux는 그 사무실 안에 만든 작업방입니다.
- Hermes Agent는 그 방 안에 앉아 있는 AI 비서입니다.
- Telegram과 Discord는 비서에게 말을 거는 전화기입니다.
- gateway는 전화를 받아서 비서에게 연결해주는 안내 데스크입니다.
- bot token은 안내 데스크 출입증입니다.
- allowed users는 “이 사람만 이 비서를 써도 됩니다”라고 적힌 출입 명단입니다.
- scrcpy는 내가 맥북에서 그 사무실 CCTV를 보면서, 마우스와 키보드로 대신 조작하는 도구입니다.

즉, 우리가 하려는 일은 아래 한 줄로 요약됩니다.

> 안드로이드폰 안에 AI 비서를 앉혀두고, Telegram이나 Discord로 말을 걸면 대답하게 만드는 일입니다.

## 1. 전체 구조를 그림처럼 이해하기

이 구조를 글로 다시 그려보면 이렇습니다.

MacBook  
→ 안드로이드 화면을 크게 보여줌  
→ 키보드로 긴 명령어를 대신 입력하게 도와줌

Android Phone  
→ Termux라는 작은 Linux 작업실 실행  
→ 그 안에 Hermes Agent 설치  
→ Hermes gateway 실행

Telegram / Discord  
→ 내가 메시지를 보냄  
→ gateway가 그 메시지를 Hermes에게 전달  
→ Hermes가 답을 만들고 다시 메신저로 보냄

실생활 비유로 말하면,

- MacBook은 공사 감독석입니다.
- Android 폰은 실제 공사가 진행되는 방입니다.
- Termux는 공구함과 작업대가 있는 작업실입니다.
- Hermes는 그 안에서 일하는 기술자입니다.
- Telegram/Discord는 손님이 말을 거는 창구입니다.

이 그림만 머릿속에 있으면, 중간에 막혀도 “지금 내가 어디를 고치고 있는가”를 놓치지 않게 됩니다.

## 2. 시작 전에 꼭 알아둘 보안 원칙

이 글에서 토큰 이야기가 자주 나옵니다. 토큰은 쉽게 말해 **비밀번호**입니다.

집 현관 비밀번호를 벽에 써두면 안 되듯이, 봇 토큰도 아무 데나 적으면 안 됩니다.

절대 하면 안 되는 것:

- GitHub에 토큰 올리기
- 공개 문서에 토큰 적기
- 단체 채팅방에 토큰 붙여넣기
- 스크린샷에 토큰 보이게 두기
- 아무 생각 없이 `config.yaml`에 넣고 파일을 공유하기

이번 실습에서 특히 중요했던 결론은 아래입니다.

> **Discord 봇 토큰은 `~/.hermes/config.yaml`이 아니라 `~/.hermes/.env`에 넣습니다.**

이걸 실생활 비유로 말하면,

- `.env`는 열쇠 보관함입니다.
- `config.yaml`은 행동 규칙표입니다.

즉, **문을 여는 열쇠는 열쇠함에 넣어야지, 규칙표에 붙여두면 안 됩니다.**

## 3. 준비물

필요한 것은 아래 정도입니다.

- macOS가 설치된 MacBook
- Android 폰
- 데이터 전송이 되는 USB 케이블
- Android 앱: Termux
- Telegram 계정
- Discord 계정
- 인터넷 연결
- Hermes에서 사용할 AI 모델/API 설정

권장:

- Android 개발자 옵션에서 USB 디버깅 켜기
- Android 배터리 설정에서 Termux 배터리 최적화 제외
- 설치 중에는 폰을 충전기에 연결
- MacBook에서 scrcpy로 폰 화면을 보며 설치 진행

왜 충전기를 권하느냐 하면, Android에서 패키지를 빌드할 때 생각보다 시간이 오래 걸릴 수 있기 때문입니다. 비유하면, 오래가는 손반죽 작업을 시키는데 중간에 전기가 끊기면 다시 처음부터 해야 하는 것과 비슷합니다.

## 4. MacBook에서 Android 화면을 보는 준비

이 단계는 초보자에게 정말 중요합니다. 폰 화면만 보고 긴 명령어를 입력하면 오타가 자주 납니다. 맥북에서 화면을 보며 설치하면 훨씬 수월합니다.

### 4-1. Homebrew 설치

Mac에 Homebrew가 없다면 아래를 실행합니다.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Apple Silicon Mac이면 보통 아래도 이어서 실행합니다.

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Intel Mac이면 보통 이 경로를 씁니다.

```bash
eval "$(/usr/local/bin/brew shellenv)"
```

### 4-2. scrcpy와 adb 설치

```bash
brew install scrcpy android-platform-tools
```

설치 확인:

```bash
scrcpy --version
adb version
```

### 4-3. Android에서 USB 디버깅 켜기

이건 “폰이 맥북의 말을 들을 수 있게 허락하는 과정”이라고 생각하면 됩니다.

순서:

1. `설정` 열기
2. `휴대전화 정보` 또는 `휴대폰 정보`
3. `빌드 번호`를 7번 누르기
4. 개발자 옵션이 켜졌다는 메시지 확인
5. `설정 -> 시스템 -> 개발자 옵션` 또는 `설정 -> 개발자 옵션` 이동
6. `USB 디버깅` 켜기
7. 제조사에 따라 필요하면 `USB 디버깅(보안 설정)`도 켜기

USB로 연결하면 폰에 “이 컴퓨터를 믿을까요?”에 가까운 팝업이 뜹니다. 여기서 허용해야 합니다.

### 4-4. adb 연결 확인

```bash
adb devices
```

정상 예시:

```text
List of devices attached
RF9N800SGKR device
```

만약 `unauthorized`가 뜨면, 맥 쪽 문제가 아니라 보통 **폰 쪽 허용 팝업** 문제입니다.

### 4-5. scrcpy 실행

```bash
scrcpy --stay-awake --window-title Hermes-Android-Debug
```

이제부터는 맥북 화면에서 안드로이드 화면을 보고 마우스와 키보드로 조작할 수 있습니다. 마치 작은 폰을 큰 모니터에 올려놓고 일하는 느낌입니다.

## 5. Android 안에 Termux 작업실 만들기

Termux는 안드로이드 안에서 Linux 명령어를 실행하게 해주는 터미널 앱입니다. 루팅은 필요 없습니다.

처음 실행한 뒤 아래를 먼저 합니다.

```bash
pkg update
pkg upgrade -y
```

기본 도구 설치:

```bash
pkg install -y git python clang rust make pkg-config libffi openssl nodejs ripgrep ffmpeg curl
pkg install -y python-psutil
```

이 단계는 쉽게 말하면, 빈 작업실에 공구를 들여놓는 과정입니다.

- `git` = 자료 가져오는 도구
- `python` = Hermes가 일하는 기본 언어
- `clang`, `rust`, `make` = 부품을 현장에서 조립하는 공구
- `ffmpeg` = 오디오/영상 처리용 도구

## 6. Hermes Agent 설치

### 6-1. Hermes 저장소 받기

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git ~/.hermes/hermes-agent
cd ~/.hermes/hermes-agent
```

이미 clone했는데 submodule 없이 받았다면 아래를 실행합니다.

```bash
git submodule update --init --recursive
```

여기서 `submodule`은 “같이 딸려와야 하는 작은 부품 상자” 정도로 이해하면 됩니다.

### 6-2. Python 가상환경 만들기

Hermes 전용 상자를 따로 만드는 단계입니다. 주방에 반찬통을 따로 만들어 음식이 섞이지 않게 하는 것과 비슷합니다.

```bash
python -m venv --system-site-packages venv-termux
source venv-termux/bin/activate
```

성공하면 앞에 `(venv-termux)` 표시가 붙습니다.

### 6-3. Android API 레벨 설정

일부 패키지는 “이 폰이 어떤 Android 버전인가”를 알아야 설치가 됩니다.

```bash
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
echo "$ANDROID_API_LEVEL"
```

Android 12는 보통 `31`이 나옵니다.

### 6-4. pip 업그레이드

```bash
python -m pip install --upgrade pip setuptools wheel
```

### 6-5. Termux용 Hermes 설치

여기서 중요한 포인트가 하나 있습니다.

> Android/Termux에서는 일반 PC처럼 무조건 `.[all]`을 쓰면 안 되는 경우가 있습니다.

쉽게 말하면, “모든 기능이 다 들어 있는 큰 공구 세트”를 가져오면 Android에서는 맞지 않는 공구도 섞여서 설치가 깨질 수 있다는 뜻입니다. 그래서 실습에서는 Android에 맞춘 세트를 씁니다.

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

설치 중 아래 패키지들이 오래 걸릴 수 있습니다.

- `jiter`
- `pydantic-core`
- `cryptography`
- `rpds-py`
- `maturin`

이때 가장 많이 하는 실수가 “멈춘 줄 알고 꺼버리는 것”입니다. 사실은 뒤에서 열심히 조립 중일 때가 많습니다.

실생활 비유로 말하면, 빵 반죽을 오븐에 넣었는데 3분 보고 안 부푼다고 꺼내버리는 것과 비슷합니다. 조금 오래 기다려야 합니다.

### 6-6. `hermes` 명령 연결 확인

```bash
hermes --version
```

만약 `hermes` 명령이 없거나 예전 가상환경을 가리키면 아래처럼 복구합니다.

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
ln -sf "$PWD/venv-termux/bin/hermes" "$PREFIX/bin/hermes"
hash -r
hermes --version
```

## 7. Hermes 기본 설정을 이해하기

Hermes 설정 파일은 크게 두 곳을 기억하면 됩니다.

```text
~/.hermes/.env
 -> 토큰, API 키, 사용자 ID 같은 비밀값

~/.hermes/config.yaml
 -> 봇 동작 방식, 응답 방식, 채널 규칙 같은 구조화 설정
```

다시 쉬운 말로 바꾸면,

- `.env` = 열쇠함
- `config.yaml` = 행동 매뉴얼

예를 들어,
- “이 봇으로 로그인하려면 어떤 비밀번호를 써야 하나?” → `.env`
- “이 봇은 멘션이 있을 때만 답할까?” → `config.yaml`

## 8. Telegram bot 만들기

### 8-1. BotFather에서 bot 생성

Telegram에서 `@BotFather`를 엽니다.

순서:

1. `/newbot`
2. 봇 이름 입력
3. 봇 username 입력
4. BotFather가 bot token 반환
5. token을 안전한 곳에 보관

### 8-2. 내 Telegram 숫자 ID 찾기

Hermes는 Telegram username이 아니라 **숫자 ID**를 기준으로 사람을 구분합니다.

`@userinfobot` 같은 bot으로 숫자 ID를 확인합니다.

예시:

```text
123456789
```

비유하면, 이름이 아니라 주민번호 같은 고유 번호를 보는 셈입니다.

## 9. Hermes에 Telegram 연결하기

### 9-1. 설정 마법사 사용

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
hermes gateway setup
```

Telegram을 선택하고 아래를 넣습니다.

- BotFather가 준 token
- 내 Telegram 숫자 user ID

### 9-2. 직접 `.env`에 넣는 방법

```bash
nano ~/.hermes/.env
```

예시:

```text
TELEGRAM_BOT_TOKEN=1234567890:YOUR_TELEGRAM_BOT_TOKEN
TELEGRAM_ALLOWED_USERS=123456789
```

저장 후 종료:

- `Ctrl + O` → `Enter`
- `Ctrl + X`

## 10. Discord bot 만들기

이제 Telegram과 같은 방식으로 Discord 쪽 창구도 엽니다.

### 10-1. Discord Developer Portal에서 앱 생성

브라우저에서 접속:

https://discord.com/developers/applications

순서:

1. `New Application`
2. 이름 입력 (예: Hermes)
3. 앱 생성
4. 왼쪽 메뉴에서 Bot 이동
5. Bot 생성 또는 설정 확인

### 10-2. Privileged Gateway Intents 켜기

아래 항목을 켭니다.

- Presence Intent
- Server Members Intent
- Message Content Intent

이 부분을 집에 비유하면,

- Presence Intent = 누가 집에 와 있는지 볼 권한
- Server Members Intent = 집에 사는 사람 명단을 볼 권한
- Message Content Intent = 사람들이 무슨 말을 했는지 들을 권한

특히 `Message Content Intent`가 꺼져 있으면, 봇이 말을 들을 수 없는 상태가 됩니다.

### 10-3. Bot token 받기

Bot 페이지에서 `Reset Token` 또는 `Copy Token`으로 토큰을 받습니다.

이 토큰도 비밀번호입니다.

### 10-4. Bot을 서버에 초대

필요 scope:

- `bot`
- `applications.commands`

권장 권한:

- View Channels
- Send Messages
- Read Message History
- Embed Links
- Attach Files
- Send Messages in Threads
- Add Reactions

초대 직후에는 서버 멤버 목록에 보여도 오프라인일 수 있습니다. 아직 Hermes gateway가 Discord 토큰으로 로그인하지 않았기 때문입니다.

## 11. Discord user ID와 channel ID 찾기

### 11-1. Developer Mode 켜기

Discord에서:

`User Settings -> Advanced -> Developer Mode ON`

### 11-2. 내 user ID 복사

내 프로필이나 메시지를 오른쪽 클릭하고 `Copy User ID`

예시:

```text
123456789012345678
```

### 11-3. channel ID 복사

Hermes가 기본으로 사용할 채널을 오른쪽 클릭하고 `Copy Channel ID`

예시:

```text
1503049189528174746
```

## 12. Hermes에 Discord 연결하기

이번 실습에서 가장 중요했던 포인트입니다.

많이 헷갈리는 오해:

> “Discord bot token을 `config.yaml`에 넣으면 되겠지?”

아닙니다. **로그인 정보는 `.env`에 둡니다.**

### 12-1. `.env` 열기

```bash
nano ~/.hermes/.env
```

### 12-2. Discord 설정 추가

```text
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
DISCORD_ALLOWED_USERS=YOUR_DISCORD_USER_ID
DISCORD_HOME_CHANNEL=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
```

여러 명 허용 시:

```text
DISCORD_ALLOWED_USERS=111111111111111111,222222222222222222
```

### 12-3. 길이만 확인하기

토큰을 그대로 찍지 말고 길이만 확인합니다.

```bash
python - <<'PY'
from pathlib import Path

path = Path.home() / ".hermes" / ".env"
for key in ("DISCORD_BOT_TOKEN", "DISCORD_ALLOWED_USERS", "DISCORD_HOME_CHANNEL", "DISCORD_REQUIRE_MENTION"):
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

정상 예시:

```text
DISCORD_BOT_TOKEN: set len=72
DISCORD_ALLOWED_USERS: set len=18
DISCORD_HOME_CHANNEL: set len=19
DISCORD_REQUIRE_MENTION: set len=4
```

## 13. Discord 의존성 확인과 설치

이번 실습에서 Discord 봇이 오프라인이었던 첫 번째 실제 원인은 `discord.py`가 설치되지 않은 것이었습니다.

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

문제 예시:

```text
discord: FAIL ModuleNotFoundError: No module named 'discord'
discord.ext: FAIL ModuleNotFoundError: No module named 'discord'
aiohttp: OK 3.13.5
openai: OK 2.36.0
```

해결:

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
python -m pip install 'discord.py>=2.7.1,<3'
```

다시 확인:

```bash
python - <<'PY'
import discord
print("discord.py:", discord.__version__)
PY
```

정상 예시:

```text
discord.py: 2.7.1
```

쉽게 말하면, Discord 창구를 열어두려면 Discord용 직원을 한 명 더 채용해야 하는 셈입니다.

## 14. Hermes gateway 실행

gateway는 메신저와 Hermes 사이를 오가는 배달부입니다.

### 14-1. foreground로 실행

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
hermes gateway run
```

정상 예시:

```text
Hermes Gateway Starting...
Messaging platforms + cron scheduler
Press Ctrl+C to stop
```

### 14-2. background로 실행

계속 켜두고 싶다면 로그를 남기며 background로 돌립니다.

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

### 14-3. gateway 재시작

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

정상 예시:

```text
Gateway is running (PID: 18715)
```

## 15. Telegram 테스트

Telegram bot에게 `ping`을 보냅니다.

정상 예시:

- 사용자: `ping`
- Hermes: `pong.`

즉, “전화를 걸었더니 안내 데스크가 받았고, 비서가 답했다”는 뜻입니다.

## 16. Discord 온라인 확인과 ping 테스트

### 16-1. 온라인 확인

Discord 서버 멤버 목록을 봅니다.

실패 상태:

```text
온라인 — 1: Bluelion
오프라인 — 1: Hermes
```

성공 상태:

```text
온라인 — 2
Bluelion
Hermes
```

`.env`에 Discord token과 allowed user를 제대로 넣고 gateway를 재시작한 뒤 `Hermes, 온라인`이 보이면 로그인 자체는 성공한 것입니다.

### 16-2. Discord ping 테스트

채널에서 Hermes를 멘션합니다.

```text
@Hermes ping
```

성공 예시:

- `Bluelion: @Hermes ping`
- `Hermes: pong`

이번 실습에서는 Hermes가 자동으로 `ping` 스레드를 만들고 그 안에서 `pong`으로 응답했습니다. 즉, 본문 채널이 아니라 스레드 안에서 답할 수도 있다는 점을 기억해두면 덜 당황합니다.

## 17. 실제로 많이 막히는 문제를 쉽게 풀어보면

### 문제 1. `adb devices`에 폰이 안 보임

이건 “맥북이 폰을 아직 믿는 기기로 인정받지 못한 상태”라고 보면 됩니다.

복구:

```bash
adb kill-server
adb start-server
adb devices
```

그리고 폰 화면에서 USB 디버깅 허용 팝업을 다시 확인합니다.

### 문제 2. scrcpy 화면이 안 뜸

이건 CCTV 연결은 했는데 화면이 잠겨 있거나 케이블이 불안정한 경우와 비슷합니다.

```bash
adb devices
scrcpy --version
scrcpy --stay-awake --window-title Hermes-Android-Debug
```

### 문제 3. `hermes` 명령이 이상한 곳을 가리킴

쉽게 말하면 작업실 안의 비서를 찾으러 갔는데 예전 방으로 잘못 찾아가는 상태입니다.

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
ln -sf "$PWD/venv-termux/bin/hermes" "$PREFIX/bin/hermes"
hash -r
hermes --version
```

### 문제 4. OpenAI SDK가 안 보임

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
python -m pip install -e '.[termux]' -c constraints-termux.txt
hermes --version
```

### 문제 5. 빌드가 너무 오래 걸림

이건 폰이 느린 게 아니라, 작은 폰 안에서 무거운 부품을 직접 조립하는 중인 경우가 많습니다.

대응:

- 충전기 연결
- Termux 닫지 않기
- 화면 꺼지지 않게 하기
- 충분히 기다리기

### 문제 6. Telegram bot이 답이 없음

이건 보통 출입 명단이나 열쇠가 틀린 상태입니다.

확인:

```bash
nano ~/.hermes/.env
```

```text
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ALLOWED_USERS=...
```

그리고 재시작:

```bash
pkill -f "hermes gateway run" 2>/dev/null || true
setsid -f hermes gateway run > ~/.hermes/gateway.log 2>&1
```

### 문제 7. Discord 봇이 오프라인

이건 대체로 아래 다섯 가지 중 하나입니다.

1. gateway가 꺼져 있음
2. Discord token이 `.env`에 없음
3. `discord.py`가 없음
4. token이 틀림
5. Android가 Termux를 죽임

### 문제 8. Discord token을 `config.yaml`에 넣음

이건 가장 많이 헷갈리는 포인트입니다.

다시 한 번 정리하면,

- `.env` = 로그인 열쇠
- `config.yaml` = 로그인 후 행동 규칙

### 문제 9. PyNaCl 경고가 뜸

음성 기능이 안 된다는 뜻입니다. 텍스트 채팅 `ping/pong`에는 치명적이지 않습니다.

### 문제 10. Discord에서 답장이 안 보임

스레드로 갔을 가능성이 큽니다. 왼쪽 목록이나 원본 메시지 아래 스레드를 확인합니다.

### 문제 11. Android가 Termux를 죽임

이건 Android가 “이 앱은 지금 백그라운드니까 꺼도 되겠지”라고 판단한 상태입니다.

해결:

- `설정 -> 앱 -> Termux -> 배터리 -> 제한 없음`
- 최근 앱에서 Termux 닫지 않기

## 18. 전체 복구용 명령 모음

### Hermes 환경 진입

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
```

### 버전 확인

```bash
hermes --version
```

### Python 패키지 확인

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

### `.env` 확인

```bash
python - <<'PY'
from pathlib import Path

path = Path.home() / ".hermes" / ".env"
keys = (
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_ALLOWED_USERS",
    "DISCORD_BOT_TOKEN",
    "DISCORD_ALLOWED_USERS",
    "DISCORD_HOME_CHANNEL",
    "DISCORD_REQUIRE_MENTION",
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

### gateway 재시작

```bash
pkill -f "hermes gateway run" 2>/dev/null || true
sleep 2
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
sleep 10
hermes gateway status
tail -n 120 ~/.hermes/gateway-discord.log
```

## 19. 성공 기준 체크리스트

### MacBook / Android 연결

- `adb devices`에서 Android가 `device`로 보인다.
- `scrcpy`로 Android 화면이 보인다.
- MacBook 키보드로 Termux에 입력할 수 있다.

### Hermes 설치

- `hermes --version`이 실행된다.
- 관련 패키지가 정상 표시된다.
- `venv-termux` 가상환경이 있다.

### Telegram

- `~/.hermes/.env`에 `TELEGRAM_BOT_TOKEN`이 있다.
- `~/.hermes/.env`에 `TELEGRAM_ALLOWED_USERS`가 있다.
- Telegram에서 `ping`을 보내면 `pong`이 온다.

### Discord

- `discord.py` import가 성공한다.
- `~/.hermes/.env`에 `DISCORD_BOT_TOKEN`이 있다.
- `~/.hermes/.env`에 `DISCORD_ALLOWED_USERS`가 있다.
- Discord 서버 멤버 목록에서 `Hermes`가 온라인이다.
- `@Hermes ping`에 `pong` 응답이 온다.

## 20. 정말 마지막으로 딱 외울 것

한 문장 요약:

> Android 폰 안에 Termux라는 작은 작업실을 만들고, 그 안에 Hermes를 설치한 뒤, gateway를 켜서 Telegram과 Discord 창구를 연결하면 됩니다.

딱 외워둘 핵심:

- Termux = 작업실
- Hermes = AI 비서
- gateway = 메시지 배달부
- bot token = 문 열쇠
- allowed users = 출입 명단
- `.env` = 비밀 열쇠 보관함
- `config.yaml` = 행동 규칙표

그리고 가장 많이 틀리는 부분은 다시 한 번 이것입니다.

> **Discord token은 `config.yaml`이 아니라 `~/.hermes/.env`에 넣습니다.**

## 참고 링크

- [scrcpy 공식 GitHub](https://github.com/Genymobile/scrcpy)
- [Termux 공식 사이트](https://termux.dev)
- [Hermes Agent GitHub](https://github.com/NousResearch/hermes-agent)
- [Hermes Discord Setup 공식 문서](https://github.com/nousresearch/hermes-agent/blob/main/website/docs/user-guide/messaging/discord.md)
- [Hermes Telegram Setup 공식 문서](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)
