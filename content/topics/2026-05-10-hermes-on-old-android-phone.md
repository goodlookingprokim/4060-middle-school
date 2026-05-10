---
title: "2026년 5월 10일(일) 방치된 안드로이드폰에 Hermes Agent 설치하고 Telegram으로 대화하기"
description: "집에서 놀고 있는 안드로이드폰에 Hermes Agent를 설치하고, Telegram bot으로 대화하는 방법을 초보자 기준으로 차근차근 정리합니다."
tags:
  - middle-school
  - hermes
  - android
  - telegram
created: "2026-05-10"
modified: "2026-05-10"
publish: true
cssclasses:
  - field-note
---

# 2026년 5월 10일(일) 방치된 안드로이드폰에 Hermes Agent 설치하고 Telegram으로 대화하기

집에서 더 이상 쓰지 않는 안드로이드폰이 하나쯤 남아 있는 경우가 있습니다. 그냥 서랍에 넣어두기엔 아깝고, 그렇다고 다시 메인폰으로 쓰기는 애매할 때가 있지요. 이럴 때 꽤 흥미로운 활용이 하나 있습니다. 그 폰 안에 Hermes Agent를 설치하고, Telegram bot을 통해 말을 걸 수 있게 만드는 방식입니다.

처음 보면 복잡해 보이지만, 구조를 나눠서 보면 생각보다 단순합니다. Mac에서 안드로이드 화면을 띄워 조작하고, 폰 안에서는 Termux라는 작은 Linux 작업실을 만들고, 그 안에 Hermes를 설치합니다. 그리고 Hermes gateway를 Telegram과 연결하면, 내가 bot에게 메시지를 보내고 Hermes가 답하는 흐름이 완성됩니다.

이 글은 그 과정을 초보자 기준으로 하나씩 따라갈 수 있게 정리한 실습형 메모입니다.

## 먼저 결론

- 안드로이드폰에 Hermes를 설치하는 핵심은 **Termux 안에 Hermes를 올리고, Telegram gateway를 연결하는 것**입니다.
- 초보자라면 폰만 붙들고 하기보다, **Mac에서 scrcpy로 화면을 보며 설치하는 방식**이 훨씬 수월합니다.
- Android/Termux에서는 일반 Linux와 다르게 서비스 관리나 패키지 설치에서 막히는 지점이 있으므로, **`.[termux]` 사용과 gateway 수동 실행 방식**을 미리 이해하는 것이 중요합니다.

## 한 문장으로 이해하면

이 구조는 이렇게 보면 됩니다.

- **Termux**는 안드로이드 폰 안에 만든 작은 작업실입니다.
- **Hermes**는 그 작업실 안에 설치한 AI 비서입니다.
- **Telegram bot token**은 Telegram 문을 여는 열쇠입니다.
- **`TELEGRAM_ALLOWED_USERS`**는 “이 사람만 들어오세요” 하는 출입 명단입니다.
- **gateway**는 Telegram과 Hermes 사이를 오가는 안내 데스크이자 배달부입니다.
- **scrcpy**는 맥북에서 폰 화면을 보며 마우스와 키보드로 조작하게 해주는 원격 화면입니다.

## 전체 준비물

필요한 것은 아래 정도입니다.

- macOS가 설치된 MacBook
- 안드로이드 폰
- 데이터 전송이 되는 USB 케이블
- Android 앱: Termux
- Telegram 계정
- 인터넷 연결
- Hermes에서 사용할 AI 모델/API 설정

가능하면 아래도 같이 챙기면 좋습니다.

- Android 개발자 옵션의 USB 디버깅 켜기
- 폰 배터리 최적화에서 Termux 제한 해제
- 설치 중에는 충전기 연결

여기서 특히 중요한 보안 포인트가 있습니다. Telegram bot token은 사실상 비밀번호와 비슷합니다. 화면 공유 중이거나 문서 정리 중일 때도 노출하지 않는 습관이 필요합니다. 또 Hermes bot은 터미널 명령을 실행할 수 있는 강한 권한으로 이어질 수 있으므로, 허용 사용자 목록을 반드시 설정해야 합니다.

## 1. MacBook에서 안드로이드 화면 미러링 준비

초보자에게는 이 단계가 꽤 중요합니다. 폰 화면만 보고 긴 명령어를 입력하면 실수가 많아지기 때문입니다.

### Homebrew가 없다면 먼저 설치

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Apple Silicon Mac이라면 보통 아래도 이어서 실행합니다.

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Intel Mac이라면 이 경로를 쓰는 경우가 많습니다.

```bash
eval "$(/usr/local/bin/brew shellenv)"
```

