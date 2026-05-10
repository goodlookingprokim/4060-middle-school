---
title: "2026년 5월 11일(월) Android 폰에서 Hermes Agent 설치하고 Telegram + Discord까지 연결하기"
description: "집에서 놀고 있는 안드로이드폰에 Hermes Agent를 설치하고, Telegram과 Discord에서 실제로 대화가 오가도록 연결하는 과정을 초보자 기준으로 정리합니다."
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

집에서 한동안 쓰지 않고 놓아둔 안드로이드폰이 있다면, 그 폰을 그냥 서랍에 넣어두기보다 작은 AI 작업 장치로 다시 써볼 수 있습니다. 핵심은 안드로이드폰 안에 Termux라는 작은 Linux 작업실을 만들고, 그 안에 Hermes Agent를 설치한 뒤, Telegram과 Discord를 연결해 실제로 말을 걸고 답을 받게 만드는 것입니다.

처음 보면 복잡해 보이지만 구조는 단순합니다. MacBook은 화면을 보고 조작하는 도구이고, Android 폰은 실제 설치와 실행이 일어나는 자리이며, Telegram과 Discord는 Hermes와 대화하는 창구입니다. 이 글은 그 과정을 초보자 기준으로 끝까지 따라갈 수 있게 정리한 실습형 매뉴얼입니다.

## 먼저 결론

- 안드로이드폰에 Hermes를 올리는 핵심은 **Termux 안에 Hermes Agent를 설치하고, gateway를 통해 Telegram과 Discord를 연결하는 것**입니다.
- 초보자라면 폰만 들고 하기보다 **MacBook + scrcpy** 조합으로 화면을 보며 설치하는 쪽이 훨씬 쉽습니다.
- 이번 정리에서 특히 중요한 포인트는 **Discord 토큰 위치, `discord.py` 의존성, gateway 재시작 흐름**까지 실제 동작 기준으로 확인했다는 점입니다.

## 0. 가장 쉽게 이해하기

전체 구조는 이렇게 보면 됩니다.

MacBook  
→ scrcpy로 Android 폰 화면을 보고 조작  
→ adb로 폰에 명령 전송

Android Phone  
→ Termux라는 작은 Linux 작업실 실행  
→ Termux 안에 Hermes Agent 설치  
→ Hermes gateway 실행

Telegram / Discord  
→ 사용자가 봇에게 메시지 전송  
→ Hermes gateway가 메시지를 받아 Hermes Agent에 전달  
→ Hermes Agent가 답장을 만들어 다시 Telegram / Discord로 전송

파인만식으로 풀면 아래처럼 이해하면 됩니다.

- `Termux`는 Android 폰 안에 만든 작은 Linux 작업실입니다.
- `Hermes Agent`는 그 작업실 안에 설치한 AI 비서입니다.
- `gateway`는 Telegram, Discord와 Hermes 사이에서 메시지를 배달하는 안내 데스크입니다.
- `bot token`은 봇 계정으로 로그인하기 위한 열쇠입니다.
- `ALLOWED_USERS`는 봇을 사용할 수 있는 사람의 출입 명단입니다.
- `scrcpy`는 MacBook으로 Android 화면을 보면서 마우스와 키보드로 조작하게 해주는 도구입니다.

## 1. 중요한 보안 원칙

봇 토큰은 사실상 비밀번호입니다.

절대 하지 말아야 할 것은 아래와 같습니다.

- 봇 토큰을 GitHub에 올리기
- 봇 토큰을 공개 문서에 적기
- 봇 토큰을 단체 채팅방에 붙여넣기
- 스크린샷에 토큰이 보이게 두기
- `config.yaml`에 아무 생각 없이 토큰을 넣고 공유하기

이번 실습에서 특히 중요했던 결론은 이것입니다.

**Discord 봇 토큰은 `~/.hermes/config.yaml`이 아니라 `~/.hermes/.env`에 넣습니다.**

