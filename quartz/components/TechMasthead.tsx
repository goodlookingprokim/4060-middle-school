import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { joinSegments, pathToRoot } from "../util/path"

interface MastheadLink {
  label: string
  href: string
}

interface Options {
  eyebrow: string
  title: string
  subtitle: string
  links: MastheadLink[]
}

const defaultOptions: Options = {
  eyebrow: "OpenClaw Publishing System",
  title: "GoodlookingProKim",
  subtitle: "AI 자동화, 문서 제작, 작업 노트를 바로 다시 쓸 수 있게 정리하는 실전 테크 블로그",
  links: [
    { label: "AI 자동화", href: "ai-automation" },
    { label: "문서와 슬라이드", href: "docs-slides" },
    { label: "작업 노트", href: "work-notes" },
    { label: "RSS", href: "index.xml" },
  ],
}

function resolveHref(currentRoot: string, href: string) {
  if (/^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("#")) {
    return href
  }

  return joinSegments(currentRoot, href)
}

export default ((userOpts?: Partial<Options>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const TechMasthead: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const baseDir = pathToRoot(fileData.slug!)

    return (
      <section class="tech-masthead" aria-label="Site introduction">
        <div class="tech-masthead__identity">
          <p class="tech-masthead__eyebrow">{opts.eyebrow}</p>
          <a class="tech-masthead__title" href={baseDir}>
            {opts.title}
          </a>
          <p class="tech-masthead__subtitle">{opts.subtitle}</p>
        </div>
        <nav class="tech-masthead__nav" aria-label="Primary">
          {opts.links.map((link) => (
            <a href={resolveHref(baseDir, link.href)}>{link.label}</a>
          ))}
        </nav>
      </section>
    )
  }

  TechMasthead.css = `
.tech-masthead {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1.5rem;
  align-items: end;
  padding: 1.35rem 0 1.15rem;
  border-bottom: 1px solid var(--border);
}

.tech-masthead__identity {
  min-width: 0;
}

.tech-masthead__eyebrow {
  margin: 0 0 0.35rem;
  color: var(--muted);
  font-family: var(--codeFont);
  font-size: 0.76rem;
  font-weight: 500;
  letter-spacing: 0;
}

.tech-masthead__title {
  display: inline-block;
  color: var(--dark);
  font-family: var(--titleFont);
  font-size: 1.7rem;
  font-weight: 700;
  line-height: 1.1;
  text-decoration: none;
  word-break: keep-all;
}

.tech-masthead__title:hover {
  color: var(--secondary);
}

.tech-masthead__subtitle {
  max-width: 42rem;
  margin: 0.45rem 0 0;
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.62;
}

.tech-masthead__nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
}

.tech-masthead__nav a {
  color: var(--muted);
  font-size: 0.88rem;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
}

.tech-masthead__nav a:hover {
  color: var(--secondary);
}

@media all and (max-width: 1200px) {
  .tech-masthead {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .tech-masthead__nav {
    justify-content: flex-start;
  }
}

@media all and (max-width: 800px) {
  .tech-masthead {
    padding: 1rem 0 0.9rem;
  }

  .tech-masthead__title {
    font-size: 1.45rem;
  }

  .tech-masthead__subtitle {
    font-size: 0.9rem;
  }
}
`

  return TechMasthead
}) satisfies QuartzComponentConstructor
