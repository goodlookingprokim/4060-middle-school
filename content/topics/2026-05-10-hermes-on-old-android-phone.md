---
title: "2026년 5월 11일(월) Android 폰에서 Hermes Agent 설치하고 Telegram + Discord + OpenClaw 팀 운영까지 연결하기"
description: "Android 폰의 Termux 안에 Hermes Agent를 설치하고, Telegram과 Discord를 연결한 뒤, OpenClaw를 팀장 봇으로 붙여 협업 구조까지 만드는 과정을 초보자 기준으로 정리합니다."
tags:
  - middle-school
  - hermes
  - android
  - telegram
  - discord
  - openclaw
created: "2026-05-10"
modified: "2026-05-11"
publish: true
cssclasses:
  - field-note
---

# Android 폰에서 Hermes Agent 설치하고 Telegram + Discord + OpenClaw 팀 운영까지 연결하기

초보자를 위한 실습형 매뉴얼  
작성 기준: 2026-05-11 실습 기록, Android 12, Termux, macOS, scrcpy, Hermes Agent, OpenClaw

> 목표: Android 폰 안에서 Hermes Agent를 실행하고, Telegram과 Discord에서 Hermes 봇에게 말을 걸면 실제로 답장하게 만든다. 더 나아가 OpenClaw를 Discord 운영 팀장 봇으로 추가해, OpenClaw가 Hermes에게 일을 맡기고 Hermes가 팀원처럼 응답하는 구조까지 만든다.

이번 글은 설치, 오류 해결, Telegram ping 테스트, Discord 봇 온라인 전환, Discord 토큰 위치 수정, `Bluelion` 외 참석자에게 Hermes가 반응하지 않았던 문제, 채널 전체 대화 읽기 권한, OpenClaw 초대와 팀장/팀원 역할 분담, 그리고 봇끼리 대화할 때 무한 반복을 피하는 설정까지 한 번에 정리한 실습형 교육 자료입니다.

---

## 0. 가장 쉽게 이해하기

처음 보면 복잡해 보이지만 구조는 단순합니다.

```text
MacBook
 -> scrcpy로 Android 폰 화면을 보고 조작
 -> adb로 폰에 명령 전송

Android Phone
 -> Termux라는 작은 Linux 작업실 실행
 -> Termux 안에 Hermes Agent 설치
 -> Hermes gateway 실행

Telegram / Discord
 -> 사용자가 봇에게 메시지 전송
 -> Hermes gateway가 메시지를 받아 Hermes Agent에 전달
 -> Hermes Agent가 답장을 만들어 다시 Telegram / Discord로 전송

OpenClaw
 -> MacBook에서 별도 Discord 봇으로 실행
 -> 운영 팀장 역할을 맡음
 -> 필요할 때 @Hermes를 불러 하위 작업을 맡김
 -> Hermes 응답을 확인하고 사람 운영자에게 정리해서 보고
```

파인만식으로 말하면:

- `Termux`는 Android 폰 안에 만든 작은 Linux 작업실입니다.
- `Hermes Agent`는 그 작업실 안에 설치한 AI 비서입니다.
- `gateway`는 Telegram, Discord와 Hermes 사이에서 메시지를 배달하는 안내 데스크입니다.
- `bot token`은 봇 계정으로 로그인하기 위한 열쇠입니다.
- `ALLOWED_USERS`는 봇을 사용할 수 있는 사람의 출입 명단입니다.
- `scrcpy`는 MacBook으로 Android 화면을 보면서 마우스와 키보드로 조작하게 해주는 도구입니다.
- `OpenClaw`는 Discord 운영을 앞에서 이끄는 팀장 봇입니다.
- `Hermes`는 Android 폰 안에서 계속 켜져 있는 실행 담당 팀원 봇입니다.

### 0.1 오늘 실습에서 꼭 기억해야 할 핵심 교훈

오늘 대화와 실제 검증에서 얻은 핵심은 아래입니다.

```text
1. 봇 토큰은 비밀번호다. 문서, 채팅, 스크린샷에 남기지 않는다.
2. Discord bot token은 ~/.hermes/config.yaml이 아니라 ~/.hermes/.env에 둔다.
3. 봇이 서버에 초대되어도 gateway가 실행되지 않으면 오프라인이다.
4. Discord Developer Portal의 Message Content Intent가 꺼져 있으면 봇이 채널 대화를 읽지 못한다.
5. 서버/채널 권한에서 View Channel, Send Messages, Read Message History가 없으면 봇은 말할 수 없다.
6. Hermes가 Bluelion에게만 답했던 이유는 DISCORD_ALLOWED_USERS가 한 사람만 허용했기 때문이다.
7. 채널 전체 운영 봇으로 쓰려면 사용자는 열되, 채널은 좁혀야 한다.
8. 봇끼리 협업시키려면 bot-to-bot 메시지를 무조건 허용하지 말고 mentions 조건으로만 허용한다.
9. OpenClaw는 팀장, Hermes는 팀원이라는 역할 프롬프트가 있어야 대화가 일처럼 정리된다.
10. 상태 명령만 믿지 말고 실제 Discord 화면에서 새 메시지와 새 답장을 확인해야 한다.
```

