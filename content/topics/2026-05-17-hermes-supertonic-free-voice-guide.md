---
title: "2026년 5월 17일(일) Hermes + Supertonic으로 완전 무료 음성 대화 만들기"
description: "Hermes의 유료 TTS 대신 Supertonic을 붙여 돈 들이지 않고 자연스러운 한국어 음성 대화를 만드는 방법을, 텔레그램에서 빠르게 첫 성공을 확인하는 흐름 중심으로 초보자도 따라 할 수 있게 정리합니다."
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

이번 글의 역할은 분명합니다. <strong>복잡한 자비스 프로젝트 전체를 한 번에 다루기보다, 먼저 텔레그램 같은 메신저에서 음성 응답이 실제로 되는 첫 성공을 만드는 입문 실습</strong>에 가깝습니다.

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

## 2. Supertonic 설치용 전용 가상환경 만들기

이 단계는 꼭 추천합니다.

Supertonic을 다른 프로그램과 뒤섞어 설치하면 나중에 충돌이 날 수 있습니다. 그래서 아예 전용 공간을 따로 만들어 두는 편이 마음이 편합니다.

```bash
python3 -m venv /tmp/supertonic_test
source /tmp/supertonic_test/bin/activate
```

이렇게 하면 `/tmp/supertonic_test` 안에 Supertonic 전용 작업 공간이 생깁니다.

이걸 사람으로 비유하면,
주방 전체를 다 뒤엎지 않고 <strong>작은 실험용 조리대 하나를 따로 만드는 것</strong>과 비슷합니다.

## 3. Supertonic 설치하기

이제 방금 만든 전용 가상환경 안에서 Supertonic을 설치합니다.

```bash
pip install supertonic
```

여기서 중요한 건, 그냥 아무 터미널 창에서 설치하는 게 아니라 <strong>반드시 방금 활성화한 가상환경 안에서 설치해야 한다</strong>는 점입니다.

가상환경이 제대로 켜진 상태라면 보통 프롬프트 앞에 `(supertonic_test)` 비슷한 표시가 보이거나, 적어도 현재 파이썬 경로가 `/tmp/supertonic_test/` 아래를 가리키게 됩니다.

## 4. 설치가 제대로 되었는지 확인하기

초보자 글에서는 이 단계가 꼭 필요합니다. 설치 명령이 끝났다고 바로 다음으로 넘어가면, 나중에 어디서 꼬였는지 찾기 어려워집니다.

아래처럼 아주 짧게 확인해 봅니다.

```bash
source /tmp/supertonic_test/bin/activate
python -c "from supertonic import TTS; print('supertonic import ok')"
```

정상이라면 아래처럼 비슷한 문구가 나옵니다.

```text
supertonic import ok
```

### 처음 실행할 때 알아둘 점

Supertonic은 실제로 처음 음성을 만들 때 모델을 내려받는 과정이 있을 수 있습니다. 그래서

- 첫 실행은 조금 느릴 수 있고
- 인터넷 연결이 한 번 필요할 수 있고
- 두 번째부터는 훨씬 빨라질 수 있습니다

이 부분을 미리 알고 있으면 “설치가 실패했나?” 하고 덜 당황하게 됩니다.

### 설치가 안 될 때 먼저 볼 것

설치가 잘 안 되면 아래를 먼저 확인해 보세요.

1. 가상환경이 실제로 켜져 있는가
2. `python`이 `/tmp/supertonic_test/bin/python` 쪽을 가리키는가
3. 설치 중 에러 메시지가 떴는가
4. 네트워크가 너무 막혀 있지 않은가

확인은 이렇게 해볼 수 있습니다.

```bash
which python
which pip
```

둘 다 `/tmp/supertonic_test/bin/` 아래를 가리키면 정상입니다.

## 5. 왜 중간 스크립트가 필요한가

여기서 한 번 생각이 막히는 분들이 많습니다.

“Hermes가 말을 하게 할 거면, 그냥 Supertonic에 바로 연결하면 되는 거 아닌가요?”

겉으로 보면 그렇게 보이지만, 실제로는 중간 번역자가 하나 필요합니다.

