---
title: "2026년 5월 17일(일) Hermes + Supertonic으로 완전 무료 음성 대화 만들기"
description: "Hermes의 유료 TTS 대신 Supertonic을 붙여 돈 들이지 않고 자연스러운 한국어 음성 대화를 만드는 방법을, 설치부터 말투 개선과 로그 분석까지 초보자도 따라 할 수 있게 정리합니다."
tags:
  - middle-school
  - hermes
  - supertonic
  - tts
  - voice-assistant
created: "2026-05-17"
modified: "2026-05-17"
publish: true
cssclasses:
  - field-note
---

# 2026년 5월 17일(일) Hermes + Supertonic으로 완전 무료 음성 대화 만들기

AI와 음성으로 대화해보면 금방 이런 생각이 듭니다.

“와, 진짜 신기하다.”
그 다음엔 거의 바로 이런 생각이 따라옵니다.

“그런데 이거 오래 쓰면 돈이 꽤 들겠는데?”

바로 이 지점에서 이번 글을 정리하게 됐습니다. Hermes에서 음성 대화를 할 때 기본으로 연결되는 TTS는 대부분 유료입니다. 잠깐 테스트할 때는 괜찮지만, 자주 써보거나 계속 튜닝해보려 하면 비용이 신경 쓰이기 시작합니다.

그래서 이번에는 방향을 바꿨습니다. <strong>Hermes에 무료 오픈소스 TTS인 Supertonic을 붙여서, 돈 한 푼 들이지 않고도 꽤 자연스러운 한국어 음성 대화를 만드는 방법</strong>을 실제 따라 하기 매뉴얼 형태로 정리해보려 합니다.

이 글은 단순히 “이론상 됩니다” 수준이 아닙니다.

- 설치는 어떻게 하는지
- 왜 가상환경을 따로 만드는지
- Hermes와 Supertonic을 어떤 중간 스크립트로 연결하는지
- 목소리는 어떻게 바꾸는지
- 말투는 어떻게 덜 기계처럼 만들지
- 실제 로그를 보고 어떻게 점점 더 나아지게 만들지

여기까지 한 번에 묶었습니다.

## 먼저 한 줄 결론

이 글대로 하면,
<strong>Hermes + Supertonic 조합으로 완전 무료 음성 대화</strong>를 만들 수 있습니다.

그리고 거기서 끝이 아닙니다.

- 목소리 변경
- 숨소리/한숨 태그 넣기
- 문장 길이 다듬기
- 실제 대화 로그를 보고 더 자연스럽게 개선하기

이 흐름까지 같이 가져갈 수 있습니다.

## 1. 준비물

먼저 아래가 준비되어 있어야 합니다.

- macOS 또는 Linux
- Hermes Agent가 이미 설치되어 있음
- 터미널 사용 가능
- Homebrew 설치되어 있음

먼저 `ffmpeg`가 있는지 확인합니다.

```bash
which ffmpeg
```

아무 것도 안 나오면 설치합니다.

```bash
brew install ffmpeg
```

왜 `ffmpeg`가 필요하냐면, Supertonic이 만든 wav 파일을 Hermes가 쓰기 편한 형식으로 다시 바꿔주는 데 필요하기 때문입니다.

쉽게 말하면,
Supertonic이 먼저 말을 만들고,
그 말을 Hermes가 잘 알아듣는 상자로 다시 담는 작업이라고 보면 됩니다.

## 2. Supertonic 전용 가상환경 만들기

이 단계는 꼭 추천합니다.

Supertonic을 다른 프로그램과 뒤섞어 설치하면 나중에 충돌이 날 수 있습니다. 그래서 아예 전용 공간을 따로 만들어 두는 편이 마음이 편합니다.

```bash
python3 -m venv /tmp/supertonic_test
source /tmp/supertonic_test/bin/activate
pip install supertonic
```

이렇게 하면 `/tmp/supertonic_test` 안에 Supertonic 전용 작업 공간이 생깁니다.

이걸 사람으로 비유하면,
주방 전체를 다 뒤엎지 않고 <strong>작은 실험용 조리대 하나를 따로 만드는 것</strong>과 비슷합니다.

## 3. 왜 중간 스크립트가 필요한가

여기서 한 번 생각이 막히는 분들이 많습니다.

“Hermes가 말을 하게 할 거면, 그냥 Supertonic에 바로 연결하면 되는 거 아닌가요?”

겉으로 보면 그렇게 보이지만, 실제로는 중간 번역자가 하나 필요합니다.

