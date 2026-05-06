import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.use({ gfm: true, breaks: false })

export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw) as string
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}
