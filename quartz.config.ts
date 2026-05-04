import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

const config: QuartzConfig = {
  configuration: {
    pageTitle: "4060미들스쿨",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "ko-KR",
    baseUrl: "goodlookingprokim.github.io/4060-middle-school",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        title: { name: "Noto Sans KR", weights: [700], includeItalic: false },
        header: { name: "Noto Sans KR", weights: [500, 700], includeItalic: false },
        body: { name: "IBM Plex Sans KR", weights: [400, 500, 600], includeItalic: false },
        code: { name: "JetBrains Mono", weights: [400, 600], includeItalic: false },
      },
      colors: {
        lightMode: {
          light: "#f7f8f5",
          lightgray: "#e6e9ee",
          gray: "#707783",
          darkgray: "#24292f",
          dark: "#15191f",
          secondary: "#2563eb",
          tertiary: "#0f766e",
          highlight: "rgba(37, 99, 235, 0.1)",
          textHighlight: "#dbeafe",
        },
        darkMode: {
          light: "#0f1419",
          lightgray: "#26313d",
          gray: "#9aa7b6",
          darkgray: "#dbe2ea",
          dark: "#f5f7fb",
          secondary: "#8ab4ff",
          tertiary: "#5eead4",
          highlight: "rgba(138, 180, 255, 0.16)",
          textHighlight: "#1e3a5f",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
