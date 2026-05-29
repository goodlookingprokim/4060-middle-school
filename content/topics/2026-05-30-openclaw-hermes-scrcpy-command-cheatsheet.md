---
title: "2026년 5월 30일(토) OpenClaw, Hermes, scrcpy 자주 쓰는 명령어만 빠르게 보는 치트시트"
description: "MacBook의 OpenClaw, Android Termux의 Hermes, 그리고 scrcpy를 함께 쓸 때 가장 자주 쓰는 터미널 명령만 골라 한눈에 다시 보기 쉽게 정리한 빠른 참고 글입니다."
tags:
  - middle-school
  - openclaw
  - hermes
  - scrcpy
  - android
  - discord
created: "2026-05-30"
modified: "2026-05-30"
publish: true
cssclasses:
  - field-note
---

# 2026년 5월 30일(토) OpenClaw, Hermes, scrcpy 자주 쓰는 명령어만 빠르게 보는 치트시트

출처: 첨부 문서 기준 정리

앞선 글들에서는 구조와 원리를 길게 풀어 설명했습니다.
그런데 막상 실제로 운영하다 보면,
긴 설명보다 먼저 손이 가는 건 짧은 명령어 메모입니다.

오늘은 그 기준으로 정리해 보겠습니다.

> MacBook에서 OpenClaw를 보고, Android Termux에서 Hermes를 돌리고, scrcpy로 폰 화면을 보며 운영할 때 자주 쓰는 명령만 추려서 빠르게 다시 보는 글입니다.

이 글은 새 개념을 늘어놓기보다,
이미 한 번 세팅한 뒤에 "지금 뭘 치면 되지?" 하고 다시 찾게 되는 명령들을 중심으로 정리했습니다.

## 먼저 아주 짧게 구분하면

### MacBook 터미널에서 치는 명령

```bash
openclaw status
adb devices
scrcpy --stay-awake --window-title Hermes-Android-Debug
```

### Android 폰 Termux 안에서 치는 명령

```bash
cd ~/.hermes/hermes-agent
. venv-termux/bin/activate
hermes gateway status
```

이 구분만 먼저 머리에 넣어두면 덜 헷갈립니다.

쉽게 말하면,
MacBook은 바깥에서 보고 조종하는 자리이고,
Termux는 Android 폰 안쪽 작업실입니다.

## 1. OpenClaw에서 가장 자주 쓰는 명령어

OpenClaw는 이 MacBook에서 백그라운드 서비스처럼 계속 돌아가고,
터미널에서 치는 `openclaw` 명령은 그 상태를 확인하거나 다시 깨우는 리모컨에 가깝습니다.

### 1-1. 전체 상태 보기

```bash
openclaw status
```

가장 자주 쓰는 확인 명령입니다.
먼저 이걸 보고,
Gateway 서비스가 살아 있는지,
Discord가 붙어 있는지부터 봅니다.

더 자세히 보려면:

```bash
openclaw status --deep
```

### 1-2. Gateway 상태만 빠르게 보기

```bash
openclaw gateway status
```

OpenClaw 본체 설명보다,
지금 엔진이 켜져 있는지만 짧게 보고 싶을 때 좋습니다.

### 1-3. Gateway 시작

```bash
openclaw gateway start
```

OpenClaw가 아예 내려가 있거나,
처음 다시 띄울 때 씁니다.

### 1-4. Gateway 재시작

```bash
openclaw gateway restart
```

켜져 있기는 한데 Discord 반응이 이상할 때,
제일 먼저 써보는 복구 명령입니다.

### 1-5. Gateway 중지

```bash
openclaw gateway stop
```

백그라운드에서 잠시 꺼두고 싶을 때 씁니다.

### 1-6. macOS 서비스 자체를 강제로 다시 깨우기

```bash
launchctl kickstart -k "gui/$(id -u)/ai.openclaw.gateway"
```

이건 `openclaw gateway restart`로 해결이 안 될 때만 쓰는 편이 좋습니다.

차이는 이렇게 생각하면 쉽습니다.

