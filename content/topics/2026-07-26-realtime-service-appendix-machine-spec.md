---
title: "2026년 7월 26일(일) 부록 E — 에이전트 직접 적용용 기계 명세 (Machine-Applicable Spec)"
description: "쌀로운 글이 아니라, AI 코딩 에이전트가 사람 해석 없이 그대로 구현·검증할 수 있도록 계약과 테스트 벡터로 확정한 실시간 퀴즈 기계 명세입니다."
tags:
  - middle-school
  - realtime
  - websocket
  - django-channels
  - system-design
  - machine-spec
created: "2026-07-26"
modified: "2026-07-26"
publish: true
cssclasses:
  - field-note
---

> 이 문서는 [실시간 퀴즈, 투표, 채팅은 어떻게 만들어질까](2026-07-25-realtime-service-beginner-guide)의 분록입니다. 본문이 사람을 위한 비유 가이드라면, 이 분록은 같은 설계 결정을 AI 코딩 에이전트가 사람의 해석 없이 그대로 구혅·검증할 수 있도록 계약(contract)과 테스트 벡터로 확정한 기계 명세입니다. 본문과 충돌하면 이 분록이 우선합니다.

# 부록 E — 에이전트 직접 적용용 기계 명세 (Machine-Applicable Spec)

> 이 부록은 사람의 해석 없이 AI 코딩 에이전트가 그대로 구현·검증할 수 있도록, 본문의 설계 결정을 계약(contract)과 테스트 벡터로 확정한 것이다. 본문과 충돌하면 이 부록이 우선한다.

## E-1. HTTP 엔드포인트 계약

| # | 메서드/경로 | 요청 바디 | 성공 응답 | 실패 응답 |
|---|---|---|---|---|
| H1 | `POST /quiz/{quiz_id}/join` | `{name: string(1..20)}` | `201 {student_id: uuid, name}` | `404 {error:"quiz_not_found"}` |
| H2 | `GET /quiz/{quiz_id}/state?student_id={uuid}` | 없음 | `200 state_snapshot` (E-3 스키마) | `404 {error:"quiz_not_found"}` |
| H3 | `POST /quiz/{quiz_id}/answers` | `{student_id, question_id, choice, submission_id: uuid}` | `201 {ok:true, submission_id}` | reason↔status 매핑: `malformed`→400 · `unknown_student`→404 · `unknown_question`→404 · `quiz_not_found`→404 · `invalid_choice`→422 · `closed`→422 · `duplicate`→409. 실패 바디는 항상 `{ok:false, reason: enum}` |
| H4 | `GET /quiz/{quiz_id}/results` | 없음 | `200 {rankings: [{rank, name, score, last_correct_at}], total_students: int}` | `404` · `423 {error:"quiz_not_finished"}` (종료 전 조회 시) |
| H5 | `POST /quiz/{quiz_id}/questions/{question_id}/start` | 없음 (교사) | `200 {ok:true, phase:"running", ends_at}` | `404` · `409 {error:"invalid_phase"}` (waiting/revealed가 아닐 때) |
| H6 | `POST /quiz/{quiz_id}/reveal` | 없음 (교사) | `200 {ok:true, phase:"revealed", answer, leaderboard}` | `404` · `409 {error:"invalid_phase"}` (running이 아닐 때) |
| H7 | `POST /quiz/{quiz_id}/finish` | 없음 (교사) | `200 {ok:true, phase:"finished", rankings}` | `404` · `409 {error:"invalid_phase"}` (이미 finished) |

- H5 성공 시: 서버가 `ends_at = now + question.duration_sec`을 DB에 먼저 저장한 뒤 Group에 `question_started` 방송(20장 저장→방송 순서 그대로).
- H6 성공 시: 현재 문제를 **채점한 뒤** `answer_revealed` + `leaderboard_updated`를 Group에 방송. 채점은 이 시점에 1회만 수행(트리거 확정).
- H7 성공 시: 최종 순위를 확정하고 `quiz_finished`(rankings 포함)를 Group에 방송. 이후 H4가 423 대신 200을 반환.
- H5~H7 교사 인가 최소 계약: `Authorization: Bearer <teacher_token>` 헤더 필수. 헤더 누락, 무효, 또는 학생 자격(student_id 기반)으로 호출 시 `403 {error:"forbidden"}`. 토큰 발급·검증 방식은 배포 환경이 결정하되, 위 403 분기는 반드시 구현한다.

