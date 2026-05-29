---
title: "2026년 5월 11일(월) Android 폰에서 Hermes Agent 설치하고 Telegram + Discord 연결하기 1편"
description: "Android 폰의 Termux 안에 Hermes Agent를 설치하고, Telegram과 Discord에서 실제로 답장하는 상태까지 만드는 과정을 2026-05-30 실습 기준으로 다시 정리한 초보자용 가이드입니다."
tags:
  - middle-school
  - hermes
  - android
  - telegram
  - discord
created: "2026-05-11"
modified: "2026-05-30"
publish: true
cssclasses:
  - field-note
---

# Android 폰에서 Hermes Agent 설치하고 Telegram + Discord 연결하기 1편

초보자를 위한 실습형 매뉴얼  
작성 기준: 2026-05-30 실습 기록, Android 12, Termux, macOS, scrcpy, Hermes Agent

> 이 글은 2부작의 1편입니다. 1편에서는 Android 폰 안에 Hermes를 설치하고, Telegram과 Discord에서 실제로 답하게 만드는 데 집중합니다. OpenClaw를 붙여 팀장-팀원 구조로 운영하는 내용은 [2편](./2026-05-11-hermes-android-part-2)에서 이어집니다.

이번 글의 목표는 아주 분명합니다.

집에 있는 Android 폰 하나를 작은 실행 장치처럼 써서,
Hermes가 Telegram과 Discord에서 실제로 답하게 만드는 것입니다.

처음 보면 복잡해 보이지만,
가만히 뜯어보면 구조는 생각보다 단순합니다.

## 먼저 가장 쉽게 이해하면

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

조금 더 일상적으로 바꾸면 이렇게 볼 수 있습니다.

- `Termux`는 Android 폰 안에 만든 작은 작업실입니다.
- `Hermes Agent`는 그 작업실 안에 앉아 있는 AI 비서입니다.
- `gateway`는 Telegram, Discord와 Hermes 사이를 오가는 안내 데스크입니다.
- `bot token`은 봇 계정으로 로그인하는 열쇠입니다.
- `scrcpy`는 MacBook에서 Android 폰 화면을 보며 대신 조작하게 해주는 리모컨 같은 도구입니다.

## 이번 실습에서 가장 먼저 기억할 핵심

이번에는 실제로 설치하고, 고치고, 다시 살려보면서 몇 가지가 아주 또렷해졌습니다.

```text
1. 봇 토큰은 비밀번호다. 문서, 채팅, 스크린샷에 남기지 않는다.
2. Discord bot token은 ~/.hermes/config.yaml이 아니라 ~/.hermes/.env에 둔다.
3. 봇이 서버에 초대되어 있어도 gateway가 실행되지 않으면 오프라인이다.
4. Discord의 Message Content Intent가 꺼져 있으면 봇이 채널 대화를 읽지 못한다.
5. 서버 권한과 채널 권한이 둘 다 맞아야 한다.
6. Hermes가 특정 사람에게만 답한다면 DISCORD_ALLOWED_USERS부터 의심한다.
7. 상태 명령만 믿지 말고, 실제 Telegram/Discord 화면에서 답장이 오는지 확인한다.
8. Telegram/Discord 문제처럼 보여도 먼저 Hermes 본체가 직접 대답하는지 확인한다.
```

초보자 기준으로는 아래처럼 외워도 충분합니다.

```text
.env = 열쇠 보관함
config.yaml = 행동 규칙표
Intents = 봇의 눈
Permissions = 봇이 드나드는 문
ALLOWED_USERS = 사람 출입 명단
```

## 1. 보안 원칙부터 먼저

봇 토큰은 비밀번호입니다.

그래서 아래는 하지 않는 편이 좋습니다.

- 봇 토큰을 GitHub에 올리기
- 공개 문서에 토큰 적기
- 단체 채팅방에 토큰 붙여넣기
- 스크린샷에 토큰이 보이게 두기
- 설정 파일을 통째로 공유하기

이번 실습에서 특히 중요했던 결론은 이것입니다.

