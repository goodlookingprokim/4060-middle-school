---
title: "2026년 6월 28일(일) Hermes 구조와 OpenClaw 운영 구조는 어떻게 나눠 잡으면 좋을까"
description: "Hermes에서는 어떤 폴더와 파일부터 잡아야 하고, OpenClaw에서는 어떤 운영 규칙과 fallback 흐름부터 정리하면 좋은지 4060 회원분들이 바로 따라가기 쉽게 정리한 2편 초안입니다."
tags:
  - middle-school
  - hermes
  - openclaw
  - search
  - ai-workflow
  - platform-tools
created: "2026-06-28"
modified: "2026-06-28"
publish: false
draft: true
cssclasses:
  - field-note
---

# 2026년 6월 28일(일) Hermes 구조와 OpenClaw 운영 구조는 어떻게 나눠 잡으면 좋을까

지난 글에서는 왜 검색 기능을 하나의 큰 검색기로 만들기보다, 플랫폼별 도구를 서랍처럼 나눠 붙이는 방식이 더 현실적인지 살펴봤습니다.

이번 글은 그다음 단계입니다.

- Hermes에서는 실제로 어떤 파일과 폴더부터 잡으면 좋은지
- OpenClaw에서는 어떤 운영 규칙과 fallback 흐름부터 정리하면 좋은지

이 둘을 나눠서 보겠습니다.

## 먼저 결론

- Hermes는 구조를 직접 만드는 쪽이라 `config`, `registry`, `invoker`, `platform adapters`가 먼저 보여야 합니다.
- OpenClaw는 이미 있는 도구 흐름을 정리하는 쪽이라 `우선순위`, `fallback`, `도구 선택 규칙`이 먼저 잡혀야 합니다.
- 같은 검색 시스템 이야기라도, Hermes는 폴더 구조 중심으로, OpenClaw는 운영 규칙 중심으로 접근하는 편이 덜 헷갈립니다.

## 1. Hermes 쪽은 왜 폴더 구조부터 보는 게 좋을까

Hermes에서는 보통 직접 손으로 구조를 만드는 일이 먼저 생깁니다.

예를 들면 이런 질문이 나옵니다.

- 플랫폼 목록은 어디에 적어둘까
- GitHub 호출은 어느 파일에서 분기할까
- YouTube 쪽은 어떤 adapter로 뺄까
- 새 플랫폼 추가용 스크립트는 어디에 둘까

즉, Hermes에서는 “무슨 도구를 쓰느냐”만큼 “어디에 둘 것이냐”도 중요합니다.

## 2. OpenClaw 쪽은 왜 운영 규칙부터 보는 게 좋을까

OpenClaw에서는 이미 있는 도구와 세션 흐름이 있는 경우가 많습니다.

그래서 아래 같은 질문이 더 먼저 나옵니다.

- 검색을 시킬 때 어떤 도구를 먼저 시도할까
- 실패하면 두 번째로 무엇을 시도할까
- 어떤 플랫폼은 그냥 기존 웹 도구로 충분한가
- 새 도구를 붙일 필요가 있는 플랫폼만 따로 분리할까

즉, OpenClaw에서는 “어디에 둘까”보다 “어떤 순서로 쓰게 할까”가 더 중요해집니다.

## 3. 다음에 이어서 넣을 내용

이 글에서는 다음 내용을 이어서 정리할 예정입니다.

- Hermes 기준 최소형 폴더 구조 예시
- `platform_registry`, `invoker`, `platform adapters` 역할 구분
- OpenClaw 기준 검색 우선순위 표
- fallback 규칙을 문서에 적는 방법
- 회원분들이 처음 따라 할 때 최소 MVP로 어디까지 하면 되는지

## 참고

이 글은 앞선 1편  
`Hermes에 검색 기능을 붙일 때 왜 플랫폼별 서랍부터 나눠야 할까`  
에서 이어지는 2편 초안입니다.