파인만식으로 더 쉽게 말하면:

```text
.env = 비밀 열쇠 보관함
config.yaml = 행동 규칙표
Discord 권한 = 봇이 들어갈 수 있는 방 열쇠
Intents = 봇이 메시지를 볼 수 있게 허락하는 눈
ALLOWED_USERS = 사람 출입 명단
ALLOWED_CHANNELS = 방 출입 명단
ALLOW_BOTS=mentions = 다른 봇이 내 이름을 불렀을 때만 대답
channel prompt = 이 방에서 각 봇이 맡을 역할표
```

이번 프로젝트의 최종 운영 구조는 다음과 같습니다.

```text
사람 운영자
 -> Discord #수다방에 요청

OpenClaw
 -> 요청을 먼저 판단하는 팀장
 -> 필요하면 @Hermes로 구체적인 하위 작업 지시

Hermes
 -> Android Termux에서 계속 실행되는 팀원
 -> OpenClaw나 사람 운영자가 부르면 짧고 실행 가능한 답변

안전장치
 -> 두 봇 모두 허용 채널을 #수다방으로 제한
 -> 봇끼리는 멘션될 때만 응답
 -> 무한 반복을 피하도록 역할 프롬프트에 1회 답변 원칙 명시
```

---

## 1. 중요한 보안 원칙

봇 토큰은 비밀번호입니다.

절대 하지 말아야 할 것:

- 봇 토큰을 GitHub에 올리기
- 봇 토큰을 공개 문서에 적기
- 봇 토큰을 단체 채팅방에 붙여넣기
- 스크린샷에 토큰이 보이게 두기
- `config.yaml`에 아무 생각 없이 토큰을 넣고 공유하기

이번 실습에서 특히 중요했던 결론:

```text
Discord 봇 토큰은 ~/.hermes/config.yaml이 아니라 ~/.hermes/.env에 넣는다.
```

Hermes 공식 문서 기준으로도 Discord 인증 정보는 `~/.hermes/.env`의 `DISCORD_BOT_TOKEN`과 `DISCORD_ALLOWED_USERS`에 둡니다. `config.yaml`은 주로 동작 방식 설정용입니다.

만약 토큰이 이미 다른 사람에게 보였거나 채팅에 남았다면 Discord Developer Portal에서 토큰을 재발급해야 합니다.

토큰을 재발급하면 예전 토큰은 즉시 무효가 됩니다. 그래서 새 토큰을 받은 직후 `~/.hermes/.env`의 `DISCORD_BOT_TOKEN`을 교체하고 gateway를 다시 시작해야 합니다.

이번 실습에서는 실제로 Discord Developer Portal에서 재로그인과 다단계 인증을 통과한 뒤 봇 토큰을 초기화했습니다. 그 다음 새 토큰만 `~/.hermes/.env`에 교체하고, 이미 잡아 둔 채널 전체 응답 설정은 그대로 보존했습니다.

중요한 차이:

```text
토큰 교체 = DISCORD_BOT_TOKEN만 새 값으로 바꾸는 일
권한 설정 = 누가, 어느 채널에서 Hermes를 쓸 수 있는지 정하는 일
```

토큰을 재발급할 때 권한 설정까지 실수로 되돌리면, 다시 "Bluelion에게만 답하고 다른 참석자에게는 답하지 않는" 상태가 될 수 있습니다.

---

## 2. 준비물

필수:

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
- MacBook 터미널과 Android Termux 화면을 동시에 볼 수 있게 scrcpy 사용

---

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

Mac 터미널에서 실행합니다.

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

---

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
```

실습 중 `psutil` 관련 의존성 안정화를 위해 아래도 설치했습니다.

```bash
pkg install -y python-psutil
```

---

## 5. Hermes Agent 설치

### 5.1 Hermes 저장소 받기

Termux에서 실행합니다.

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git ~/.hermes/hermes-agent
```

폴더로 이동합니다.

```bash
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
```

가상환경을 켭니다.

```bash
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

### 5.6 hermes 명령 연결 확인

```bash
hermes --version
```

정상이라면 Hermes 버전, Python 버전, 관련 패키지 정보가 표시됩니다.

만약 `hermes` 명령이 없거나 예전 가상환경을 가리킨다면 아래 복구 명령을 사용합니다.

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
ln -sf "$PWD/venv-termux/bin/hermes" "$PREFIX/bin/hermes"
hash -r
hermes --version
```

---

## 6. Hermes 기본 설정

Hermes 설정 파일은 주로 두 곳입니다.

```text
~/.hermes/.env
 -> 토큰, API 키, 사용자 ID 같은 비밀값

~/.hermes/config.yaml
 -> 봇 동작 방식, 응답 방식, 채널 규칙 같은 구조화 설정
```

초보자는 이렇게 기억하면 됩니다.

```text
.env = 열쇠 보관함
config.yaml = 행동 규칙표
```

비밀값은 되도록 `.env`에 둡니다.

---

## 7. Telegram bot 만들기

### 7.1 BotFather에서 bot 생성

Telegram에서 `@BotFather`를 엽니다.

아래 순서로 진행합니다.

```text
/newbot
```