Hermes 공식 문서 기준으로도 Discord 인증 정보는 `~/.hermes/.env`의 `DISCORD_BOT_TOKEN`과 `DISCORD_ALLOWED_USERS`에 두는 쪽이 맞습니다. `config.yaml`은 주로 동작 방식 설정용에 가깝습니다.

만약 토큰이 이미 다른 사람에게 보였거나 채팅에 남았다면, Discord Developer Portal에서 즉시 토큰을 재발급해야 합니다.

## 2. 준비물

필수 준비물은 아래 정도입니다.

- macOS가 설치된 MacBook
- Android 폰
- 데이터 전송이 되는 USB 케이블
- Android 앱: Termux
- Telegram 계정
- Discord 계정
- 인터넷 연결
- Hermes에서 사용할 AI 모델/API 설정

권장 항목:

- Android 개발자 옵션에서 USB 디버깅 켜기
- Android 배터리 설정에서 Termux 배터리 최적화 제외
- 설치 중에는 폰을 충전기에 연결
- MacBook 터미널과 Android Termux 화면을 동시에 볼 수 있게 scrcpy 사용

## 3. MacBook에서 Android 화면 미러링 준비

### 3.1 Homebrew 설치

Mac에 Homebrew가 없다면 터미널에서 실행합니다.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Apple Silicon Mac에서는 설치 후 아래도 실행합니다.

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Intel Mac이면 보통 아래 경로를 씁니다.

```bash
eval "$(/usr/local/bin/brew shellenv)"
```

### 3.2 scrcpy와 adb 설치

```bash
brew install scrcpy android-platform-tools
```

설치 확인:

```bash
scrcpy --version
adb version
```

### 3.3 Android에서 USB 디버깅 켜기

Android 폰에서 다음 순서로 설정합니다.

1. `설정`을 엽니다.
2. `휴대전화 정보` 또는 `휴대폰 정보`로 들어갑니다.
3. `빌드 번호`를 7번 연속으로 누릅니다.
4. 개발자 옵션이 켜졌다는 메시지가 나오면 뒤로 갑니다.
5. `설정 -> 시스템 -> 개발자 옵션` 또는 `설정 -> 개발자 옵션`으로 들어갑니다.
6. `USB 디버깅`을 켭니다.
7. 삼성/샤오미 계열은 필요하면 `USB 디버깅(보안 설정)`도 켭니다.

USB로 MacBook에 연결하면 폰 화면에 `USB 디버깅을 허용하시겠습니까?` 같은 팝업이 뜹니다. `허용`을 누릅니다.

### 3.4 adb 연결 확인

```bash
adb devices
```

정상 예시:

```text
List of devices attached
RF9N800SGKR device
```

`unauthorized`가 나오면 폰 화면에서 USB 디버깅 허용 팝업을 다시 확인합니다.

### 3.5 scrcpy 실행

```bash
scrcpy --stay-awake --window-title Hermes-Android-Debug
```

이제 MacBook에서 Android 화면을 보고, 마우스와 키보드로 조작할 수 있습니다.

## 4. Android에 Termux 준비

Termux는 Android 안에서 Linux 명령어를 실행하게 해주는 터미널 앱입니다. 루팅은 필요 없습니다.

Termux를 실행한 뒤 패키지를 업데이트합니다.

```bash
pkg update
pkg upgrade -y
```

Hermes 설치에 필요한 기본 도구를 설치합니다.

```bash
pkg install -y git python clang rust make pkg-config libffi openssl nodejs ripgrep ffmpeg curl
pkg install -y python-psutil
```

## 5. Hermes Agent 설치

### 5.1 Hermes 저장소 받기