### scrcpy와 adb 설치

```bash
brew install scrcpy android-platform-tools
```

설치가 끝나면 버전을 확인합니다.

```bash
scrcpy --version
adb version
```

### 안드로이드폰에서 USB 디버깅 켜기

폰에서는 보통 아래 흐름으로 갑니다.

1. 설정 열기
2. 휴대전화 정보 또는 휴대폰 정보
3. 빌드 번호를 7번 누르기
4. 개발자 옵션 켜졌다는 메시지 확인
5. 설정 → 시스템 → 개발자 옵션 또는 설정 → 개발자 옵션 이동
6. USB 디버깅 켜기
7. 제조사에 따라 필요하면 `USB 디버깅(보안 설정)`도 켜기

맥에 USB로 연결한 뒤 폰에 `USB 디버깅을 허용하시겠습니까?` 팝업이 뜨면 허용을 눌러야 합니다.

### adb 연결 확인

```bash
adb devices
```

정상이라면 이런 느낌으로 나옵니다.

```text
List of devices attached
RF9N800SGKR device
```

만약 `unauthorized`가 뜨면 USB 디버깅 허용 팝업을 다시 확인해야 합니다.

### scrcpy 실행

```bash
scrcpy
```

이제 맥북 화면에 안드로이드 화면이 뜨고, 마우스와 키보드로 조작할 수 있습니다. 여기까지 오면 실습 난이도가 꽤 낮아집니다.

## 2. Android에 Termux 준비

Termux는 안드로이드 안에서 Linux 명령을 실행하게 해주는 터미널 앱입니다. 루팅은 필요 없습니다.

Termux를 실행한 뒤 먼저 업데이트합니다.

```bash
pkg update
pkg upgrade -y
```

그 다음 기본 도구를 설치합니다.

```bash
pkg install -y git python clang rust make pkg-config libffi openssl nodejs ripgrep ffmpeg
pkg install -y python-psutil
```

여기서부터는 “맥 터미널”이 아니라 “폰 안의 Termux 터미널”이라는 점을 자주 확인해야 합니다.

## 3. Hermes Agent 설치

### 저장소 받기

```bash
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git ~/.hermes/hermes-agent
cd ~/.hermes/hermes-agent
```

이미 clone했는데 submodule 없이 받았다면 아래를 한 번 더 돌립니다.

```bash
git submodule update --init --recursive
```

### Python 가상환경 만들기

가상환경은 Hermes 전용 설치 상자라고 생각하면 됩니다.

```bash
python -m venv --system-site-packages venv-termux
source venv-termux/bin/activate
```

정상이라면 프롬프트 앞에 `(venv-termux)` 표시가 붙습니다.

### Android API 레벨 설정

일부 패키지는 Android 버전을 알아야 빌드됩니다.

```bash
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
echo "$ANDROID_API_LEVEL"
```

Android 12라면 보통 `31` 정도가 나옵니다.

### pip 업그레이드

```bash
python -m pip install --upgrade pip setuptools wheel
```

### Termux용 Hermes 설치

여기서 중요한 포인트가 하나 있습니다. Android/Termux에서는 `.[all]`이 아니라 **`.[termux]`**를 씁니다.

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

설치 중에는 `jiter`, `pydantic-core`, `cryptography`, `rpds-py` 같은 패키지가 오래 빌드될 수 있습니다. 이때 멈춘 것처럼 보여도 실제로는 컴파일 중인 경우가 많습니다. 폰 성능에 따라 수십 분이 걸릴 수 있으니 조급하게 끊지 않는 것이 중요합니다.

### `hermes` 명령을 PATH에 연결

```bash
ln -sf "$PWD/venv-termux/bin/hermes" "$PREFIX/bin/hermes"
```

확인:

```bash
hermes --version
hermes doctor
```

정상 예시는 아래처럼 보일 수 있습니다.

```text
Hermes Agent v0.13.0
Python 3.13.13
```

## 4. Hermes 기본 설정

Hermes가 답변하려면 사용할 AI 모델이 잡혀 있어야 합니다.

가장 쉬운 방법은 설정 마법사를 쓰는 것입니다.

```bash
hermes setup
```

모델만 따로 정하고 싶다면 아래도 가능합니다.

```bash
hermes model
```

환경변수 파일을 직접 편집해도 됩니다.

```bash
nano ~/.hermes/.env
```

예를 들어 OpenAI를 쓴다면 이런 식으로 들어갑니다.

```text
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```

물론 실제로는 본인이 쓰는 제공자 기준으로 맞춰야 합니다.

## 5. Telegram bot 만들기