Hermes는 텍스트를 단순히 문자열 하나로 넘기지 않고, 임시 파일 경로를 이용해 처리하는 경우가 많습니다. 그래서 그 중간에서

- Hermes가 준 입력을 읽고
- 적당히 다듬고
- Supertonic에 넘기고
- 생성된 wav를 Hermes가 쓸 출력 형식으로 바꿔주는

<strong>작은 래퍼 스크립트</strong>가 필요합니다.

## 4. TTS 래퍼 스크립트 만들기

먼저 스크립트를 둘 폴더를 만듭니다.

```bash
mkdir -p ~/.hermes/scripts
```

그 다음 `~/.hermes/scripts/supertonic_tts.py` 파일을 만들고 아래 코드를 넣습니다.

```python
#!/usr/bin/env python3
import os
import sys
import subprocess
import tempfile
import re

VENV_PYTHON = "/tmp/supertonic_test/bin/python3"

def add_smart_tags(text: str) -> str:
 result = text.strip()
 if len(result) > 50 and '<breath>' not in result:
  result = re.sub(r'^([^.]{35,}?)\. ', r'\1. <breath> ', result, count=1)
 if len(result) > 25:
  if not any(tag in result for tag in ['<sigh>', '<breath>', '<laugh>']):
   if result.endswith('.') or result.endswith('요'):
    result = result.rstrip('.요') + ' <sigh>'
 return result

def main():
 if not sys.stdin.isatty() and sys.stdin.readable():
  stdin_text = sys.stdin.read().strip()
  if stdin_text:
   text = stdin_text
   output_path = sys.argv[1]
  else:
   text = sys.argv[1]
   output_path = sys.argv[2]
 else:
  text = sys.argv[1]
  output_path = sys.argv[2]

 tagged_text = add_smart_tags(text)

 with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
  wav_path = tmp.name

 python_code = f'''
from supertonic import TTS
tts = TTS(auto_download=True)
style = tts.get_voice_style(voice_name="F1")
text = {tagged_text!r}
wav, _ = tts.synthesize(text=text, lang="ko", voice_style=style, total_steps=8)
tts.save_audio(wav, {wav_path!r})
'''

 result = subprocess.run([VENV_PYTHON, "-c", python_code], capture_output=True, text=True)
 if result.returncode != 0:
  print("Supertonic Error:", result.stderr, file=sys.stderr)
  sys.exit(1)

 subprocess.run([
  "ffmpeg", "-y", "-i", wav_path,
  "-c:a", "libopus", "-b:a", "64k",
  output_path
 ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

 os.unlink(wav_path)
 print(f"Generated: {output_path}")

if __name__ == "__main__":
 main()
```

그 다음 실행 권한을 줍니다.

```bash
chmod +x ~/.hermes/scripts/supertonic_tts.py
```

## 5. 이 스크립트가 실제로 하는 일

위 코드는 길어 보이지만, 실제 역할은 단순합니다.

1. Hermes가 넘긴 텍스트를 읽는다
2. 문장을 조금 더 사람답게 들리도록 태그를 살짝 넣는다
3. Supertonic으로 wav를 만든다
4. `ffmpeg`로 ogg(opus)로 바꾼다
5. 그 파일을 Hermes가 읽게 넘긴다

즉, <strong>Hermes와 Supertonic 사이의 통역사</strong>라고 생각하면 됩니다.

## 6. Hermes에 Supertonic 등록하기

이제 Hermes 설정 파일을 엽니다.

```bash
hermes config edit
```

그리고 `tts:` 부분을 아래처럼 바꿉니다.

```yaml
tts:
 provider: supertonic
 providers:
  supertonic:
   type: command
   command: python3 /Users/jaiclass/.hermes/scripts/supertonic_tts.py < {input_path} {output_path}
   format: ogg
```

저장하면 됩니다.

이 설정의 뜻은 간단합니다.

- Hermes가 말할 일이 생기면
- 유료 TTS 대신
- 우리가 만든 `supertonic_tts.py`를 호출하라는 뜻입니다.

## 7. 첫 테스트는 어떻게 하나

설정을 마쳤으면 너무 긴 문장보다 짧은 문장으로 먼저 테스트하는 게 좋습니다.

예를 들면 이런 식입니다.

- 안녕하세요. 오늘은 무엇을 도와드릴까요?
- 네, 먼저 짧게 정리해드릴게요.
- 좋아요. 두 가지 방법이 있습니다.

처음부터 긴 설명문을 넣으면,
목소리 자체가 어색한 건지
문장이 긴 탓인지
태그가 이상한 건지
구분이 잘 안 됩니다.

