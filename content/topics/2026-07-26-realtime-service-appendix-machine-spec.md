---
title: "2026년 7월 26일(일) 부록 E — 에이전트 직접 적용용 기계 명세 (Machine-Applicable Spec)"
description: "사람이 읽지 않아도 AI 코딩 에이전트가 해석 없이 그대로 구현·검증할 수 있도록, 실시간 퀴즈 서비스의 설계 결정을 계약·정본 코드·테스트 벡터로 확정한 기계 명세입니다."
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

> 이 문서는 [실시간 퀴즈, 투표, 채팅은 어떻게 만들어질까](2026-07-25-realtime-service-beginner-guide)의 부록입니다. 본문이 사람을 위한 비유 가이드라면, 이 부록은 같은 설계 결정을 AI 코딩 에이전트가 사람의 해석 없이 그대로 구현·검증할 수 있도록 계약(contract)·정본 코드·테스트 벡터로 확정한 기계 명세입니다. 본문과 충돌하면 이 부록이 우선합니다.

# 부록 E — 에이전트 직접 적용용 기계 명세 (Machine-Applicable Spec)

> 이 부록은 사람의 해석 없이 AI 코딩 에이전트가 그대로 구현·검증할 수 있도록, 본문의 설계 결정을 계약(contract)과 테스트 벡터로 확정한 것이다. 본문과 충돌하면 이 부록이 우선한다.
>
> 본문(1~5부)의 코드 블록은 개념 설명을 위한 축약 예시이고, 실행 가능한 정본 코드는 전부 이 부록에 있다. 본문 예시와 이 부록의 코드가 다르면 이 부록을 따라야 한다.

## E-1. HTTP 엔드포인트 계약

| # | 메서드/경로 | 요청 바디 | 성공 응답 | 실패 응답 |
|---|---|---|---|---|
| H1 | `POST /quiz/{quiz_id}/join` | `{name: string(1..20)}` | `201 {student_id: uuid, name}` | `404 {error:"quiz_not_found"}` |
| H2 | `GET /quiz/{quiz_id}/state?student_id={uuid}` | 없음 | `200 state_snapshot` (E-3 스키마) | `404 {error:"quiz_not_found"}` |
| H3 | `POST /quiz/{quiz_id}/answers` (바디 64KB 바이트 초과 시 WS와 동일하게 malformed→400. 미들웨어/뷰 진입부에서 Content-Length 검사 + 헤더 누락·chunked 전송의 경우 실제 수신 바이트 상한(64KB)으로 이중 강제) | `{student_id, question_id, choice, submission_id: uuid}` | 신규 저장 `201 {ok:true, submission_id}` · 같은 submission_id 멱등 재생 `200 {ok:true, submission_id, replayed:true}` | reason↔status 매핑: `malformed`→400 · `unknown_student`→404 · `unknown_question`→404 · `quiz_not_found`→404 · `invalid_choice`→422 · `closed`→422 · `duplicate`→409. 실패 바디는 항상 `{ok:false, reason: enum}` |
| H4 | `GET /quiz/{quiz_id}/results` | 없음 | `200 {rankings: [{rank, name, score, last_correct_at}], total_students: int}` | `404` · `423 {error:"quiz_not_finished"}` (종료 전 조회 시) |
| H5 | `POST /quiz/{quiz_id}/questions/{question_id}/start` | 없음 (교사) | `200 {ok:true, phase:"running", ends_at}` | `404` · `409 {error:"invalid_phase"}` (waiting/revealed가 아닐 때) |
| H6 | `POST /quiz/{quiz_id}/reveal` | 없음 (교사) | `200 {ok:true, phase:"revealed", answer, leaderboard}` | `404` · `409 {error:"invalid_phase"}` (running이 아닐 때) |
| H7 | `POST /quiz/{quiz_id}/finish` | 없음 (교사) | `200 {ok:true, phase:"finished", rankings}` | `404` · `409 {error:"invalid_phase"}` (이미 finished) |

- H5 성공 시: 서버가 `ends_at = now + question.duration_sec`을 DB에 먼저 저장한 뒤 Group에 `question_started` 방송(20장 저장→방송 순서 그대로).
- H6 성공 시: 현재 문제를 **채점한 뒤** `answer_revealed` + `leaderboard_updated`를 Group에 방송. 채점은 이 시점에 1회만 수행(트리거 확정).
- H7 성공 시: 아직 채점되지 않은(`is_correct IS NULL`) Submission을 먼저 일괄 채점한 뒤 최종 순위를 확정하고 `quiz_finished`(rankings 포함)를 Group에 방송. 미제출만 0점이고, 정답 제출은 finish에서도 인정된다. 이후 H4가 423 대신 200을 반환.
- H5~H7 교사 인가 최소 계약: `Authorization: Bearer <teacher_token>` 헤더 필수. 검증은 결정적으로: 요청 토큰이 환경 변수 `QUIZ_TEACHER_TOKEN` 값과 정확히 일치하면 교사, 아니면(누락·불일치·학생 자격) `403 {error:"forbidden"}`. 토큰의 발급·분배는 배포 환경이 결정하되, 검증 분기는 이 한 줄로 확정한다.