### BotFather에서 bot 생성

Telegram에서 `@BotFather`를 엽니다.

순서는 아래와 같습니다.

1. `/newbot`
2. 표시 이름 입력
3. username 입력 (`bot`으로 끝나야 함)
4. BotFather가 API token 반환

형식은 대체로 아래처럼 생겼습니다.

```text
<BOT_ID>:<SECRET_TOKEN_FROM_BOTFATHER>
```

실제 토큰은 절대 공유하면 안 됩니다.

### 내 Telegram user ID 찾기

Hermes는 Telegram username이 아니라 숫자 ID로 사용자를 구분합니다.

아래 bot 중 하나에 메시지를 보내 ID를 확인합니다.

- `@userinfobot`
- `@get_id_bot`

예를 들어 이런 식입니다.

```text
Id: 123456789
```

## 6. Hermes에 Telegram 연결하기

### 추천: interactive wizard 사용

```bash
hermes gateway setup
```

설정 중 Telegram을 선택한 뒤 아래를 입력합니다.

- BotFather가 준 token
- 내 Telegram 숫자 ID

### 수동 설정 방식

```bash
nano ~/.hermes/.env
```

예시:

```text
TELEGRAM_BOT_TOKEN=<YOUR_TELEGRAM_BOT_TOKEN>
TELEGRAM_ALLOWED_USERS=<YOUR_TELEGRAM_USER_ID>
```

여러 명을 허용하려면 쉼표로 구분합니다.

```text
TELEGRAM_ALLOWED_USERS=123456789,987654321
```

이 두 변수의 역할은 분명합니다.

- `TELEGRAM_BOT_TOKEN` = 열쇠
- `TELEGRAM_ALLOWED_USERS` = 출입 명단

둘 중 하나라도 틀리면 bot이 메시지를 제대로 받지 못할 수 있습니다.

## 7. Hermes gateway 실행

gateway는 Telegram과 Hermes를 이어주는 배달부입니다.

### 처음에는 foreground 테스트

```bash
hermes gateway run
```

또는 버전에 따라 아래가 동작할 수도 있습니다.

```bash
hermes gateway
```

정상 시작 예시는 대체로 이런 느낌입니다.

```text
Hermes Gateway Starting...
Messaging platforms + cron scheduler
Press Ctrl+C to stop
```

이 상태에서 Telegram bot에게 `ping`을 보내봅니다.

정상이라면 `pong`이 돌아옵니다.

foreground 실행은 테스트엔 좋지만, 터미널을 붙잡고 있어야 합니다. 종료는 `Ctrl+C`입니다.

### Termux에서는 `hermes gateway start`가 안 될 수 있음

Termux에는 systemd 같은 서비스 관리자가 없기 때문에 아래 명령이 실패할 수 있습니다.

```bash
hermes gateway start
```

이건 설치 실패가 아니라 **환경 차이**입니다.

### background 실행

실습에선 아래 방식이 잘 맞습니다.

```bash
setsid -f hermes gateway run
hermes gateway status
```

정상이라면 이런 식으로 나옵니다.

```text
Gateway is running (PID: 2302)
(Running manually, not as a system service)
```

### 로그 파일을 남기고 싶다면

```bash
mkdir -p ~/.hermes/logs
nohup hermes gateway run > ~/.hermes/logs/gateway.log 2>&1 &
tail -f ~/.hermes/logs/gateway.log
```

## 8. 최종 동작 확인

아래가 모두 맞으면 기본 설치는 성공입니다.

```bash
hermes --version
hermes gateway status
```

Telegram에서 테스트:

- 내가 보냄: `ping`
- bot이 답함: `pong`

이 세 가지가 되면 “안드로이드폰 안에 Hermes를 설치하고 Telegram으로 대화하는 기본 과정”은 끝났다고 보면 됩니다.

## 9. 실습 중 자주 막히는 문제

이 부분이 실제로 꽤 중요합니다. 초보자는 설치 명령보다 **막혔을 때 어디를 볼지**를 먼저 알아야 덜 당황합니다.

### adb에서 Android가 안 보일 때

```bash
adb kill-server
adb start-server
adb devices
```

그리고 아래를 다시 확인합니다.

- 데이터 전송 케이블인지
- 폰 잠금이 풀렸는지
- USB 디버깅 허용 팝업에서 허용했는지
- 개발자 옵션에서 USB 디버깅이 켜졌는지

### scrcpy 화면이 검게 보일 때

```bash
adb shell input keyevent 224
adb shell input keyevent 82
adb shell wm dismiss-keyguard
scrcpy
```

### git clone 중 HTTPS/libcurl/ngtcp2 오류