그래서 <strong>짧은 문장 → 중간 길이 문장 → 긴 문장</strong> 순서로 가는 편이 좋습니다.

## 8. 목소리 바꾸기

목소리를 바꾸고 싶으면 스크립트 안에서 이 부분을 찾으면 됩니다.

```python
style = tts.get_voice_style(voice_name="F1")
```

여기서 `voice_name`만 바꾸면 됩니다.

추천 조합은 이렇습니다.

- `F1`: 밝고 명확한 여성 목소리 — 기본 추천
- `F2`: 부드럽고 따뜻한 여성 목소리
- `M1`: 차분하고 안정적인 남성 목소리
- `M2`: 약간 거칠고 직설적인 남성 목소리

### 어떤 목소리가 더 잘 맞을까

이건 정답이 하나로 고정돼 있지 않습니다.

예를 들어,

- 안내형 비서 느낌이면 `F1` 또는 `F2`
- 차분한 설명형이면 `M1`
- 딱딱한 보고보다 조금 인간적인 비서 느낌이면 `F2`나 `M1`

이런 식으로 상황에 따라 달라질 수 있습니다.

한마디로,
<strong>좋은 목소리 하나를 찾는 것보다, 상황에 맞는 목소리 감각을 찾는 것</strong>이 더 중요합니다.

## 9. 말투를 덜 기계처럼 만드는 핵심

Supertonic은 기본 상태에서도 꽤 괜찮지만, 그냥 그대로 두면 조금 기계처럼 들릴 수 있습니다.

여기서 중요한 게 태그입니다.

- `<sigh>`
- `<breath>`
- `<laugh>`

이런 태그를 적절히 넣어주면 훨씬 사람처럼 들립니다.

현재 스크립트에서는 `add_smart_tags()` 함수가 이 역할을 합니다.

### 지금 함수가 하는 일

- 문장이 너무 길면 중간에 `<breath>`를 넣어줌
- 어느 정도 길이가 되면 끝부분에 `<sigh>`를 붙여 조금 더 자연스럽게 만듦
- 이미 태그가 있으면 중복으로 넣지 않음

즉, <strong>긴 문장에서 숨 한번 쉬고, 문장 끝을 너무 딱딱하게 닫지 않도록 살짝 풀어주는 역할</strong>입니다.

## 10. 숫자를 조금 바꾸면서 튜닝하는 법

스크립트 안에 이런 숫자가 들어 있습니다.

- `50`
- `25`

이 숫자는 “문장이 어느 정도 길면 태그를 넣을지”를 결정하는 기준입니다.

예를 들어,

- 지금보다 태그가 너무 자주 들어간다 싶으면 숫자를 올리고
- 너무 무표정하다 싶으면 숫자를 조금 낮춰볼 수 있습니다.

이 부분은 정답이 없고, 결국 <strong>내 귀에 어떤 리듬이 가장 편한지</strong>를 찾아가는 과정입니다.

## 11. 진짜 중요한 부분: 실제 대화 로그로 개선하기

이제부터가 진짜 재미있는 부분입니다.

보통은 TTS를 붙이면 “됐다” 하고 끝내기 쉽습니다. 그런데 실제로 오래 쓰다 보면 바로 이런 생각이 듭니다.

- 어떤 문장은 좋고
- 어떤 문장은 어색하고
- 어떤 목소리는 상황과 잘 맞는데
- 어떤 목소리는 조금 딱딱하다

이걸 감으로만 두지 말고, 실제 로그를 보면 훨씬 빨리 좋아집니다.

## 12. Hermes 대화 로그는 어디에 있나

기본 위치는 이쪽입니다.

```text
~/.hermes/sessions/
```

여기 들어가면 세션 단위 파일들이 있습니다.

또는 Hermes 안에서

```text
/history
```

명령으로도 최근 흐름을 볼 수 있습니다.

## 13. 로그에서 뭘 봐야 하나

로그를 볼 때는 아래 네 가지를 중심으로 보면 좋습니다.

### 1. 문장 길이
너무 길면 사람이 들어도 숨이 막힙니다.

- 한 번에 너무 많은 정보를 읽는지
- 적당한 길이에서 끊기는지
- 문장 하나가 강의처럼 늘어지는지

이걸 봐야 합니다.

### 2. 태그 사용 위치
`<sigh>`나 `<breath>`가 어디에 들어가야 자연스러운지 봅니다.

- 설명 중간에 숨 한번 쉬는 게 자연스러운지
- 문장 끝에서 한숨처럼 정리되는 게 어색하지 않은지
- 너무 자주 들어가서 오히려 연기처럼 느껴지지 않는지