- 모든 시각 필드는 ISO 8601 UTC(`ends_at`, `server_time` 포함).
- 에러 바디는 항상 `{error: string}` 또는 `{ok:false, reason: enum}` 단일 형태.
- WebSocket `submit_answer`의 ACK도 H3과 동일한 reason enum을 쓴다(채널만 다르고 계약은 하나).

### WebSocket 학생 신원 바인딩 (확정)

- WS 주소는 `wss://{host}/ws/quiz/{quiz_id}/{student_id}/` 형태로, student_id를 **URL 경로**로 전달한다(쿠키/인증 헤더에 의존하지 않음). student_id는 **소문자 UUID**만 허용한다(라우팅 정규식이 소문자 hex만 매칭. 대문자 UUID는 매칭되지 않아 연결이 성립하지 않으므로 클라이언트는 반드시 소문자로 보내야 한다).
- Consumer는 `connect()`에서 `self.student_id = self.scope["url_route"]["kwargs"]["student_id"]`로 바인딩하고, 이 student_id가 해당 퀴즈에 join된 학생이 아니면 `accept()` 직후 `{type:"error", reason:"unknown_student"}`를 보내고 `close()`한다.
- 재연결 시에도 같은 URL로 접속하므로 `my_submission` 조회(AC-6)가 항상 성립한다.

## E-2. 서버 수신 검증 규칙 (submit_answer / H3 공통)

서버는 답안 제출을 받으면 아래 순서로 검증하고, 첫 실패 지점에서 즉시 거부한다.

```text
⓪ 필수 키 누락(question_id/choice/submission_id),
   비-JSON, 타입 불일치, 64KB(바이트 기준) 초과 페이로드
   → 자동 검증 전에 즉시 거부 {ok:false, reason:"malformed"}
   (⓪는 H3 HTTP 채널에도 동일 절차로 적용. 단 H3 바디의 student_id는 "어느 학생인가"의 참조일 뿐 호출자 인증이 아니므로, 프로토타입 이후 운영 배포 시에는 세션/토큰으로 호출자==학생 바인딩을 추가해야 한다(교사 토큰과 같은 자리의 문서화된 경계): 필수 키 누락·null·비-JSON·비-dict·타입 불일치·64KB 초과를 뷰 진입부에서 400으로 거부. WS 채널은 연결을 끊지 않고
    {type:"answer_saved", ok:false, reason:"malformed"} ACK로 응답. DB 미변경)
① student_id가 이 퀴즈에 join된 학생인가        → 아니면 {ok:false, reason:"unknown_student"}
② phase == "running"인가                          → 아니면 {ok:false, reason:"closed"} (정답 공개 후·종료 후 제출 거부)
③ question_id가 현재 진행 중 문제와 같은가        → 아니면 {ok:false, reason:"unknown_question"}
④ choice가 해당 문제의 보기 목록에 있는가        → 아니면 {ok:false, reason:"invalid_choice"}
④-b 서버 시각 now <= ends_at 인가                  → 아니면 {ok:false, reason:"closed"}
⑤ submission_id가 기존 저장과 같은가 → **같은 submission_id면 ok:true 멱등 재생**(ACK 유실 재송 대응). 다른 submission_id인데 (student_id, question_id)가 이미 있으면 {ok:false, reason:"duplicate"} (기존 저장 유지)
⑥ 전부 통과 시에만 DB 저장 후                    → {ok:true, submission_id}

(별도) type이 sync_state/submit_answer 어느 쪽도 아닌 유효 dict는 저장 없이
{type:"error", reason:"unknown_type"}로 응답한다.
```

- 학생 신원의 출처는 채널마다 하나다: WS는 URL 바인딩된 `self.student_id`만 신뢰하고 페이로드의 student_id는 무시한다(스푸핑 차단). HTTP(H3)는 바인딩이 없으므로 바디의 student_id를 쓴다.
- ④의 기준 시각은 반드시 서버 시계다. 클라이언트가 보낸 시각은 검증에 쓰지 않는다.
- ⑤는 사전 조회 없이 DB 유니크 제약 단일 방어로 원자적으로 보장한다(조회-삽입 경합이 있으므로 애플리케이션 사전 판단은 오히려 빈틈).