> Discord bot token은 `~/.hermes/config.yaml`이 아니라 `~/.hermes/.env`에 넣는다.

쉽게 말하면,
`.env`는 열쇠 보관함이고,
`config.yaml`은 행동 규칙표입니다.

집 열쇠를 행동 규칙표에 적어놓는 사람은 없죠.
그런 느낌으로 이해하면 됩니다.

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
- `scrcpy`로 Mac과 Android 화면을 같이 보기

## 3. MacBook에서 Android 화면 미러링 준비

### 3-1. Homebrew 설치

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

### 3-2. scrcpy와 adb 설치

```bash
brew install scrcpy android-platform-tools
```

확인:

```bash
scrcpy --version
adb version
```

### 3-3. Android에서 USB 디버깅 켜기

1. `설정`
2. `휴대전화 정보`
3. `빌드 번호` 7번 연속 터치
4. `개발자 옵션` 열기
5. `USB 디버깅` 켜기

USB 연결 뒤 폰에 `USB 디버깅 허용` 팝업이 뜨면 허용합니다.

### 3-4. adb 연결 확인

```bash
adb devices
```

정상 예시:

```text
List of devices attached
RF9N800SGKR    device
```

`unauthorized`가 보이면 폰 화면의 허용 팝업을 다시 확인합니다.

### 3-5. scrcpy 실행

```bash
scrcpy --stay-awake --window-title Hermes-Android-Debug
```

이제 MacBook에서 Android 화면을 보고 마우스와 키보드로 조작할 수 있습니다.

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

## 5. Hermes Agent 설치

### 5-1. 저장소 받기

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git ~/.hermes/hermes-agent
cd ~/.hermes/hermes-agent
```

이미 clone했는데 submodule이 빠졌다면:

```bash
git submodule update --init --recursive
```

### 5-2. 가상환경 만들기

```bash
python -m venv --system-site-packages venv-termux
source venv-termux/bin/activate
```

정상이라면 프롬프트 앞에 `(venv-termux)`가 붙습니다.

### 5-3. Android API 레벨 설정

```bash
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
echo "$ANDROID_API_LEVEL"
```

Android 12면 보통 `31`이 나옵니다.

### 5-4. pip 업그레이드

```bash
python -m pip install --upgrade pip setuptools wheel
```

### 5-5. Termux용 Hermes 설치

여기서 많이 틀립니다.
Android/Termux에서는 일반 PC처럼 무조건 `.[all]`을 쓰면 실패할 수 있습니다.
이번 실습에서는 Termux용 extras를 썼습니다.

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

설치 중 아래 패키지들이 오래 걸릴 수 있습니다.

- `jiter`
- `pydantic-core`
- `cryptography`
- `rpds-py`
- `maturin`

폰 성능에 따라 꽤 오래 걸립니다.
이럴 때는 "멈춘 것 같은데요"라고 생각하기 쉬운데,
실제로는 뒤에서 열심히 컴파일 중인 경우가 많습니다.

쉽게 말하면,
압력밥솥이 조용하다고 밥이 안 되는 게 아닌 것과 비슷합니다.
조금 기다려줘야 합니다.

### 5-6. hermes 명령 확인

```bash
hermes --version
```

정상이라면 버전 정보가 나옵니다.

명령이 꼬였을 때 복구:

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
ln -sf "$PWD/venv-termux/bin/hermes" "$PREFIX/bin/hermes"
hash -r
hermes --version
```

## 6. Hermes 기본 설정

Hermes 설정 파일은 보통 두 곳을 먼저 기억하면 됩니다.

```text
~/.hermes/.env
 -> 토큰, API 키, 사용자 ID 같은 비밀값

~/.hermes/config.yaml
 -> 봇 동작 방식, 응답 방식, 채널 규칙 같은 설정
```

초보자용으로 다시 줄이면 이렇습니다.

```text
.env = 열쇠 보관함
config.yaml = 행동 규칙표
```

## 7. Telegram bot 만들기

### 7-1. BotFather에서 bot 생성

Telegram에서 `@BotFather`를 열고 아래 순서로 진행합니다.