- `openclaw gateway restart` = OpenClaw 리모컨으로 재시작
- `launchctl kickstart` = macOS 서비스 자체를 강제로 흔들어 깨우기

### 1-7. 대시보드 열기

```bash
openclaw dashboard
```

이건 꼭 이렇게 여는 편이 좋습니다.
그냥 로컬 주소만 브라우저로 직접 열면,
겉화면은 보여도 인증이 안 붙어서 `gateway token missing`이 뜰 수 있습니다.

브라우저는 열지 않고 인증 URL만 만들고 싶다면:

```bash
openclaw dashboard --no-open
```

쉽게 말하면,
건물 주소만 치고 들어가는 게 아니라,
출입증이 붙은 초대장으로 들어간다고 생각하면 됩니다.

### 1-8. 로그 보기

```bash
openclaw logs --follow
```

무슨 일이 꼬였는지 실시간으로 보고 싶을 때 씁니다.
종료는 `Ctrl + C`입니다.

### 1-9. 설정 검증

```bash
openclaw config validate
```

설정 파일에 문법 문제가 없는지 볼 때 씁니다.

### 1-10. Doctor 점검

```bash
openclaw doctor --fix --non-interactive
```

플러그인, 채널, 보안 설정을 한 번에 점검할 때 좋습니다.

여기서 `Preserved Codex OAuth model routes` 같은 문구가 보여도,
무조건 오류로 보면 안 됩니다.
현재처럼 Codex OAuth 경로를 쓰는 환경에서는 정상 안내일 수 있습니다.

### 1-11. 보안 감사 점검

```bash
openclaw security audit --deep
```

여기서 `Potential multi-user setup detected`가 남을 수 있습니다.
이건 공유 Discord 채널을 운영하고 있다는 알림으로 읽는 편이 맞습니다.

즉,
바로 "누가 내 맥을 막 건드릴 수 있다"는 뜻으로 받아들이기보다,
공유 공간을 쓰는 구조인지 알려주는 경고로 읽는 게 정확합니다.

### 1-12. OpenClaw 빠른 복구 순서

OpenClaw가 Discord에서 오프라인처럼 보일 때는 보통 이렇게 갑니다.

```bash
openclaw status
openclaw gateway restart
openclaw status
```

그래도 이상하면:

```bash
launchctl kickstart -k "gui/$(id -u)/ai.openclaw.gateway"
```

## 2. Android 연결 확인용 명령어

이 명령들은 MacBook 터미널에서 실행합니다.

### 2-1. Android가 잡히는지 보기

```bash
adb devices
```

조금 더 자세히:

```bash
adb devices -l
```

정상이라면 `device`로 보입니다.
`unauthorized`면 폰 화면에서 USB 디버깅 허용을 눌러야 합니다.

### 2-2. ADB 서버 재시작

```bash
adb kill-server
adb start-server
adb devices
```

USB 연결이 꼬였을 때 가장 먼저 해볼 만한 기본 복구입니다.

### 2-3. MacBook에서 Termux 앱 열기

```bash
adb shell am start -n com.termux/.app.TermuxActivity
```

손으로 폰을 만지지 않고,
MacBook에서 바로 Termux 창을 띄우고 싶을 때 유용합니다.

### 2-4. Android 안에서 Termux와 Hermes 프로세스 보기

```bash
adb shell ps -A | grep -iE 'termux|hermes'
```

`hermes`가 보이면 Hermes gateway가 실행 중일 가능성이 높습니다.

## 3. Termux 안의 Hermes 핵심 명령어

이 명령들은 Android 폰의 Termux에서 실행합니다.

### 3-1. Hermes 폴더로 이동

```bash
cd ~/.hermes/hermes-agent
```

### 3-2. 가상환경 켜기

```bash
. venv-termux/bin/activate
```

프롬프트 앞에 `(venv-termux)`가 붙으면 정상입니다.

### 3-3. gateway 상태 확인

```bash
hermes gateway status
```

지금 Hermes가 살아 있는지 가장 먼저 볼 때 쓰는 명령입니다.

### 3-4. gateway 시작

```bash
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
```

터미널을 닫아도 백그라운드에서 계속 돌게 할 때 씁니다.