Termux에서 실행합니다.

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git ~/.hermes/hermes-agent
cd ~/.hermes/hermes-agent
```

이미 clone했는데 submodule 없이 받았다면 아래를 실행합니다.

```bash
git submodule update --init --recursive
```

### 5.2 Python 가상환경 만들기

Hermes 전용 Python 환경을 따로 만듭니다.

```bash
python -m venv --system-site-packages venv-termux
source venv-termux/bin/activate
```

성공하면 프롬프트 앞에 이런 표시가 붙습니다.

```text
(venv-termux)
```

### 5.3 Android API 레벨 설정

일부 Rust/Python 패키지는 Android 버전을 알아야 빌드됩니다.

```bash
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
echo "$ANDROID_API_LEVEL"
```

Android 12는 보통 `31`이 나옵니다.

### 5.4 pip 업그레이드

```bash
python -m pip install --upgrade pip setuptools wheel
```

### 5.5 Termux용 Hermes 설치

중요합니다. Android/Termux에서는 일반 PC처럼 무조건 `.[all]`을 쓰면 실패할 수 있습니다. 실습에서는 Termux용 extras를 사용했습니다.

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

설치 중에는 아래 패키지들이 오래 빌드될 수 있습니다.

- `jiter`
- `pydantic-core`
- `cryptography`
- `rpds-py`
- `maturin`

폰 성능에 따라 수십 분 걸릴 수 있습니다. 화면이 멈춘 것처럼 보여도 컴파일 중일 수 있으니 충분히 기다립니다.

### 5.6 `hermes` 명령 연결 확인

```bash
hermes --version
```

만약 `hermes` 명령이 없거나 예전 가상환경을 가리킨다면 아래 복구 명령을 사용합니다.

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
ln -sf "$PWD/venv-termux/bin/hermes" "$PREFIX/bin/hermes"
hash -r
hermes --version
```

## 6. Hermes 기본 설정

Hermes 설정 파일은 주로 두 곳입니다.

```text
~/.hermes/.env
 -> 토큰, API 키, 사용자 ID 같은 비밀값

~/.hermes/config.yaml
 -> 봇 동작 방식, 응답 방식, 채널 규칙 같은 구조화 설정
```

초보자는 이렇게 기억하면 됩니다.

- `.env` = 열쇠 보관함
- `config.yaml` = 행동 규칙표

비밀값은 되도록 `.env`에 둡니다.

## 7. Telegram bot 만들기

### 7.1 BotFather에서 bot 생성

Telegram에서 `@BotFather`를 엽니다.

순서:

1. `/newbot`
2. 봇 이름 입력
3. 봇 username 입력
4. BotFather가 bot token 반환
5. 이 token을 안전한 곳에 보관

### 7.2 내 Telegram user ID 찾기

Hermes는 Telegram username이 아니라 숫자 ID로 사용자를 구분합니다.

`@userinfobot` 같은 ID 확인 bot에게 메시지를 보내 숫자 ID를 확인합니다.

예시:

```text
123456789
```

## 8. Hermes에 Telegram 연결하기