- 모든 시각 필드는 ISO 8601 UTC(`ends_at`, `server_time` 포함).
- 에러 바디는 항상 `{error: string}` 또는 `{ok:false, reason: enum}` 단일 형태.
- WebSocket `submit_answer`의 ACK도 H3과 동일한 reason enum을 쓴다(채널만 다르고 계약은 하나).

### WebSocket 학생 신원 바인딩 (확정)

- WS 주소는 `wss://{host}/ws/quiz/{quiz_id}/{student_id}/` 형태로, student_id를 **URL 경로**로 전달한다(쿠키/인증 헤더에 의존하지 않음).
- Consumer는 `connect()`에서 `self.student_id = self.scope["url_route"]["kwargs"]["student_id"]`로 바인딩하고, 이 student_id가 해당 퀴즈에 join된 학생이 아니면 `accept()` 직후 `{type:"error", reason:"unknown_student"}`를 보내고 `close()`한다.
- 재연결 시에도 같은 URL로 접속하므로 `my_submission` 조회(AC-6)가 항상 성립한다.

## E-2. 서버 수신 검증 규칙 (submit_answer / H3 공통)

서버는 답안 제출을 받으면 아래 순서로 검증하고, 첫 실패 지점에서 즉시 거부한다.

```text
① 필수 키 누락(student_id/question_id/choice/submission_id),
   비-JSON, 타입 불일치, 64KB 초과 페이로드
   → 자동 검증 전에 즉시 거부 {ok:false, reason:"malformed"}
   (HTTP 채널은 400. WS 채널은 연결을 끊지 않고
    {type:"answer_saved", ok:false, reason:"malformed"} ACK로 응답. DB 미변경)
① student_id가 이 퀴즈에 join된 학생인가        → 아니면 {ok:false, reason:"unknown_student"}
② question_id가 존재하고 현재 진행 중 문제와 같은가 → 아니면 {ok:false, reason:"unknown_question"}
③ choice가 해당 문제의 보기 목록에 있는가        → 아니면 {ok:false, reason:"invalid_choice"}
④ 서버 시각 now <= ends_at 인가                  → 아니면 {ok:false, reason:"closed"}
⑤ (student_id, question_id) 기존 저장이 있는가    → 있으면 {ok:false, reason:"duplicate"} (기존 저장 유지)
⑥ 전부 통과 시에만 DB 저장 후                    → {ok:true, submission_id}
```

- ④의 기준 시각은 반드시 서버 시계다. 클라이언트가 보낸 시각은 검증에 쓰지 않는다.
- ⑤는 DB 유니크 제약으로 원자적으로 보장한다(애플리케이션 판단 + DB 제약 이중).

## E-3. 상태 스냅샷 스키마와 헬퍼 완성 코드

### state_snapshot 스키마 (고정 키 집합)

```json
{
  "type": "state_snapshot",
  "quiz_id": 123,
  "phase": "waiting | running | revealed | finished",
  "current_question": {"number": 3, "text": "...", "choices": ["가","나","다","라"]} ,
  "ends_at": "2026-07-25T10:15:30Z",
  "answer_revealed": false,
  "my_submission": {"question_id": 45, "choice": "나"},
  "server_time": "2026-07-25T10:15:12Z"
}
```

- `phase == "waiting" | "finished"`이면 `current_question`과 `ends_at`은 `null`.
- `my_submission`은 현재 문제에 대한 내 제출이 없으면 `null`.
- `server_time`은 클라이언트 시계 보정용이다(종료시각 계산의 기준 오프셋).

### 헬퍼 완성 (Django Channels)

