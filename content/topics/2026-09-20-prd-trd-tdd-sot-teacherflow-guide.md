---
title: "초보 개발자를 위한 개발 기획 문서 가이드: PRD·TRD·TDD에서 SOT까지"
description: "TeacherFlow 기획 과정을 사례로, 개발 전에 어떤 문서를 왜 만들고 어떻게 SOT로 정리하는지 What·Why·How 구조로 쉽게 설명합니다."
created: "2026-09-20"
modified: "2026-09-20"
tags:
  - ai-development
  - product-planning
  - prd-trd-tdd
  - sot
  - vibe-coding
publish: true
cssclasses:
  - playbook
---

<div class="note-hero">
  <p class="kicker">DEVELOPMENT PLANNING FOR BEGINNERS</p>
  <p><strong>코드를 빨리 쓰는 것보다 먼저, 무엇을 만들고 어떻게 확인할지 정하는 일이 필요합니다.</strong></p>
  <p>TeacherFlow 사례를 따라가며 PRD·TRD·TDD·SOT가 각각 어떤 질문에 답하는 문서인지, 언제 만들고 어떻게 이어 붙이는지 차근차근 살펴봅니다.</p>
</div>


# 초보 개발자를 위한 개발 기획 문서 가이드
## PRD·TRD·TDD에서 SOT까지, TeacherFlow를 기획하며 배운 것

AI와 함께 개발하면 코드를 만드는 속도는 매우 빨라집니다. 하지만 실제 프로젝트에서는 곧 다른 문제가 생깁니다.

> “코드는 빨리 만들 수 있는데, 뭘 만들어야 하는지 자꾸 바뀐다.”

> “어제 문서와 오늘 문서의 내용이 다르다.”

> “PRD, TRD, TDD는 도대체 무엇이고, 언제 만들어야 하지?”

> “문서를 꼼꼼하게 만들다 보니 오히려 개발이 늦어지는 것 아닌가?”

TeacherFlow라는 교사용 AI 서비스를 기획하면서 이 문제를 그대로 경험했습니다. 처음에는 아이디어를 구체화하기 위해 여러 문서를 만들었고, 마지막에는 최종 결정을 하나로 모은 **SOT(Single Source of Truth)** 를 만들었습니다.

이 글은 그 과정을 초보 개발자도 이해할 수 있도록 **What · Why · How** 구조로 설명합니다.

---

## 목차

1. 먼저 큰 그림 보기
2. 생활 속 비유로 이해하는 개발 문서
3. Project Definition
4. Research
5. PRD
6. TRD
7. Persona
8. User Scenario
9. Wireframe
10. Test Strategy
11. TDD
12. Development Plan
13. Final Planning Gate
14. SOT
15. SOT 이전과 이후의 차이
16. TeacherFlow 실제 기획 과정
17. 초보 개발자가 자주 하는 실수
18. 추천 문서 작성 순서
19. 수업용 한 장 요약
20. 용어 초간단 사전

---

## 1. 먼저 큰 그림부터 봅시다

개발 문서의 전체 흐름을 가장 단순하게 표현하면 다음과 같습니다.

```text
무엇을 만들까?
↓
왜 필요한지 조사
↓
사용자에게 필요한 기능 정의
↓
기술적으로 어떻게 만들지 설계
↓
사용자가 어떻게 쓸지 설계
↓
어떻게 검사할지 정의
↓
어떤 순서로 개발할지 결정
↓
최종 결정들을 SOT로 통합
↓
구현
```

TeacherFlow에서는 다음 순서로 진행했습니다.

```text
1. Project Definition
2. Research
3. Research Summary
4. PRD
5. TRD
6. Persona
7. User Scenario
8. Wireframe
9. Test Strategy
10. TDD Plan
11. Development Plan
12. Final Planning Gate
13. SOT
14. Implementation Checklist
15. Progress Board
16. 구현
```

여기서 가장 중요한 점은 **처음부터 SOT 하나만 쓰는 것이 아니라는 것**입니다. 초기에는 아직 무엇이 정답인지 모르기 때문에 여러 문서를 통해 탐색해야 합니다. 충분히 탐색한 뒤 결정이 수렴했을 때 비로소 SOT를 만듭니다.

---

## 2. 생활 속 비유로 이해하는 개발 문서

개발 문서를 **집을 짓는 과정**이라고 생각하면 쉽습니다.

| 개발 문서 | 집 짓기 비유 | 핵심 질문 |
|---|---|---|
| Project Definition | 어떤 집을 지을지 정하기 | 무엇을 해결할까? |
| Research | 땅, 자재, 법규 조사 | 가능한가? |
| PRD | 집주인의 요구사항 | 무엇이 있어야 하나? |
| TRD | 건축·전기·배관 도면 | 어떻게 만들까? |
| Persona | 실제로 살 사람 | 누가 쓸까? |
| User Scenario | 사람이 집에서 생활하는 장면 | 어떻게 쓸까? |
| Wireframe | 평면도·스케치 | 어디에 배치할까? |
| Test Strategy | 준공검사 계획 | 무엇을 검사할까? |
| TDD | 검사 기준을 먼저 정하고 시공 | 어떤 테스트부터 통과할까? |
| Development Plan | 공사 일정표 | 어떤 순서로 만들까? |
| Checklist | 현장 점검표 | 빠뜨린 것은 없나? |
| Progress Board | 공사 현황판 | 지금 어디까지 했나? |
| SOT | 최종 승인된 도면 | 현재 정답은 무엇인가? |

---

## 3. Project Definition — “도대체 무엇을 만들려고 하는가?”

### What

Project Definition은 프로젝트의 가장 큰 방향을 정하는 문서입니다.

이 단계에서는 버튼 색상이나 데이터베이스 종류를 정하지 않습니다. 대신 다음을 정합니다.

```text
어떤 문제를 해결할 것인가?
누구를 위한 서비스인가?
가장 중요한 사용 장면은 무엇인가?
MVP는 어디까지인가?
무엇은 만들지 않을 것인가?
```

### Why

이 문서가 없으면 기능이 계속 늘어납니다.

```text
수업자료 생성기 만들자
↓
학생 AI도 넣을까?
↓
학교 LMS도 넣자
↓
생활기록부도 넣자
↓
모바일 앱도 만들자
↓
프로젝트가 끝나지 않음
```

Project Definition은 **프로젝트의 울타리**입니다.

### How — TeacherFlow 사례

TeacherFlow는 처음에 이렇게 정의했습니다.

> 교사가 현재 보고 있는 Web/PDF 자료를 수업자료로 바꾸고, 실제 편집 가능한 파일까지 완성하는 AI Workflow Agent.

MVP는 다음으로 좁혔습니다.

```text
Web / Public PDF
↓
50분 수업 만들기
↓
수업안 + PPT + 활동지 + 평가
↓
PPTX + DOCX + PDF
```

반대로 HWP/HWPX, 학생 AI, LMS, NEIS, OCR, Desktop Agent 등은 뒤로 미뤘습니다.

#### 기억하기

> **Project Definition = 우리가 어디까지 갈 것인지 그어 놓은 울타리**

---

## 4. Research — “좋은 아이디어인데, 정말 가능한가?”

### What

Research는 단순한 자료 수집이 아닙니다. **제품의 중요한 가설을 검증하는 단계**입니다.

### Why

예를 들어 “PDF를 읽어서 바로 수정 가능한 PPT를 만들자”는 아이디어가 있어도, 실제 PDF 추출 방식이나 PPTX 생성 방식에 제약이 있을 수 있습니다. 기술적 위험을 PRD에 확정하기 전에 조사해야 합니다.