```bash
pkg update
pkg upgrade -y
pkg install -y git openssl ca-certificates
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git ~/.hermes/hermes-agent
```

### `.[all]` 설치가 실패할 때

Android/Termux에서는 `.[all]`보다 `.[termux]`가 안전합니다.

```bash
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### `uv pip install`이 Android에서 실패할 때

Termux에서는 일반적으로 Python 표준 `venv` + `pip` 쪽이 더 안정적입니다.

```bash
python -m venv --system-site-packages venv-termux
source venv-termux/bin/activate
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### `ANDROID_API_LEVEL` 관련 에러

```bash
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### native build가 오래 걸릴 때

아래 패키지를 먼저 챙겨두고, 충전기를 꽂고 충분히 기다리는 편이 좋습니다.

```bash
pkg install -y clang rust make pkg-config libffi openssl
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install -e '.[termux]' -c constraints-termux.txt
```

### Telegram bot이 아무 답을 안 할 때

아래 순서로 보는 편이 좋습니다.

1. gateway 실행 중인가?
   ```bash
   hermes gateway status
   ```
2. 실행 안 되어 있으면 다시 시작
   ```bash
   setsid -f hermes gateway run
   hermes gateway status
   ```
3. `.env`에 token이 맞는가?
4. `TELEGRAM_ALLOWED_USERS`에 **숫자 ID**가 들어갔는가?
5. 내가 대화 중인 bot이 BotFather에서 만든 그 bot이 맞는가?
6. AI 모델/API 키 설정이 끝났는가?
7. gateway를 여러 개 띄운 것은 아닌가?

필요하면 아래처럼 정리하고 하나만 다시 띄웁니다.

```bash
pkill -f "hermes gateway"
setsid -f hermes gateway run
hermes gateway status
```

### `Gateway shutting down` 메시지가 올 때

foreground로 돌리던 gateway가 중단된 경우가 많습니다. 다시 background로 띄우면 됩니다.

```bash
setsid -f hermes gateway run
hermes gateway status
```

### 그룹 채팅에서는 반응하지 않을 때

이 경우는 보통 Telegram bot privacy mode를 먼저 봐야 합니다.

- BotFather에서 privacy mode가 꺼져 있는지
- 변경 후 bot을 그룹에서 다시 초대했는지
- bot을 admin으로 올렸는지
- group mention이 필요한지
- 허용 설정이 맞는지

처음에는 무조건 개인 DM에서 먼저 성공시키는 편이 좋습니다.

## 10. 보안 체크리스트

Telegram bot은 단순 채팅창이 아니라, 잘못 열어두면 폰 안의 작업실까지 이어질 수 있습니다.

반드시 지킬 것은 아래입니다.

- BotFather token 공개 금지
- `.env`를 GitHub에 올리지 않기
- 화면 공유 중 token 노출 금지
- `TELEGRAM_ALLOWED_USERS` 설정하기
- 모르는 사람 허용하지 않기
- 테스트 목적이 아니면 `GATEWAY_ALLOW_ALL_USERS=true` 쓰지 않기
- 공개 그룹에 넣기 전 privacy mode와 권한 이해하기
- 유출 의심 시 바로 token revoke하기

유출이 의심되면 BotFather에서 `/revoke`를 실행하고, 새 token을 받아 `.env`를 교체한 뒤 gateway를 재시작합니다.

```bash
pkill -f "hermes gateway"
setsid -f hermes gateway run
hermes gateway status
```

## 11. Android/Termux에서 특히 조심할 점

### background 작업은 꺼질 수 있음

Android는 배터리 절약 때문에 background 앱을 멈출 수 있습니다. 장시간 쓸 때는 아래를 권장합니다.

- Termux 배터리 최적화 제외
- 충전기 연결
- 최근 앱에서 Termux 닫지 않기
- 멈추면 다시 실행

```bash
setsid -f hermes gateway run
```

### Termux에는 systemd가 없음

그래서 아래가 실패해도 이상한 일이 아닙니다.

```bash
hermes gateway start
```

대신 아래를 씁니다.

```bash
hermes gateway run
setsid -f hermes gateway run
```

### Mac 명령과 Termux 명령을 헷갈리지 않기

Mac에서 실행:

```bash
brew install scrcpy android-platform-tools
adb devices
scrcpy
```

Termux에서 실행:

```bash
pkg update
pkg install -y git python clang rust make pkg-config libffi openssl
python -m pip install -e '.[termux]' -c constraints-termux.txt
hermes gateway run
```

이 구분이 흐려지면 설치가 금방 꼬입니다.

## 12. 빠른 복습용 명령 모음

### Mac

```bash
brew install scrcpy android-platform-tools
adb devices
scrcpy
```

### Termux

```bash
pkg update
pkg upgrade -y
pkg install -y git python clang rust make pkg-config libffi openssl nodejs ripgrep ffmpeg python-psutil
git clone --recurse-submodules https://github.com/NousResearch/hermes-agent.git ~/.hermes/hermes-agent
cd ~/.hermes/hermes-agent
python -m venv --system-site-packages venv-termux
source venv-termux/bin/activate
export ANDROID_API_LEVEL="$(getprop ro.build.version.sdk)"
python -m pip install --upgrade pip setuptools wheel
python -m pip install -e '.[termux]' -c constraints-termux.txt
ln -sf "$PWD/venv-termux/bin/hermes" "$PREFIX/bin/hermes"
hermes --version
hermes doctor
```

### Hermes 설정

```bash
hermes setup
hermes gateway setup
```

### Telegram gateway 실행

```bash
setsid -f hermes gateway run
hermes gateway status
```

### Telegram 테스트

```text
ping
```

정상 응답:

```text
pong
```

## 13. 수업에서 설명할 때는 이렇게 말하면 쉽습니다

강사 입장에서는 이렇게 설명하면 꽤 전달이 잘 됩니다.

> 폰 안에 작은 Linux 작업실을 만들고, 그 안에 Hermes라는 AI 비서를 설치합니다. Telegram bot은 그 비서와 대화하는 창구입니다. token은 문 열쇠이고, allowed user는 출입 명단입니다. gateway는 Telegram에서 온 말을 Hermes에게 전달하고, Hermes의 답장을 다시 Telegram으로 보내는 배달부입니다.

순서는 이렇게 잡으면 됩니다.

1. Mac에서 폰 화면을 보이게 한다.
2. 폰 안에서 Termux를 연다.
3. Termux에 기본 도구를 설치한다.
4. Hermes 코드를 받는다.
5. Hermes 전용 가상환경을 만든다.
6. `.[termux]`로 설치한다.
7. BotFather에서 bot을 만들고 token을 받는다.
8. 내 숫자 ID를 허용 사용자로 등록한다.
9. gateway를 실행한다.
10. `ping → pong`을 확인한다.

## 14. 자주 나오는 질문

### 폰에 Hermes 앱을 설치하는 건가요?

아닙니다. Hermes는 일반 Android 앱이 아니라, Termux 안에 설치되는 Python 기반 CLI 프로그램입니다.

### 루팅이 필요한가요?

아닙니다. Termux와 scrcpy 모두 루팅 없이 사용할 수 있습니다.

### MacBook이 꼭 필요한가요?

꼭 필요한 것은 아닙니다. 하지만 초보자에게는 scrcpy로 화면을 보며 키보드로 입력하는 방식이 훨씬 쉽습니다.

### bot이 `typing`만 하고 답이 늦어요.

Hermes가 모델 호출 중일 수 있습니다. 조금 기다린 뒤, 계속 안 되면 gateway 상태와 API 키, 모델 설정을 다시 확인합니다.

### 폰 화면을 꺼도 계속 동작하나요?

항상 보장되지는 않습니다. Android의 배터리 절약 정책 때문에 background 작업이 멈출 수 있습니다.

### 왜 `hermes gateway start`가 안 되나요?

Termux에는 일반 Linux의 서비스 매니저가 없기 때문입니다. 환경 차이로 이해하면 됩니다.

### 다른 사람도 이 bot을 쓸 수 있나요?

가능하지만 매우 조심해야 합니다. 다른 사람의 Telegram 숫자 ID를 허용 사용자 목록에 추가해야 하고, 보안 위험을 충분히 이해한 뒤 열어야 합니다.

## 15. 마지막 점검

수업 마지막에는 아래 세 가지만 확인하면 됩니다.

```bash
hermes --version
hermes gateway status
```

Telegram DM에서:

```text
ping -> pong
```

이 세 가지가 되면, 방치된 안드로이드폰을 다시 깨워 Hermes Agent와 Telegram 대화용 장치로 바꾸는 기본 과정은 완료된 것입니다.

## 참고 문서

- [Hermes Agent Android / Termux 공식 문서](https://hermes-agent.nousresearch.com/docs/getting-started/termux)
- [Hermes Agent Messaging Gateway 공식 문서](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/)
- [Hermes Agent Telegram Setup 공식 문서](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/telegram)
- [Termux 공식 사이트](https://termux.dev/en/)
- [scrcpy 공식 GitHub](https://github.com/Genymobile/scrcpy)