1. 봇 이름을 입력합니다.
2. 봇 username을 입력합니다. 보통 `something_bot` 형태입니다.
3. BotFather가 bot token을 보여줍니다.
4. 이 token을 안전한 곳에 보관합니다.

### 7.2 내 Telegram user ID 찾기

Hermes는 Telegram username이 아니라 숫자 ID로 사용자를 구분합니다.

Telegram에서 `@userinfobot` 같은 ID 확인 bot에게 메시지를 보내 숫자 ID를 확인합니다.

예시:

```text
123456789
```

---

## 8. Hermes에 Telegram 연결하기

### 8.1 설정 마법사 사용

Termux에서 실행합니다.

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
hermes gateway setup
```

설정 중 Telegram을 선택하고 다음 값을 입력합니다.

- BotFather가 준 Telegram bot token
- 내 Telegram 숫자 user ID

### 8.2 직접 `.env`에 넣는 방법

설정 마법사가 어렵다면 직접 열어도 됩니다.

```bash
nano ~/.hermes/.env
```

아래처럼 넣습니다. 실제 값은 본인의 값으로 바꿉니다.

```bash
TELEGRAM_BOT_TOKEN=1234567890:YOUR_TELEGRAM_BOT_TOKEN
TELEGRAM_ALLOWED_USERS=123456789
```

저장 후 나옵니다.

```text
Ctrl + O -> Enter -> Ctrl + X
```

---

## 9. Discord bot 만들기

### 9.1 Discord Developer Portal에서 앱 생성

브라우저에서 접속합니다.

```text
https://discord.com/developers/applications
```

순서:

1. `New Application` 클릭
2. 이름 입력, 예: `Hermes`
3. 앱 생성
4. 왼쪽 메뉴에서 `Bot` 이동
5. Bot을 생성하거나 기존 Bot 설정 확인

### 9.2 Privileged Gateway Intents 켜기

Discord Bot 페이지에서 아래 항목을 켭니다.

```text
Presence Intent
Server Members Intent
Message Content Intent
```

특히 중요:

- `Message Content Intent`가 꺼져 있으면 봇이 메시지 내용을 읽지 못할 수 있습니다.
- `Server Members Intent`가 꺼져 있으면 사용자/역할 확인이 실패할 수 있습니다.

변경 후 `Save Changes`를 누릅니다.

### 9.3 Bot token 받기

Bot 페이지에서 `Reset Token` 또는 `Copy Token`을 사용해 토큰을 받습니다.

주의:

```text
이 토큰은 비밀번호입니다. 공개 문서에 적지 마세요.
```

### 9.4 Bot을 서버에 초대

Developer Portal의 `Installation` 또는 `OAuth2` 메뉴에서 초대 링크를 만듭니다.

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

운영 채널에서 Hermes가 "대화를 모두 읽고 자유롭게 답장"하려면 Discord 서버 권한과 채널 권한이 둘 다 맞아야 합니다.

확인할 곳:

```text
Server Settings -> Roles -> Hermes bot role
Channel Settings -> Permissions -> Hermes bot role
```

채널 권한에서 최소한 아래는 허용합니다.

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

주의:

```text
Developer Portal의 Message Content Intent = 메시지 내용을 볼 수 있는 눈
Discord 서버/채널 권한 = 해당 방에 들어가고 말할 수 있는 문

눈과 문 중 하나라도 막히면 봇은 온라인이어도 대화를 제대로 읽거나 답하지 못한다.
```

봇을 원하는 Discord 서버에 초대합니다.

초대 직후에는 봇이 서버 멤버 목록에 보이지만 오프라인일 수 있습니다. 정상입니다. 아직 Android Termux의 Hermes gateway가 Discord bot token으로 로그인하지 않았기 때문입니다.

---

## 10. Discord user ID와 channel ID 찾기

Hermes는 Discord username이 아니라 숫자 ID를 사용합니다.

### 10.1 Developer Mode 켜기

Discord에서:

```text
User Settings -> Advanced -> Developer Mode ON
```

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
1234567890123456789
```

---

## 11. Hermes에 Discord 연결하기

이번 실습에서 가장 중요하게 수정된 부분입니다.

잘못 이해하기 쉬운 점:

```text
Discord bot token을 ~/.hermes/config.yaml에 넣는 것이 핵심이 아니다.
```

권장 위치:

```text
~/.hermes/.env
```

### 11.1 `.env` 열기

```bash
nano ~/.hermes/.env
```

### 11.2 Discord 설정 추가

실제 값은 본인의 값으로 바꿉니다.

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

반대로 특정 Discord 채널 안에서는 참석자 모두가 Hermes를 쓸 수 있게 하려면 아래처럼 채널을 제한한 뒤 채널 안 사용자 전체를 허용할 수 있습니다.

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

이 설정의 뜻은 다음과 같습니다.

```text
DISCORD_ALLOW_ALL_USERS=true = Discord 사용자 허용 목록을 열어 둔다.
DISCORD_ALLOWED_CHANNELS=채널ID = 그래도 이 채널에서만 반응하게 막는다.
DISCORD_FREE_RESPONSE_CHANNELS=채널ID = 이 채널에서는 @Hermes 없이도 사람 말에 반응할 수 있다.
DISCORD_REQUIRE_MENTION=true = 다른 채널에서는 여전히 @Hermes가 필요하다.
DISCORD_IGNORE_NO_MENTION=false = 다른 멘션이 섞인 메시지도 무시하지 않는다.
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

Hermes를 `#수다방`의 공동 운영 봇처럼 쓰는 경우, 위 설정 전체를 한 덩어리로 유지하는 것이 좋습니다.

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