## E-3. 상태 스냅샷 스키마와 헬퍼 완성 코드

### state_snapshot 스키마 (고정 키 집합)

```json
{
  "type": "state_snapshot",
  "quiz_id": 123,
  "phase": "waiting | running | revealed | finished",
  "current_question": {"question_id": 45, "number": 3, "text": "...", "choices": ["가","나","다","라"]},
  "ends_at": "2026-07-25T10:15:30Z",
  "answer_revealed": false,
  "revealed_answer": null,
  "leaderboard": null,
  "my_submission": {"question_id": 45, "choice": "나"},
  "server_time": "2026-07-25T10:15:12Z"
}
```

- `phase == "waiting" | "finished"`이면 `current_question`과 `ends_at`은 `null`.
- `revealed_answer`는 phase가 `revealed`일 때만, `leaderboard`는 `revealed`/`finished`일 때만 값을 갖는다(그 외 `null`). finished에서는 `current_question`이 null이므로 문맥 없는 정답을 싣지 않는다. 이 둘이 있어야 revealed/finished 국면에 재접속한 학생이 놓친 방송 내용을 스냅샷으로 복원할 수 있다(AC-8).
- `my_submission`은 현재 문제에 대한 내 제출이 없으면 `null`.
- `server_time`은 클라이언트 시계 보정용이다(종료시각 계산의 기준 오프셋).

### 헬퍼 완성 (Django Channels)