### How — TeacherFlow 사례

TeacherFlow에서는 Research를 6개 질문으로 나눴습니다.

```text
R-01 Browser Context
웹페이지/PDF 내용을 어떻게 가져올 것인가?

R-02 Document Generation
PPTX/DOCX/PDF를 어떻게 만들 것인가?

R-03 Source Grounding
생성 내용의 근거를 어떻게 추적할 것인가?

R-04 Human-in-the-loop
어디까지 자동화하고 언제 교사가 승인할 것인가?

R-05 Privacy / Local vs Cloud
학생 개인정보는 어디까지 처리할 수 있는가?

R-06 Competitor Workflow
기존 제품과 어떤 Workflow 차이를 만들 것인가?
```

Research의 완료 기준은 “자료를 많이 모았는가?”가 아니라 **제품 결정을 내릴 만큼 답을 얻었는가?** 입니다.

#### 기억하기

> **Research = 아이디어를 사실과 근거 위에 올려놓는 단계**

---

## 5. PRD — Product Requirements Document
### “사용자 입장에서 무엇이 되어야 하는가?”

### What

PRD는 **Product Requirements Document**입니다.

- Product: 만들 제품
- Requirements: 반드시 만족해야 하는 요구사항
- Document: 그것을 적어 놓은 문서

쉽게 말하면:

> **이 제품은 사용자에게 무엇을 해줄 수 있어야 하는가?**

를 정리한 문서입니다.

### 생활 비유

식당에서 주문한다고 생각해봅시다.

```text
“김치찌개 주세요.”
“맵기는 보통으로 해주세요.”
“돼지고기는 들어가야 해요.”
“2인분이어야 합니다.”
```

이것이 요구사항입니다. 손님은 고기를 몇 도에서 몇 분 익힐지 결정하지 않습니다.

즉 **PRD는 What**, 기술적인 **How는 아직 뒤로 미룹니다.**

### Why

PRD가 없으면 기획자와 개발자가 서로 다른 제품을 생각할 수 있습니다.

```text
기획자: “현재 웹페이지에서 바로 수업을 만들게 해주세요.”
개발자: “파일 업로드 화면을 만들었습니다.”
기획자: “왜 사용자가 파일을 업로드해야 하죠?”
개발자: “그게 구현하기 편해서요.”
```

PRD는 “구현하기 편한 것”이 아니라 “사용자에게 필요한 것”을 먼저 고정합니다.

### How — TeacherFlow 사례

TeacherFlow PRD의 핵심 요구는 다음과 같았습니다.

```text
사용자는 현재 Web/PDF에서 바로 시작할 수 있어야 한다.
복잡한 Prompt 작성이 필수여서는 안 된다.
AI가 생성한 주요 내용의 Source를 확인할 수 있어야 한다.
Preview에서 교사가 수정할 수 있어야 한다.
실제 편집 가능한 PPTX/DOCX가 생성되어야 한다.
학생 고위험 개인정보는 External LLM으로 보내지 않아야 한다.
```

### PRD에 들어가면 좋은 항목

```text
Problem
Goal
Non-goal
Primary User
User Needs
MVP Scope
Functional Requirements
Non-functional Requirements
Acceptance Criteria
Success Metrics
```

#### 한 문장 기억법

> **PRD = 사용자와 제품 사이의 약속**

---

## 6. TRD — Technical Requirements Document
### “그 요구사항을 기술적으로 어떻게 실현할 것인가?”

### What

TRD는 **Technical Requirements Document**입니다.

쉽게 말하면:

> **PRD에서 약속한 기능을 실제 시스템으로 만드는 기술 설계 문서**

입니다.

### 생활 비유

PRD가 집주인의 요구라면:

```text
방 3개
화장실 2개
큰 거실
```

TRD는 건축가와 기술자가 만드는 도면입니다.

```text
철근 구조
전기 배선
배관
난방
창문 규격
```

### Why

PRD만 보고 바로 코딩하면 개발 중 구조가 계속 바뀔 수 있습니다.

TeacherFlow에서는 AI가 PPTX, DOCX, PDF를 각각 직접 만들지 않고 먼저 공통 구조를 만들도록 했습니다.

```text
AI
↓
LessonPackage
↓
├─ PPTX Renderer
├─ DOCX Renderer
└─ PDF Renderer
```

이렇게 하면 세 파일의 내용이 서로 일관되기 쉽습니다.

### TeacherFlow TRD 예

```text
Chrome Extension
├─ Toolbar
├─ Floating Launcher
├─ Side Panel
├─ Context Extractor
└─ Privacy Precheck
        ↓
TeacherFlow API
├─ Workflow Orchestrator
├─ LLM Gateway
├─ Semantic Document Model
├─ Source Grounding
└─ Approval State
        ↓
Document Pipeline
├─ PPTX
├─ DOCX
└─ PDF
```

### PRD와 TRD의 차이

| 질문 | PRD | TRD |
|---|---|---|
| 사용자가 무엇을 할 수 있어야 하는가? | O | 참고 |
| 어떤 기술로 구현할 것인가? | X | O |
| PPTX가 편집 가능해야 하는가? | O | O |
| 어떤 라이브러리로 생성하는가? | X | O |
| 개인정보를 외부 AI로 보내면 안 되는가? | O | O |
| 차단 로직을 어디서 수행하는가? | X | O |

#### 기억하기

> **PRD = 무엇을 만들까?**  
> **TRD = 그것을 어떻게 만들까?**

---

## 7. Persona — “누구를 위해 만들고 있는가?”

### What

Persona는 대표 사용자를 구체적인 사람처럼 표현한 모델입니다.

### Why

“모든 사람을 위한 제품”은 실제로는 아무에게도 딱 맞지 않을 수 있습니다.

### How — TeacherFlow 사례

TeacherFlow에서는 세 가지 행동형 Persona를 만들었습니다.

#### A. 빠른 수업 준비형

> “좋은 자료를 찾았는데 빨리 수업으로 바꾸고 싶다.”

#### B. 신뢰·검토 중심형

> “AI가 만든 내용을 바로 믿지 않고 출처를 확인하고 싶다.”

#### C. 편집·완성도 중심형

> “결국 실제 PowerPoint와 Word 파일이 제대로 나와야 한다.”

#### 기억하기

> **Persona = 기능을 평가할 때 대신 앉혀 놓는 대표 사용자**

---

## 8. User Scenario — “그 사람이 실제로 어떻게 사용하는가?”

Persona가 **누구**라면 Scenario는 **그 사람이 실제로 무엇을 어떻게 하는지**를 표현합니다.

TeacherFlow 예:

```text
교사가 웹에서 AI 윤리 기사를 발견한다.
↓
Floating Launcher를 누른다.
↓
Side Panel이 열린다.
↓
“50분 수업 만들기”를 선택한다.
↓
고3 / 인공지능 기초 / 50분을 선택한다.
↓
수업자료가 생성된다.
↓
출처를 확인한다.
↓
활동 하나를 수정한다.
↓
PPTX, DOCX, PDF를 만든다.
```

Scenario를 쓰면 빠진 화면이나 기능을 쉽게 발견할 수 있습니다.

#### 기억하기

> **Persona = 사람**  
> **Scenario = 그 사람의 사용 장면**

---

## 9. Wireframe — “화면을 만들기 전에 종이에 그려보자”

### What

Wireframe은 디자인 이전의 화면 구조입니다.

