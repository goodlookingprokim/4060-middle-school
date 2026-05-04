---
title: "{{category_title}}"
description: "{{category_description}}"
publish: true
cssclasses:
  - reference
---

<div class="hub-hero">
  <p class="kicker">{{CATEGORY_LABEL}}</p>
  <p><strong>{{one_sentence_value_proposition}}</strong></p>
  <p>{{category_context_for_readers}}</p>
</div>

# {{category_title}}

{{category_intro}}

## 핵심 축

<div class="hub-grid">
  <div class="hub-card">
    <span class="hub-status">{{axis_label_1}}</span>
    <strong>{{axis_title_1}}</strong>
    <span>{{axis_description_1}}</span>
  </div>
  <div class="hub-card">
    <span class="hub-status">{{axis_label_2}}</span>
    <strong>{{axis_title_2}}</strong>
    <span>{{axis_description_2}}</span>
  </div>
  <div class="hub-card">
    <span class="hub-status">{{axis_label_3}}</span>
    <strong>{{axis_title_3}}</strong>
    <span>{{axis_description_3}}</span>
  </div>
</div>

## 대표 읽기 경로

<!-- 실제 발행 글이나 이미 존재하는 관련 허브가 있을 때만 유지합니다. 없으면 이 섹션 전체를 제거하고 아래 빈 상태를 유지합니다. -->

<div class="reading-path">
  <a href="{{relative_post_link_1}}" class="internal">
    <strong>{{post_title_1}}</strong>
    <span>{{post_description_1}}</span>
  </a>
  <a href="{{relative_post_link_2}}" class="internal">
    <strong>{{post_title_2}}</strong>
    <span>{{post_description_2}}</span>
  </a>
  <a href="{{relative_post_link_3}}" class="internal">
    <strong>{{post_title_3}}</strong>
    <span>{{post_description_3}}</span>
  </a>
</div>

## 준비 중인 시리즈

<!-- 발행 전 주제는 링크 없는 카드로 둡니다. 실제 글이 발행된 뒤에만 <a class="hub-card">로 바꿉니다. -->

<div class="hub-grid">
  <div class="hub-card is-pending">
    <span class="hub-status">준비 중</span>
    <strong>{{upcoming_title_1}}</strong>
    <span>{{upcoming_description_1}}</span>
  </div>
  <div class="hub-card is-pending">
    <span class="hub-status">준비 중</span>
    <strong>{{upcoming_title_2}}</strong>
    <span>{{upcoming_description_2}}</span>
  </div>
  <div class="hub-card is-pending">
    <span class="hub-status">준비 중</span>
    <strong>{{upcoming_title_3}}</strong>
    <span>{{upcoming_description_3}}</span>
  </div>
</div>

<div class="empty-state">
  <p class="kicker">NO POSTS YET</p>
  <p><strong>{{empty_state_title}}</strong></p>
  <p>{{empty_state_description}}</p>
</div>

<div class="cta-panel">
  <p><strong>{{cta_title}}</strong></p>
  <p>{{cta_description}}</p>
</div>
