import { extractText, getDocumentProxy } from "unpdf"

export type ExtractedPdf = {
  text: string
  pageCount: number
  wordCount: number
}

/** Collapse the ragged whitespace that PDF extraction usually produces. */
function normalize(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<ExtractedPdf> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer))
  const { text, totalPages } = await extractText(pdf, { mergePages: true })

  const normalized = normalize(Array.isArray(text) ? text.join("\n\n") : text)

  return {
    text: normalized,
    pageCount: totalPages,
    wordCount: normalized ? normalized.split(/\s+/).length : 0,
  }
}