```text
무엇이 어디에 있는가?
무엇을 누르는가?
다음 화면은 무엇인가?
```

를 확인합니다.

### TeacherFlow에서 얻은 실제 교훈

TeacherFlow에서는 브라우저 진입 방식을 고민했습니다.

초기:

```text
Toolbar만 사용할까?
```

중간:

```text
Floating Icon이 더 눈에 잘 띄지 않을까?
```

최종:

```text
Toolbar Icon
        ┐
        ├→ Same Side Panel
Floating Launcher
        ┘
```

즉 **Hybrid Launcher**가 최종 결정이 되었습니다.

중요한 점은 Floating Launcher가 자체 메뉴를 잔뜩 펼치는 것이 아니라:

```text
Floating Launcher
→ Side Panel 열기
```

만 담당한다는 것입니다.

#### 기억하기

> **Wireframe = 코드 없이 미리 해보는 화면 리허설**

---

## 10. Test Strategy — “완성됐다는 것을 어떻게 증명할까?”

### What

Test Strategy는:

> **무엇을 어느 수준까지 검사해야 완료라고 인정할 것인가**

를 정합니다.

### TeacherFlow 테스트 계층

```text
L1 Unit
L2 Component
L3 Integration
L4 Contract
L5 End-to-End
L6 Artifact Quality
L7 Teacher Validation
```

TeacherFlow는 AI와 파일 생성 기능이 있기 때문에 다음을 특별히 중요하게 봤습니다.

```text
Privacy
Source Grounding
Prompt Injection
PPTX/DOCX/PDF 실제 품질
Partial Success
Retry
Hybrid Launcher
Teacher Pilot
```

#### 기억하기

> **Test Strategy = 완성품을 받을 때 검사할 기준표**

---

## 11. TDD — Test-Driven Development
### “시험 문제를 먼저 만들고 코드를 작성한다”

### What

TDD는 **Test-Driven Development**입니다.

쉽게 말하면:

> **테스트가 개발 방향을 이끌게 하는 방식**

입니다.

대표 흐름은 다음과 같습니다.

```text
RED
↓
GREEN
↓
REFACTOR
```

#### RED

먼저 테스트를 만들고 실패를 확인합니다.

#### GREEN

테스트를 통과시키는 최소 기능을 만듭니다.

#### REFACTOR

동작은 유지하면서 코드 구조를 개선합니다.

### TeacherFlow 예

먼저 테스트를 정의합니다.

```text
Given:
학생 이름 + 학번 + 성적

When:
Privacy Check

Then:
External LLM 전송 = BLOCK
```

그 다음 이 테스트를 통과하도록 Privacy Gate를 구현합니다.

### 중요한 주의점

TDD를 “모든 코드 한 줄마다 테스트를 먼저 작성해야 한다”라고만 이해하면 개발 과정이 과도하게 무거워질 수 있습니다.

TeacherFlow에서는 **Privacy, Grounding, Semantic Model, Recovery 같은 핵심 규칙**에 TDD를 강하게 적용하고, 디자인 품질은 수동 QA와 교사 검증을 함께 사용했습니다.

#### 기억하기

> **TDD = 정답 기준을 먼저 만들고 코드를 작성하는 개발 방식**

---

## 12. Development Plan — “그럼 어떤 순서로 만들까?”

좋은 기획 문서가 있어도 모든 기능을 한꺼번에 만들면 진행 상황을 파악하기 어렵습니다.

TeacherFlow에서는 중요한 시행착오가 있었습니다.

한때 세부 체크 항목이 100개 이상처럼 보였습니다.

하지만 여기서 중요한 교훈을 얻었습니다.

> **체크 항목 수와 개발 단계 수는 같은 것이 아니다.**

그래서 구조를 점점 줄였습니다.

```text
100개 이상의 세부 체크처럼 보이는 구조
↓
16 Tasks
↓
9 Tasks
↓
최종 6 Core Tasks
```

최종 구조:

```text
M1 Core
T01 Context + Privacy
T02 Lesson Generation + Grounding

M2 Product
T03 Chrome Hybrid Side Panel Workflow
T04 Unified Document Output

M3 Validate & Ship
T05 E2E + Safety + Recovery
T06 Teacher Pilot + Release
```

세부 항목은 Task가 아니라 **Acceptance Criteria**로 관리합니다.

#### 기억하기

> **좋은 계획은 모든 일을 잘게 쪼개는 계획이 아니라, 진행 상황을 이해할 수 있을 만큼만 나누는 계획이다.**

---

## 13. Final Planning Gate — “이제 정말 개발을 시작해도 되는가?”

기획 마지막에 한 번 멈추고 확인합니다.

```text
요구사항이 충돌하지 않는가?
기술 구조가 정해졌는가?
MVP가 너무 크지 않은가?
테스트 기준이 있는가?
개발 순서가 있는가?
```

TeacherFlow의 최종 판정은:

```text
GO WITH CONDITIONS
```

이었습니다.

즉 “개발을 시작해도 되지만 조건은 지켜야 한다”는 의미입니다.

예:

```text
Core Task는 6개만 관리한다.
Privacy를 일정 때문에 제거하지 않는다.
Source Grounding을 제거하지 않는다.
새 기능은 기본 Deferred로 보낸다.
```

---

## 14. SOT — Single Source of Truth
### “현재 프로젝트에서 무엇이 정답인가?”

기획 과정에서는 여러 문서가 만들어집니다.

```text
Research
PRD
TRD
Wireframe
Test Strategy
TDD Plan
Development Plan
```

각 문서는 작성 당시 최선의 결정을 담고 있습니다. 그런데 프로젝트가 발전하면서 결정도 바뀝니다.

TeacherFlow의 Hybrid Launcher가 대표적인 예입니다.

```text
초기: Toolbar 중심
↓
중간: Floating Icon 검토
↓
최종: Toolbar + Floating Launcher → Same Side Panel
```

과거 문서에 서로 다른 표현이 남아 있으면 개발자는 묻게 됩니다.

> “어느 문서가 진짜 최신이지?”

이 문제를 해결하는 것이 **SOT**입니다.

### What

**Single Source of Truth**

- Single: 하나의
- Source: 출처
- Truth: 기준, 진실

즉:

> **현재 프로젝트의 최종 결정이 모여 있는 하나의 공식 기준**

입니다.

### 생활 비유

학교 시간표가 여러 장 있다고 생각해봅시다.

```text
교무실 출력본
교사 개인 메모
카카오톡 사진
지난주 시간표
수정 시간표
```

최종 확정 시간표 하나를 공식 기준으로 정해야 합니다. 그것이 SOT입니다.

---

## 15. SOT 이전과 이후의 차이

### SOT 이전: 탐색 모드

목표:

> **정답을 찾는 것**

```text
Idea
↓
Project Definition
↓
Research
↓
PRD
↓
TRD
↓
Persona
↓
Scenario
↓
Wireframe
↓
Test Strategy
↓
TDD
↓
Development Plan
↓
Final Gate
```

특징:

- 질문이 많다
- 여러 대안을 비교한다
- 문서가 늘어날 수 있다
- 결정이 바뀔 수 있다
- 생각을 넓혔다가 좁히는 과정이다

### SOT 이후: 실행 모드

목표:

> **결정한 것을 정확히 만드는 것**

```text
SOT
↓
Implementation Checklist
↓
Code
↓
Test
↓
Progress Board
↓
Next Task
```

특징:

- 새로운 문서를 계속 만들지 않는다
- 현재 정답은 SOT 하나다
- 개발자는 해석보다 구현에 집중한다
- 진행 상황은 Progress Board에서 본다
- 완료 여부는 Checklist에서 본다