```python
def is_joined_student(quiz_id, student_id):
    return Student.objects.filter(pk=student_id, quiz_id=quiz_id).exists()

def compute_leaderboard(quiz):
    """E-4 정본: 총점 내림차순 → 마지막 정답 created_at 빠른 순(null은 뒤) → student_id 오름차순.
    Student 기준으로 집계하므로 무제출 학생도 score=0, last_correct_at=null로 포함된다."""
    rows = (
        Student.objects
        .filter(quiz_id=quiz.pk)
        .annotate(
            score=Sum(Case(When(submission__is_correct=True, then=100), default=0,
                           output_field=IntegerField())),
            last_correct_at=Max("submission__created_at", filter=Q(submission__is_correct=True)),
        )
        .order_by("-score", F("last_correct_at").asc(nulls_last=True), "pk")
    )
    return [{"rank": i + 1, "name": r.name, "score": r.score,
             "last_correct_at": r.last_correct_at.isoformat() if r.last_correct_at else None}
            for i, r in enumerate(rows)]

def quiz_results(quiz):
    """H4 GET /results 정본: 전체 순위 + 총 학생 수."""
    return {
        "rankings": compute_leaderboard(quiz),  # H4는 상위 10명이 아니라 전체
        "total_students": Student.objects.filter(quiz_id=quiz.pk).count(),
    }

def load_state_for(quiz_id, student_id):
    """state_snapshot 생성의 SSOT. WS(load_state)와 H2 GET /state가 공유."""
    return _load_state_impl(quiz_id, student_id)

def _load_state_impl(quiz_id, student_id):
    quiz = Quiz.objects.get(pk=quiz_id)
    if quiz.phase in ("waiting", "finished"):
        current, ends_at = None, None
    else:
        q = quiz.current_question
        current = {"question_id": q.pk, "number": q.number, "text": q.text, "choices": q.choices}
        ends_at = quiz.ends_at.isoformat()
    my_sub = None
    if quiz.phase in ("running", "revealed") and student_id and quiz.current_question_id:
        sub = Submission.objects.filter(
            student_id=student_id,
            question_id=quiz.current_question_id,
        ).first()
        if sub:
            my_sub = {"question_id": sub.question_id, "choice": sub.choice}
    revealed_answer, leaderboard = None, None
    if quiz.phase == "revealed" and quiz.current_question_id:
        revealed_answer = quiz.current_question.answer  # 정답은 revealed에서만 노출
    if quiz.phase in ("revealed", "finished"):
        leaderboard = compute_leaderboard(quiz)[:10]  # 두 국면 모두 스냅샷 복원 (AC-8)
    return {
        "type": "state_snapshot",
        "quiz_id": quiz.pk,
        "phase": quiz.phase,
        "current_question": current,
        "ends_at": ends_at,
        "answer_revealed": quiz.answer_revealed,
        "revealed_answer": revealed_answer,
        "leaderboard": leaderboard,
        "my_submission": my_sub,
        "server_time": timezone.now().isoformat(),
    }

# --- 저장 검증의 단일 진실원(SSOT): 동기 공유 함수 ---
# WS Consumer와 H3 HTTP 뷰가 모두 이 함수 하나를 호출한다 (부록 E 서문: 추론 금지).
import json
import os
from datetime import timedelta
from django.db import IntegrityError
from django.db.models import Sum, Max, Count, Case, When, IntegerField, F, Q
from django.utils import timezone

def save_answer_sync(quiz_id, student_id, data):
    # 락 없음: 읽기 검증 후 create. (student, question) 유니크 제약이
    # 동시 제출 경쟁을 원자적으로 차단 (IntegrityError → duplicate).
    # Quiz 행 광역 락(select_for_update)은 28명 동시 제출을 직렬화하므로 쓰지 않는다.
    try:
        quiz = Quiz.objects.get(pk=quiz_id)
    except Quiz.DoesNotExist:
        return False, "quiz_not_found", False
    # E-2 검증 순서와 1:1 대응 (서버 시각 기준)
    if not Student.objects.filter(pk=student_id, quiz_id=quiz_id).exists():
        return False, "unknown_student", False
    if quiz.phase != "running" or quiz.current_question_id is None \
            or data["question_id"] != quiz.current_question_id:
        # waiting/revealed/finished에서는 진행 중 문제가 없다. revealed(정답 공개 후) 제출도 거부
        if quiz.phase != "running":
            return False, "closed", False
        return False, "unknown_question", False
    if data["choice"] not in quiz.current_question.choices:
        return False, "invalid_choice", False
    if timezone.now() > quiz.ends_at:
        return False, "closed", False
    try:
        Submission.objects.create(
            submission_id=data["submission_id"],
            student_id=student_id,
            question_id=data["question_id"],
            choice=data["choice"],
        )
        return True, None, False
    except IntegrityError:
        # 충돌 출처를 구분한다: (a) (submission_id,student) unique vs (b) (student,question) unique.
        existing = Submission.objects.filter(
            submission_id=data["submission_id"], student_id=student_id,
        ).first()
        if existing:
            # 멱등 재생은 "완전히 같은 재전송"일 때만. 내용이 다륩면 중복 공격이다.
            if (str(existing.question_id) == str(data["question_id"])
                    and existing.choice == data["choice"]):
                return True, None, True   # ACK 유실 후 재송 → 같은 결과 재생 (replayed)
            return False, "duplicate", False  # 같은 키로 다른 답을 싣고 온 변조 재송
        return False, "duplicate", False  # (b) 다른 submission_id로 같은 (student,question) 재제출


# --- 완결형 QuizConsumer 정본 (본문 20장 전체 대체, 부록 우선) ---
# 이 클래스 하나가 connect~receive~방송 핸들러~헬퍼의 전부다. 다른 조각과 병합할 필요가 없다.
class QuizConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.quiz_id = self.scope["url_route"]["kwargs"]["quiz_id"]
        self.student_id = self.scope["url_route"]["kwargs"]["student_id"]  # URL 신원 바인딩 (E-1)
        self.group_name = f"quiz_{self.quiz_id}"

        await self.accept()
        # 미join 학생은 방송 목록에 넣기 전에 걸러낸다 (스푸핑 차단)
        if not await database_sync_to_async(is_joined_student)(self.quiz_id, self.student_id):
            await self.send(text_data=json.dumps({"type": "error", "reason": "unknown_student"}))
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        # 연결하자마자 칠판을 보여 준다 (재연결 시에도 자동 복원)
        await self.send_state_snapshot()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        # ⓪ malformed 게이트: 크기(바이트) → JSON → 구조
        if len(text_data.encode("utf-8")) > 65536:
            await self.send(text_data=json.dumps({
                "type": "answer_saved", "ok": False, "reason": "malformed",
            }))
            return
        try:
            data = json.loads(text_data)
        except (json.JSONDecodeError, TypeError):
            data = None
        if not isinstance(data, dict) or "type" not in data:
            await self.send(text_data=json.dumps({
                "type": "answer_saved", "ok": False, "reason": "malformed",
            }))
            return

        if data.get("type") == "sync_state":
            await self.send_state_snapshot()

        elif data.get("type") == "submit_answer":
            required = {"question_id", "choice", "submission_id"}
            if not required <= data.keys() or any(data.get(k) is None for k in required):
                await self.send(text_data=json.dumps({
                    "type": "answer_saved", "ok": False, "reason": "malformed",
                }))
                return
            try:
                uuid.UUID(str(data["submission_id"]))  # 비-UUID submission_id는 malformed
            except (ValueError, AttributeError):
                await self.send(text_data=json.dumps({
                    "type": "answer_saved", "ok": False, "reason": "malformed",
                }))
                return
            # SSOT 공유 함수를 비동기 래핑해 호출. 신원은 URL 바인딩만 신뢰
            ok, reason, replayed = await database_sync_to_async(save_answer_sync)(
                self.quiz_id, self.student_id, data,
            )
            await self.send(text_data=json.dumps({
                "type": "answer_saved",
                "submission_id": data["submission_id"],
                "ok": ok,
                "reason": reason,
                "replayed": replayed,  # 멱등 재생이면 True (AC-2b)
            }))

        else:
            await self.send(text_data=json.dumps({
                "type": "error", "reason": "unknown_type",
            }))

    # --- Group 방송 핸들러 (type 이름 = 메서드 이름) ---
    async def question_started(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    async def answer_revealed(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    async def leaderboard_updated(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    async def quiz_finished(self, event):
        await self.send(text_data=json.dumps(event["payload"]))

    # --- 헬퍼 ---
    async def send_state_snapshot(self):
        state = await database_sync_to_async(load_state_for)(self.quiz_id, self.student_id)
        await self.send(text_data=json.dumps(state))  # dict에 type:"state_snapshot" 포함
```

