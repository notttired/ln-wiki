export interface InfoRow {
  type: 'field' | 'section'
  key: string
  value?: string
}

export interface InfoTableResult {
  rows: InfoRow[]
  strippedMarkdown: string
}

export function parseInfoTable(raw: string): InfoTableResult | null {
  const lines = raw.split('\n')

  // Find first contiguous block of lines starting with '|'
  let start = -1
  let end = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('|')) {
      if (start === -1) start = i
      end = i
    } else if (start !== -1) {
      break
    }
  }

  if (start === -1) return null

  const tableLines = lines.slice(start, end + 1)
  const rows: InfoRow[] = []

  for (const line of tableLines) {
    // Skip separator rows like |---|---|
    if (/^\|[-| :]+\|$/.test(line.trim())) continue

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim())

    if (cells.length < 2) continue

    const rawKey = cells[0]
    const rawVal = cells[1]

    // Skip the empty header row | | |
    if (!rawKey && !rawVal) continue

    const isBold = /^\*\*.*\*\*$/.test(rawKey)
    const key = rawKey.replace(/^\*\*|\*\*$/g, '').trim()
    const value = rawVal.trim()

    if (!key) continue

    if (isBold && !value) {
      // Section divider
      rows.push({ type: 'section', key })
    } else {
      rows.push({ type: 'field', key, value: value || undefined })
    }
  }

  if (rows.length === 0) return null

  // Remove the table block from the markdown (plus any blank line immediately after)
  const before = lines.slice(0, start)
  let after = lines.slice(end + 1)
  if (after[0]?.trim() === '') after = after.slice(1)
  const strippedMarkdown = [...before, ...after].join('\n')

  return { rows, strippedMarkdown }
}
