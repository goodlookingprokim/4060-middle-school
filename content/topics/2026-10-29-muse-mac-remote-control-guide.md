---
title: "Muse로 내 맥을 원격으로 조종하기 — 아주 쉬운 안내서"
description: "휴대폰의 Muse에서 집의 맥북을 안전하게 확인하고 조작하기 위해 Tailscale·SSH·GUI 러너를 연결하는 과정을 4060 회원님 눈높이로 정리한 실전 안내서입니다."
tags:
  - muse
  - macos
  - remote-access
  - tailscale
  - ssh
  - middle-school
created: "2026-10-29"
modified: "2026-10-29"
publish: true
cssclasses:
  - playbook
---

<div class="note-hero">
  <p class="kicker">MUSE · MAC REMOTE CONTROL</p>
  <p><strong>집에 있는 맥북을 밖에서 Muse에게 부탁해 쓰고 싶다면, 화면을 인터넷에 그대로 열기보다 Tailscale·SSH·GUI 러너를 역할별로 나누어 연결하는 편이 안전하고 이해하기 쉽습니다.</strong></p>
  <p>이 글은 실제 설치에서 겪은 실패까지 최대한 빠뜨리지 않고 정리한 안내서입니다. 민감한 IP·계정·키 지문·개인 식별 정보는 공개하지 않고 예시 형태로 바꾸었습니다.</p>
</div>


> **이 안내서는 누구를 위한 글인가요?**
> 집에 있는 내 맥북을, 밖에 있는 내가 휴대폰으로 Muse에게 시켜서 쓰고 싶은 선생님·동료를 위한 글입니다.
> 예를 들어 "맥에 있는 파일 열어줘", "지금 화면이 어떻게 돼 있어?" 같은 일을 Muse가 대신하게 만드는 방법입니다.
>
> **이 안내서는 실제 시행착오를 바탕으로 썼습니다.**
> 2026년 10월 28~29일, 작성자의 맥북에서 직접 설치하면서 일어난 일들입니다.
> 잘 된 것만 적은 게 아닙니다. 컴퓨터가 꺼진 일, 키가 거부된 일, 스크린샷이 안 된 일까지 다 적었습니다.
> 그래서 이 글을 순서대로 따라가면, 같은 실수를 반복하지 않아도 됩니다.

---

## 0. 먼저, 전체 그림을 잡아요 (3분)

이 방법은 3가지가 합쳐진 것입니다.

```
[휴대폰의 나] → [Muse (VM, 인터넷 위의 내 컴퓨터)] → [집의 내 맥북]
                                        │
                                        ├─ ① Tailscale: 둘을 잇는 비밀 통로 (인터넷에 문을 열지 않음)
                                        ├─ ② SSH: 맥에 명령을 내리는 길 (전용 열쇠만 씀)
                                        └─ ③ GUI 러너: 화면 보기·앱 켜기·클릭·키 입력을 하는 작은 프로그램
```

- **Tailscale**이 없으면 Muse는 집 맥을 찾을 수 없습니다.
- **SSH**가 없으면 파일 확인·명령 실행을 못 합니다.
- **GUI 러너**가 없으면 화면을 보거나 클릭을 못 합니다. SSH만으로는 화면 작업이 안 됩니다.

> ⚠️ **Aside와는 다릅니다.**
> Aside는 브라우저만 조종합니다. 이 방법은 파일·프로그램·화면까지 갑니다.
> Aside를 지우지 마세요. 둘은 같이 씁니다.

### 꼭 기억할 황금 규칙 3가지

1. **쓸 때는 Tailscale을 켜고, 러너를 실행하세요.**
   평소에 Tailscale을 꺼두는 분이 많습니다. 안 되면 가장 먼저 이 두 가지를 확인하세요.
2. **설치 스크립트를 두 번 실행하지 마세요.**
   특히 화면이 꺼지거나 컴퓨터가 꺼진 적이 있다면, 다시 실행하지 말고 멈추세요.
3. **토큰(비밀번호 같은 것)과 비공개키는 채팅에 붙이지 마세요.**
   토큰은 맥 안에만 두는 것이 이 안내서의 기본 방식입니다.

---

## 1. 준비물 체크리스트

시작하기 전에, 아래가 다 있는지 확인하세요.

- [ ] 맥북 (이 안내서는 Apple Silicon 맥북 기준입니다. Intel 맥은 일부 경로가 다릅니다.)
- [ ] 맥북이 켜져 있고, 로그인돼 있습니다. (설치와 권한 승인은 맥 앞에서만 됩니다.)
- [ ] Muse 계정이 있습니다. (휴대폰 Muse 앱에서 쓸 수 있는 상태)
- [ ] Tailscale 계정이 있습니다. (없으면 <a href="https://tailscale.com" target="_blank" rel="noopener">tailscale.com</a> (블로그 밖 · 새 창)에서 무료로 만듭니다.)
- [ ] 맥에 Tailscale 앱이 설치돼 있습니다. (App Store 또는 tailscale.com에서 받습니다.)
- [ ] 관리자 암호를 압니다. (원격 로그인을 켤 때 필요합니다.)

> 💡 **맥이 잠들면 안 닿습니다.**
> 맥이 완전히 잠들면 Muse도 깨울 수 없습니다. 쓸 때는 화면이 꺼져도 잠들지 않게 설정해 두는 것이 좋습니다.
> `시스템 설정 > 배터리(또는 에너지 절약)`에서 확인하세요.

---

## 2. 1단계: Tailscale로 비밀 통로 만들기

### 2-1. 맥에서 Tailscale 로그인하기

1. 맥 메뉴 막대(화면 오른쪽 위)에서 Tailscale 아이콘을 누릅니다.
2. 로그인합니다. (처음이면 브라우저가 열립니다.)
3. 로그인 뒤, Terminal을 열고 아래를 실행합니다.

```sh
tailscale ip -4
```

**이렇게 나오면 성공입니다.**

```
100.64.x.x
```