```python
@database_sync_to_async
def load_state(self):
    quiz = Quiz.objects.get(pk=self.quiz_id)
    if quiz.phase in ("waiting", "finished"):
        current, ends_at = None, None
    else:
        q = quiz.current_question
        current = {"number": q.number, "text": q.text, "choices": q.choices}
        ends_at = quiz.ends_at.isoformat()
    my_sub = None
    if self.student_id and quiz.current_question_id:
        sub = Submission.objects.filter(
            student_id=self.student_id,
            question_id=quiz.current_question_id,
        ).first()
        if sub:
            my_sub = {"question_id": sub.question_id, "choice": sub.choice}
    return {
        "quiz_id": quiz.pk,
        "phase": quiz.phase,
        "current_question": current,
        "ends_at": ends_at,
        "answer_revealed": quiz.answer_revealed,
        "my_submission": my_sub,
        "server_time": timezone.now().isoformat(),
    }

@database_sync_to_async
def save_answer(self, data):
    # 락 없음: 읽기 검증 후 create. (student, question) 유니크 제약이
    # 동시 제출 경쟁을 원자적으로 차단 (IntegrityError → duplicate).
    # Quiz 행 광역 락(select_for_update)은 28명 동시 제출을 직렬화하므로 쓰지 않는다.
    quiz = Quiz.objects.get(pk=self.quiz_id)
    # E-2 검증 순서와 1:1 대응 (서버 시각 기준)
    if not Student.objects.filter(pk=data["student_id"], quiz_id=self.quiz_id).exists():
        return False, "unknown_student"
    if data["question_id"] != quiz.current_question_id:
        return False, "unknown_question"
    if data["choice"] not in quiz.current_question.choices:
        return False, "invalid_choice"
    if timezone.now() > quiz.ends_at:
        return False, "closed"
    try:
        Submission.objects.create(
            student_id=data["student_id"],
            question_id=data["question_id"],
            choice=data["choice"],
        )
        return True, None
    except IntegrityError:  # 유니크 제약 위반 = 중복
        return False, "duplicate"
```

- ACK 계약: `save_answer`가 `(True, None)`을 반환할 때만 `{type:"answer_saved", ok:true, submission_id}`를 보낸다. 실패 시 `{type:"answer_saved", ok:false, reason}`.

### Submission 모델 확정 (20장 모델에 필드 추가, 부록 우선)

```python
class Submission(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    choice = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)  # 서버 수신 시각. E-4 tie-break와 H4 last_correct_at의 기준

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "question"],
                name="uniq_submission_per_question",
            )
        ]
```

- 학생의 `last_correct_at` = 해당 학생의 **정답 Submission 중 가장 늦은 `created_at`**. 정답이 하나도 없는 학생의 `last_correct_at`은 `null`로 한다. 정렬 시 `null`은 항상 비-null 값보다 뒤로 가고, `null`끼리는 student_id 오름차순으로 결정한다(결정적).

## E-3½. phase 상태 머신 (결정적 전이 규칙)

| 현재 phase | 트리거 | 다음 phase | 부수 동작 |
|---|---|---|---|
| waiting | H5 start | running | `ends_at = now + question.duration_sec` 저장 → `question_started` 방송 |
| running | H6 reveal | revealed | 채점 1회 → `answer_revealed` + `leaderboard_updated` 방송 |
| running | 서버 시각 now > ends_at (타이머 만료) | running 유지 | 자동 전이 없음. 제출만 `closed`로 거부. reveal은 교사가 호출 |
| revealed | H5 start (다음 문제) | running | 새 `ends_at = now + question.duration_sec` 저장 → `question_started` 방송 |
| revealed | H7 finish | finished | 최종 순위 확정 → `quiz_finished` 방송 |
| running | H7 finish | finished | 미reveal 문제는 무응답 처리 후 순위 확정 → `quiz_finished` 방송 |

- 위 표에 없는 전이는 전부 `409 {error:"invalid_phase"}`.
- `answer_revealed` 플래그는 phase=="revealed"와 동치. finished 도달 경로는 H7뿐이다.

## E-4. 채점 규칙