---

## 16. SOT 전후 비교표

| 구분 | SOT 이전 | SOT 이후 |
|---|---|---|
| 핵심 목적 | 탐색과 결정 | 구현과 검증 |
| 질문 | 무엇이 좋을까? | 지금 무엇을 만들까? |
| 문서 | 여러 개 | 핵심 3개 중심 |
| 변경 | 비교적 자유 | 중요한 변경만 |
| 개발자 행동 | 문서 해석 | SOT 기준 실행 |
| 진행 상태 | 문서마다 흩어짐 | Progress Board |
| 완료 확인 | 여러 문서 확인 | Checklist |
| 충돌 해결 | 토론 필요 | SOT 우선 |
| 새로운 아이디어 | 검토 가능 | 기본 Deferred |
| 목표 | 올바른 방향 찾기 | 빠뜨리지 않고 완성 |

---

## 17. SOT 이후 문서는 세 가지면 충분하다

TeacherFlow에서는 최종적으로 다음 구조로 정리했습니다.

```text
TeacherFlow_SOT/

SOT.md
│
├─ implementation/
│   ├─ implementation-checklist.md
│   └─ progress-board.md
│
└─ references/
    ├─ PRD.md
    ├─ TRD.md
    ├─ Research
    ├─ Wireframes
    ├─ Test Strategy
    └─ TDD Plan
```

### SOT.md

질문:

> “지금 무엇이 최종 결정인가?”

여기에 들어가는 것:

```text
제품 정의
MVP Scope
최종 UX
Privacy/Safety 원칙
Golden Path
Architecture
6 Core Tasks
Release Gate
Deferred Scope
```

### implementation-checklist.md

질문:

> “현재 Task에서 빠뜨린 것이 없는가?”

```text
[ ] T01 Context + Privacy
    [ ] Web Context
    [ ] PDF Context
    [ ] Privacy Block
```

### progress-board.md

질문:

> “지금 어디까지 개발했는가?”

```text
Milestone : M2
Task      : T03
Status    : DOING
Blocker   : None
```

---

## 18. Reference 문서는 왜 버리지 않는가?

SOT가 있다고 PRD나 TRD를 삭제하는 것은 아닙니다.

역할이 달라집니다.

```text
SOT
→ 현재 결론

Reference
→ 왜 그런 결론을 내렸는지 보여주는 근거
```

예를 들어 SOT에:

```text
R3/R4 정보는 External LLM 금지
```

라고 적혀 있다면, 왜 그렇게 정했는지는 Privacy Research와 TRD에서 확인할 수 있습니다.

> **SOT는 지도이고 Reference는 지도를 만들 때 사용한 조사 자료입니다.**

---

## 19. SOT를 너무 일찍 만들면 안 되는 이유

“그렇다면 프로젝트 시작부터 SOT 하나만 쓰면 되지 않을까?”라고 생각할 수 있습니다.

하지만 초기에는 정답이 없습니다.

TeacherFlow에서도 이런 질문이 있었습니다.

```text
Toolbar가 좋을까?
Floating Launcher가 좋을까?
둘 다 필요할까?
```

충분한 Research와 UX 검토 없이 너무 빨리 SOT를 만들면 **잘못된 결정을 공식 정답처럼 고정할 수 있습니다.**

따라서 순서가 중요합니다.

```text
탐색
↓
비교
↓
결정
↓
수렴
↓
SOT
```

SOT는 생각을 막는 문서가 아니라 **충분히 생각한 뒤 흔들리지 않게 만드는 문서**입니다.

---

## 20. What · Why · How로 다시 정리하기

| 단계 | What | Why | How |
|---|---|---|---|
| Project Definition | 프로젝트 경계 | 기능 폭주 방지 | 문제·사용자·MVP·Non-goal |
| Research | 가설 조사 | 근거 없는 기획 방지 | 핵심 질문별 조사 |
| PRD | 제품 요구 | 사용자 관점의 What 고정 | 요구사항·Acceptance Criteria |
| TRD | 기술 설계 | PRD를 시스템으로 변환 | Architecture·Data·API·Security |
| Persona | 대표 사용자 | 애매한 “모든 사용자” 방지 | 행동·Pain Point·성공 기준 |
| Scenario | 실제 사용 흐름 | 빠진 단계 발견 | 시작→행동→결과 |
| Wireframe | 화면 구조 | 코딩 전 UX 검증 | Entry·Main·Error·Complete |
| Test Strategy | 검증 범위 | 완료 기준 명확화 | Unit→E2E→사용자 검증 |
| TDD | 테스트 중심 구현 | 성공 기준을 먼저 고정 | RED→GREEN→REFACTOR |
| Development Plan | 개발 순서 | 한꺼번에 구현하는 혼란 방지 | Milestone·Core Task |
| Final Gate | 구현 시작 승인 | 충돌 상태로 개발 시작 방지 | Scope·Architecture·Test 검토 |
| SOT | 최종 단일 기준 | 문서 충돌 제거 | 최종 결정만 모으기 |

---

## 21. 초보 개발자가 자주 하는 실수

### 실수 1. 아이디어가 생기자마자 코드부터 작성한다

```text
아이디어
↓
바로 프로젝트 생성
```

그러면 만들면서 요구가 계속 바뀝니다.

추천:

```text
Project Definition
↓
짧은 Research
↓
PRD
↓
개발
```

### 실수 2. PRD와 TRD를 섞는다

PRD:

```text
현재 웹페이지에서 수업 생성 가능
```

TRD:

```text
Chrome Extension + Side Panel + Context Extractor
```

What과 How를 분리하면 기술을 바꿔도 제품 목표는 유지할 수 있습니다.

### 실수 3. 체크리스트를 전부 개발 단계로 만든다

TeacherFlow에서도 세부 체크가 지나치게 많아 보이는 문제가 있었습니다.

해결:

```text
6 Core Tasks
+
Task별 Acceptance Criteria
```

### 실수 4. 꼼꼼하게 한다는 이유로 계속 새 문서를 만든다

```text
문서
↓
문서 검토 문서
↓
검토 결과 요약 문서
↓
다시 계획 문서
```

이러면 개발을 하지 못합니다.

원칙:

```text
기획 단계
→ 문서를 통해 생각한다.

SOT 이후
→ 새 문서를 줄이고 구현한다.
```

### 실수 5. 모든 과거 문서를 항상 최신 상태로 만들려고 한다

더 좋은 방식:

```text
SOT = 최신 정답
Reference = 당시 판단 근거
```

### 실수 6. SOT에 모든 내용을 복사한다

SOT가 지나치게 길어지면 다시 읽지 않게 됩니다.

SOT에는 최종 결정과 핵심 기준만 남깁니다.

---

## 22. 초보자를 위한 추천 문서 작성 순서

작은 개인 프로젝트라면 모든 문서를 거대하게 만들 필요는 없습니다.

### Step 1 — Project.md

```text
무슨 문제?
누구?
핵심 기능?
MVP?
하지 않을 것?
```

### Step 2 — Research.md

정말 중요한 기술 질문만 조사합니다.

### Step 3 — PRD.md

```text
사용자가 할 수 있어야 하는 것
```

### Step 4 — TRD.md

```text
기술적으로 어떻게 구현할 것인지
```

### Step 5 — scenarios.md + wireframe.md

사용 흐름과 화면을 확인합니다.

### Step 6 — test-strategy.md + TDD 원칙

성공 기준을 정합니다.