- ACK 계약: 정본 함수 `save_answer_sync`는 `(ok, reason, replayed)`를 반환한다(본문 20장의 `self.save_answer` 언급은 이 함수의 호출로 읽는다. 별도 메서드를 만들지 않는다). 성공 ACK는 `{type:"answer_saved", ok:true, submission_id, replayed}` - WS/HTTP 두 채널 모두 replayed 플래그를 포함해 페이로드를 통일한다(멱등 재생이면 true, 신규 저장이면 false). 실패 시 `{type:"answer_saved", ok:false, reason}`.

### Submission 모델 확정 (20장 모델에 필드 추가, 부록 우선)


```python
class Submission(models.Model):
    submission_id = models.UUIDField()  # 클라이언트 생성 멱등 키. 학생당 유일(아래 복합 유니크)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    choice = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)  # 서버 수신 시각. E-4 tie-break와 H4 last_correct_at의 기준
    is_correct = models.BooleanField(null=True, default=None)  # None=미채점. reveal 시 1회 기록 (E-4)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student", "question"],
                name="uniq_submission_per_question",
            ),
            models.UniqueConstraint(
                fields=["submission_id", "student"],
                name="uniq_submission_id_per_student",  # 학생 범위 멱등 키. 타 학생과의 네임스페이스 충돌은 구조적으로 불가능
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
| revealed | H7 finish | finished | `answer_revealed`를 False로 리셋한 뒤 최종 순위 확정 → `quiz_finished` 방송 |
| running | H7 finish | finished | `answer_revealed`를 False로 리셋 + 미reveal 문제의 `is_correct IS NULL` Submission을 finish 시점에 일괄 채점(choice==answer)한 뒤 순위 확정 → `quiz_finished` 방송 |

- 위 표에 없는 전이는 전부 `409 {error:"invalid_phase"}`.
- `answer_revealed` 플래그는 phase=="revealed"와 동치. finished 도달 경로는 H7뿐이다.

CSRF 전략 확정: H1~H7 뷰는 브라우저 fetch·모바일 클라이언트가 직접 호출하는 JSON API이므로 전부 `@csrf_exempt`를 적용한다(세션 쿠키 인증을 쓰지 않고, 학생은 URL/바디 신원, 교사는 Bearer 토큰으로 인가하므로 CSRF 방어 대상이 아니다).

모듈 배치 확정: 공유 헬퍼(`save_answer_sync`, `load_state_for`, `compute_leaderboard`, `quiz_results`, `is_joined_student`)는 `quiz/services.py`에 둔다. 뷰(H1~H7)는 `quiz/views.py`, Consumer는 `quiz/consumers.py`, 모델은 `quiz/models.py`에 두고 각각 `from .services import ...`로 가져온다.

### 배선 정본 (asgi.py + urls.py)

```python
# config/asgi.py — settings.ASGI_APPLICATION = "config.asgi.application" 과 일치
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django_asgi_app = get_asgi_application()

from quiz.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
})
```

```python
# quiz/urls.py — E-1 계약 표 H1~H7과 1:1 매핑
from django.urls import path
from . import views