```text
/newbot
```

1. 봇 이름 입력
2. 봇 username 입력 (`something_bot` 형태)
3. BotFather가 bot token 표시
4. token을 안전한 곳에 보관

### 7-2. 내 Telegram user ID 찾기

Hermes는 Telegram username이 아니라 숫자 ID를 씁니다.

`@userinfobot` 같은 ID 확인 bot으로 숫자 ID를 확인합니다.

예시:

```text
123456789
```

## 8. Hermes에 Telegram 연결하기

### 8-1. 설정 마법사 사용

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
hermes gateway setup
```

설정 중 Telegram을 선택하고 아래를 넣습니다.

- BotFather가 준 bot token
- 내 Telegram 숫자 user ID

### 8-2. 직접 `.env`에 넣는 방법

```bash
nano ~/.hermes/.env
```

예:

```bash
TELEGRAM_BOT_TOKEN=1234567890:YOUR_TELEGRAM_BOT_TOKEN
TELEGRAM_ALLOWED_USERS=123456789
```

저장:

```text
Ctrl + O -> Enter -> Ctrl + X
```

## 9. Discord bot 만들기

### 9-1. Discord Developer Portal에서 앱 생성

```text
https://discord.com/developers/applications
```

순서:

1. `New Application`
2. 이름 입력, 예: `Hermes`
3. 앱 생성
4. 왼쪽 메뉴 `Bot`
5. Bot 생성 또는 Bot 설정 확인

### 9-2. Intents 켜기

Discord Bot 페이지에서 아래를 켭니다.

```text
Presence Intent
Server Members Intent
Message Content Intent
```

특히 중요한 건 `Message Content Intent`입니다.
이게 꺼져 있으면 봇이 메시지 내용을 제대로 읽지 못합니다.

초보자용으로는 이렇게 외우면 됩니다.

```text
Intents = 봇의 눈
Permissions = 봇의 문
```

눈이 있어도 문이 잠겨 있으면 못 들어가고,
문이 열려 있어도 눈이 없으면 뭘 읽어야 할지 모릅니다.

### 9-3. Bot token 받기

Bot 페이지에서 `Reset Token` 또는 `Copy Token`으로 토큰을 받습니다.

다시 강조하지만,
이 토큰은 비밀번호입니다.

### 9-4. Bot을 서버에 초대

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

운영 채널에서 Hermes가 읽고 말하려면,
서버 권한과 채널 권한이 둘 다 맞아야 합니다.

## 10. Discord user ID와 channel ID 찾기

### 10-1. Developer Mode 켜기

```text
User Settings -> Advanced -> Developer Mode ON
```

### 10-2. user ID 복사

내 프로필이나 메시지를 오른쪽 클릭하고 `Copy User ID`.

### 10-3. channel ID 복사

사용할 채널을 오른쪽 클릭하고 `Copy Channel ID`.

## 11. Hermes에 Discord 연결하기

이번 실습에서 가장 중요하게 수정된 부분입니다.

잘못 이해하기 쉬운 점:

> Discord bot token을 `config.yaml`에 넣는 것이 핵심이 아닙니다.

권장 위치:

```text
~/.hermes/.env
```

### 11-1. `.env` 열기

```bash
nano ~/.hermes/.env
```

### 11-2. Discord 설정 추가

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

### 11-3. 왜 `.env`가 중요한가

다시 아주 쉽게 말하면 이렇습니다.

- `.env` = 로그인 열쇠
- `config.yaml` = 로그인 후 행동 규칙

즉,
열쇠는 `.env`에,
행동 규칙은 `config.yaml`에 둔다고 이해하면 됩니다.

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
```

해결:

```bash
python -m pip install 'discord.py>=2.7.1,<3'
```

## 13. Hermes gateway 실행

### 13-1. foreground로 실행

처음에는 로그를 눈으로 보는 편이 좋습니다.

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
hermes gateway run
```

### 13-2. background로 실행

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

### 13-3. 재시작

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
pkill -f "hermes gateway run" 2>/dev/null || true
sleep 2
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
sleep 10
hermes gateway status
```