- 숫자는 사람마다 다릅니다. 중요한 것은 `100.`으로 시작하는 것입니다.
- 아래처럼 나오면 아직 안 된 것입니다.

```
no current Tailscale IPs; state: Stopped
Tailscale is stopped.
```

이때는 Tailscale 앱에서 로그인을 다시 해주세요. 앱이 멈춰 있는 상태입니다.

> 📝 **내 IP를 메모해 두세요.**
> 나중에 Muse가 "맥 IP가 뭐예요?"라고 물으면 이 숫자를 알려주면 됩니다.
> 예시: 이 안내서의 실제 설치에서는 `100.64.x.x`이었습니다. 여러분의 숫자는 다를 수 있습니다.

### 2-2. Muse 쪽(VM)도 같은 tailnet에 넣기

이 부분은 Muse가 합니다. 여러분은 승인만 하면 됩니다.

1. Muse에게 "Tailscale에 연결해줘"라고 말합니다.
2. Muse가 승인 링크를 보여줍니다. 링크를 열고 Tailscale 관리 화면에서 Muse 기기를 승인합니다.
3. Muse가 아래처럼 확인합니다.

```sh
tailscale status
```

맥 이름(예: `내-맥북`)과 맥 IP가 보이면 성공입니다.

> ⚠️ **주의: `tailscale down`은 누르지 마세요.**
> 끄면 기기 정체성이 지워져서, 다시 가입할 때 새 승인이 필요합니다.

---

## 3. 2단계: SSH — 전용 열쇠 만들기

SSH는 "맥에 명령을 내리는 길"입니다. **절대 기존 열쇠를 재사용하지 마세요.** 이 일만을 위한 전용 열쇠를 만듭니다.

### 3-1. 맥에서 원격 로그인 켜기

방법 1 (설정에서, 쉬운 방법):

1. `시스템 설정 > 일반 > 공유`를 엽니다.
2. `원격 로그인`을 켭니다.

방법 2 (Terminal에서):

```sh
sudo systemsetup -setremotelogin on
```

**이렇게 나오면 이미 켜져 있는 것입니다. 걱정하지 마세요.**

```
setremotelogin: remote login is already On.
```

> 💡 **실수하기 쉬운 점:**
> `systemsetup -getremotelogin`을 `sudo` 없이 실행하면 아래처럼 나옵니다.
> ```
> You need administrator access to run this tool... exiting!
> ```
> 이것은 꺼져 있다는 뜻이 아닙니다. 권한이 없다는 뜻입니다. `sudo`를 붙여서 다시 하세요.

### 3-2. 전용 키 만들기 (Muse가 VM에서 합니다)

Muse가 VM에서 아래를 실행합니다. 여러분은 결과(지문)만 확인하면 됩니다.

```sh
ssh-keygen -t ed25519 -f ~/.ssh/muse-mac-tailscale -N "" -C "muse-vm-to-mac-tailscale"
ssh-keygen -lf ~/.ssh/muse-mac-tailscale.pub
```

- <strong>공개키(<code>.pub</code>로 끝나는 파일)</strong>만 맥으로 옮깁니다.
- <strong>비공개키(확장자가 없는 파일)</strong>는 절대 옮기지 않고, 채팅에 붙이지 않습니다. VM 안에만 둡니다.

> 🔑 **왜 전용 키인가요?**
> 나중에 그만 쓰고 싶을 때, 전용 키 한 줄만 지우면 됩니다. 평소 쓰던 열쇠를 건드리면 다른 일까지 망가집니다.

### 3-3. 맥에 공개키 등록하기 (가장 조심할 부분)

맥의 `~/.ssh/authorized_keys` 파일에 공개키 한 줄을 넣습니다. 이때 **제한 옵션**을 붙입니다.

**써야 하는 제한 (이대로 쓰세요):**

```
from="100.*",no-port-forwarding,no-agent-forwarding,no-X11-forwarding <공개키>
```

뜻은 이렇습니다.

- `from="100.*"` : Tailscale 주소(100으로 시작)에서만 들어올 수 있습니다.
- `no-port-forwarding` : 포트 전달(우회 통로)을 못 만듭니다.
- `no-agent-forwarding`, `no-X11-forwarding` : 다른 전달 기능도 끕니다.

**절대 넣지 마세요 — 실제 실패 사례:**

```
permitopen="none"
```

이 한 단어가 들어가면, 맥의 SSH 서버(OpenSSH 10.3)가 그 키 줄 전체를 거부합니다.
공개키가 파일에 있는데도 "Permission denied (publickey)"가 나옵니다.
우리는 이 때문에 반나절을 헤맸습니다. 원인을 알고 나니, 옵션을 빼자마자 바로 붙었습니다.

> ✅ **나중에 더 조이고 싶다면:**
> 처음에는 `from="100.*"`로 두고, 연결이 되면 VM의 실제 Tailscale IP 하나로 바꾸는 것이 좋습니다.
> 예: `from="100.80.x.x"` (여러분의 VM IP로 바꾸세요.)

### 3-4. 파일이 제대로 들어갔는지 확인하기

Terminal에서 아래를 실행합니다.

```sh
ls -ld ~ ~/.ssh; ls -l ~/.ssh/authorized_keys; wc -l ~/.ssh/authorized_keys; awk '{print NR": len="length" : "substr($0,1,90)}' ~/.ssh/authorized_keys
```

**정상 예시:**

```
drwxr-x--- ... /Users/여러분
drwx------ ... /Users/여러분/.ssh
-rw------- ... /Users/여러분/.ssh/authorized_keys
       2 /Users/여러분/.ssh/authorized_keys
1: len=94 : ssh-ed25519 AAAAC3... (예전 키가 있다면)
2: len=193 : from="100.*",no-port-forwarding,... ssh-ed25519 AAAAC3...
```

확인할 점 3가지:

1. `~/.ssh`는 `drwx------` (700), `authorized_keys`는 `-rw-------` (600)이어야 합니다.
2. 줄이 2줄이면 2줄이 따로 보여야 합니다. 두 줄이 한 줄로 붙어 있으면 안 됩니다.
3. 우리 키 줄이 `from=`으로 시작하고, `permitopen`이 없어야 합니다.