### 3. 목소리와 상황의 일치
예를 들어,

- 설명할 때는 `M1`
- 가벼운 대화는 `F1` 또는 `F2`

이런 식으로 상황이 더 잘 맞을 수 있습니다.

### 4. 사용자 반응
이건 아주 중요합니다.

- “목소리 좋다”
- “자연스럽다”
- “조금 딱딱하다”
- “생각보다 사람 같다”

이런 피드백이 가장 강력한 데이터입니다.

## 14. 실제 개선 루틴

이건 너무 거창하게 할 필요 없습니다. 아래 정도면 충분합니다.

1. 최근 대화 15~20턴 정도를 본다.
2. “여기엔 태그가 있었으면 좋겠다” 싶은 문장을 표시한다.
3. “이 상황은 F1보다 M1이 낫겠다” 같은 메모를 남긴다.
4. 일주일에 한 번 정도 `add_smart_tags()` 함수나 목소리 선택을 살짝 조정한다.
5. 다시 테스트한다.

이렇게 반복하면 점점 <strong>내가 듣기에 제일 자연스러운 비서 말투</strong>가 생깁니다.

## 15. 생활 비유로 이해해보면

이 과정은 마치 바리스타가 커피 맛을 맞추는 것과 비슷합니다.

처음에는
- 원두 넣고
- 버튼 누르고
- 커피 나오면 끝처럼 보입니다.

그런데 실제로는
- 물 온도
- 추출 시간
- 원두 양
- 컵 크기
를 조금씩 바꾸며 자기 입맛에 맞추게 됩니다.

음성 비서도 같습니다.

처음엔 “말이 나오네?” 수준이지만,
조금 지나면
- 너무 딱딱한가
- 너무 느린가
- 너무 숨이 없는가
- 너무 밝은가
를 보게 됩니다.

그리고 그때부터 진짜 재미가 시작됩니다.

## 16. 따라 하다가 막히기 쉬운 지점

### 1. Hermes는 되는데 소리가 안 나오는 경우
- `ffmpeg` 설치 확인
- 스크립트 실행 권한 확인
- `command:` 경로 오타 확인

### 2. Supertonic 에러가 나는 경우
- 가상환경 경로 확인
- `/tmp/supertonic_test/bin/python3`가 실제 존재하는지 확인
- 첫 실행 때 모델 다운로드 시간이 조금 걸릴 수 있음

### 3. 목소리가 너무 기계 같은 경우
- 태그 기준 숫자를 조정해보기
- 다른 `voice_name`으로 바꿔보기
- 문장을 더 짧게 끊어보기

### 4. 문장이 너무 답답하게 들리는 경우
- 긴 문장 줄이기
- 설명을 두 문장으로 나누기
- `<breath>` 위치 조정하기

## 17. 이 매뉴얼의 진짜 목적

이 글의 목적은 그냥 “무료 TTS 됩니다”를 보여주는 데 있지 않습니다.

더 중요한 건 이겁니다.

> <strong>돈 안 들이고도, 내가 원하는 말투로 점점 더 자연스러운 음성 비서를 다듬어갈 수 있다.</strong>

이 감각이 한 번 오면,
그다음부터는 단순 설치를 넘어서
내 취향과 내 상황에 맞는 음성 도우미를 만드는 쪽으로 넘어가게 됩니다.

## 마무리

이 매뉴얼대로 따라 하면 Hermes + Supertonic으로 완전 무료 음성 대화를 만들 수 있습니다.

그리고 거기서 멈추지 않고,

- 목소리 바꾸기
- 상황에 맞는 말투 조절하기
- 실제 대화 로그를 보며 개선하기
- 나에게 더 잘 맞는 비서 톤 만들기

이 흐름까지 이어갈 수 있습니다.

처음부터 완벽하게 자연스러울 필요는 없습니다.
오히려 조금씩 듣고, 조금씩 바꾸고, 조금씩 나아지는 과정이 제일 현실적입니다.

필요하다면 다음 글에서는 이어서 아래 내용도 정리해볼 수 있습니다.

- 감정 분석을 붙여 자동으로 태그 넣는 고급 버전
- 여러 목소리 프리셋을 파일로 관리하는 방법
- 사용자 피드백을 받아 말투를 최적화하는 루틴

이번엔 여기까지 따라 해보면서, 먼저 “무료인데 생각보다 꽤 괜찮네?”라는 감각부터 잡아보면 좋겠습니다.