그리고 `~/.hermes/config.yaml`에는 공동 채널 맥락과 팀 역할을 쓰기 위해 아래 값을 둡니다.

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
 다른 봇 메시지는 Hermes가 직접 멘션된 경우에만 답하고, 무한 반복을 피하기 위해
 봇끼리 한 작업당 1회 답변을 기본으로 한다. 필요한 결정권은 사람 운영자에게 요청한다.
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
DISCORD_FREE_RESPONSE_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
DISCORD_IGNORE_NO_MENTION=false
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_HOME_CHANNEL=YOUR_DISCORD_CHANNEL_ID
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

즉, 토큰은 새 값으로 바뀌어야 하지만 채널 제한 값은 유지되어야 합니다.

저장 후 나옵니다.

```text
Ctrl + O -> Enter -> Ctrl + X
```

### 11.3 `.env` 값이 들어갔는지 확인

토큰을 그대로 출력하면 위험합니다. 길이만 확인합니다.

```bash
python - <<'PY'
from pathlib import Path

path = Path.home() / ".hermes" / ".env"
for key in (
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

정상 예시:

```text
DISCORD_BOT_TOKEN: set len=72
DISCORD_ALLOWED_USERS: set len=18
DISCORD_ALLOW_ALL_USERS: set len=4
DISCORD_ALLOWED_CHANNELS: set len=19
DISCORD_FREE_RESPONSE_CHANNELS: set len=19
DISCORD_HOME_CHANNEL: set len=19
DISCORD_REQUIRE_MENTION: set len=4
DISCORD_IGNORE_NO_MENTION: set len=5
DISCORD_AUTO_THREAD: set len=5
DISCORD_NO_THREAD_CHANNELS: set len=19
DISCORD_ALLOW_BOTS: set len=8
DISCORD_ALLOW_MENTION_USERS: set len=4
```

---

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

---

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

---

## 14. Telegram 테스트

Telegram bot에게 메시지를 보냅니다.

```text
ping
```

성공 예시:

```text
사용자: ping
Hermes: pong.
```

이번 실습에서는 Telegram에서 `ping`을 보낸 뒤 Hermes bot이 `pong.`으로 응답했습니다. 이것으로 Telegram 연결은 정상으로 확인했습니다.

---

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

```text
Bluelion: @Hermes ping
Hermes: pong
```

이번 실습에서는 Hermes가 자동으로 `ping` 스레드를 만들고, 그 안에서 `pong`으로 응답했습니다. 메시지에 체크 반응도 붙어 Discord 이벤트 처리가 정상임을 확인했습니다.

---

## 16. OpenClaw를 팀장 봇으로 추가하기

이번 실습의 최종 목표는 Hermes 혼자 답하는 봇을 만드는 데서 끝나지 않았습니다.

운영 구조를 아래처럼 만들었습니다.

```text
OpenClaw = 팀장
Hermes = 팀원
사람 운영자 = 최종 결정권자
```

즉, OpenClaw가 Discord 채널에서 먼저 상황을 보고, 필요한 경우 `@Hermes`를 불러 하위 작업을 맡기는 방식입니다.

### 16.1 왜 OpenClaw는 MacBook에서 실행했나

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

### 16.2 OpenClaw 주요 경로

이번 실습에서 사용한 OpenClaw 프로필 이름은 `openclaw`입니다.

주요 경로:

```bash
~/.openclaw-openclaw
~/.openclaw-openclaw/openclaw.json
~/.openclaw-openclaw/runtime
~/.openclaw-openclaw/runtime/node_modules/.bin/openclaw
~/Library/LaunchAgents/ai.openclaw.openclaw.plist
```

파인만식으로 말하면:

```text
~/.openclaw-openclaw = OpenClaw의 집
openclaw.json = OpenClaw 행동 규칙표
runtime = OpenClaw 실행 도구 상자
node_modules/.bin/openclaw = 실제 OpenClaw 명령 실행 파일
LaunchAgents plist = Mac이 OpenClaw를 계속 켜 두게 하는 자동 실행 등록표
```

OpenClaw 명령이 PATH에 없다면 아래처럼 절대 경로를 변수로 잡고 실행합니다.

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw --help
```

### 16.3 OpenClaw Discord 연결 상태 확인

OpenClaw가 Discord gateway에 정상 연결되어 있는지 확인합니다.

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw channels status --deep
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

이번 실습에서는 OpenClaw가 Discord에 `OpenClawYSGH` 봇으로 온라인 접속되어 있음을 확인했습니다.

### 16.4 OpenClaw 자동 실행 재시작

OpenClaw는 macOS LaunchAgent로 계속 실행되게 구성할 수 있습니다.

상태 확인:

```bash
launchctl print "gui/$(id -u)/ai.openclaw.openclaw"
```

재시작:

```bash
launchctl kickstart -k "gui/$(id -u)/ai.openclaw.openclaw"
```

LaunchAgent 파일 확인:

```bash
plutil -p "$HOME/Library/LaunchAgents/ai.openclaw.openclaw.plist"
```

주의:

```text
plist 안에 토큰이 직접 들어 있으면 안 된다.
토큰은 OpenClaw의 secret 저장소나 안전한 런타임 설정으로 관리한다.
```

### 16.5 OpenClaw의 채널 운영 설정 원칙

OpenClaw도 Hermes와 마찬가지로 아무 채널에서나 말하게 만들면 위험합니다.

권장 원칙:

```text
1. 대상 Discord 서버와 채널을 명확히 제한한다.
2. 운영 채널에서는 OpenClaw가 사람 메시지를 읽을 수 있게 한다.
3. 다른 봇 메시지는 평소에는 무시한다.
4. 단, @OpenClawYSGH처럼 직접 멘션된 봇 메시지는 처리한다.
5. Hermes를 부를 때는 반드시 @Hermes로 명시한다.
```

OpenClaw 설정에서 핵심은 아래와 같습니다.

```text
contextVisibility = all
requireMention = false
allowBots = mentions
mentionAliases = Hermes 관련 별칭
systemPrompt = OpenClaw 팀장 / Hermes 팀원 역할 설명
```

이때 `allowBots = mentions`가 매우 중요합니다.

```text
allowBots=false = OpenClaw가 Hermes의 말을 아예 무시할 수 있다.
allowBots=true = 봇끼리 끝없이 대화할 위험이 있다.
allowBots=mentions = 다른 봇이 OpenClaw를 직접 부를 때만 응답한다.
```

### 16.6 OpenClaw 팀장 프롬프트 예시

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

### 16.7 Hermes 쪽 봇 간 대화 허용 설정

Hermes가 OpenClaw의 지시를 받으려면 `.env`에 아래 값이 있어야 합니다.

```bash
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

같이 유지해야 하는 채널 제한 값:

```bash
DISCORD_ALLOW_ALL_USERS=true
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
```

뜻:

```text
Hermes는 운영 채널 안에서 사람들의 말을 읽고 답할 수 있다.
Hermes는 다른 봇의 말은 평소에는 무시한다.
하지만 OpenClaw가 @Hermes라고 직접 부르면 팀원처럼 답한다.
```

### 16.8 봇 ID 확인

OpenClaw가 Hermes를 정확히 부르려면 username보다 Discord bot ID를 쓰는 것이 안정적입니다.

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw channels resolve --channel discord --kind user Hermes OpenClawYSGH --json
```

Discord 메시지에서 직접 멘션할 때는 보통 아래 형식입니다.

```text
<@HERMES_BOT_ID>
<@OPENCLAW_BOT_ID>
```

### 16.9 팀워크 실제 테스트

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw message send \
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

### 16.10 OpenClaw message read가 실패할 때

```text
Discord bot token configured for account "default" is unavailable
resolve SecretRefs against the active runtime snapshot
```

이 오류는 "Discord gateway가 반드시 죽었다"는 뜻이 아닙니다.

의미는 더 좁습니다.

```text
OpenClaw 로컬 CLI가 현재 실행 중인 runtime snapshot에서 Discord token SecretRef를 읽지 못했다.
```

이때 확인 순서:

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw channels status --deep
```

그리고 Discord 화면에서 직접 확인합니다.

```text
OpenClawYSGH가 온라인인가?
Hermes가 온라인인가?
OpenClaw가 보낸 메시지가 채널에 보이는가?
Hermes가 그 뒤에 응답했는가?
```

---

## 17. 이번 실습에서 실제로 막혔던 문제와 해결

### 문제 1. adb에서 Android가 안 보임

증상:

```text
List of devices attached
```

목록이 비어 있거나 `unauthorized`가 나옵니다.

원인:

- USB 케이블이 충전 전용
- Android에서 USB 디버깅 허용을 누르지 않음
- 개발자 옵션이 꺼져 있음

해결:

```bash
adb kill-server
adb start-server
adb devices
```

폰 화면에서 USB 디버깅 허용 팝업을 확인합니다.

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

그래도 안 되면 USB 케이블을 바꾸고, Android 화면 잠금을 해제합니다.

### 문제 3. Hermes 명령이 잘못된 가상환경을 가리킴

증상:

```text
No such file or directory: venv-termux/bin/hermes
```

또는 예전 경로를 가리킵니다.

해결:

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
ln -sf "$PWD/venv-termux/bin/hermes" "$PREFIX/bin/hermes"
hash -r
hermes --version
```

### 문제 4. OpenAI SDK가 설치되지 않음

증상:

```text
OpenAI SDK: Not installed
```

해결:

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
python -m pip install -e '.[termux]' -c constraints-termux.txt
hermes --version
```

정상 예시:

```text
OpenAI SDK: 2.36.0
```

### 문제 5. Rust/native build가 오래 걸림

증상:

```text
Building wheel for pydantic-core ...
Building wheel for cryptography ...
Building wheel for jiter ...
```

해결:

- 충전기를 연결합니다.
- Termux를 닫지 않습니다.
- 10분 이상 화면 변화가 적어도 기다립니다.
- Android가 절전 모드로 들어가지 않도록 합니다.

### 문제 6. Telegram bot이 답하지 않음

확인할 것:

```bash
nano ~/.hermes/.env
```

확인 항목:

```bash
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