---

## 4. 3단계: GUI 러너 — 화면을 보는 작은 프로그램

### 4-1. 러너가 왜 필요한가요?

SSH만으로는 아래를 못 합니다.

- 지금 화면이 어떻게 생겼는지 보기
- 앱을 앞으로 가져오기
- 마우스 클릭하기, 키 입력하기

러너는 그 일만 하는 작은 프로그램입니다. 임의의 명령을 실행하지는 않습니다. 허용된 일만 합니다.

**러너가 할 수 있는 일:**

| 일 | 설명 |
|---|---|
| `screenshot` | 지금 화면 사진 찍기 |
| `frontmost` | 지금 앞에 있는 앱 이름 알려주기 |
| `activate` | 지정한 앱을 앞으로 가져오기 |
| `open` | Desktop·Documents·Downloads·Applications 안의 파일/앱 열기 |
| `click` | 지정한 좌표 클릭하기 (좌표는 꼭 확인하고) |
| `keystroke` | 짧은 글자 입력하기 (200자까지, 줄바꿈 없음) |

> ⚠️ **click과 keystroke는 조심해서 씁니다.**
> 클릭과 키 입력은 화면을 실제로 바꿉니다. Muse에게 시킬 때는 "어디를, 무엇을" 정확히 정해주세요.
> Muse는 여러분이 정해주지 않으면 함부로 누르거나 입력하지 않습니다.

### 4-2. 가장 중요한 결론: 러너는 Terminal에서 띄워야 합니다

**이것이 이번 설치에서 가장 큰 시행착오입니다. 꼭 읽어주세요.**

처음에는 러너를 "로그인하면 자동으로 뜨는 방식(LaunchAgent)"으로 만들었습니다.
또 ".app으로 감싸는 방식"도 해봤습니다.
둘 다 건강 확인(`health`)은 됐고, 앞 앱 확인(`frontmost`)도 됐습니다.
그런데 **스크린샷만 계속 실패**했습니다.

에러 메시지는 매번 같았습니다.

```
could not create image from display
```

권한 목록에 Python을 넣어도, screencapture 프로그램을 넣어도, .app을 넣어도 안 됐습니다.
원인은 권한 목록이 아니었습니다. **그 방식으로는 맥의 화면(WindowServer)에 닿지 못하기 때문**이었습니다.

**되는 방법은 하나였습니다. Terminal에서 직접 띄우는 것입니다.**

```sh
nohup /usr/bin/python3 ~/.config/muse-runner/runner.py --token-file ~/.config/muse-runner/token >> ~/Library/Logs/muse-runner/runner-term.log 2>&1 &
```

Terminal 세션에서 띄우자마자 스크린샷이 됐습니다.
2992×1934 크기의 실제 화면 사진이 왔습니다.

> 📌 **그래서 이 안내서의 결론은 이렇습니다.**
> - LaunchAgent로 자동 시작하면: 건강 확인은 되지만 스크린샷은 안 됩니다.
> - .app으로 실행하면: 역시 스크린샷이 안 됩니다.
> - **Terminal에서 띄우면: 다 됩니다.**
>
> 자동 시작이 편해 보여도, 스크린샷이 필요하면 Terminal 방식을 쓰세요.
> 로그인할 때마다 한 번씩 실행해 주는 것이, 안 되는 자동 방식보다 낫습니다.

### 4-3. 다시 띄우기 쉽게: 더블클릭 파일 만들기

매번 긴 명령을 치기 귀찮으니, 더블클릭 파일을 하나 만듭니다.
이 파일은 "예전 러너를 끄고, 새로 띄우는" 일을 합니다.

**파일 위치 (예시 — 여러분이 정한 폴더에 두세요):**

```
~/Documents/muse-mac-kit/MuseRunner-Start.command
```

> 📝 **여러분의 폴더로 바꾸세요.**
> 위 경로는 실제 설치에서 쓴 예시입니다. 여러분은 자기 폴더(예: Documents 안의 자기 폴더)에 두면 됩니다.
> 중요한 것은 **위치를 기억해 두는 것**입니다. 나중에 "러너 다시 띄우는 법이 뭐였지?"라고 물으면, Muse가 이 위치를 바로 알려줄 수 있게 메모해 두세요.

**파일 내용:**

```sh
#!/bin/sh
pkill -f "runner.py" 2>/dev/null; sleep 1
nohup /usr/bin/python3 "$HOME/.config/muse-runner/runner.py" --token-file "$HOME/.config/muse-runner/token" >> "$HOME/Library/Logs/muse-runner/runner-term.log" 2>&1 &
```

**만드는 방법 (Terminal에서 한 번만):**

```sh
cat > ~/Documents/mac-kit-v2/MuseRunner-Start.command <<'EOF'
#!/bin/sh
pkill -f "runner.py" 2>/dev/null; sleep 1
nohup /usr/bin/python3 "$HOME/.config/muse-runner/runner.py" --token-file "$HOME/.config/muse-runner/token" >> "$HOME/Library/Logs/muse-runner/runner-term.log" 2>&1 &
EOF
chmod +x ~/Documents/mac-kit-v2/MuseRunner-Start.command
```

(폴더 경로를 자기 것으로 바꾸세요.)

**실행 방법:** Finder에서 그 파일을 **더블클릭**합니다.
아무것도 안 뜨는 것이 정상입니다. 백그라운드 프로그램이라 창이 없습니다.
떴는지는 Muse에게 "러너 살아 있어?"라고 물어보면 확인해 줍니다.

> ⚠️ **이 파일도 Terminal에서 띄우는 것과 같습니다.**
> 더블클릭하면 Terminal이 잠깐 열렸다가, 러너가 백그라운드로 뜹니다.
> SSH로 띄우면 안 됩니다. 꼭 맥 앞에서(또는 맥 화면에서) 더블클릭하세요.

### 4-4. 토큰: 절대 채팅에 붙이지 마세요

