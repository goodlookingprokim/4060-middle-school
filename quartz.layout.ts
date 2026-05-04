import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.TechMasthead({
      eyebrow: "OpenClaw Publishing System",
      title: "GoodlookingProKim",
      subtitle: "AI 자동화, 문서 제작, 작업 노트를 바로 다시 쓸 수 있게 정리하는 실전 테크 블로그",
      links: [
        { label: "AI 자동화", href: "ai-automation" },
        { label: "문서와 슬라이드", href: "docs-slides" },
        { label: "작업 노트", href: "work-notes" },
        { label: "RSS", href: "index.xml" },
        {
          label: "GitHub",
          href: "https://github.com/goodlookingprokim/goodlookingprokim.github.io",
        },
      ],
    }),
  ],
  afterBody: [],
  footer: Component.Footer({
    message: "다음 작업에서 다시 꺼내 쓸 수 있는 기록을 남깁니다.",
    links: {
      Home: "https://goodlookingprokim.github.io/",
      GitHub: "https://github.com/goodlookingprokim/goodlookingprokim.github.io",
      RSS: "https://goodlookingprokim.github.io/index.xml",
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
    Component.Explorer(),
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
    Component.Explorer(),
  ],
  right: [Component.DesktopOnly(Component.TableOfContents())],
}