### Step 7 — development-plan.md

개발 단계를 최소한으로 정합니다.

### Step 8 — Final Planning Gate

정말 만들 준비가 되었는지 확인합니다.

### Step 9 — SOT.md

최종 결정만 모읍니다.

### Step 10 — 구현

```text
SOT
↓
Checklist
↓
Code
↓
Test
↓
Progress Board
```

---

## 23. 프로젝트 크기에 따라 문서를 줄여도 된다

### 작은 개인 프로젝트

```text
Project
PRD
TRD
SOT
Checklist
```

정도로 충분할 수 있습니다.

### 중간 규모 AI 프로젝트

```text
Project
Research
PRD
TRD
Scenario
Wireframe
Test Strategy
Development Plan
SOT
```

### 개인정보·파일·AI Agent가 포함된 프로젝트

TeacherFlow처럼:

```text
Privacy Research
Human-in-the-loop
Source Grounding
Test Strategy
TDD
Final Gate
```

까지 필요할 수 있습니다.

핵심은:

> **문서를 많이 만드는 것이 좋은 개발이 아니라, 위험과 불확실성을 줄이는 만큼만 만드는 것이 좋은 개발입니다.**

---

## 24. TeacherFlow 사례 전체 요약

TeacherFlow는 다음 아이디어에서 시작했습니다.

> 브라우저에서 보고 있는 자료를 바로 수업자료로 바꾸는 교사용 AI를 만들자.

이후 질문을 하나씩 해결했습니다.

```text
Project Definition
→ 누구를 위한 무엇인가?

Research
→ 정말 만들 수 있는가?

PRD
→ 사용자가 무엇을 할 수 있어야 하는가?

TRD
→ 기술적으로 어떻게 연결할 것인가?

Persona
→ 어떤 교사가 쓰는가?

Scenario
→ 실제로 어떻게 사용하는가?

Wireframe
→ 어떤 화면 흐름인가?

Test Strategy
→ 언제 완료라고 인정하는가?

TDD
→ 어떤 테스트부터 통과시키며 만들 것인가?

Development Plan
→ 어떤 순서로 구현할 것인가?

Final Planning Gate
→ 이제 개발해도 되는가?

SOT
→ 현재 최종 결정은 무엇인가?
```

최종 제품 흐름은 다음처럼 수렴했습니다.

```text
Toolbar Icon
        ┐
        ├→ Same Side Panel
Floating Launcher
        ┘
↓
Web / Public PDF
↓
50분 수업 생성
↓
Source 확인
↓
Teacher Edit
↓
PPTX + DOCX + PDF
```

개발 구조도 다음처럼 단순화했습니다.

```text
3 Milestones
6 Core Tasks
약 3~4주
```

---

## 25. 수업용 한 장 요약

```text
아이디어가 있다
        ↓
Project Definition
“무엇을 해결하지?”
        ↓
Research
“가능한가?”
        ↓
PRD
“사용자에게 무엇이 필요하지?”
        ↓
TRD
“기술적으로 어떻게 만들지?”
        ↓
Persona / Scenario / Wireframe
“누가, 어떻게 쓰지?”
        ↓
Test Strategy / TDD
“어떻게 완료를 증명하지?”
        ↓
Development Plan
“어떤 순서로 만들지?”
        ↓
Final Planning Gate
“이제 시작해도 되나?”
        ↓
SOT
“현재 최종 정답은 이것!”
        ↓
Checklist → Code → Test → Progress
```

---

## 26. 용어 초간단 사전

| 용어 | 아주 쉽게 |
|---|---|
| MVP | 가장 작은 실제 제품 |
| PRD | 제품이 해야 할 일 목록 |
| TRD | 그것을 만드는 기술 설계 |
| Persona | 대표 사용자 |
| User Scenario | 사용자가 쓰는 장면 |
| Wireframe | 화면 밑그림 |
| Acceptance Criteria | 완료라고 인정할 조건 |
| Test Strategy | 무엇을 어떻게 검사할지 |
| TDD | 테스트를 먼저 기준으로 잡는 개발 |
| E2E | 처음부터 끝까지 실제 흐름 테스트 |
| HITL | 중요한 순간에는 사람이 확인하는 구조 |
| Source Grounding | AI 내용이 어디서 왔는지 연결 |
| SOT | 현재 최종 결정이 모인 단 하나의 기준 |
| Checklist | 빠뜨리지 않기 위한 확인표 |
| Progress Board | 지금 어디까지 했는지 보여주는 현황판 |
| Deferred | 지금 만들지 않고 나중으로 미룬 것 |
| Golden Path | 가장 중요한 정상 사용자 흐름 |

---

## 27. 프로젝트 시작 전 체크리스트

### 기획

- [ ] 해결하려는 문제가 한 문장으로 설명되는가?
- [ ] Primary User가 정해졌는가?
- [ ] MVP가 정해졌는가?
- [ ] Non-goal이 있는가?
- [ ] 중요한 기술 위험을 조사했는가?

### 제품

- [ ] PRD가 있는가?
- [ ] 주요 Scenario가 있는가?
- [ ] 화면 흐름을 확인했는가?

### 기술

- [ ] TRD가 있는가?
- [ ] Privacy/Security 위험을 확인했는가?
- [ ] 실패 시 복구 방법이 있는가?

### 테스트

- [ ] 완료조건이 있는가?
- [ ] Golden Path E2E가 정의되어 있는가?
- [ ] 핵심 규칙의 테스트가 있는가?

### 구현 준비

- [ ] Development Plan이 과도하게 세분화되지 않았는가?
- [ ] Core Task와 세부 체크를 구분했는가?
- [ ] Final Planning Gate를 통과했는가?
- [ ] 최종 결정이 SOT에 모여 있는가?
- [ ] Checklist와 Progress Board가 있는가?

---

## 28. 마지막으로 기억할 문장

개발 기획 문서의 목적은 문서를 많이 만드는 것이 아닙니다.

> **코드를 쓰기 전에 생각해야 할 것을 미리 생각하는 것**

입니다.

그리고 SOT의 목적은 모든 문서를 없애는 것도 아닙니다.

> **여러 문서에서 얻은 결론을 하나의 현재 기준으로 모으는 것**

입니다.

따라서 전체 과정을 가장 짧게 표현하면:

> **기획할 때는 문서를 통해 생각을 넓히고, 개발할 때는 SOT를 통해 기준을 하나로 줄인다.**

TeacherFlow 기획 과정에서 우리가 실제로 한 일이 바로 이것이었습니다.

---

### 블로그용 핵심 문장

> **PRD는 “무엇”, TRD는 “어떻게”, TDD는 “어떻게 검증하며 만들 것인가”, SOT는 “그래서 지금 최종 정답이 무엇인가”를 다루는 문서입니다.**

> **SOT 이전에는 정답을 찾기 위해 여러 문서를 만들고, SOT 이후에는 정답을 하나로 모아 개발에 집중합니다.**

> **좋은 개발 문서는 개발 단계를 늘리지 않습니다. 오히려 불필요한 재작업을 줄여 개발을 빠르게 만듭니다.**

---

## 부록 D. 초보 개발자가 꼭 알아야 할 개발 단계 용어

개발을 시작하면 `PoC`, `Prototype`, `MVP`, `Pilot`, `Beta`, `GA` 같은 단어를 자주 만나게 됩니다.

처음에는 모두 "아직 완성 전 버전"처럼 보여 헷갈릴 수 있습니다.

가장 쉽게 이해하려면 **음식점을 준비하는 과정**에 비유하면 됩니다.