러너는 토큰(긴 비밀번호 같은 것)으로 본인 확인을 합니다.
토큰 파일은 맥 안에만 있습니다.

```
~/.config/muse-runner/token
```

- 파일 권한은 600(나만 읽기)이어야 합니다.
- 토큰 값을 채팅에 붙이지 마세요. 비밀번호 관리자에 저장하세요.
- Muse가 러너를 확인할 때는, **토큰을 맥 밖으로 가져오지 않는 방식**을 씁니다.
  SSH로 맥 안에서 토큰을 읽어 러너를 찌르고, 결과만 가져옵니다. 토큰 값은 VM으로 오지 않습니다.

**토큰 없이 찔렀을 때 `401 Unauthorized`가 나오면 정상입니다.**
토큰이 틀렸거나 없다는 뜻이 아니라, "토큰을 안 냈으니 안 된다"는 정상 응답입니다.

---

## 5. 권한 승인: 화면 기록과 손쉬운 사용

러너가 화면을 보려면, 맥의 권한 승인이 필요합니다. **이것은 원격으로 해줄 수 없습니다. 맥 앞에서 직접 해야 합니다.**

### 5-1. 어디에서 하나요?

**영문 메뉴:**

- `System Settings > Privacy & Security > Screen Recording` (화면 기록)
- `System Settings > Privacy & Security > Accessibility` (손쉬운 사용)

**Accessibility를 못 찾겠다면:**

Accessibility는 최상위 메뉴가 아닙니다. `Privacy & Security` 안에 있습니다.
`Privacy & Security`를 열고 오른쪽 목록을 맨 아래까지 내리세요. Screen Recording보다 아래에 있습니다.
못 찾겠으면, 설정 창의 왼쪽 위 검색창에 `Accessibility`라고 치세요.
이때 디스플레이 아이콘인 최상위 Accessibility가 아니라, **Privacy & Security 아래에 있는 Accessibility**를 고르세요.

그래도 안 되면, Terminal에서 아래를 실행하면 설정이 바로 그 화면으로 갑니다.

```sh
open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
```

### 5-2. 무엇을 추가하나요?

처음에는 목록에 Terminal만 있을 것입니다. Python이 없습니다.
추가할 파일은, 실제로 도는 Python입니다.

```
/Applications/Xcode.app/Contents/Developer/usr/bin/python3
```

왜 이 경로냐면, `/usr/bin/python3`은 껍데기이고 실제로 도는 것은 Xcode 안의 Python이기 때문입니다.
아래 명령으로 확인할 수 있습니다.

```sh
/usr/bin/python3 -c "import sys; print(sys.executable)"; ls -l /usr/bin/python3
```

```
 /Applications/Xcode.app/Contents/Developer/usr/bin/python3
 -rwxr-xr-x  78 root  wheel  200560  9월 24 16:10 /usr/bin/python3
```

**추가하는 방법:**

1. 목록 아래 `+` 버튼을 누릅니다.
2. 파일 선택 창에서 `Cmd+Shift+G`를 누릅니다.
3. 폴더 경로를 입력합니다: `/Applications/Xcode.app/Contents/Developer/usr/bin`
4. `python3`을 골라서 엽니다.
5. 목록에 생기면 토글을 켭니다.

화면 기록과 손쉬운 사용, **두 곳 다** 같은 파일을 추가하고 켜세요.
파일이 선택이 안 되면, 대신 `/Applications/Xcode.app` 자체를 추가해 보세요.

> 💡 **그래도 스크린샷이 안 되면, 권한 목록 문제가 아닐 수 있습니다.**
> 위에서 설명한 대로, LaunchAgent나 .app으로 띄웠으면 권한을 줘도 안 됩니다.
> Terminal에서 띄웠는지 먼저 확인하세요. 그것이 1순위입니다.

### 5-3. Gatekeeper: 처음 여는 앱 경고

서명이 없는 앱을 처음 열면, 맥이 "확인되지 않은 개발자" 경고를 냅니다.
이때는 Finder에서 앱을 우클릭하고 `열기`를 눌러, 나오는 창에서 `열기`를 누르세요.
Terminal로는 아래처럼 격리 표시를 지울 수도 있지만, 되도록 Finder에서 승인하는 것이 안전합니다.

```sh
xattr -dr com.apple.quarantine /Applications/MuseRunner.app
```

---

## 6. Muse 쪽 설정: VM에서 맥에 닿는 길

이 부분은 Muse가 VM에서 합니다. 여러분이 알아둘 점만 적습니다.

### 6-1. SSH 설정 파일은 절대 경로로, `-F`로 부르기

VM에서는 환경변수 `HOME`과 실제 홈이 달라서, SSH가 설정 파일을 못 찾는 일이 있습니다.
그래서 설정 파일에는 `~` 대신 절대 경로를 쓰고, 실행할 때는 `-F`로 파일을 직접 지정합니다.

```sh
ssh -F ~/.ssh/config muse-mac 'whoami'
```

이렇게 안 하고 그냥 `ssh muse-mac`를 하면, 직접 연결을 시도하다가 아래 같은 차단 메시지를 받을 수 있습니다.

```
muse: Outbound SSH is turned off for this assistant. ...
```

이것은 SSH 자체가 꺼졌다는 뜻이 아니라, **설정 파일(ProxyCommand)을 안 읽고 직접 연결했다는 뜻**입니다.
`-F`로 부르면 해결됩니다. Muse가 이 부분을 기억하고 있습니다.

### 6-2. 터널 프록시

VM의 Tailscale은 클라이언트 전용이라, SSH를 직접 보내지 못합니다.
대신 터널 프록시(3130번)를 통해 TCP로 연결합니다. Muse의 SSH 설정에 그 길이 들어 있습니다.
여러분이 따로 설정할 것은 없습니다. 안 되면 Muse에게 "SSH 설정 확인해줘"라고 말하세요.

---

## 7. 순서대로 확인하기 (검증 체크리스트)

아래를 순서대로 확인하세요. 앞이 안 되면 뒤로 넘어가지 마세요.