| 규칙 | 값 |
|---|---|
| 정답 | `choice == question.answer` → **100점** |
| 오답 | 0점 |
| 시간초과(종료 후 제출 거부됨) / 무응답 | 0점 |
| 문제별 점수 합산 | 학생 총점 = Σ 문제별 점수 |
| 점수 저장 | `Submission.is_correct`(bool, null=미채점)에 reveal 시 1회 기록. 총점은 조회 시 결정적 집계(`SUM(CASE WHEN is_correct THEN 100 ELSE 0 END)`). 별도 집계 테이블 없음 |
| 리더보드 정렬 | 총점 내림차순 → 동점 시 **마지막 정답 제출 시각이 빠른 순** → 그래도 동점이면 student_id 오름차순(결정적) |
| `leaderboard_updated` 페이로드 | 상위 10명 `[{rank, name, score, last_correct_at}]` (H4 rankings와 필드 세트 동일) |

**예시 (입력 → 기대 출력):**

| 학생 | 문제1(정답:가) | 문제2(정답:다) | 기대 총점 |
|---|---|---|---|
| A(10초 제출) | 가 | 다 | 200 |
| B(5초 제출) | 가 | 다 | 200 |
| C | 나 | 다 | 100 |
| D | 가 | 미제출 | 100 |

기대 리더보드 순서: **B → A → D → C**
- A·B 동점 200: B의 마지막 정답 제출(5초)이 A(10초)보다 빠름 → B 우선.
- C·D 동점 100: D의 마지막 정답은 문제1, C의 마지막 정답은 문제2. D가 더 빠름 → D 우선.
- 전 항목 동점이면 student_id 오름차순으로 최종 결정(결정적).

## E-5. Acceptance 테스트 벡터 (자동 PASS/FAIL)

각 항목은 입력 이벤트 시퀀스와 기대 결과의 쌍이다. 전부 통과해야 구현 완료로 판정한다.

| # | 시나리오 | 입력 시퀀스 | 기대 결과 (assert) |
|---|---|---|---|
| AC-1 | 접속 즉시 칠판 | 문제3 진행 중 WS 연결 | 첫 메시지가 `state_snapshot`이고 `current_question.number==3`, `ends_at`이 서버 저장값과 일치 |
| AC-2 | 중복 제출 3중 방어 | 같은 `(student,question)`으로 submit 3회 (WS 2회 + H3 1회) | DB에 Submission **정확히 1건**. 첫 ACK만 `ok:true`, 나머지 2개는 `ok:false, reason:"duplicate"` |
| AC-3 | 종료 후 제출 | `ends_at + 1초` 이후 submit | `ok:false, reason:"closed"`, DB 저장 0건 |
| AC-4 | 잘못된 입력 | 보기에 없는 choice / 다른 question_id / 미등록 student | 각각 `invalid_choice` / `unknown_question` / `unknown_student`로 거부, DB 변화 없음 |
| AC-4b | malformed 입력 | 필수 키 누락 / 비-JSON / 타입 불일치 제출 | 전부 `malformed`로 거부(HTTP 400), DB 변화 없음, 에러 없음 |
| AC-5 | 동시 브로드캐스트 | 학생 2명 접속 중 교사가 문제 시작 | 두 클라이언트 모두 `question_started` 수신, 페이로드의 `ends_at`이 DB 저장값과 동일 |
| AC-6 | 재연결 복원 | 답안 제출 완료 → 연결 끊기 → 재연결 | 재연결 후 첫 `state_snapshot.my_submission`이 직전 제출과 일치. 추가 제출 시 `duplicate` |
| AC-7 | 타이머 수렴 (결정적 단위 테스트) | 순수 함수 `calcLeft(endsAt, localNow, serverOffset)`에 고정 클럭 주입: localNow가 5초 어긋난 케이스 2조 | 두 케이스의 반환값 차이 **0초** (DOM 렌더 판정 금지, flaky 방지). 브라우저 통합 검증은 선택 항목으로 분리 |
| AC-8 | 이벤트 손실 없는 저장 순서 | 문제 시작 직후 0.5초 뒤 신규 접속 | 신규 접속자가 `question_started`를 못 받았어도 `state_snapshot`으로 현재 문제를 복원 |
| AC-9 | 배포 체크리스트 자동 판정 | `wss://` 여부, ASGI 서버 프로세스(daphne/uvicorn) 확인, Channel Layer 백엔드==Redis 확인 | 3개 모두 참이어야 배포 PASS |

