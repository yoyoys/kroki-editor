export type KrokiErrorKind = 'network' | 'syntax' | 'unsupported' | 'unknown'

export interface ClassifiedError {
  kind: KrokiErrorKind
  /** 1-based line number the error points at, if we could extract one. */
  line: number | null
  /** Raw message from Kroki (or the fetch exception) for the "details" view. */
  raw: string
}

interface ClassifyInput {
  /** True when fetch() itself threw (no HTTP response: offline, CORS, DNS, refused). */
  networkError?: boolean
  status?: number
  body?: string
}

const LINE_PATTERNS = [
  /\bline\s+#?(\d+)/i, //  PlantUML "Error line 3", graphviz "syntax error in line 2"
  /\bat line (\d+)/i, //   mermaid-ish
  /[第行]\s*(\d+)\s*行?/, // chinese "第 3 行"
  /:(\d+):\d+/, //          d2 / others "input:3:5"
  /\bline:?\s*(\d+)/i,
]

export function extractLine(raw: string): number | null {
  for (const pattern of LINE_PATTERNS) {
    const m = raw.match(pattern)
    if (m) {
      const n = Number(m[1])
      if (Number.isFinite(n) && n > 0)
        return n
    }
  }
  return null
}

const UNSUPPORTED_STATUS = new Set([404, 415, 501, 502, 503, 504])
const UNSUPPORTED_RE = /unsupported|not (?:installed|enabled|supported|found)|no such|unable to find|companion|service unavailable|bad gateway/i
const SYNTAX_RE = /syntax|parse|error line|unexpected|expecting|lexical|cannot find|invalid/i

export function classifyKrokiError(input: ClassifyInput): ClassifiedError {
  const raw = (input.body ?? '').trim()

  if (input.networkError)
    return { kind: 'network', line: null, raw: raw || 'Failed to fetch' }

  const status = input.status ?? 0

  if (UNSUPPORTED_STATUS.has(status) || UNSUPPORTED_RE.test(raw))
    return { kind: 'unsupported', line: null, raw }

  if (status === 400 || SYNTAX_RE.test(raw))
    return { kind: 'syntax', line: extractLine(raw), raw }

  return { kind: 'unknown', line: extractLine(raw), raw }
}
