import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"

interface Options {
  links: Record<string, string>
  message?: string
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    const links = opts?.links ?? []
    const message = opts?.message ?? "다음 작업에서 다시 꺼내 쓸 수 있는 기록을 남깁니다."

    return (
      <footer class={`${displayClass ?? ""}`}>
        <p>
          <strong>{cfg.pageTitle}</strong> © {year}
          <span> · {message}</span>
        </p>
        <ul>
          {Object.entries(links).map(([text, link]) => (
            <li>
              <a href={link}>{text}</a>
            </li>
          ))}
        </ul>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
