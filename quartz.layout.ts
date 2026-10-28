import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.TechMasthead({
      eyebrow: "4060 MIDDLE SCHOOL",
      title: "4060미들스쿨",
      subtitle: "중년의 배움, 삶의 변화, 함께 나눌 질문을 차분하게 기록하는 모임 블로그",
      links: [
        { label: "모임 소개", href: "meeting-intro" },
        { label: "이번 주제", href: "topics" },
        { label: "모임 후 정리", href: "after-notes" },
        { label: "자료 갤러리", href: "galleries" },
        { label: "RSS", href: "index.xml" },
        { label: "GitHub", href: "https://github.com/goodlookingprokim/4060-middle-school" },
      ],
    }),
  ],
  afterBody: [],
  footer: Component.Footer({
    message: "함께 나눈 이야기를 다음 만남에서도 다시 꺼내 쓸 수 있게 기록합니다.",
    links: {
      Home: "https://goodlookingprokim.github.io/4060-middle-school/",
      GitHub: "https://github.com/goodlookingprokim/4060-middle-school",
      RSS: "https://goodlookingprokim.github.io/4060-middle-school/index.xml",
    },
  }),
}

export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta({ showComma: false }),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({
      sortFn: (a, b) => {
        // 갤러리 폴더를 맨 위에, 그다음 일반 폴더, 그다음 파일
        // 주의: 이 함수는 문자열로 직렬화되어 브라우저에서 실행된다.
        // slugSegment가 없는 노드(루트 등)가 있으므로 반드시 ?? 로 방어한다.
        const rankA = a.isFolder ? ((a.slugSegment ?? "").endsWith("-gallery") ? 0 : 1) : 2
        const rankB = b.isFolder ? ((b.slugSegment ?? "").endsWith("-gallery") ? 0 : 1) : 2
        if (rankA !== rankB) return rankA - rankB

        // 날짜가 있는 글은 발행일 최신순으로 정렬한다.
        // 파일명에 날짜가 없는 오래된 글은 예전 발행일을 보완한다.
        const legacyDates = {
          "ai-tools-in-my-own-environment": "2026-05-09",
          "the-speed-of-relearning": "2026-05-04",
        }
        const slugDateA = (a.slugSegment ?? "").match(/^\d{4}-\d{2}-\d{2}/)?.[0]
        const titleDateA = (a.displayName ?? "").match(/^(\d{4})년\s+(\d{1,2})월\s+(\d{1,2})일/)
        const dateA =
          slugDateA ??
          (titleDateA
            ? `${titleDateA[1]}-${titleDateA[2].padStart(2, "0")}-${titleDateA[3].padStart(2, "0")}`
            : legacyDates[a.slugSegment ?? ""] ?? null)
        const slugDateB = (b.slugSegment ?? "").match(/^\d{4}-\d{2}-\d{2}/)?.[0]
        const titleDateB = (b.displayName ?? "").match(/^(\d{4})년\s+(\d{1,2})월\s+(\d{1,2})일/)
        const dateB =
          slugDateB ??
          (titleDateB
            ? `${titleDateB[1]}-${titleDateB[2].padStart(2, "0")}-${titleDateB[3].padStart(2, "0")}`
            : legacyDates[b.slugSegment ?? ""] ?? null)
        if (dateA || dateB) {
          if (!dateA) return 1
          if (!dateB) return -1
          const byDate = dateB.localeCompare(dateA)
          if (byDate !== 0) return byDate
        }

        return a.displayName.localeCompare(b.displayName, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      },
    }),
  ],
  right: [
    Component.DesktopOnly(Component.TableOfContents()),
    Component.DesktopOnly(Component.Backlinks()),
  ],
}

export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta({ showComma: false }),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({
      sortFn: (a, b) => {
        // 갤러리 폴더를 맨 위에, 그다음 일반 폴더, 그다음 파일
        // 주의: 이 함수는 문자열로 직렬화되어 브라우저에서 실행된다.
        // slugSegment가 없는 노드(루트 등)가 있으므로 반드시 ?? 로 방어한다.
        const rankA = a.isFolder ? ((a.slugSegment ?? "").endsWith("-gallery") ? 0 : 1) : 2
        const rankB = b.isFolder ? ((b.slugSegment ?? "").endsWith("-gallery") ? 0 : 1) : 2
        if (rankA !== rankB) return rankA - rankB

        // 날짜가 있는 글은 발행일 최신순으로 정렬한다.
        // 파일명에 날짜가 없는 오래된 글은 예전 발행일을 보완한다.
        const legacyDates = {
          "ai-tools-in-my-own-environment": "2026-05-09",
          "the-speed-of-relearning": "2026-05-04",
        }
        const slugDateA = (a.slugSegment ?? "").match(/^\d{4}-\d{2}-\d{2}/)?.[0]
        const titleDateA = (a.displayName ?? "").match(/^(\d{4})년\s+(\d{1,2})월\s+(\d{1,2})일/)
        const dateA =
          slugDateA ??
          (titleDateA
            ? `${titleDateA[1]}-${titleDateA[2].padStart(2, "0")}-${titleDateA[3].padStart(2, "0")}`
            : legacyDates[a.slugSegment ?? ""] ?? null)
        const slugDateB = (b.slugSegment ?? "").match(/^\d{4}-\d{2}-\d{2}/)?.[0]
        const titleDateB = (b.displayName ?? "").match(/^(\d{4})년\s+(\d{1,2})월\s+(\d{1,2})일/)
        const dateB =
          slugDateB ??
          (titleDateB
            ? `${titleDateB[1]}-${titleDateB[2].padStart(2, "0")}-${titleDateB[3].padStart(2, "0")}`
            : legacyDates[b.slugSegment ?? ""] ?? null)
        if (dateA || dateB) {
          if (!dateA) return 1
          if (!dateB) return -1
          const byDate = dateB.localeCompare(dateA)
          if (byDate !== 0) return byDate
        }

        return a.displayName.localeCompare(b.displayName, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      },
    }),
  ],
  right: [Component.DesktopOnly(Component.TableOfContents())],
}