확인:

```bash
hermes gateway status
```

Discord 패키지 확인:

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

정답:

```text
Discord 인증 정보는 ~/.hermes/.env에 넣는다.
```

`.env`에 있어야 할 값:

```bash
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
DISCORD_ALLOWED_USERS=YOUR_DISCORD_USER_ID
DISCORD_HOME_CHANNEL=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
```

채널 참석자 전체에게 열어 줄 때는 추가로 아래 값을 둡니다.

```bash
DISCORD_ALLOW_ALL_USERS=true
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

`config.yaml`의 `discord:` 섹션은 아래 같은 동작 설정에 가깝습니다.

```yaml
discord:
 require_mention: true
 free_response_channels:
 - "YOUR_DISCORD_CHANNEL_ID"
 auto_thread: false
 no_thread_channels:
 - "YOUR_DISCORD_CHANNEL_ID"
 reactions: true
 channel_prompts:
 "YOUR_DISCORD_CHANNEL_ID": "OpenClaw는 팀장, Hermes는 팀원으로 운영한다."
```

### 문제 9. Discord gateway 로그에 PyNaCl 경고가 나옴

증상:

```text
WARNING discord.client: PyNaCl is not installed, voice will NOT be supported
WARNING discord.client: davey is not installed, voice will NOT be supported
```

의미:

```text
음성 기능이 비활성이라는 뜻입니다.
텍스트 채팅 bot 온라인과 ping/pong에는 치명적 문제가 아닙니다.
```

### 문제 10. Discord에서 ping은 보냈지만 답장이 안 보임

이번 실습에서는 Hermes가 `auto_thread` 설정 때문에 채널 본문에 바로 답하지 않고 `ping` 스레드를 만들었습니다.

확인할 곳:

- 채널 왼쪽 목록의 `ping` 스레드
- 원본 메시지 아래 `스레드 ping 메시지 2개`

### 문제 11. Hermes가 나에게만 답하고 다른 참석자에게 답하지 않음

증상:

```text
Bluelion이 @Hermes를 부르면 Hermes가 답한다.
이은하, 리아가 @Hermes를 불러도 Hermes가 바로 답하지 않는다.
```

원인:

```text
~/.hermes/.env의 DISCORD_ALLOWED_USERS가 서버 주인 1명만 허용하고 있었다.
```

특정 사람만 추가하려면 쉼표로 사용자 ID를 더합니다.

```bash
DISCORD_ALLOWED_USERS=111111111111111111,222222222222222222,333333333333333333
```

현재 실습처럼 특정 채널 전체를 열어 주려면 아래처럼 설정합니다.

```bash
DISCORD_ALLOW_ALL_USERS=true
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
DISCORD_IGNORE_NO_MENTION=false
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
```

### 문제 12. Hermes가 "채널 대화를 읽을 수 없다"고 말함

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

Hermes를 공동 운영방 봇처럼 쓰려면 `~/.hermes/config.yaml`에 아래 값을 둡니다.

```yaml
group_sessions_per_user: false
```

그리고 `~/.hermes/.env`에는 아래 값을 둡니다.

```bash
DISCORD_ALLOW_ALL_USERS=true
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
DISCORD_IGNORE_NO_MENTION=false
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
```

### 문제 13. Android가 Termux를 죽여서 봇이 다시 오프라인됨

원인:

- Android 배터리 최적화
- Termux를 최근 앱에서 밀어서 종료
- 화면 잠금 후 background 제한

권장 설정:

```text
설정 -> 앱 -> Termux -> 배터리 -> 제한 없음
```

그리고 Termux를 최근 앱에서 닫지 않습니다.

### 문제 14. OpenClaw가 @Hermes를 불러도 Hermes가 답하지 않음

증상:

```text
OpenClaw가 Discord 채널에 @Hermes 메시지를 보낸다.
Hermes는 온라인인데 답하지 않는다.
Bluelion이 @Hermes를 부르면 Hermes가 답한다.
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

해결:

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
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw message send \
 --channel discord \
 --target channel:YOUR_DISCORD_CHANNEL_ID \
 --message '<@HERMES_BOT_ID> 팀워크 복구 테스트입니다. 한 문장으로 응답해 주세요.'
```

### 문제 15. OpenClaw와 Hermes가 서로 끝없이 대화할까 봐 걱정됨

위험한 설정:

```text
모든 채널에서 requireMention=false
모든 봇 메시지를 무조건 허용
팀장/팀원 역할 프롬프트 없음
```

안전한 설정:

```bash
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
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

### 문제 16. ADB로 Termux에 긴 스크립트를 넣을 때 중간에 끊김

먼저 시도했던 방법:

```bash
adb push script.sh /sdcard/Download/script.sh
```

그 뒤 Termux에서 읽으려고 하면 아래처럼 막힐 수 있습니다.

```text
Permission denied
```

원인:

```text
Termux가 Android 공유 저장소 접근 권한을 받지 못했거나,
Android 버전/권한 정책 때문에 /sdcard/Download 파일을 바로 읽지 못한다.
```