```text
PoC
→ 이 요리를 만들 수 있는가?

Prototype
→ 손님에게 보여줄 모양을 만들어볼 수 있는가?

MVP
→ 실제로 돈을 받고 팔 수 있는 최소 메뉴인가?

Pilot
→ 소수 손님에게 실제로 팔아봐도 되는가?

Beta
→ 더 많은 손님에게 공개해서 문제를 찾을 수 있는가?

GA / Production
→ 이제 정식 메뉴로 운영해도 되는가?
```

---

### D-1. PoC — Proof of Concept

#### What

**Proof of Concept**는 우리말로 하면 **개념 검증**입니다.

쉽게 말하면:

> **"이 아이디어가 기술적으로 정말 가능한가?"**

를 확인하는 단계입니다.

#### 생활 비유

새로운 자동 라면 조리기를 만든다고 해봅시다.

PoC에서는 이런 것만 확인해도 됩니다.

```text
물이 자동으로 끓는가?
면을 자동으로 넣을 수 있는가?
3분 후 불을 끌 수 있는가?
```

디자인이 예쁜지는 중요하지 않습니다.

#### TeacherFlow 예

TeacherFlow의 PoC라면:

```text
현재 웹페이지의 본문을 읽을 수 있는가?
↓
읽은 내용을 AI에 전달할 수 있는가?
↓
수업안 JSON을 받을 수 있는가?
```

정도만 확인해도 충분합니다.

#### 핵심

> **PoC는 "제품을 만들었다"가 아니라 "가능하다는 것을 증명했다"입니다.**

---

### D-2. Prototype — 프로토타입

#### What

Prototype은 **시제품** 또는 **모형**입니다.

> **"사용자가 실제 제품을 쓰는 것처럼 경험해볼 수 있는 시험용 버전"**

이라고 이해하면 됩니다.

#### 생활 비유

아파트를 짓기 전에 모델하우스를 만드는 것과 비슷합니다.

실제로 사람이 살 수는 없지만:

```text
거실은 어디인지
주방은 어디인지
동선은 어떤지
```

를 체험할 수 있습니다.

#### TeacherFlow 예

```text
Toolbar
↓
Side Panel
↓
50분 수업 만들기
↓
Preview 화면
```

이 흐름을 Figma나 간단한 HTML로 클릭해볼 수 있다면 Prototype입니다.

#### PoC와 차이

```text
PoC
→ 기술 가능성

Prototype
→ 사용 경험 가능성
```

---

### D-3. MVP — Minimum Viable Product

#### What

**Minimum Viable Product**

단어별로 보면:

- **Minimum**: 최소한의
- **Viable**: 실제로 사용할 수 있는
- **Product**: 제품

즉:

> **"사용자에게 실제 가치를 줄 수 있는 가장 작은 제품"**

입니다.

#### 중요한 오해

MVP는:

```text
대충 만든 제품
```

이 아닙니다.

정확히는:

```text
기능은 적지만
핵심 가치는 실제로 제공하는 제품
```

입니다.

#### TeacherFlow MVP

TeacherFlow의 MVP는 다음처럼 정리했습니다.

```text
Web / Public PDF
↓
50분 수업 만들기
↓
Preview / Source Check
↓
PPTX + DOCX + PDF
```

반면 다음은 MVP에서 뺐습니다.

```text
HWP/HWPX
학생 AI
LMS
NEIS
Marketplace
고급 PPT 디자인
```

#### 핵심

> **MVP의 목적은 "작게 만들기"가 아니라 "핵심 가치가 진짜 통하는지 빨리 검증하기"입니다.**

---

### D-4. Pilot — 파일럿

#### What

Pilot은 **소수의 실제 사용자를 대상으로 제한적으로 운영해보는 단계**입니다.

#### 생활 비유

새 메뉴를 전국 매장에 출시하기 전에 특정 매장 2~3곳에서 먼저 판매해보는 것입니다.

#### TeacherFlow 예

```text
현직 교사 3~5명
↓
실제 Web/PDF 선택
↓
50분 수업 생성
↓
파일 열기
↓
실제 사용 가능성 평가
```

#### Pilot에서 보는 것

```text
사용자가 막히는 지점
실제 사용 시간
심각한 오류
반복되는 불편
실제 사용할 의향
```

---

### D-5. Alpha

Alpha는 **아직 내부 개발 성격이 강한 초기 버전**입니다.

보통:

```text
핵심 기능은 있음
오류가 많을 수 있음
개발팀/내부 사용자 중심
```

입니다.

#### 쉽게 말하면

> **"우리끼리 먼저 써보는 초기 제품"**

입니다.

---

### D-6. Beta

Beta는 Alpha보다 안정적이고, **더 많은 외부 사용자에게 공개해 문제를 찾는 단계**입니다.

```text
기능 대부분 존재
↓
외부 사용자 사용
↓
버그/UX 문제 수집
↓
정식 출시 전 개선
```

#### 쉽게 말하면

> **"실전 연습 경기"**

입니다.

---

### D-7. RC — Release Candidate

RC는 **정식 출시 후보 버전**입니다.

예:

```text
v1.0.0-rc.1
```

뜻은:

> "큰 문제가 없다면 이 버전을 정식 출시하겠습니다."

입니다.

TeacherFlow의 `Final Planning Gate`와 비슷하게, 구현에서도 RC 단계에서는:

```text
치명적 버그가 없는가?
보안 문제가 없는가?
Golden Path가 동작하는가?
```

를 확인합니다.

---

### D-8. GA — General Availability

GA는 **정식 출시**입니다.

쉽게 말하면:

> **"이제 일반 사용자에게 공식적으로 제공합니다."**

입니다.

보통 `Production Release`와 비슷한 의미로 사용됩니다.

---

### D-9. Production

Production은 **실제 사용자들이 사용하는 운영 환경**입니다.

개발자의 컴퓨터에서 돌아가는 것과는 다릅니다.

```text
Local
→ 내 컴퓨터

Development
→ 개발 환경

Staging
→ 출시 전 리허설 환경

Production
→ 실제 서비스
```

#### 핵심

> **Production은 연습장이 아니라 실제 경기장입니다.**

---

## 부록 E. 개발 단계 한눈에 비교하기

| 단계 | 핵심 질문 | 결과물 | 실제 사용자 |
|---|---|---|---|
| PoC | 가능한가? | 기술 검증 코드 | 거의 없음 |
| Prototype | 이렇게 쓰면 편한가? | 클릭 가능한 모형 | 소수 |
| MVP | 핵심 가치가 통하는가? | 최소 실제 제품 | 실제 사용자 |
| Alpha | 내부에서 쓸 만한가? | 초기 제품 | 내부 중심 |
| Pilot | 현장에서 통하는가? | 제한 운영 버전 | 소수 실제 사용자 |
| Beta | 더 많은 사용자에게 문제 없는가? | 공개 테스트 버전 | 확대 |
| RC | 정식 출시해도 되는가? | 출시 후보 | 제한/내부 |
| GA / Production | 정식 운영 가능한가? | 공식 서비스 | 전체 사용자 |

---

## 부록 F. QA는 무엇인가?

QA는 개발 현장에서 정말 자주 듣는 용어입니다.

### QA — Quality Assurance

**Quality Assurance**는 **품질 보증**입니다.

쉽게 말하면:

> **"좋은 품질의 제품이 나오도록 전체 과정에서 미리 관리하는 활동"**

입니다.

#### 생활 비유

학교 시험을 예로 들어봅시다.