### 8.1 설정 마법사 사용

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
hermes gateway setup
```

설정 중 Telegram을 선택하고 다음 값을 입력합니다.

- BotFather가 준 Telegram bot token
- 내 Telegram 숫자 user ID

### 8.2 직접 `.env`에 넣는 방법

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

## 9. Discord bot 만들기

### 9.1 Discord Developer Portal에서 앱 생성

브라우저에서 접속합니다.

https://discord.com/developers/applications

순서:

1. `New Application` 클릭
2. 이름 입력, 예: Hermes
3. 앱 생성
4. 왼쪽 메뉴에서 Bot 이동
5. Bot 생성 또는 기존 Bot 설정 확인

### 9.2 Privileged Gateway Intents 켜기

Discord Bot 페이지에서 아래 항목을 켭니다.

- Presence Intent
- Server Members Intent
- Message Content Intent

특히 `Message Content Intent`가 꺼져 있으면 메시지 내용을 읽지 못할 수 있습니다.

### 9.3 Bot token 받기

Bot 페이지에서 `Reset Token` 또는 `Copy Token`을 사용해 토큰을 받습니다.

이 토큰도 비밀번호입니다. 절대 공개 문서에 적지 않는 것이 원칙입니다.

### 9.4 Bot을 서버에 초대

Developer Portal의 `Installation` 또는 OAuth2 메뉴에서 초대 링크를 만듭니다.

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

초대 직후에는 서버 멤버 목록에 보이지만 오프라인일 수 있습니다. 아직 Android Termux의 Hermes gateway가 Discord bot token으로 로그인하지 않았기 때문입니다.

## 10. Discord user ID와 channel ID 찾기

Hermes는 Discord username이 아니라 숫자 ID를 사용합니다.

### 10.1 Developer Mode 켜기

Discord에서:

`User Settings -> Advanced -> Developer Mode ON`

### 10.2 내 user ID 복사

내 프로필이나 메시지를 오른쪽 클릭하고 `Copy User ID`를 누릅니다.

예시:

```text
123456789012345678
```

### 10.3 channel ID 복사

Hermes가 기본으로 사용할 채널을 오른쪽 클릭하고 `Copy Channel ID`를 누릅니다.

예시:

```text
1503049189528174746
```

## 11. Hermes에 Discord 연결하기

이번 실습에서 가장 중요하게 수정된 부분입니다.

잘못 이해하기 쉬운 점은 이것입니다.

**Discord bot token을 `~/.hermes/config.yaml`에 넣는 것이 핵심이 아닙니다.**

권장 위치는 아래입니다.

```text
~/.hermes/.env
```

### 11.1 `.env` 열기

```bash
nano ~/.hermes/.env
```

### 11.2 Discord 설정 추가

실제 값은 본인의 값으로 바꿉니다.

```text
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
DISCORD_ALLOWED_USERS=YOUR_DISCORD_USER_ID
DISCORD_HOME_CHANNEL=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
```

여러 사용자를 허용하려면 쉼표로 구분합니다.

```text
DISCORD_ALLOWED_USERS=111111111111111111,222222222222222222
```

### 11.3 `.env` 값이 들어갔는지 확인

토큰을 그대로 출력하면 위험하므로, 길이만 확인합니다.

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

## 12. Discord 의존성 확인과 설치

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

## 13. Hermes gateway 실행

### 13.1 foreground로 실행

처음에는 화면에 로그가 보이도록 실행하는 것이 좋습니다.

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
hermes gateway run
```

화면에 아래처럼 나오면 gateway가 실행 중입니다.

```text
Hermes Gateway Starting...
Messaging platforms + cron scheduler
Press Ctrl+C to stop
```

### 13.2 background로 실행

계속 켜두고 싶으면 로그 파일을 남기면서 background로 실행합니다.

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

### 13.3 gateway 재시작

문제 해결 후 다시 시작할 때 사용합니다.

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

## 14. Telegram 테스트

Telegram bot에게 메시지를 보냅니다.

```text
ping
```

성공 예시:

- 사용자: `ping`
- Hermes: `pong.`

이번 실습에서는 Telegram에서 `ping`을 보낸 뒤 Hermes bot이 `pong.`으로 응답했습니다. 이것으로 Telegram 연결은 정상으로 확인했습니다.

## 15. Discord 온라인 확인과 ping 테스트

### 15.1 온라인 확인

Discord 서버의 오른쪽 멤버 목록을 봅니다.

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

이번 실습에서는 `.env`에 Discord token과 allowed user를 제대로 넣고 gateway를 재시작한 뒤 `Hermes, 온라인`이 확인되었습니다.

### 15.2 Discord ping 테스트

채널에서 Hermes를 멘션하고 ping을 보냅니다.

```text
@Hermes ping
```

성공 예시:

- `Bluelion: @Hermes ping`
- `Hermes: pong`

이번 실습에서는 Hermes가 자동으로 `ping` 스레드를 만들고, 그 안에서 `pong`으로 응답했습니다. 메시지에 체크 반응도 붙어 Discord 이벤트 처리가 정상임을 확인했습니다.

## 16. 이번 실습에서 실제로 막혔던 문제와 해결