### 3-5. gateway 재시작

```bash
pkill -f "hermes gateway" 2>/dev/null || true
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
```

설정을 바꾼 뒤에는 이 명령을 제일 많이 쓰게 됩니다.

### 3-6. 로그 보기

최근 로그 120줄:

```bash
tail -n 120 ~/.hermes/gateway-discord.log
```

실시간 보기:

```bash
tail -f ~/.hermes/gateway-discord.log
```

### 3-7. Discord 운영 설정 확인

토큰은 빼고,
운영에 필요한 값만 보려면:

```bash
grep -E '^(DISCORD_ALLOW_ALL_USERS|DISCORD_ALLOWED_CHANNELS|DISCORD_FREE_RESPONSE_CHANNELS|DISCORD_REQUIRE_MENTION|DISCORD_IGNORE_NO_MENTION|DISCORD_AUTO_THREAD|DISCORD_NO_THREAD_CHANNELS|DISCORD_ALLOW_BOTS|DISCORD_ALLOW_MENTION_USERS)=' ~/.hermes/.env
```

공개 글에서는 실제 ID를 그대로 적기보다,
`YOUR_DISCORD_CHANNEL_ID`처럼 바꿔 쓰는 편이 안전합니다.

특히 팀장 모드에서 기억할 값은 이쪽입니다.

```text
DISCORD_FREE_RESPONSE_CHANNELS=
DISCORD_REQUIRE_MENTION=true
DISCORD_IGNORE_NO_MENTION=true
DISCORD_ALLOW_BOTS=mentions
DISCORD_ALLOW_MENTION_USERS=true
```

즉,
Hermes는 채널 안에 있지만,
아무 말에나 먼저 끼어들지 않고,
직접 불렸을 때만 움직이는 쪽입니다.

### 3-8. Hermes가 스레드를 만들지 않게 할 때

```bash
DISCORD_AUTO_THREAD=false
DISCORD_NO_THREAD_CHANNELS=YOUR_DISCORD_CHANNEL_ID
```

이 값이 바뀌었다면 `.env`와 `config.yaml`을 고친 뒤 gateway를 다시 띄웁니다.

### 3-9. `'NoneType' object is not iterable` 오류가 보일 때

이건 꽤 헷갈리는 오류인데,
Telegram이나 Discord 문제처럼 보여도 먼저 Hermes 본체부터 확인하는 편이 맞습니다.

버전과 업데이트 확인:

```bash
hermes --version
hermes update --check
```

업데이트가 필요하면:

```bash
hermes update --yes --backup
```

그리고 가장 중요한 본체 단문 응답 테스트:

```bash
hermes chat \
 --provider openai-codex \
 --model "$(python - <<'PY'
from pathlib import Path
import yaml
cfg = yaml.safe_load((Path.home() / '.hermes' / 'config.yaml').read_text()) or {}
print((cfg.get('model') or {}).get('model') or 'gpt-5.5')
PY
)" \
 --toolsets clarify \
 --ignore-rules \
 --quiet \
 --query "한국어로 OK라고만 답하세요."
```

정상 기준은 아주 단순합니다.

```text
OK
```

메신저 연결을 의심하기 전에,
Hermes가 자기 입으로 먼저 대답할 수 있는지 보는 셈입니다.

## 4. scrcpy에서 자주 쓰는 명령어

scrcpy는 Android 화면을 MacBook으로 가져와서,
보면서 조작할 수 있게 해 주는 도구입니다.

### 4-1. 가장 기본

```bash
scrcpy
```

### 4-2. 가장 추천하는 기본 실행

```bash
scrcpy --stay-awake --window-title Hermes-Android-Debug
```

폰이 자꾸 꺼지지 않게 하고,
창 이름도 알아보기 쉽게 붙이는 방식입니다.

### 4-3. 조금 더 부드럽게

```bash
scrcpy --stay-awake --max-fps=60 --window-title Hermes-Android-Debug
```

### 4-4. 화질을 높이고 싶을 때

```bash
scrcpy --stay-awake --max-fps=60 --video-bit-rate=20M --window-title Hermes-Android-Debug
```