## 14. Telegram 테스트

Telegram bot에게 아래를 보냅니다.

```text
ping
```

성공 예시:

```text
사용자: ping
Hermes: pong.
```

## 15. Discord 온라인 확인과 ping 테스트

Discord 멤버 목록에서 Hermes가 온라인인지 먼저 봅니다.

성공 상태 예시:

```text
온라인 — 2
Bluelion
Hermes
```

그다음 채널에서 테스트합니다.

```text
@Hermes ping
```

성공 예시:

```text
Bluelion: @Hermes ping
Hermes: pong
```

이번 실습에서는 Hermes가 `ping` 스레드를 따로 만들고 그 안에서 `pong`으로 응답한 경우도 있었습니다.
그러니 채널 본문에 바로 안 보이면 스레드도 같이 봐야 합니다.

## 16. 여기서 자주 막히는 문제들

### 1) Hermes가 특정 사람에게만 답함
이건 대개 `DISCORD_ALLOWED_USERS`가 너무 좁게 잡혀 있을 때 생깁니다.

### 2) Discord 봇이 오프라인임
아래를 순서대로 봅니다.

- gateway가 실행 중인가
- `.env`에 token이 들어갔는가
- `discord.py`가 설치됐는가
- Android가 Termux를 죽이지 않았는가

### 3) token을 `config.yaml`에 넣어둠
이건 다시 `.env`로 옮겨야 합니다.

### 4) Telegram/Discord 문제 같지만 Hermes 본체가 고장남
이번 실습에서는 `'NoneType' object is not iterable` 오류도 있었습니다.
이럴 때는 메신저 쪽보다 먼저 Hermes 본체가 직접 대답하는지 봐야 합니다.

예:

```bash
hermes chat \
 --provider openai-codex \
 --model gpt-5.5 \
 --toolsets clarify \
 --ignore-rules \
 --quiet \
 --query "한국어로 OK라고만 답하세요."
```

성공 기준:

```text
OK
```

쉽게 말하면,
전화선 문제인지 상담원 문제인지 헷갈릴 때,
먼저 상담원이 자기 목소리로 말할 수 있는지 확인하는 것과 비슷합니다.

## 17. 1편 핵심 정리

- Android 폰 안에 Termux 작업실을 만든다
- 그 안에 Hermes를 설치한다
- Telegram과 Discord 열쇠는 `.env`에 둔다
- Discord는 Intents와 권한을 둘 다 확인한다
- gateway를 켜고 실제 화면에서 답장이 오는지 확인한다
- 메신저 문제가 의심돼도 먼저 Hermes 본체가 직접 대답하는지 본다

## 생활 속 쉬운 예시로 표현하는 용어 설명

### Termux
Android 폰 안에 만든 작은 작업실입니다.
거실 한쪽에 접이식 책상을 펴서 거기서만 따로 일하는 느낌과 비슷합니다.

### gateway
메시지를 받아서 안쪽 비서에게 전달하는 안내 데스크입니다.
병원 접수창구처럼, 바깥 사람 말을 받아 안쪽으로 넘겨주는 역할이라고 보면 됩니다.

### bot token
봇 계정으로 들어가는 열쇠입니다.
현관 비밀번호처럼 생각하면 됩니다.

### Intents
봇이 볼 수 있는 범위를 정해주는 눈입니다.
불을 꺼두면 방에 들어가도 안 보이듯, 이게 없으면 메시지가 있어도 제대로 못 읽습니다.

### Permissions
봇이 드나들 수 있는 문입니다.
아무리 똑똑해도 문이 잠겨 있으면 방에 못 들어갑니다.

### `.env`
비밀 열쇠 보관함입니다.
현관 비밀번호, 금고 비밀번호를 적어두는 작은 수첩 같은 느낌입니다.

### `config.yaml`
행동 규칙표입니다.
가게 직원에게 "손님 오면 먼저 인사하고, 주문은 여기서 받고, 마감은 9시에 해"라고 적어둔 매뉴얼 같은 것입니다.