| 순서 | 확인할 것 | 성공 예시 |
|---|---|---|
| 1 | Tailscale IP | `tailscale ip -4` → `100.x.x.x` |
| 2 | 원격 로그인 | `sudo systemsetup -getremotelogin` → `Remote Login: On` |
| 3 | SSH 연결 | `ssh -F ~/.ssh/config muse-mac 'whoami; hostname'` → `내-맥`, `내-맥.local` |
| 4 | 러너 건강 확인 | 토큰을 맥 안에서 읽어 찌르면 `{"ok": true}` |
| 5 | 앞 앱 확인 | `frontmost` → `{"ok": true, "app": "Google Chrome"}` (여러분의 앞 앱 이름) |
| 6 | 스크린샷 | `http=200`, `image/png`, 크기가 수백 KB 이상, PNG로 열면 실제 화면이 보임 |
| 7 | (필요할 때만) 클릭·키 입력 | 좌표와 글자를 정확히 정한 뒤에만, 한 번씩 확인하며 |

> ✅ **스크린샷은 꼭 눈으로 확인하세요.**
> `200`이 왔다고 끝이 아닙니다. 파일을 받아서 열어보고, 실제 화면인지, 빈 화면이 아닌지 확인하세요.
> 파일이 46바이트짜리 JSON이면 실패입니다. (`{"ok": false, ...}`가 들어 있습니다.)
> 성공하면 100만 바이트가 넘는 PNG가 옵니다. (예: 1,498,239바이트, 2992×1934)

---

## 8. 평소에 쓰는 방법 (매일 하는 일)

### 8-1. 쓸 때

1. 맥에서 **Tailscale을 켭니다.** (메뉴 막대 아이콘에서 켜기/로그인)
2. **러너를 실행합니다.** 더블클릭 파일(`MuseRunner-Start.command`)을 누릅니다.
3. Muse에게 말합니다. 예: "지금 맥 화면 보여줘", "그록봇 열어줘".

### 8-2. 다 쓴 뒤

- Tailscale을 꺼두고 싶으면 꺼도 됩니다. (작성자도 평소에는 꺼둡니다.)
- 러너는 두어도 됩니다. 다음에 쓸 때 더블클릭 파일로 다시 띄우면 됩니다.

> 📌 **안 되면 가장 먼저 이 두 가지를 말하세요.**
> "Tailscale 켰어? 러너 실행했어?"
> 이 안내서를 만든 선생님의 지시입니다. 다른 것을 보기 전에 이 두 가지를 먼저 확인합니다.

### 8-3. 맥이 잠들지 않게

쓸 때는 맥이 잠들지 않게 해두세요. 화면이 꺼지는 것과 잠드는 것은 다릅니다.
화면은 꺼져도 되지만, 맥 자체가 잠들면 Muse가 닿지 않습니다.

---

## 9. 문제 해결 표 (시행착오 정리)

| 증상 | 원인 (실제로 겪은 것) | 해결 방법 |
|---|---|---|
| `Tailscale is stopped` | Tailscale 앱이 멈춰 있음 | 앱에서 로그인 다시 하기 |
| SSH에서 `Connection reset` | 맥에 서비스가 안 떠 있음, 또는 설정 파일을 안 읽고 직접 연결함 | Tailscale/원격 로그인 확인, `ssh -F`로 설정 파일 지정 |
| `Outbound SSH is turned off` 배너 | SSH 설정 파일을 못 읽음 (HOME 불일치) | 절대 경로 설정 + `ssh -F` 사용 |
| `Permission denied (publickey)` | `permitopen="none"`이 authorized_keys에 있음 | 그 옵션을 빼고 `from` + `no-*`만 남기기 |
| `Permission denied (publickey)` | 키 줄이 붙어 있음, 권한이 틀림 | 줄 분리 확인, `~/.ssh` 700, `authorized_keys` 600 확인 |
| 러너 `401 Unauthorized` | 토큰을 안 냄 | 정상입니다. 토큰을 맥 안에서 읽어 찌우기 |
| 러너 `500`, frontmost 타임아웃 | 손쉬운 사용 권한 없음, 또는 LaunchAgent 맥락 | 권한 추가 + Terminal에서 띄우기 |
| 스크린샷 `500`, `could not create image from display` | LaunchAgent/.app 맥락이라 화면에 닿지 못함 | **Terminal에서 띄우기.** 권한 목록을 더 채워도 안 됨 |
| `.app`을 더블클릭해도 아무 일도 없음 | Finder PATH에 `/usr/local/bin`이 없어 `tailscale`을 못 찾음, 조용히 종료됨 | 런처에 PATH 넣기 + 로그 파일로 확인하기 |
| `.app`이 안 열림, `rejected` | Gatekeeper 격리 표시 (다운로드한 서명 없는 앱) | Finder 우클릭 > 열기, 또는 `xattr -dr com.apple.quarantine` |
| zip을 받았는데 옛날 파일이 나옴 | 파일명이 같아서 옛날 zip을 다시 받음 | 파일명을 바꿔서 받기 (예: `-v2.zip`), `md5`로 확인하기 |
| 설치 스크립트 실행 후 화면/컴퓨터가 꺼짐 | `launchctl bootout`을 파일 경로와 합쳐서 한 인수로 쓴 것이 유력 원인 (확정 아님) | 그 스크립트를 다시 실행하지 말 것. 라벨 형태로만, 이미 로드된 경우에만 bootout 하기. 러너가 이미 돌고 있으면 전체 설치를 다시 하지 말 것 |
| `/usr/local/bin/openssl`, `/usr/local/bin/python3`에서 `Bad CPU type` | Apple Silicon 맥에 Intel 바이너리가 섞여 있음 | `/usr/bin/python3`을 쓰기. 토큰 만들 때는 `openssl` 대신 Python `secrets` 쓰기 |
| 새 zip인데 맥 파일이 옛날 것 | zip을 덮어썼는데 맥 폴더에 옛날 파일이 남아 있음 | 파일명을 바꾼 새 zip으로 받고, `md5`와 줄 번호로 버전 확인하기 |