urlpatterns = [
    path("quiz/<int:quiz_id>/join", views.join_quiz),                          # H1
    path("quiz/<int:quiz_id>/state", views.quiz_state_view),                   # H2
    path("quiz/<int:quiz_id>/answers", views.submit_answer_http),              # H3
    path("quiz/<int:quiz_id>/results", views.quiz_results_view),               # H4
    path("quiz/<int:quiz_id>/questions/<int:question_id>/start",
         views.start_question),                                                # H5
    path("quiz/<int:quiz_id>/reveal", views.reveal_answer),                    # H6
    path("quiz/<int:quiz_id>/finish", views.finish_quiz),                      # H7
]
```

### H1/H2 정본 뷰

```python
@csrf_exempt
def join_quiz(request, quiz_id):                            # H1
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        data = None
    if not isinstance(data, dict) or not isinstance(data.get("name"), str) \
            or not (1 <= len(data["name"]) <= 20):
        return JsonResponse({"error": "malformed"}, status=400)
    quiz, err = _get_quiz_or_404(quiz_id)
    if err:
        return err
    student = Student.objects.create(quiz=quiz, name=data["name"])
    return JsonResponse({"student_id": str(student.pk), "name": student.name}, status=201)

def quiz_state_view(request, quiz_id):                      # H2
    quiz, err = _get_quiz_or_404(quiz_id)
    if err:
        return err
    student_id = request.GET.get("student_id")
    if student_id:
        try:
            student_id = str(uuid.UUID(student_id))  # 잘못된 형식은 익명(스냅샷의 my_submission=null)으로 처리
        except ValueError:
            student_id = None
    snapshot = load_state_for(quiz.pk, student_id)
    snapshot.pop("type", None)
    return JsonResponse(snapshot)
```

### H3 HTTP 채널 정본 뷰 (WS와 검증 공유)

```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

def _get_quiz_or_404(quiz_id):
    """모든 뷰의 404를 계약대로 JSON {error:"quiz_not_found"}로 통일."""
    try:
        return Quiz.objects.get(pk=quiz_id), None
    except Quiz.DoesNotExist:
        return None, JsonResponse({"error": "quiz_not_found"}, status=404)


@csrf_exempt
def submit_answer_http(request, quiz_id):
    # ⓪ malformed: 크기(바이트) → JSON → 구조
    cl = request.META.get("CONTENT_LENGTH")
    if (cl and int(cl) > 65536) or len(request.body) > 65536:
        return JsonResponse({"ok": False, "reason": "malformed"}, status=400)
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, TypeError):
        data = None
    required = {"student_id", "question_id", "choice", "submission_id"}
    if not isinstance(data, dict) or not required <= data.keys() \
            or any(data.get(k) is None for k in required):
        return JsonResponse({"ok": False, "reason": "malformed"}, status=400)
    try:
        uuid.UUID(str(data["submission_id"]))
        uuid.UUID(str(data["student_id"]))
    except (ValueError, AttributeError):
        return JsonResponse({"ok": False, "reason": "malformed"}, status=400)

    ok, reason, replayed = save_answer_sync(quiz_id, data["student_id"], data)
    if ok:
        return JsonResponse({"ok": True, "submission_id": data["submission_id"],
                             "replayed": replayed}, status=200 if replayed else 201)
    status_map = {"quiz_not_found": 404, "unknown_student": 404, "unknown_question": 404,
                  "invalid_choice": 422, "closed": 422, "duplicate": 409}
    return JsonResponse({"ok": False, "reason": reason}, status=status_map[reason])

```

- `save_answer_sync(quiz_id, student_id, data)`는 E-3 `save_answer`의 본문을 Consumer 비의존으로 추출한 공유 함수다. WS Consumer도 `save_answer_sync(self.quiz_id, self.student_id, data)`를 호출해 두 채널이 하나의 검증 경로를 공유한다.

### 교사 액션 정본 (H5~H7) + 결과 뷰 정본 (H4)

```python
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def _check_teacher(request):
    token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    return token and token == os.environ.get("QUIZ_TEACHER_TOKEN")

def _broadcast(quiz_id, event_type, payload):
    async_to_sync(get_channel_layer().group_send)(
        f"quiz_{quiz_id}", {"type": event_type, "payload": payload},
    )

@csrf_exempt
def start_question(request, quiz_id, question_id):          # H5
    if not _check_teacher(request):
        return JsonResponse({"error": "forbidden"}, status=403)
    try:
        quiz = Quiz.objects.get(pk=quiz_id)
        question = Question.objects.get(pk=question_id, quiz=quiz)
    except (Quiz.DoesNotExist, Question.DoesNotExist):
        return JsonResponse({"error": "quiz_not_found"}, status=404)
    if quiz.phase not in ("waiting", "revealed"):
        return JsonResponse({"error": "invalid_phase"}, status=409)
    # ① 저장 먼저 (칠판), ② 방송 나중 (총소리)
    quiz.current_question = question
    quiz.phase = "running"
    quiz.started_at = timezone.now()
    quiz.ends_at = quiz.started_at + timedelta(seconds=question.duration_sec)
    quiz.answer_revealed = False
    quiz.save()
    _broadcast(quiz.pk, "question_started", {
        "type": "question_started", "number": question.number,
        "text": question.text, "choices": question.choices,
        "ends_at": quiz.ends_at.isoformat(),
        "server_time": timezone.now().isoformat(),
    })
    return JsonResponse({"ok": True, "phase": "running",
                         "ends_at": quiz.ends_at.isoformat()})