### 문제 1. adb에서 Android가 안 보임

증상:

```text
List of devices attached
```

목록이 비어 있거나 `unauthorized`가 나옵니다.

해결:

```bash
adb kill-server
adb start-server
adb devices
```

그리고 폰 화면에서 USB 디버깅 허용 팝업을 다시 확인합니다.

### 문제 2. scrcpy 화면이 안 뜸

확인:

```bash
adb devices
scrcpy --version
```

다시 실행:

```bash
scrcpy --stay-awake --window-title Hermes-Android-Debug
```

### 문제 3. Hermes 명령이 잘못된 가상환경을 가리킴

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
ln -sf "$PWD/venv-termux/bin/hermes" "$PREFIX/bin/hermes"
hash -r
hermes --version
```

### 문제 4. OpenAI SDK가 설치되지 않음

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
python -m pip install -e '.[termux]' -c constraints-termux.txt
hermes --version
```

정상 예시에서는 `OpenAI SDK: 2.36.0` 같은 정보가 보일 수 있습니다.

### 문제 5. Rust/native build가 오래 걸림

증상:

- `Building wheel for pydantic-core ...`
- `Building wheel for cryptography ...`
- `Building wheel for jiter ...`

해결:

- 충전기를 연결합니다.
- Termux를 닫지 않습니다.
- 10분 이상 화면 변화가 적어도 기다립니다.
- Android가 절전 모드로 들어가지 않게 합니다.

### 문제 6. Telegram bot이 답하지 않음

확인할 것:

```bash
nano ~/.hermes/.env
```

확인 항목:

```text
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ALLOWED_USERS=...
```

주의:

- Telegram username이 아니라 숫자 ID를 넣어야 합니다.
- token 앞뒤에 공백이 없어야 합니다.
- gateway를 재시작해야 합니다.

재시작:

```bash
pkill -f "hermes gateway run" 2>/dev/null || true
setsid -f hermes gateway run > ~/.hermes/gateway.log 2>&1
```

### 문제 7. Discord 봇이 서버에는 있는데 오프라인임

증상:

```text
오프라인 — 1: Hermes
```

원인 후보:

1. Hermes gateway가 실행되지 않음
2. Discord token이 `.env`에 없음
3. `discord.py`가 설치되지 않음
4. token이 틀렸거나 재발급됨
5. Android가 Termux background 작업을 죽임

패키지 확인:

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
python - <<'PY'
import importlib
for name in ("discord", "discord.ext", "aiohttp"):
    try:
        mod = importlib.import_module(name)
        print(f"{name}: OK {getattr(mod, '__version__', '')}")
    except Exception as exc:
        print(f"{name}: FAIL {type(exc).__name__}: {exc}")
PY
```

해결:

```bash
python -m pip install 'discord.py>=2.7.1,<3'
```

### 문제 8. Discord token을 `config.yaml`에 넣었는데 봇이 안 켜짐

이번 실습에서 핵심적으로 수정한 부분입니다.

정답:

**Discord 인증 정보는 `~/.hermes/.env`에 넣습니다.**

`.env` 예시:

```text
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
DISCORD_ALLOWED_USERS=YOUR_DISCORD_USER_ID
DISCORD_HOME_CHANNEL=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
```

반면 `config.yaml`의 `discord:` 섹션은 아래 같은 **동작 설정**에 가깝습니다.

```yaml
discord:
  require_mention: true
  free_response_channels: ""
  auto_thread: true
  reactions: true