Hermes는 텍스트를 단순히 문자열 하나로 넘기지 않고, 임시 파일 경로를 이용해 처리하는 경우가 많습니다. 그래서 그 중간에서

- Hermes가 준 입력을 읽고
- 적당히 다듬고
- Supertonic에 넘기고
- 생성된 wav를 Hermes가 쓸 출력 형식으로 바꿔주는

<strong>작은 래퍼 스크립트</strong>가 필요합니다.

## 6. TTS 래퍼 스크립트 만들기

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

## 7. 이 스크립트가 실제로 하는 일

위 코드는 길어 보이지만, 실제 역할은 단순합니다.

1. Hermes가 넘긴 텍스트를 읽는다
2. 문장을 조금 더 사람답게 들리도록 태그를 살짝 넣는다
3. Supertonic으로 wav를 만든다
4. `ffmpeg`로 ogg(opus)로 바꾼다
5. 그 파일을 Hermes가 읽게 넘긴다

즉, <strong>Hermes와 Supertonic 사이의 통역사</strong>라고 생각하면 됩니다.

## 8. Hermes에 Supertonic 등록하기

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
   command: python3 ~/.hermes/scripts/supertonic_tts.py < {input_path} {output_path}
   format: ogg
```

저장하면 됩니다.

이 설정의 뜻은 간단합니다.

- Hermes가 말할 일이 생기면
- 유료 TTS 대신
- 우리가 만든 `supertonic_tts.py`를 호출하라는 뜻입니다.

## 9. 첫 테스트는 텔레그램에서 해보는 게 가장 쉽습니다

설정을 마쳤으면, 바로 복잡한 자비스 앱부터 붙이기보다 <strong>텔레그램에서 먼저 음성 응답이 실제로 되는지 확인</strong>하는 쪽이 훨씬 쉽습니다.

이유는 간단합니다.

- 내가 보낸 문장에 실제 답이 오는지 바로 확인할 수 있고
- 목소리 톤이 어떤지 듣기 쉽고
- 실패해도 문제를 좁혀 보기 좋기 때문입니다

여기서 중요한 점이 하나 있습니다.
이 글의 사용 방식은 <strong>실시간 전화처럼 주고받는 동기식 대화</strong>가 아니라, <strong>텔레그램에서 메시지를 보내고 잠시 뒤 음성 답을 받는 비동기식 대화</strong>에 가깝습니다.

쉽게 말하면 이런 흐름입니다.

1. 내가 텔레그램에 질문을 보낸다
2. Hermes가 그 문장을 읽는다
3. LLM이 답을 만든다
4. Supertonic이 그 답을 음성으로 만든다
5. 텔레그램으로 음성 답장이 돌아온다

즉, 전화 통화처럼 서로 동시에 끼어드는 방식은 아닙니다.
대신 <strong>메신저로 차분하게 질문을 보내고, 짧은 음성 답변을 받는 비서형 사용</strong>에 더 가깝습니다.

그래서 이 글을 읽는 분은 먼저 이렇게 이해하면 됩니다.

- 실시간 음성 통화 비서 만들기 글이 아님
- 텔레그램에서 음성 답장을 받는 구조를 먼저 성공시키는 글임
- 그 다음 단계가 GUI, barge-in, 자비스형 프로젝트 글임

처음 테스트할 때는 너무 긴 문장보다 짧은 문장으로 먼저 가는 게 좋습니다.

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

## 10. 그래서 실제로는 어떻게 쓰면 될까

이 부분이 빠지면 초보자 입장에서는 설치까지는 따라 했는데, 막상 어떤 장면에서 써야 할지 감이 안 옵니다.

이 글 기준으로 가장 자연스러운 사용 장면은 이런 쪽입니다.

### 이런 식으로 쓰면 됩니다
- 텔레그램에 짧게 질문 보내기
- 이동 중에 손으로 길게 읽기 어려울 때 음성 답장 받기
- 간단한 정리, 안내, 격려 문장을 목소리로 듣기
- 메신저 기반으로 조용한 비서처럼 쓰기

예를 들면 이런 질문이 잘 맞습니다.

- 오늘 해야 할 일 세 가지만 짧게 정리해줘
- 이 문장을 조금 더 부드럽게 바꿔줘
- 방금 보낸 내용을 한 문장으로 요약해줘
- 짧게 격려 메시지 하나 써줘

반대로 아직 이 글만으로는 바로 안 되는 것도 있습니다.

- 전화처럼 실시간으로 동시에 말 끼어들기
- 내가 말하는 중간에 바로 알아듣고 반응하기
- 화면 위 작은 앱에서 바로 대화 이어가기

이런 건 다음 단계인 자비스 프로젝트 쪽에서 다룹니다.

즉, <strong>이 글은 메신저형 음성 비서 입문편</strong>이고, <strong>실시간 인간 비서형 인터페이스는 다음 프로젝트 단계</strong>라고 이해하면 가장 정확합니다.

## 11. 목소리 바꾸기

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

## 11. 말투를 덜 기계처럼 만드는 핵심

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

## 12. 숫자를 조금 바꾸면서 튜닝하는 법

스크립트 안에 이런 숫자가 들어 있습니다.

- `50`
- `25`

이 숫자는 “문장이 어느 정도 길면 태그를 넣을지”를 결정하는 기준입니다.

예를 들어,

- 지금보다 태그가 너무 자주 들어간다 싶으면 숫자를 올리고
- 너무 무표정하다 싶으면 숫자를 조금 낮춰볼 수 있습니다.

이 부분은 정답이 없고, 결국 <strong>내 귀에 어떤 리듬이 가장 편한지</strong>를 찾아가는 과정입니다.

## 13. 진짜 중요한 부분: 실제 대화 로그로 개선하기

이제부터가 진짜 재미있는 부분입니다.

보통은 TTS를 붙이면 “됐다” 하고 끝내기 쉽습니다. 그런데 실제로 오래 쓰다 보면 바로 이런 생각이 듭니다.

- 어떤 문장은 좋고
- 어떤 문장은 어색하고
- 어떤 목소리는 상황과 잘 맞는데
- 어떤 목소리는 조금 딱딱하다

이걸 감으로만 두지 말고, 실제 로그를 보면 훨씬 빨리 좋아집니다.

## 14. Hermes 대화 로그는 어디에 있나

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

## 15. 로그에서 뭘 봐야 하나

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

## 16. 실제 개선 루틴

이건 너무 거창하게 할 필요 없습니다. 아래 정도면 충분합니다.

1. 최근 대화 15~20턴 정도를 본다.
2. “여기엔 태그가 있었으면 좋겠다” 싶은 문장을 표시한다.
3. “이 상황은 F1보다 M1이 낫겠다” 같은 메모를 남긴다.
4. 일주일에 한 번 정도 `add_smart_tags()` 함수나 목소리 선택을 살짝 조정한다.
5. 다시 테스트한다.

이렇게 반복하면 점점 <strong>내가 듣기에 제일 자연스러운 비서 말투</strong>가 생깁니다.

## 17. 생활 비유로 이해해보면

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

## 18. 여기까지 되면 다음은 자비스 프로젝트 쪽입니다

이 글은 어디까지나 <strong>Hermes + Supertonic으로 음성 응답을 붙이고, 텔레그램에서 첫 성공을 확인하는 입문 글</strong>입니다.

그다음 단계는 성격이 조금 달라집니다.
예를 들면 아래 같은 것들입니다.

- 작은 GUI 창 만들기
- STT 정확도 보정
- 로컬 LLM 선택
- 다시 듣기 버튼
- 실제 질문에 더 잘 답하게 만들기
- barge-in 같은 비서형 기능 붙이기

이런 내용은 이미 별도의 자비스 진행 글에서 다루기 시작했습니다.
즉, 이 글이 <strong>음성 응답 입문편</strong>이라면, 그다음 글은 <strong>인간 비서형 프로젝트 운영편</strong>에 가깝습니다.

## 19. 따라 하다가 막히기 쉬운 지점

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

## 19. 이 매뉴얼의 진짜 목적

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