## E-6. 완료 판정 (Definition of Done)

다음이 모두 참일 때만 "구현 완료"다. 사람의 판단이 개입할 여지가 없도록 각 항목은 코드·명령·쿼리로 확인한다.

1. AC-1 ~ AC-9 전수 통과 (자동 테스트 + 배포 게이트).
2. `SELECT student_id, question_id, COUNT(*) FROM submission GROUP BY 1,2 HAVING COUNT(*)>1` → **0행**.
3. 배포 환경에서 개발자도구 Network → WS 연결 상태코드 **101** 확인.
4. H1~H4 전 엔드포인트가 계약 표의 성공/실패 응답 형태를 그대로 반환.
5. 어떤 화면에도 "남은 초"를 서버가 직접 보내는 코드가 없고, 전부 `ends_at` 차감 방식.

## E-7. 브라우저 카운트다운 정정 (20장 코드 대체, 부록 우선)

20장 예시는 로컬 시계(`new Date()`)를 그대로 써서 AC-7(시계 5초 차이 환경)을 통과하지 못한다. 아래처럼 `server_time` 오프셋을 보정해야 한다.

```javascript
let endsAt = null;
let serverOffset = 0; // 서버 시계 - 로컬 시계

ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.server_time) {
    serverOffset = new Date(msg.server_time) - Date.now(); // ★ 수신 때마다 보정
  }
  if (msg.type === "question_started" || msg.type === "state_snapshot") {
    endsAt = new Date(msg.ends_at);
    render(msg);
  }
};

// ★ AC-7 단위 테스트 대상 순수 함수 (이 이름 그대로 추출)
function calcLeft(endsAt, localNow, serverOffset) {
  return Math.max(0, Math.ceil((endsAt - (localNow + serverOffset)) / 1000));
}

setInterval(() => {
  if (!endsAt) return;
  const left = calcLeft(endsAt, Date.now(), serverOffset);
  document.querySelector("#timer").textContent = `${left}초`;
}, 200);
```

- AC-7 판정은 두 층으로 분리한다: ① 결정적 단위 테스트(필수) = 고정 클럭을 주입한 `calcLeft` 반환값 차이 **0초**. ② 선택적 브라우저 통합(참고) = 표시 잔여 시간 차이 1초 이하. DoD 판정에는 ①만 사용한다.


## E-8. 도메인 모델 정의 (필드·타입 확정)

앞의 코드가 참조하는 모든 필드는 여기서 정의한다. 에이전트는 추론하지 않고 이 정의를 그대로 쓴다.

```python
class Quiz(models.Model):
    PHASE_CHOICES = [("waiting","waiting"),("running","running"),
                     ("revealed","revealed"),("finished","finished")]
    phase = models.CharField(max_length=10, choices=PHASE_CHOICES, default="waiting")
    current_question = models.ForeignKey("Question", null=True, blank=True,
                                         on_delete=models.SET_NULL)
    started_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    answer_revealed = models.BooleanField(default=False)

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    number = models.PositiveIntegerField()          # 1-base 문제 번호
    text = models.TextField()
    choices = models.JSONField()                    # ["가","나","다","라"]
    answer = models.CharField(max_length=10)        # choices 중 하나
    duration_sec = models.PositiveIntegerField(default=30)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["quiz","number"],
                                               name="uniq_question_number_per_quiz")]

class Student(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="students")
    name = models.CharField(max_length=20)
    joined_at = models.DateTimeField(auto_now_add=True)
```

- `Submission.is_correct = models.BooleanField(null=True, default=None)` 추가: `None`=미채점, reveal 시 `choice == question.answer`로 1회 갱신.
- H6 reveal 채점 시점: 현재 문제의 `is_correct IS NULL` Submission만 일괄 갱신 후 leaderboard 집계 → 방송.
- H4 rankings와 `leaderboard_updated`는 동일한 집계 쿼리와 필드 세트(`rank,name,score,last_correct_at`)를 쓴다. 단, H4는 전체 순위, 이벤트는 상위 10명만 담는다.