@csrf_exempt
def reveal_answer(request, quiz_id):                        # H6
    if not _check_teacher(request):
        return JsonResponse({"error": "forbidden"}, status=403)
    quiz, err = _get_quiz_or_404(quiz_id)
    if err:
        return err
    if quiz.phase != "running":
        return JsonResponse({"error": "invalid_phase"}, status=409)
    # 채점은 이 시점에 1회만
    for sub in Submission.objects.filter(question=quiz.current_question, is_correct__isnull=True):
        sub.is_correct = (sub.choice == quiz.current_question.answer)
        sub.save(update_fields=["is_correct"])
    quiz.phase = "revealed"
    quiz.answer_revealed = True
    quiz.save()
    _broadcast(quiz.pk, "answer_revealed", {
        "type": "answer_revealed", "answer": quiz.current_question.answer,
    })
    lb = compute_leaderboard(quiz)[:10]
    _broadcast(quiz.pk, "leaderboard_updated", {
        "type": "leaderboard_updated", "leaderboard": lb,
    })
    return JsonResponse({"ok": True, "phase": "revealed",
                         "answer": quiz.current_question.answer, "leaderboard": lb})

@csrf_exempt
def finish_quiz(request, quiz_id):                          # H7
    if not _check_teacher(request):
        return JsonResponse({"error": "forbidden"}, status=403)
    quiz, err = _get_quiz_or_404(quiz_id)
    if err:
        return err
    if quiz.phase == "finished":
        return JsonResponse({"error": "invalid_phase"}, status=409)
    # 미채점 Submission 일괄 채점 (running에서 바로 종료필도 정답 인정)
    for sub in Submission.objects.filter(question__quiz=quiz, is_correct__isnull=True):
        sub.is_correct = (sub.choice == sub.question.answer)
        sub.save(update_fields=["is_correct"])
    quiz.phase = "finished"
    quiz.answer_revealed = False  # E-3½ 리셋 규칙
    quiz.save()
    result = quiz_results(quiz)
    _broadcast(quiz.pk, "quiz_finished", {"type": "quiz_finished", **result})
    return JsonResponse({"ok": True, "phase": "finished", **result})

def quiz_results_view(request, quiz_id):                    # H4
    quiz, err = _get_quiz_or_404(quiz_id)
    if err:
        return err
    if quiz.phase != "finished":
        return JsonResponse({"error": "quiz_not_finished"}, status=423)
    return JsonResponse(quiz_results(quiz))