해결 방법은 두 가지입니다.

첫 번째, Termux에 저장소 권한을 부여합니다.

```bash
termux-setup-storage
```

그래도 안 되거나 화면 조작이 어렵다면 두 번째 방법을 씁니다. MacBook에서 ADB keyboard input으로 base64 조각을 Termux에 직접 입력합니다.

핵심 주의점:

```text
1. 긴 스크립트를 base64로 바꾼다.
2. base64 문자열을 작은 조각으로 나눠 Termux 파일에 append한다.
3. adb shell input text 안의 공백은 %s로 바꾼다.
4. pipe 문자는 \|처럼 escape한다.
5. shell while/read 루프 안에서 adb를 실행할 때는 반드시 </dev/null을 붙인다.
6. 그렇지 않으면 adb가 루프의 stdin을 먹어 버려 첫 조각만 들어간다.
7. 마지막 줄에 newline이 없으면 마지막 조각이 빠질 수 있으니 파일 크기나 sha256을 확인한다.
```

예시 흐름:

```bash
base64 -i local-script.sh > local-script.sh.b64
split -b 700 local-script.sh.b64 chunk-
```

조각 입력 예시:

```bash
adb shell input text 'printf%sABCDEF...%s>>%s/tmp/script.b64' </dev/null
adb shell input keyevent 66 </dev/null
```

Termux 안에서 복원:

```bash
base64 -d /tmp/script.b64 > /tmp/script.sh
chmod +x /tmp/script.sh
bash /tmp/script.sh
```

검증:

```bash
wc -c /tmp/script.sh
sha256sum /tmp/script.sh
```

### 문제 17. OpenClaw CLI에서 `message read`가 SecretRef 오류를 냄

증상:

```text
Discord bot token configured for account "default" is unavailable
resolve SecretRefs against the active runtime snapshot
```

의미:

```text
OpenClaw CLI가 현재 터미널 명령에서 Discord token SecretRef를 읽지 못했다.
```

중요:

```text
이것만으로 OpenClaw gateway가 꺼졌다고 단정하지 않는다.
```

확인 순서:

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw channels status --deep
```

그리고 Chrome/Discord 화면에서 직접 확인합니다.

```text
OpenClawYSGH가 온라인인가?
OpenClaw가 메시지를 보낼 수 있는가?
Hermes가 그 메시지에 답했는가?
```

---

## 18. 전체 복구용 명령 모음

문제가 생겼을 때 아래 순서로 확인합니다.

### 18.1 Termux에서 Hermes 환경 진입

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
```

### 18.2 Hermes 버전 확인

```bash
hermes --version
```

### 18.3 Python 패키지 확인

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

### 18.4 Discord `.env` 마스킹 확인

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

### 18.5 Hermes gateway 재시작

```bash
pkill -f "hermes gateway run" 2>/dev/null || true
sleep 2
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
sleep 10
hermes gateway status
tail -n 120 ~/.hermes/gateway-discord.log
```

### 18.6 Hermes 공동 운영 설정 확인

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
DISCORD_FREE_RESPONSE_CHANNELS=운영 채널 ID
DISCORD_REQUIRE_MENTION=true
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=운영 채널 ID
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
group_sessions_per_user: False
channel_prompts에 운영 채널 ID가 있음
```

### 18.7 OpenClaw 상태 확인과 재시작

MacBook에서 실행합니다.

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw channels status --deep
```

LaunchAgent 재시작:

```bash
launchctl kickstart -k "gui/$(id -u)/ai.openclaw.openclaw"
sleep 5
"$OPENCLAW_BIN" --profile openclaw channels status --deep
```

### 18.8 OpenClaw -> Hermes 팀워크 테스트

Discord bot ID는 본인 환경의 값으로 바꿉니다.

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw message send \
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

### 18.9 실습에서 만든 Hermes Discord room-mode 스크립트

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

## 19. 성공 기준 체크리스트

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
- 채널 전체 응답을 원하면 `DISCORD_ALLOW_ALL_USERS=true`가 있다.
- 채널 전체 응답을 원하면 `DISCORD_ALLOWED_CHANNELS`와 `DISCORD_FREE_RESPONSE_CHANNELS`가 같은 채널 ID를 가리킨다.
- OpenClaw와 협업하려면 `DISCORD_ALLOW_BOTS=mentions`가 있다.
- OpenClaw와 협업하려면 `DISCORD_ALLOW_MENTION_USERS=true`가 있다.
- 스레드 대신 채널 본문 답장을 원하면 `DISCORD_AUTO_THREAD=false`가 있다.
- 스레드 대신 채널 본문 답장을 원하면 `DISCORD_NO_THREAD_CHANNELS`에 운영 채널 ID가 있다.
- `~/.hermes/config.yaml`에 `group_sessions_per_user: false`가 있다.
- `~/.hermes/config.yaml`의 `discord.channel_prompts`에 운영 채널 역할 설명이 있다.
- Discord 서버 멤버 목록에서 `Hermes`가 온라인이다.
- `@Hermes ping`에 `pong` 응답이 온다.
- 채널 전체 응답 설정 후에는 허용된 채널에서 다른 참석자의 일반 메시지에도 Hermes가 답한다.