### 파일을 실행하기 전에 꼭 버전 확인하기

새 파일인지 확인하는 가장 확실한 방법은 `md5`와 특징 줄입니다.

```sh
md5 install-mac.sh; grep -n "Python 선택" install-mac.sh
```

새 파일이면 MD5가 안내받은 값과 같고, 특징 줄이 나옵니다.
다르면, 옛날 파일을 실행하고 있는 것입니다. 멈추고 새 파일을 다시 받으세요.

---

## 10. 보안: 안전하게 쓰고, 그만둘 때

### 10-1. 안전하게 쓰는 법

- **전용 키만 씁니다.** 평소 키를 재사용하지 않습니다.
- **제한을 붙입니다.** `from="100.*"` + `no-port-forwarding` 등. 나중에는 VM IP 하나로 더 조입니다.
- **토큰은 맥 안에만 둡니다.** 채팅, 메모, 코드에 붙이지 않습니다.
- **러너는 허용된 일만 합니다.** 임의의 명령을 실행하는 구멍이 없습니다. 임의의 명령은 SSH로 따로, 기록이 남게 합니다.
- **러너 로그에는 토큰·키 입력 내용·스크린샷이 안 남습니다.** 일 + 결과 + 접속 IP만 남습니다.

### 10-2. 그만두고 싶을 때 (되돌리기)

1. 맥에서 `~/.ssh/authorized_keys`에서 Muse 전용 키 줄을 지웁니다. (다른 줄은 건드리지 마세요.)
2. 러너를 끕니다: Terminal에서 `pkill -f runner.py`
3. LaunchAgent를 썼다면 멈춥니다 (라벨 형태로만):
   ```sh
   launchctl bootout "gui/$(id -u)/com.example.muse-runner"
   ```
4. 원격 로그인을 끄고 싶으면: `sudo systemsetup -setremotelogin off`
5. Tailscale 관리 화면에서 Muse 기기를 지웁니다.
6. 토큰 파일을 지웁니다: `rm ~/.config/muse-runner/token`

이렇게 하면 Muse는 더 이상 맥에 닿지 않습니다.

---

## 11. 우리의 시행착오 기록 (날짜순)

동료가 "왜 이렇게 됐는지" 궁금할 수 있어서, 있었던 일을 날짜순으로 적습니다.

### 2026-10-28

- **23:06** — Threads 꿀팁(윈도우용 Tailscale + SSH + 상주 러너)을 맥 기준으로 바꾸기로 함.
- **23:13~14** — 키트 만듦. 문법·로컬 테스트만 통과. 전용 SSH 키 생성 (지문 `SHA256:생략`).
- **23:24** — 맥 Tailscale 로그인 확인. IP `100.64.x.x`, tailnet `계정 정보 생략`.
- **23:26** — VM Tailscale join 승인 완료. VM IP `100.80.x.x`.
- **23:27** — SSH·러너 확인 실패. 맥에 서비스가 안 떠 있었음.
- **23:28** — 설치 스크립트에서 `openssl rand`가 `Bad CPU type`으로 실패. `/usr/local/bin`에 Intel 바이너리가 섞여 있었음. Python `secrets`로 바꿈.
- **23:30** — `/usr/local/bin/python3`도 `Bad CPU type`. `/usr/bin/python3`(3.9.6)을 쓰게 고침.
- **23:35** — 맥 폴더에 옛날 파일이 남아 있었음 (5,537바이트). 파일명을 바꾼 `mac-kit-v2.zip`으로 다시 배포.
- **23:46** — v2 설치 스크립트 실행 직후 컴퓨터가 바로 꺼짐. 유력 원인으로 `launchctl bootout`의 한 인수 형태를 지목 (확정 아님). v2 재실행 금지.
- **23:48** — bootout을 라벨 대상으로만, 로드된 경우에만 하게 고친 v3 만듦.
- **23:50~53** — 그런데 러너가 이미 돌고 있었음 (PID 37737). v2가 bootstrap까지 갔거나, 재로그인 시 자동 시작된 것으로 보임.
- **23:55** — 원격 로그인 On 확인, SSH 키 등록 완료(`KEY_ADDED`). 러너 health는 토큰 없이 401로 정상 응답.

### 2026-10-29

- **06:37** — `authorized_keys` 확인: 289바이트 2줄, 권한 정상. 1줄은 openclaw 키, 2줄은 우리 키(제한 옵션 포함).
- **06:39** — 2줄을 옵션 없는 plain 키로 바꾸자 SSH 성공. **`permitopen="none"`이 원인으로 확정.** 키트 파일에서 그 옵션을 뺌.
- **07:02** — 제한 옵션(`permitopen` 없음) 다시 붙여도 SSH 성공. SSH 경로 완성.
- **07:08** — 러너 health 200 성공 (토큰은 맥 안에만 둠). frontmost·screenshot은 500.
- **07:14** — Terminal에서 screencapture와 osascript는 둘 다 성공. 러너만 실패 → 실행 맥락 문제로 좁혀짐.
- **07:15~16** — 권한 목록에 Terminal만 있고 Python 없음. 실제 Python은 Xcode 안의 경로임 확인.
- **07:29** — 권한 추가 후 frontmost 성공 (Chrome). screenshot은 여전히 500.
- **07:31~33** — 화면 기록 추가, screencapture 추가를 해도 screenshot 500. PyObjC 없음 확인.
- **07:33~44** — .app 래퍼 만듦. Gatekeeper 격리, PATH 문제, 옛날 zip 혼동 등을 거침.
- **07:52** — 새 .app 런처로 러너는 떴지만 screenshot 500. stderr 로그 추가.
- **07:54** — stderr 확인: `could not create image from display`. .app 맥락도 화면에 닿지 못함.
- **07:55** — **Terminal에서 nohup으로 띄우자 screenshot 200 성공.** 실제 화면 사진으로 검수 완료. 최종 결론 확정.
- **07:58~59** — 다시 띄우기 파일(`MuseRunner-Start.command`)을 지정 폴더에 설치. 위치와 방법을 기억해 달라는 요청 받음.
- **08:00** — 평소에는 Tailscale을 꺼둔다는 사실 확인. 안 되면 "Tailscale 켜고, 러너 실행"을 먼저 말하기로 함.
- **08:02** — Grok Bot 앱 활성화 확인. 앱은 살아 있었으나 창이 안 보여, 최소화/다른 스페이스 가능성을 안내함.