```

비유하면:

- `.env` = 봇 계정으로 로그인하는 열쇠
- `config.yaml` = 로그인한 봇이 어떻게 행동할지 적은 규칙표

### 문제 9. Discord gateway 로그에 PyNaCl 경고가 나옴

증상:

```text
WARNING discord.client: PyNaCl is not installed, voice will NOT be supported
WARNING discord.client: davey is not installed, voice will NOT be supported
```

의미는 음성 기능이 비활성이라는 뜻입니다. 텍스트 채팅 bot 온라인과 `ping/pong` 테스트에는 치명적인 문제는 아닙니다.

### 문제 10. Discord에서 ping은 보냈지만 답장이 안 보임

이번 실습에서는 Hermes가 `auto_thread` 설정 때문에 채널 본문에 바로 답하지 않고 `ping` 스레드를 만들었습니다.

확인할 곳:

- 채널 왼쪽 목록의 `ping` 스레드
- 원본 메시지 아래 스레드 메시지

Hermes 응답이 스레드 안에 있을 수 있습니다.

### 문제 11. Android가 Termux를 죽여서 봇이 다시 오프라인됨

원인:

- Android 배터리 최적화
- Termux를 최근 앱에서 밀어서 종료
- 화면 잠금 후 background 제한

권장 설정:

`설정 -> 앱 -> Termux -> 배터리 -> 제한 없음`

그리고 Termux를 최근 앱에서 닫지 않습니다.

## 17. 전체 복구용 명령 모음

문제가 생겼을 때 아래 순서로 확인합니다.

### 17.1 Termux에서 Hermes 환경 진입

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
```

### 17.2 Hermes 버전 확인

```bash
hermes --version
```

### 17.3 Python 패키지 확인

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

### 17.4 Discord `.env` 마스킹 확인

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

### 17.5 gateway 재시작

```bash
pkill -f "hermes gateway run" 2>/dev/null || true
sleep 2
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
sleep 10
hermes gateway status
tail -n 120 ~/.hermes/gateway-discord.log
```

## 18. 성공 기준 체크리스트

### MacBook / Android 연결

- `adb devices`에서 Android가 `device`로 보인다.
- `scrcpy`로 Android 화면이 보인다.
- MacBook 키보드로 Termux에 입력할 수 있다.

### Hermes 설치

- `hermes --version`이 실행된다.
- `OpenAI SDK` 또는 사용 중인 provider 관련 패키지가 정상 표시된다.
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

## 19. 초보자용 핵심 요약

한 문장 요약:

> Android 폰 안에 Termux라는 작은 Linux 작업실을 만들고, 그 안에서 Hermes gateway를 켜면 Telegram과 Discord 봇이 Hermes AI 비서와 연결됩니다.

외워야 할 핵심:

- Termux = 작업실
- Hermes = AI 비서
- gateway = 메시지 배달부
- bot token = 문 열쇠
- allowed users = 출입 명단
- `.env` = 비밀 열쇠 보관함
- `config.yaml` = 행동 규칙표

가장 많이 틀리는 부분:

**Discord token은 `config.yaml`이 아니라 `~/.hermes/.env`에 넣습니다.**

## 20. 참고 링크

- [scrcpy 공식 GitHub](https://github.com/Genymobile/scrcpy)
- [Termux 공식 사이트](https://termux.dev)
- [Hermes Agent GitHub](https://github.com/NousResearch/hermes-agent)
- [Hermes Discord Setup 공식 문서](https://github.com/nousresearch/hermes-agent/blob/main/website/docs/user-guide/messaging/discord.md)
- [Hermes Telegram Setup 공식 문서](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)

## 21. 배포 전 주의

이 문서는 교육용으로 배포할 수 있도록 실제 토큰을 포함하지 않습니다.

배포 전 반드시 확인할 것:

- 문서 안에 실제 Telegram token이 없는가?
- 문서 안에 실제 Discord token이 없는가?
- 스크린샷에 token이 보이지 않는가?
- `.env` 파일을 공유하지 않았는가?
- GitHub에 `.env`를 올리지 않았는가?

토큰이 한 번이라도 노출됐다면 아래처럼 바로 교체합니다.

1. Telegram은 BotFather에서 token을 revoke/regenerate
2. Discord는 Developer Portal에서 bot token reset
3. `~/.hermes/.env`의 token을 새 값으로 교체
4. Hermes gateway 재시작

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
pkill -f "hermes gateway run" 2>/dev/null || true
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
```