QA는 단순히 시험지를 다 만든 뒤 오타를 찾는 것만이 아닙니다.

```text
출제 기준이 있는가?
난이도가 맞는가?
정답이 하나인가?
시험 시간이 적절한가?
검토 절차가 있는가?
```

처럼 **좋은 시험이 만들어지는 전체 과정을 관리**합니다.

---

## 부록 G. QA와 Test는 같은 말인가?

같지 않습니다.

### Test

> 실제 프로그램을 실행하여 문제가 있는지 확인하는 활동

예:

```text
로그인 버튼이 눌리는가?
PDF가 생성되는가?
Privacy Block이 동작하는가?
```

### QA

> 문제를 줄이기 위해 개발 과정 전체를 관리하는 활동

예:

```text
요구사항이 명확한가?
Acceptance Criteria가 있는가?
테스트 계획이 있는가?
릴리스 기준이 있는가?
```

#### 한 줄 차이

```text
Test
→ 제품을 검사한다.

QA
→ 좋은 제품이 나오도록 과정을 관리한다.
```

---

## 부록 H. QA와 QC의 차이

### QC — Quality Control

**Quality Control**은 **품질 관리/검사**입니다.

QA와 비슷해 보이지만 관점이 다릅니다.

```text
QA
→ 과정 중심

QC
→ 결과물 중심
```

#### 빵집 비유

QA:

```text
레시피를 표준화한다.
오븐 온도를 정한다.
재료 관리 방식을 정한다.
```

QC:

```text
완성된 빵이 타지 않았는지 검사한다.
무게가 기준에 맞는지 확인한다.
```

---

## 부록 I. UAT — User Acceptance Test

**User Acceptance Test**는 **사용자 인수 테스트**입니다.

쉽게 말하면:

> **"개발자 말고 실제 사용자가 써보고, 이 정도면 사용할 수 있다고 인정하는 테스트"**

입니다.

#### TeacherFlow 예

현직 교사에게 이렇게 요청합니다.

> "현재 보고 있는 웹페이지로 50분 수업을 만들어 보세요."

그리고 다음을 확인합니다.

```text
혼자 사용할 수 있는가?
실제 수업에 쓸 수 있는가?
결과 파일이 충분한가?
심각한 불편은 없는가?
```

이것이 UAT에 가깝습니다.

---

## 부록 J. 테스트 관련 필수 용어

### Unit Test — 단위 테스트

아주 작은 기능 하나를 검사합니다.

```text
Privacy 함수
Context 정리 함수
파일명 생성 함수
```

비유:

> 자동차 전체가 아니라 브레이크 부품 하나를 검사

---

### Integration Test — 통합 테스트

여러 부품이 연결될 때 잘 동작하는지 검사합니다.

```text
Extension
→ API
→ Privacy Gateway
```

비유:

> 브레이크와 바퀴가 연결된 상태를 검사

---

### E2E Test — End-to-End Test

처음부터 끝까지 실제 사용자 흐름을 검사합니다.

```text
Web 페이지
↓
TeacherFlow 클릭
↓
수업 생성
↓
파일 다운로드
```

비유:

> 자동차에 타서 시동 걸고 실제 도로를 달려보는 테스트

---

### Smoke Test — 스모크 테스트

핵심 기능이 아예 망가지지 않았는지 **빠르게 확인하는 최소 테스트**입니다.

```text
앱 실행됨?
로그인됨?
핵심 화면 열림?
```

이름은 전자기기를 켰을 때 연기가 나는지 먼저 확인했다는 오래된 표현에서 유래했습니다.

쉽게 말하면:

> **"일단 큰일 난 건 없는지 빠르게 확인"**

---

### Regression Test — 회귀 테스트

새 기능을 추가한 뒤 **예전에 잘 되던 기능이 망가지지 않았는지** 확인합니다.

예:

```text
Floating Launcher 추가
↓
Toolbar가 여전히 잘 열리는가?
```

#### 기억하기

> **새 기능 하나 만들고 기존 기능 하나 망가뜨리는 일을 막는 테스트**

---

### Acceptance Test — 인수/수용 테스트

기능이 **요구사항에 맞게 완료됐는지** 확인합니다.

예:

```text
요구:
PPTX는 PowerPoint에서 수정 가능해야 한다.

Acceptance Test:
실제 PowerPoint에서 열고 편집 가능한가?
```

---

## 부록 K. Acceptance Criteria와 Definition of Done

두 용어도 자주 헷갈립니다.

### Acceptance Criteria

특정 기능 하나가 완료되었다고 인정할 조건입니다.

예:

```text
T01 Context + Privacy

- Web Context PASS
- PDF Context PASS
- R3 Privacy Block PASS
```

### Definition of Done — DoD

팀이 **"완료"라는 말을 사용할 수 있는 공통 기준**입니다.

예:

```text
코드 작성
테스트 통과
리뷰 완료
문서 반영
배포 가능 상태
```

#### 차이

```text
Acceptance Criteria
→ 이 기능이 끝났나?

Definition of Done
→ 우리 팀 기준으로 진짜 완료인가?
```

---

## 부록 L. 버그와 업무 관리 용어

### Bug

프로그램이 기대와 다르게 동작하는 문제입니다.

예:

```text
"파일 만들기"를 눌렀는데 다운로드가 안 됨
```

---

### Issue

Bug보다 넓은 개념입니다.

Issue에는 다음이 모두 들어갈 수 있습니다.

```text
Bug
기능 요청
개선사항
질문
작업
```

---

### Blocker

다음 작업을 진행하지 못하게 막는 문제입니다.

예:

```text
PDF Parser가 전혀 동작하지 않아
T02로 넘어갈 수 없음
```

#### 쉽게 말하면

> **"앞길을 막고 있는 장애물"**

---

### Backlog

아직 처리하지 않은 작업 목록입니다.

```text
언젠가 해야 할 기능
버그
개선
아이디어
```

쉽게 말하면:

> **개발팀의 할 일 창고**

---

### Sprint

짧은 기간 동안 정한 일을 집중해서 개발하는 기간입니다.

일반적으로:

```text
1주
2주
```

단위가 많습니다.

쉽게 말하면:

> **짧은 개발 집중 기간**

---

### Milestone

큰 개발 목표 지점입니다.

TeacherFlow:

```text
M1 Core
M2 Product
M3 Validate & Ship
```

비유:

> 서울에서 부산까지 갈 때 대전, 대구 같은 큰 중간 지점

---

## 부록 M. 배포 관련 기초 용어

### Build

소스코드를 실행하거나 배포할 수 있는 결과물로 만드는 과정입니다.

```text
TypeScript
↓
Build
↓
JavaScript Bundle
```

---

### Deploy

만든 프로그램을 실제 서버나 환경에 올리는 것입니다.

```text
내 컴퓨터
↓
Deploy
↓
Staging / Production
```

#### Build와 Deploy 차이

```text
Build
→ 포장하기

Deploy
→ 매장에 진열하기
```

---

### Release

사용자에게 특정 버전을 공식적으로 제공하는 것입니다.

Deploy와 비슷하지만 의미가 다릅니다.

```text
Deploy
→ 서버에 올림

Release
→ 사용자에게 제공하기로 결정
```

서버에는 배포했지만 사용자에게 아직 공개하지 않을 수도 있습니다.

---

### Rollback

새 버전에 문제가 생겼을 때 이전 정상 버전으로 되돌리는 것입니다.

비유:

> 새 교과서에 심각한 오류가 있어 이전 판본을 다시 사용하는 것

---