```

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

기대 리더보드 순서: **B → A → D → C** (전제: 문제1이 문제2보다 먼저 진행되어, 문제1 정답의 created_at이 항상 문제2 정답보다 이르다)
- A·B 동점 200: B의 마지막 정답 제출(5초)이 A(10초)보다 빠름 → B 우선.
- C·D 동점 100: D의 마지막 정답은 문제1, C의 마지막 정답은 문제2. D가 더 빠름 → D 우선.
- 전 항목 동점이면 student_id 오름차순으로 최종 결정(결정적).

## E-5. Acceptance 테스트 벡터 (자동 PASS/FAIL)

각 항목은 입력 이벤트 시퀀스와 기대 결과의 쌍이다. 전부 통과해야 구현 완료로 판정한다.

| # | 시나리오 | 입력 시퀀스 | 기대 결과 (assert) |
|---|---|---|---|
| AC-1 | 접속 즉시 칠판 | 문제3 진행 중 WS 연결 | 첫 메시지가 `state_snapshot`이고 `current_question.number==3`, `ends_at`이 서버 저장값과 일치 |
| AC-2 | 중복 제출 3중 방어 | 같은 `(student,question)`, **서로 다른 submission_id 3개**로 submit (WS 2회 + H3 1회, 동시 발송) | DB에 Submission **정확히 1건**. `ok:true` ACK **정확히 1건**, `duplicate` **정확히 2건** (순서 무관, 결정적) |
| AC-2b | 멱등 재생 | 첫 제출 ACK를 못 받은 클라이언트가 **같은 submission_id**로 2회 재전송 | 3회 응답 모두 `ok:true`이고 **재전송 2회는 `replayed:true`, 최초 1회는 `replayed:false`**, DB에는 **정확히 1건** (AC-2와 구분: 멱등 재생은 중복이 아니다) |
| AC-3 | 종료 후 제출 | `ends_at + 1초` 이후 submit | `ok:false, reason:"closed"`, DB 저장 0건 |
| AC-3b | 공개 후 제출 거부 | reveal 호출 직후 ends_at 이전에 submit | `ok:false, reason:"closed"`, DB 저장 0건 |
| AC-4 | 잘못된 입력 | 보기에 없는 choice / 다른 question_id / 미등록 student | 각각 `invalid_choice` / `unknown_question` / `unknown_student`로 거부, DB 변화 없음 |
| AC-4b | malformed 입력 | 필수 키 누락 / 키 값 null / 비-JSON / 비-dict JSON(예: `"123"`) / `type` 키 없는 dict / 타입 불일치 / 64KB(바이트 기준) 초과 페이로드 | 전부 `malformed`로 거부(HTTP 400 또는 WS ACK), DB 변화 없음, 서버 예외 없음(연결 유지) |
| AC-5 | 동시 브로드캐스트 | 학생 2명 접속 중 교사가 문제 시작 | 두 클라이언트 모두 `question_started` 수신, 페이로드의 `ends_at`이 DB 저장값과 동일 |
| AC-6 | 재연결 복원 | 답안 제출 완료 → 연결 끊기 → 재연결 | 재연결 후 첫 `state_snapshot.my_submission`이 직전 제출과 일치. 추가 제출 시 `duplicate` |
| AC-7 | 타이머 수렴 (결정적 단위 테스트) | 순수 함수 `calcLeft(endsAt, localNow, serverOffset)`에 고정 클럭 주입: localNow가 5초 어긋난 케이스 2조 | 두 케이스의 반환값 차이 **0초** (DOM 렌더 판정 금지, flaky 방지). 브라우저 통합 검증은 선택 항목으로 분리 |
| AC-7b | server_time 오프셋 배선 | `question_started`(server_time=T0) 수신 후 calcLeft를 고정 클럭으로 호출 | 메시지의 server_time이 serverOffset에 반영되어, 로컬 시계가 ±5초 어긋나도 계산값이 서버 기준과 0초 차이 |
| AC-8 | 이벤트 손실 없는 저장 순서 | 문제 시작 직후 0.5초 뒤 신규 접속 | 신규 접속자가 `question_started`를 못 받았어도 `state_snapshot`으로 현재 문제를 복원 |
| AC-9 | 배포 체크리스트 자동 판정 | `wss://` 여부, ASGI 서버 프로세스(daphne/uvicorn) 확인, Channel Layer 백엔드==Redis 확인 | 3개 모두 참이어야 배포 PASS |
| AC-10 | 교사 인가 | H5~H7을 (a) 토큰 누락 (b) 무효 토큰 (c) 학생 자격으로 각각 호출 | 3케이스 모두 `403 {error:"forbidden"}` 반환, phase 미변경, 방송 미발생. 유효 교사 토큰으로는 200 |

## E-6. 완료 판정 (Definition of Done)

다음이 모두 참일 때만 "구현 완료"다. 사람의 판단이 개입할 여지가 없도록 각 항목은 코드·명령·쿼리로 확인한다.

1. AC-1 ~ AC-10 및 AC-4b 전수 통과 (자동 테스트 + 배포 게이트).
2. 중복 저장 부재를 ORM으로 확인: `Submission.objects.values("student_id","question_id").annotate(c=Count("id")).filter(c__gt=1)` → **0행** (`from django.db.models import Count`).
3. 배포 환경에서 개발자도구 Network → WS 연결 상태코드 **101** 확인.
4. H1~H7 전 엔드포인트가 계약 표의 성공/실패(403/404/409/422/423 포함) 응답 형태를 그대로 반환.
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
import uuid

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
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # H1/H2/WS 계약의 uuid와 일치
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="students")
    name = models.CharField(max_length=20)
    joined_at = models.DateTimeField(auto_now_add=True)

```

- `Submission.is_correct`는 E-3 모델 블록에 정의된 그 필드다 (SSOT). reveal 시 `choice == question.answer`로 1회 갱신한다.
- H6 reveal 채점 시점: 현재 문제의 `is_correct IS NULL` Submission만 일괄 갱신 후 leaderboard 집계 → 방송.
- H4 rankings와 `leaderboard_updated`는 동일한 집계 쿼리와 필드 세트(`rank,name,score,last_correct_at`)를 쓴다. 단, H4는 전체 순위, 이벤트는 상위 10명만 담는다.