---

## 부록: 자주 쓰는 명령 모음 (복사해서 쓰세요)

### 맥에서 (Terminal, 맥 앞에서)

```sh
# Tailscale IP 확인
tailscale ip -4

# 원격 로그인 상태 (sudo 필요)
sudo systemsetup -getremotelogin
sudo systemsetup -setremotelogin on

# 실제로 도는 Python 확인
/usr/bin/python3 -c "import sys; print(sys.executable)"

# 러너가 돌고 있는지 확인
ps aux | grep runner.py | grep -v grep

# 러너 끄기
pkill -f runner.py

# 러너 띄우기 (Terminal에서만, 스크린샷용)
nohup /usr/bin/python3 ~/.config/muse-runner/runner.py --token-file ~/.config/muse-runner/token >> ~/Library/Logs/muse-runner/runner-term.log 2>&1 &

# 러너 로그 보기
tail -20 ~/Library/Logs/muse-runner/runner-term.log
tail -20 ~/Library/Logs/muse-runner/runner.log

# authorized_keys 확인
ls -ld ~ ~/.ssh; ls -l ~/.ssh/authorized_keys; wc -l ~/.ssh/authorized_keys
```

### Muse 쪽에서 (VM, Muse가 실행)

```sh
# SSH 연결 확인 (설정 파일을 -F로 지정)
ssh -F ~/.ssh/config muse-mac 'whoami; hostname; date'

# 러너 건강 확인은 SSH로 맥 안에서 토큰을 읽어 찌우는 방식으로 (토큰은 맥 밖으로 안 나옴)
```

---

## 마지막으로

이 방법은 "한 번 해두면 끝"이 아닙니다.
**쓸 때마다 Tailscale을 켜고, 러너를 실행하는 것**이 이 방법의 전부입니다.

안 되면, 순서대로 확인하세요.

1. Tailscale 켰나요?
2. 러너 실행했나요?
3. 맥이 잠들지 않았나요?

이 세 가지가 되면, 대부분 됩니다.
그 다음부터는 Muse에게 맡기세요.

> 이 안내서에 틀린 부분이나, 여러분의 맥에서 다르게 나온 부분이 있으면 알려주세요.
> 시행착오 기록에 추가해서, 다음 동료가 더 쉽게 할 수 있게 고치겠습니다.

---

## 12. 어려운 말을 쉽게 풀어볼게요

처음 보면 낯선 말이 많습니다. 아래처럼 생각하면 훨씬 쉽습니다.

| 용어 | 쉽게 말하면 | 이 글에서 하는 일 |
|---|---|---|
| Muse | 밖에서 부탁할 수 있는 조력자 | 휴대폰에서 맥에 일을 시킵니다. |
| VM | 인터넷 안에 따로 만든 컴퓨터 한 대 | Muse가 실제 명령을 실행하는 자리입니다. |
| Tailscale | 인터넷에 공개하지 않고 내 기기끼리 잇는 비밀 통로 | Muse가 집의 맥을 찾게 해 줍니다. |
| tailnet | Tailscale로 묶인 내 기기들의 모임 | Muse VM과 맥이 같은 모임에 들어가야 합니다. |
| IP 주소 | 네트워크 안에서 기기를 찾는 주소 | Muse가 어느 맥에 연결할지 알려 줍니다. `100.x.x.x`처럼 보입니다. |
| SSH | 다른 컴퓨터에 안전하게 명령을 보내는 통로 | 파일 확인, 상태 확인, 명령 실행에 씁니다. |
| SSH 키 | 열쇠와 자물쇠 한 쌍 | 비밀번호 대신 전용 열쇠로 맥에 들어갑니다. |
| 공개키 | 자물쇠 쪽에 해당하는 내용 | 맥의 `authorized_keys`에 등록합니다. |
| 비공개키 | 실제로 들고 다니는 열쇠 | VM 안에만 두고 채팅이나 맥으로 옮기지 않습니다. |
| `authorized_keys` | 맥에 들어와도 된 열쇠 목록 | Muse 전용 공개키를 이 파일에 한 줄 등록합니다. |
| GUI 러너 | 화면을 보고 클릭·키 입력을 대신하는 작은 프로그램 | SSH만으로 할 수 없는 화면 작업을 맡습니다. |
| LaunchAgent | 맥 로그인 때 프로그램을 자동으로 켜는 방식 | 편리하지만 이번 사례에서는 스크린샷이 실패했습니다. |
| WindowServer | 맥 화면을 실제로 그려 주는 시스템 | 러너가 여기에 닿아야 스크린샷이 됩니다. |
| Screen Recording | 화면을 읽을 수 있게 하는 권한 | 러너가 화면 사진을 찍을 때 필요합니다. |
| Accessibility | 앱을 앞으로 가져오거나 클릭·키 입력을 할 수 있게 하는 권한 | `frontmost`, `click`, `keystroke`에 필요합니다. |
| 토큰 | 러너가 “허가받은 요청인지” 확인하는 긴 문자열 | 맥 안에만 보관하고 채팅에 붙이지 않습니다. |
| Gatekeeper | 맥이 출처가 불분명한 앱을 막는 안전장치 | 처음 실행할 때 Finder에서 열기를 승인할 수 있습니다. |

특히 <strong>SSH와 GUI 러너는 서로 다른 역할</strong>입니다. SSH는 “맥 안에서 명령을 실행하는 길”이고, GUI 러너는 “맥 화면을 보고 누르는 손”입니다. SSH 연결이 성공해도 스크린샷이 자동으로 되는 것은 아닙니다.