### 4-5. 화면만 보고 조작은 안 할 때

```bash
scrcpy --no-control
```

### 4-6. 폰 화면은 끄고 MacBook에서만 볼 때

```bash
scrcpy --turn-screen-off --stay-awake --window-title Hermes-Android-Debug
```

### 4-7. 녹화까지 같이 할 때

```bash
scrcpy --stay-awake --record=android-screen.mp4 --window-title Hermes-Android-Debug
```

### 4-8. 종료

- 창에서 `Command + Q`
- 터미널에서 `Ctrl + C`

## 5. 상황별로 아주 짧게 보면

### OpenClaw가 오프라인처럼 보일 때

```bash
openclaw status
openclaw gateway restart
openclaw status
```

### Hermes가 오프라인처럼 보일 때

```bash
cd ~/.hermes/hermes-agent
. venv-termux/bin/activate
pkill -f "hermes gateway" 2>/dev/null || true
setsid -f hermes gateway run > ~/.hermes/gateway-discord.log 2>&1
hermes gateway status
```

### Android 화면을 바로 띄우고 싶을 때

```bash
adb devices
scrcpy --stay-awake --window-title Hermes-Android-Debug
```

### Android가 ADB에 안 잡힐 때

```bash
adb kill-server
adb start-server
adb devices
```

그리고 폰에서 같이 볼 것:

1. 폰 잠금 해제
2. USB 연결 모드 확인
3. USB 디버깅 켜기
4. USB 디버깅 허용 팝업 누르기

## 6. 정말 이것만 외우면 되는 3개

### OpenClaw 상태 확인

```bash
openclaw status
```

### Hermes 상태 확인

```bash
cd ~/.hermes/hermes-agent
. venv-termux/bin/activate
hermes gateway status
```

### Android 미러링

```bash
scrcpy --stay-awake --window-title Hermes-Android-Debug
```

이 세 개만 손에 익어도,
대부분의 첫 점검은 훨씬 빨라집니다.

## 마무리하며

처음에는 명령어가 많아 보여도,
실제로 자주 치는 건 늘 비슷합니다.

- OpenClaw는 살아 있나
- Hermes는 살아 있나
- Android 화면은 잘 보이나

대부분의 점검은 결국 이 세 질문으로 다시 모입니다.
그러니 한꺼번에 다 외우려 하기보다,
자주 쓰는 것 세 개부터 손에 익히는 편이 훨씬 낫습니다.

출처: 첨부 문서 기준 정리

## 생활 속 쉬운 예시로 표현하는 용어 설명

### OpenClaw CLI
앞에서 버튼을 누르는 리모컨입니다.
TV 자체가 아니라, TV를 켜고 끄고 상태를 보는 손잡이 같은 것입니다.

### OpenClaw gateway
실제로 Discord와 붙어 일하는 뒤쪽 엔진입니다.
가게 매장 앞 계산대보다, 뒤쪽에서 계속 돌아가는 POS 본체에 가깝습니다.

### LaunchAgent
Mac이 백그라운드 작업을 계속 켜 두는 자동 시동 장치입니다.
아침에 가게 셔터가 열리면 같이 켜지는 전등 타이머 같은 느낌입니다.

### ADB
MacBook이 Android 폰에게 말을 거는 통로입니다.
리모컨 선이나 관리용 인터폰 같은 것이라고 생각하면 쉽습니다.

### scrcpy
Android 화면을 MacBook으로 가져오는 거울입니다.
그냥 거울이 아니라, 거울 속 화면을 직접 눌러볼 수도 있는 도구에 가깝습니다.

### Termux
Android 폰 안에 만든 작은 작업실입니다.
집 안 창고 한쪽에 간이 책상과 공구함을 만들어 놓은 느낌입니다.

### venv
Hermes만 쓰는 전용 공구함입니다.
다른 공구와 뒤섞이지 않게 작은 바구니에 따로 담아두는 것과 비슷합니다.

### 로그
무슨 일이 있었는지 적히는 운영 일지입니다.
가게 마감 노트처럼, 어디서 문제가 났는지 되짚어 볼 때 가장 도움이 됩니다.