### Hotfix

운영 중 발견된 심각한 문제를 빠르게 수정하는 긴급 패치입니다.

```text
Production 치명적 오류
↓
즉시 수정
↓
Hotfix Release
```

---

## 부록 N. 개발 환경 용어

### Development Environment — Dev

개발자가 기능을 만드는 환경입니다.

```text
실험 가능
깨져도 됨
```

---

### Staging

Production과 최대한 비슷하게 만든 **출시 전 리허설 환경**입니다.

```text
Dev
↓
Staging
↓
Production
```

비유:

> 공연 전 최종 리허설 무대

---

### Production — Prod

실제 사용자가 사용하는 운영 환경입니다.

여기서는 실수의 영향이 큽니다.

---

## 부록 O. CI/CD

### CI — Continuous Integration

여러 개발자가 만든 코드를 자주 합치고 자동으로 검사하는 방식입니다.

예:

```text
Git Push
↓
자동 Test
↓
Build
↓
문제 확인
```

쉽게 말하면:

> **코드를 합칠 때마다 자동 건강검진**

---

### CD — Continuous Delivery / Deployment

테스트를 통과한 코드를 배포 가능한 상태로 계속 유지하거나 자동 배포하는 방식입니다.

```text
CI 통과
↓
Staging
↓
Production
```

쉽게 말하면:

> **검사를 통과한 제품을 빠르게 배송할 준비**

---

## 부록 P. Git과 협업 관련 필수 용어

### Repository — Repo

프로젝트 코드와 기록을 보관하는 저장소입니다.

쉽게 말하면:

> **프로젝트 전체 폴더 + 변경 이력 저장소**

---

### Commit

코드 변경 내용을 하나의 기록 단위로 저장합니다.

비유:

> 게임의 세이브 포인트

---

### Branch

기존 코드를 건드리지 않고 별도 작업 흐름을 만드는 것입니다.

```text
main
├─ feature/login
└─ feature/teacherflow
```

비유:

> 원본 문서를 복사해 별도 버전에서 작업

---

### Merge

Branch에서 작업한 내용을 다른 Branch에 합치는 것입니다.

---

### Pull Request — PR

"제가 이렇게 수정했는데 main에 합쳐도 될까요?"라고 요청하는 과정입니다.

보통:

```text
코드 확인
리뷰
테스트
승인
Merge
```

순서로 진행합니다.

---

## 부록 Q. 코드와 도구 관련 기초 용어

### API

프로그램끼리 대화하는 약속입니다.

비유:

> 식당의 주문 창구

손님은 주방에 직접 들어가지 않고 주문서를 통해 요청합니다.

```text
Frontend
↓ API
Backend
```

---

### SDK

특정 서비스를 쉽게 사용하도록 제공하는 개발 도구 모음입니다.

비유:

> 가구 조립용 설명서 + 전용 공구 세트

---

### Library

특정 기능을 미리 만들어 놓은 코드 모음입니다.

예:

```text
PDF 처리 Library
PPTX 생성 Library
```

비유:

> 요리할 때 쓰는 미리 만들어진 소스

---

### Framework

프로그램의 전체 구조를 잡아주는 틀입니다.

비유:

```text
Library
→ 내가 필요할 때 가져다 씀

Framework
→ Framework이 정한 구조 안에서 내가 코드를 작성
```

---

### Dependency

내 프로그램이 의존하는 외부 코드나 Library입니다.

예:

```text
TeacherFlow
→ PDF.js 필요
```

PDF.js가 Dependency입니다.

---

### Runtime

프로그램이 실제로 실행되는 환경입니다.

예:

```text
Node.js
Browser
Python Runtime
```

---

## 부록 R. 운영 관련 기초 용어

### Logging

프로그램에서 어떤 일이 있었는지 기록하는 것입니다.

예:

```text
사용자 로그인
PDF parsing 시작
Renderer 실패
```

비유:

> 비행기의 비행 기록

---

### Monitoring

서비스 상태를 계속 관찰하는 것입니다.

```text
서버 정상?
에러 증가?
속도 느려짐?
```

비유:

> 병원에서 환자의 심박수를 계속 보는 모니터

---

### Observability

Logging보다 더 넓은 개념입니다.

시스템 내부에서 왜 문제가 생겼는지 이해할 수 있도록:

```text
Logs
Metrics
Traces
```

를 함께 활용합니다.

쉽게 말하면:

> **"문제가 났다는 사실뿐 아니라 왜 났는지 추적할 수 있는 상태"**

---

## 부록 S. 버전 관련 용어

### Version

제품의 변경 상태를 구분하는 번호입니다.

예:

```text
v1.0
v1.1
v2.0
```

---

### Semantic Versioning — SemVer

보통 다음 구조를 사용합니다.

```text
MAJOR.MINOR.PATCH

2.3.1
```

#### MAJOR

큰 변화, 호환성이 깨질 수 있음

```text
1.x → 2.0
```

#### MINOR

새 기능 추가, 기존 호환 유지

```text
2.2 → 2.3
```

#### PATCH

버그 수정

```text
2.3.0 → 2.3.1
```

쉽게 외우면:

```text
MAJOR = 큰 공사
MINOR = 방 하나 추가
PATCH = 고장 수리
```

---

## 부록 T. 초보 개발자가 꼭 구분해야 할 용어 10쌍

| 헷갈리는 용어 | 차이 |
|---|---|
| PRD vs TRD | 무엇 vs 어떻게 |
| PoC vs Prototype | 기술 가능성 vs 사용 경험 |
| Prototype vs MVP | 모형 vs 실제 최소 제품 |
| QA vs Test | 품질 과정 전체 vs 실제 검사 |
| QA vs QC | 과정 중심 vs 결과 검사 |
| Build vs Deploy | 결과물 만들기 vs 환경에 올리기 |
| Deploy vs Release | 올리기 vs 사용자에게 공개 |
| Unit vs E2E | 작은 부품 vs 처음부터 끝까지 |
| Bug vs Issue | 오류 vs 모든 작업/문제 |
| Milestone vs Task | 큰 목표 지점 vs 실제 작업 |

---

## 부록 U. 개발 흐름에 용어를 배치해보기

```text
아이디어
↓
PoC
"기술적으로 가능?"

↓
Prototype
"이렇게 쓰는 게 맞아?"

↓
PRD
"무엇을 만들어야 하지?"

↓
TRD
"어떻게 만들지?"

↓
MVP 개발
TDD + Test + QA

↓
Pilot / UAT
"실제 사용자가 쓸 수 있나?"

↓
Beta / RC
"정식 출시 직전 문제는 없나?"

↓
GA / Production
"정식 서비스"

↓
Monitoring / Logging
"서비스가 계속 건강한가?"

↓
Hotfix / Rollback
"문제가 생겼을 때 어떻게 대응하지?"
```

---

## 부록 V. 초보자를 위한 마지막 암기 문장

> **PoC는 가능한지 확인하고, Prototype은 어떻게 보일지 확인하고, MVP는 실제 가치가 있는지 확인한다.**

> **PRD는 무엇을 만들지, TRD는 어떻게 만들지, TDD는 어떤 테스트를 기준으로 만들지 설명한다.**

> **QA는 좋은 제품이 나오도록 과정을 관리하고, Test는 실제 제품을 검사한다.**

> **SOT는 여러 기획 문서에서 나온 최종 결론을 하나의 현재 기준으로 모은다.**

> **개발의 목적은 문서를 많이 만드는 것이 아니라, 다시 만들 일을 줄이는 것이다.**
