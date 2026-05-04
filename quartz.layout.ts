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