또 하나 기억할 점이 있습니다. `401 Unauthorized`는 토큰 없이 러너를 찔렀을 때 나오는 정상적인 거절일 수 있습니다. 반대로 `500`은 권한이나 실행 환경을 더 살펴봐야 한다는 신호입니다. 숫자만 보고 성공·실패를 단정하지 말고, 응답 내용과 실제 화면을 함께 확인하세요.

## 13. 막혔을 때는 이 순서대로 확인하세요

문제가 생기면 여러 설정을 한꺼번에 바꾸지 마세요. 아래 순서대로 하나씩 확인하면 원인을 빨리 좁힐 수 있습니다.

### 13-1. 제일 먼저 볼 세 가지

1. 맥에서 Tailscale을 켰나요? `tailscale ip -4` 결과가 `100.x.x.x`처럼 나오는지 확인합니다.
2. 러너를 실행했나요? 더블클릭 파일을 다시 실행하거나, 맥 앞의 Terminal에서 러너를 띄웁니다.
3. 맥이 잠든 상태가 아닌가요? 화면이 꺼진 것과 맥이 잠든 것은 다릅니다.

이 세 가지 중 하나라도 안 되면 SSH나 권한 설정을 다시 만져도 소용이 없습니다.

### 13-2. 연결은 되는데 화면 작업만 안 될 때

1. 먼저 `ssh -F ~/.ssh/config muse-mac 'whoami; hostname'`으로 SSH 연결을 확인합니다.
2. SSH가 되면 러너의 `health`를 확인합니다. 토큰을 맥 밖으로 꺼내지 않는 방식으로 확인해야 합니다.
3. `frontmost`가 되면 손쉬운 사용 권한을 확인합니다.
4. `frontmost`는 되는데 `screenshot`만 500이면, 권한을 계속 추가하기 전에 러너를 <strong>Terminal에서 직접 띄웠는지</strong> 확인합니다.
5. 스크린샷 응답이 200이어도 파일을 직접 열어 보세요. 빈 이미지나 작은 JSON 파일이면 성공이 아닙니다.

### 13-3. SSH가 갑자기 거절될 때

| 확인할 것 | 이렇게 확인하세요 |
|---|---|
| Tailscale 상태 | 맥과 Muse VM이 같은 tailnet에 있고, 맥의 IP가 바뀌지 않았는지 확인합니다. |
| 원격 로그인 | 맥에서 `sudo systemsetup -getremotelogin`을 실행합니다. |
| 설정 파일 | `ssh muse-mac` 대신 `ssh -F ~/.ssh/config muse-mac 'whoami'`처럼 `-F`를 붙입니다. |
| 공개키 줄 | `authorized_keys`에서 Muse 키가 한 줄로 온전히 들어갔는지 확인합니다. |
| 제한 옵션 | `from="100.*"`과 `no-*` 옵션은 유지하되, `permitopen="none"`은 넣지 않습니다. |
| 권한 | `~/.ssh`는 700, `authorized_keys`는 600인지 확인합니다. |

`Outbound SSH is turned off`라는 문구가 나와도 SSH 기능 자체가 꺼졌다고 단정하지 마세요. VM의 `HOME`과 실제 설정 파일 위치가 달라서 설정을 못 읽고 직접 연결을 시도한 경우가 있습니다. 이때는 `-F`로 설정 파일을 직접 지정합니다.

### 13-4. 설치 뒤 맥이 이상해졌을 때

- 설치 스크립트를 여러 번 다시 실행하지 마세요.
- 화면이 꺼졌거나 컴퓨터가 재시작됐다면, 우선 설치를 멈추고 러너가 이미 실행 중인지 확인합니다.
- 로그는 `tail -20 ~/Library/Logs/muse-runner/runner-term.log`처럼 마지막 부분만 먼저 봅니다.
- 새 zip이나 새 스크립트를 받았다면 파일명과 버전을 바꾸고, `md5`와 특징 줄을 확인한 뒤 실행합니다.
- Apple Silicon 맥에서 `Bad CPU type`이 나오면 Intel용 `/usr/local/bin` 프로그램을 의심하고, 이 글에서 안내한 `/usr/bin/python3` 경로를 우선 사용합니다.

### 13-5. 무엇을 바꿨는지 모를 때 되돌리는 순서

1. Muse 전용 공개키 줄만 `~/.ssh/authorized_keys`에서 지웁니다.
2. `pkill -f runner.py`로 러너를 끕니다.
3. 필요하면 원격 로그인을 끕니다.
4. Tailscale 관리 화면에서 Muse 기기를 제거합니다.
5. 마지막으로 맥 안의 토큰 파일을 지웁니다.

다른 SSH 키나 다른 사람의 설정 줄은 건드리지 마세요. 원격 연결을 끊는 작업은 한 단계씩 확인하면서 진행하는 것이 안전합니다.

## 14. 마지막 점검표

| 질문 | 예 또는 아니오 |
|---|---|
| Tailscale이 켜져 있고 맥 IP가 `100.x.x.x`로 나오나요? |  |
| Muse VM과 맥이 같은 tailnet에 있나요? |  |
| 원격 로그인이 켜져 있나요? |  |
| 전용 SSH 키만 쓰고, 비공개키를 채팅에 붙이지 않았나요? |  |
| 러너를 Terminal 방식으로 실행했나요? |  |
| Screen Recording과 Accessibility 권한을 승인했나요? |  |
| 스크린샷 파일을 실제로 열어 확인했나요? |  |
| 문제가 생겼을 때 설치 스크립트를 반복 실행하지 않았나요? |  |

처음에는 용어와 단계가 많아 보여도, 실제로 매일 확인할 것은 간단합니다.

1. Tailscale을 켭니다.
2. 러너를 실행합니다.
3. 맥이 잠들지 않았는지 봅니다.
4. 그래도 안 되면 이 글의 13번 순서대로 하나씩 확인합니다.

이 네 가지만 습관이 되면, 나머지는 Muse에게 차근차근 맡길 수 있습니다.
