---
title: "2026년 11월 20일(금) 내 맥 속에 숨어 있던 AI 친구, fm 이야기"
description: "macOS 27에 들어온 fm 명령어를 초등학생도 이해할 수 있는 이야기와 짧은 실습 예제로 풀어 보고, 인터넷·약관·개인정보·오답에 관한 주의점까지 함께 정리했습니다."
tags:
  - macos
  - apple-intelligence
  - foundation-models
  - terminal
  - local-ai
created: "2026-11-20"
modified: "2026-11-20"
publish: true
cssclasses:
  - field-note
---

<div class="note-hero">
  <p class="kicker">MACOS 27 · FM CLI</p>
  <p><strong>맥 안에 이미 들어 있는 작은 AI를, 터미널에서 어떻게 만날 수 있을까요?</strong></p>
  <p>어려운 설명 대신 민지와 삼촌의 짧은 이야기로 fm을 소개하고, 첫 확인부터 간단한 요약·정리까지 따라 해 봅니다.</p>
</div>

> [!tip] 먼저 알려 드립니다
> 아래 이야기에 나오는 인물과 데이터는 가상입니다. 명령어 형식은 Apple의 `fm` 매뉴얼과 WWDC26 자료를 바탕으로 정리했습니다. 맥의 모델·언어·Apple Intelligence 설정에 따라 결과와 사용 가능 여부는 달라질 수 있습니다.

# 내 맥 속에 숨어 있던 AI 친구, fm 이야기

민지는 초등학교 5학년이에요. 어느 날 아빠의 맥북을 빌려 숙제를 하다가 이런 생각을 했어요.

“AI한테 물어보고 싶은데, 가입도 해야 하고 돈도 내야 하잖아.”

그때 옆에 있던 삼촌이 웃으며 말했어요.

“민지야, 이 맥 안에는 이미 AI 친구가 살고 있어. 이름은 **fm**이야. 따로 가입하지 않아도 되고, 기본 친구는 인터넷 없이도 쓸 수 있어.”

민지의 눈이 동그래졌어요.

## 1장. fm은 누구일까?

삼촌이 쉽게 설명해 줬어요.

- **fm**은 맥 안에서 Apple Foundation Models를 부르는 명령어예요.
- macOS 27에 기본으로 들어 있어 따로 설치할 필요가 없어요.
- 기본값인 `system` 모델은 맥 안에서 작동해요.
- `pcc` 모델을 고르면 Apple의 Private Cloud Compute를 사용하므로 인터넷과 별도의 사용 조건이 필요해요.

| 어려운 말             | 쉬운 말                            |
| --------------------- | ---------------------------------- |
| 터미널(Terminal)      | 컴퓨터에게 글자로 말을 거는 대화창 |
| 명령어                | 컴퓨터에게 하는 부탁 한 줄         |
| 온디바이스 모델       | 내 컴퓨터 안에서 생각하는 AI       |
| 라이선스(license)     | “이렇게 쓸게요” 하고 약속하는 약관 |
| Private Cloud Compute | Apple 서버 쪽에서 처리하는 방식    |

“그러니까 터미널은 AI 친구에게 쪽지를 건네는 창문이야.”

## 2장. 친구를 만나기 전에 확인할 것

삼촌은 체크리스트를 보여 줬어요.

- [ ] 맥이 Apple Silicon(M1, M2, M3 같은 칩)인가요?
- [ ] macOS가 27 버전 이상인가요?
- [ ] 설정에서 Apple Intelligence가 켜져 있나요?
- [ ] 필요한 모델 다운로드가 끝났나요?
- [ ] 맥의 언어와 Siri 언어가 지원되는 조합인가요?

“네 가지가 다 맞으면”이라고만 생각하기보다, 마지막 두 가지까지 함께 확인하는 편이 안전해요. Apple Intelligence가 켜져 있어도 모델 다운로드가 아직 끝나지 않았으면 바로 사용할 수 없을 수 있습니다.

## 3장. 첫 만남: 설치 대신 약속하기

fm은 이미 맥 안에 있어서 설치할 게 없어요. 대신 처음 한 번은 **약속, 즉 약관 동의**를 해야 해요.

1. **터미널**을 열어요. 응용 프로그램 → 유틸리티 → 터미널 순서로 찾을 수 있어요.
2. 아래 부탁을 적고 Enter를 눌러요.