### OpenClaw

- `~/.openclaw-openclaw` 폴더가 있다.
- `~/.openclaw-openclaw/runtime/node_modules/.bin/openclaw` 명령이 실행된다.
- `~/Library/LaunchAgents/ai.openclaw.openclaw.plist`가 있다.
- `openclaw --profile openclaw channels status --deep`에서 Discord gateway가 connected로 보인다.
- Discord 서버 멤버 목록에서 `OpenClawYSGH`가 온라인이다.
- OpenClaw 설정에서 운영 채널이 지정되어 있다.
- OpenClaw 설정에서 봇 메시지는 `mentions` 조건으로만 허용되어 있다.
- OpenClaw 채널 프롬프트에 "OpenClaw는 팀장, Hermes는 팀원" 역할이 들어 있다.

### OpenClaw + Hermes 팀워크

- OpenClaw가 운영 채널에 `<@HERMES_BOT_ID>` 메시지를 보낼 수 있다.
- Hermes가 OpenClaw의 멘션에 팀원처럼 응답한다.
- OpenClaw가 Hermes 응답을 확인하고 사람 운영자에게 정리한다.
- 같은 요청으로 봇끼리 무한 반복하지 않는다.
- 브라우저 Discord 화면에서 `Bluelion`, `Hermes`, `OpenClawYSGH`가 모두 온라인으로 보인다.

---

## 20. 초보자용 핵심 요약

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
free response channels = 이름을 부르지 않아도 대답하는 방
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
```

---

## 21. 참고 링크

- scrcpy 공식 GitHub: https://github.com/Genymobile/scrcpy
- Termux 공식 사이트: https://termux.dev
- Hermes Agent GitHub: https://github.com/NousResearch/hermes-agent
- Hermes Android/Termux 시작 문서: https://hermes-agent.nousresearch.com/docs/getting-started/termux
- Hermes Discord Setup 공식 문서: https://github.com/nousresearch/hermes-agent/blob/main/website/docs/user-guide/messaging/discord.md
- Hermes Telegram Setup 공식 문서: https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram
- Discord Developer Portal: https://discord.com/developers/applications
- Discord Developer Docs: https://discord.com/developers/docs

---

## 22. 배포 전 주의

이 문서는 교육용으로 배포할 수 있도록 실제 토큰을 포함하지 않습니다.

배포 전 반드시 확인:

- 문서 안에 실제 Telegram token이 없는가?
- 문서 안에 실제 Discord token이 없는가?
- 문서 안에 OpenClaw secret이나 runtime secret 경로가 노출되어 있지 않은가?
- 스크린샷에 token이 보이지 않는가?
- 스크린샷에 Discord Developer Portal의 token 페이지가 보이지 않는가?
- `.env` 파일을 공유하지 않았는가?
- GitHub에 `.env`를 올리지 않았는가?
- 실제 서버 ID, 채널 ID, bot ID를 공개해도 되는지 확인했는가?
- 공개 배포용이라면 `1503...` 같은 실제 ID를 `YOUR_DISCORD_CHANNEL_ID`, `HERMES_BOT_ID`, `OPENCLAW_BOT_ID`로 바꿨는가?

토큰이 한 번이라도 노출됐다면:

1. Telegram은 BotFather에서 token을 revoke/regenerate합니다.
2. Discord는 Developer Portal에서 bot token을 reset합니다.
3. Discord가 재로그인이나 다단계 인증을 요구하면 먼저 통과합니다.
4. 새 token을 `~/.hermes/.env`의 `DISCORD_BOT_TOKEN`에만 교체합니다.
5. 기존 채널 권한 설정이 유지되어 있는지 확인합니다.

```bash
grep -E '^(DISCORD_ALLOW_ALL_USERS|DISCORD_ALLOWED_CHANNELS|DISCORD_FREE_RESPONSE_CHANNELS|DISCORD_REQUIRE_MENTION|DISCORD_AUTO_THREAD|DISCORD_NO_THREAD_CHANNELS|DISCORD_ALLOW_BOTS|DISCORD_ALLOW_MENTION_USERS)=' ~/.hermes/.env
```

기대값:

```bash
DISCORD_ALLOW_ALL_USERS=true
DISCORD_ALLOWED_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_FREE_RESPONSE_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_REQUIRE_MENTION=true
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

6. Hermes gateway를 재시작합니다.

```bash
cd ~/.hermes/hermes-agent
source venv-termux/bin/activate
pkill -f "hermes gateway run" 2>/dev/null || true
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
```

7. OpenClaw도 Discord에서 계속 온라인인지 확인합니다.

```bash
OPENCLAW_BIN="$HOME/.openclaw-openclaw/runtime/node_modules/.bin/openclaw"
"$OPENCLAW_BIN" --profile openclaw channels status --deep
```

8. 마지막으로 브라우저 Discord 화면에서 실제 메시지 흐름을 확인합니다.

```text
사람 운영자 -> OpenClaw 또는 Hermes에게 요청
OpenClaw -> 필요하면 @Hermes로 작업 지시
Hermes -> OpenClaw에게 팀원 응답
OpenClaw -> 결과 정리
```
