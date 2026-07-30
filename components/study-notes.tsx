import { Fragment } from "react"

/**
 * Minimal renderer for the constrained markdown the model returns
 * (## headings, - bullets, and paragraphs). Avoids a full markdown dependency.
 */
export function StudyNotes({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n")
  const blocks: React.ReactNode[] = []
  let bullets: string[] = []

  function flushBullets(key: string) {
    if (bullets.length === 0) return
    blocks.push(
      <ul key={key} className="ml-5 flex list-disc flex-col gap-2">
        {bullets.map((item, index) => (
          <li key={index} className="leading-relaxed">
            {renderInline(item)}
          </li>
        ))}
      </ul>,
    )
    bullets = []
  }

  lines.forEach((raw, index) => {
    const line = raw.trim()

    if (line.startsWith("- ") || line.startsWith("* ")) {
      bullets.push(line.slice(2))
      return
    }

    flushBullets(`ul-${index}`)

    if (!line) return

    if (line.startsWith("### ")) {
      blocks.push(
        <h4 key={index} className="mt-2 text-base font-semibold">
          {renderInline(line.slice(4))}
        </h4>,
      )
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={index} className="mt-4 text-lg font-semibold">
          {renderInline(line.slice(3))}
        </h3>,
      )
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h2 key={index} className="mt-4 text-xl font-bold">
          {renderInline(line.slice(2))}
        </h2>,
      )
    } else {
      blocks.push(
        <p key={index} className="leading-relaxed text-muted-foreground">
          {renderInline(line)}
        </p>,
      )
    }
  })

  flushBullets("ul-final")

  return <div className="flex flex-col gap-3 text-sm">{blocks}</div>
}

/** Bold `**text**` spans; everything else renders as plain text. */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  )
}