```bash
sudo fm license
```

- `sudo`: 관리자 권한을 확인받는 말이에요.
- `fm license`: fm의 약관을 보고 동의하는 부탁이에요.
- 맥 비밀번호를 물어보면 입력해요. 화면에 글자가 안 보여도 정상이에요.

이 동의는 맥을 쓰는 모든 사용자에게 적용되므로, 컴퓨터 전체에 영향을 주는 설정입니다. 약관을 먼저 보고 싶다면 아래처럼 확인할 수 있어요.

```bash
fm license --show
```

동의 여부는 다음 명령어로 확인합니다.

```bash
fm license --status
```

## 4장. 친구가 깨어 있는지 확인하기

```bash
fm models
```

`fm models`는 “사용할 수 있는 모델이 무엇인지 알려 줘”라고 묻는 명령어예요. 보통 다음 두 이름을 확인하게 됩니다.

- **system**: 맥 안에서 작동하는 기본 모델
- **pcc**: Apple의 Private Cloud Compute에서 작동하는 모델

인터넷에 있는 오래된 글에는 `fm available`이라고 적힌 경우도 있습니다. 현재 공개된 `fm` 매뉴얼은 모델 확인 명령어로 `fm models`를 안내하므로, 자신의 맥에서는 먼저 `fm --help`와 현재 매뉴얼을 함께 확인하는 편이 좋습니다.

## 5장. 첫 대화

민지는 떨리는 손으로 적었어요.

```bash
fm respond "고양이 이름 세 개 추천해 줘"
```

- `fm respond`: “대답해 줘!”라는 뜻이에요.
- 따옴표 안의 글이 질문이에요.

잠시 뒤 화면에 답이 나타났어요. 민지는 깜짝 놀라 소리쳤어요.

“진짜 대답했어!”

## 6장. 친구와 더 친해지기

### 예시 1. 말투 정해 주기

```bash
fm respond -i "친절한 선생님처럼 두 문장으로 답해." "무지개는 왜 생겨?"
```

`-i`는 친구에게 “이런 방식으로 말해 줘” 하고 미리 알려 주는 부탁이에요. 부탁과 질문은 따옴표를 따로 써요.

### 예시 2. 긴 글 줄이기

```bash
cat 일기.txt | fm respond -i "세 줄로 요약해 줘."
```

- `cat 일기.txt`: 일기 파일의 내용을 꺼내요.
- `|`: 꺼낸 내용을 친구에게 건네주는 **미끄럼틀**이에요.
- 파이프를 쓸 때는 요약 지시를 `-i`로 분명하게 적는 편이 좋아요.

### 예시 3. 문장 예쁘게 바꾸기

```bash
echo "내일 소풍 가니까 도시락 챙겨" | fm respond -i "부모님께 드리는 공손한 말로 바꿔 줘."
```

`echo`는 따옴표 안의 글을 그대로 건네줘요.

### 예시 4. 정리된 칸에 맞춰 대답 받기

```bash
fm schema object --name Pet --string name --int age > pet.json
fm respond --schema pet.json "우리 강아지 콩이는 세 살이야"
```

첫 줄은 “이름은 글자, 나이는 숫자”라는 빈칸 양식을 만들어요. 둘째 줄은 그 양식에 맞춰 대답하게 해요.

결과는 다음처럼 나올 수 있어요.

```json
{ "name": "콩이", "age": 3 }
```

### 예시 5. 수다 떨기

```bash
fm chat
```

대화창을 열고 계속 이야기하는 방식이에요. 대화 기록은 맥의 `~/.fm/sessions/` 아래에 저장될 수 있으니, 공용 컴퓨터에서는 그 점도 기억해 주세요.

### 예시 6. 어른용: 내 맥을 작은 AI 서버로

```bash
fm serve --port 1976
```

내 맥 안에서 Chat Completions 형식의 로컬 서버를 열어요. 코딩 수업에서 API 키 없이 연습할 때 유용합니다.

다만 기본 서버는 맥 안에서만 쓰는 것이 안전합니다. `--host 0.0.0.0`처럼 네트워크 전체에 열면 인증 없는 요청이 들어올 수 있으므로, 특별한 이유가 없다면 사용하지 않는 편이 좋습니다.

## 7장. 친구의 약점도 알아 두기

삼촌이 진지하게 말했어요.

“fm은 착한 친구지만 모든 걸 아는 건 아니야.”

- **잘하는 것**: 요약하기, 문장 다듬기, 정보 뽑아내기, 분류하기
- **약한 것**: 세상 지식, 어려운 수학, 긴 코드, 아주 긴 문서
- 한 번에 읽을 수 있는 글의 양이 정해져 있어요. 긴 책 한 권을 통째로 주면 안 돼요.
- 답이 틀릴 수도 있으니 **꼭 다시 확인하기!**
- 이름, 주소, 성적 같은 개인정보는 넣지 않는 편이 좋아요.
- `--model pcc`를 사용하면 입력이 Apple의 Private Cloud Compute로 보내질 수 있으니, 어떤 모델을 쓰는지 먼저 확인해요.

특히 맥 안의 파일을 파이프로 넘길 때는 “정말 그 파일을 읽고 있는가?”를 확인해야 합니다. 결과가 자연스럽게 보여도, 입력이 제대로 전달되지 않으면 엉뚱한 답이 나올 수 있어요.

## 8장. 내 말로 설명해 보기

민지는 동생에게 이렇게 설명했어요.

> “맥 안에는 fm이라는 AI 친구가 살아. 처음에 `sudo fm license`로 약속하고, `fm models`로 준비됐는지 확인해. 그다음 `fm respond "질문"`이라고 쓰면 대답해 줘. 기본 친구는 인터넷 없이도 일하지만, 가끔 틀릴 수 있으니까 꼭 확인해야 해.”

여러분도 빈칸을 채워 보세요.

- fm은 맥 안에 사는 **\_\_** 친구다.
- 처음 한 번은 `sudo fm ______`로 약속한다.
- 친구가 준비됐는지는 `fm ______`로 확인한다.
- 질문할 때는 `fm ______ "질문"`이라고 쓴다.

정답: AI / license / models / respond

## 에필로그

그날 밤 민지는 일기에 이렇게 적었어요.

“오늘 컴퓨터 속에서 새 친구를 만났다. 친구는 똑똑하지만 가끔 틀린다. 그래서 나도 같이 생각해야 한다.”

## 다음에 바로 쓸 체크리스트

<ul class="note-list">
  <li>내 맥이 Apple Silicon이고 macOS 27 이상인지 확인하기</li>
  <li>Apple Intelligence와 모델 다운로드 상태 확인하기</li>
  <li>약관을 읽은 뒤 필요할 때만 <code>sudo fm license</code> 실행하기</li>
  <li><code>fm models</code>에서 사용할 모델 상태 확인하기</li>
  <li>처음에는 개인정보 없는 짧은 문장으로 <code>fm respond</code> 시험하기</li>
  <li>결과가 맞는지 원문과 대조하고, 중요한 판단은 사람이 다시 확인하기</li>
</ul>

## 확인 범위와 참고 자료

이 글을 준비하면서 현재 맥에 `/usr/bin/fm`이 있는 것과 라이선스 상태 확인 명령이 작동하는 것을 확인했습니다. 약관 동의는 맥의 모든 사용자에게 적용되는 시스템 전체 설정이므로 대신 실행하지 않았습니다. 따라서 실제 모델 응답 결과는 맥의 설정과 모델 준비 상태에 따라 직접 확인해 주세요.

- <a href="https://developer.apple.com/videos/play/wwdc2026/334/" target="_blank" rel="noopener">Apple WWDC26 세션: Build AI-powered scripts with the fm CLI and Python SDK</a> <span class="external-link-note">(외부 링크 · 새 창)</span>
- <a href="https://keith.github.io/xcode-man-pages/fm.1.html" target="_blank" rel="noopener">fm 매뉴얼 페이지</a> <span class="external-link-note">(외부 링크 · 새 창)</span>
- <a href="https://coreydaley.dev/guides/apple-intelligence-tools/fm-command-line/" target="_blank" rel="noopener">Corey Daley: The fm command 사용 후기</a> <span class="external-link-note">(외부 링크 · 새 창)</span>
- <a href="https://www.binmage.com/macos-27-fm-command/" target="_blank" rel="noopener">fm modelNotReady 오류 해결법</a> <span class="external-link-note">(외부 링크 · 새 창)</span>
