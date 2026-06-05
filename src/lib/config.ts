import { decodeDiagram } from './encoding'
import { ALL_DIAGRAM_TYPES, DEFAULT_EXAMPLES } from './examples'

export interface KrokiConfig {
  /** Browser tab title and the in-app header label. */
  title: string
  endpoint: string
  /** Endpoint used to render gallery example thumbnails. Falls back to `endpoint`. */
  exampleEndpoint: string
  enabledDiagrams: string[]
  defaultDiagram: string
  examples: Record<string, string>
  /** Render Mermaid diagrams in the browser instead of via Kroki. */
  mermaidClient: boolean
}

interface ResolveEnv {
  VITE_PAGE_TITLE?: string
  VITE_KROKI_ENDPOINT?: string
  VITE_EXAMPLE_KROKI_ENDPOINT?: string
  VITE_ENABLED_DIAGRAMS?: string
  VITE_DEFAULT_DIAGRAM?: string
  VITE_MERMAID_CLIENT_SIDE?: string
}

interface ResolveInput {
  win?: RawKrokiConfig
  env?: ResolveEnv
}

const DEFAULTS: KrokiConfig = {
  title: 'Kroki Editor',
  endpoint: 'https://kroki.io',
  exampleEndpoint: 'https://kroki.io',
  enabledDiagrams: [...ALL_DIAGRAM_TYPES],
  defaultDiagram: 'plantuml',
  examples: { ...DEFAULT_EXAMPLES },
  mermaidClient: false,
}

function truthy(s: string | undefined): boolean | undefined {
  if (s == null || s === '')
    return undefined
  return /^(?:true|1|yes|on)$/i.test(s.trim())
}

function splitList(s: string | undefined): string[] | undefined {
  if (!s)
    return undefined
  const parts = s.split(',').map(x => x.trim()).filter(Boolean)
  return parts.length ? parts : undefined
}

function nonEmpty(s: string | undefined): string | undefined {
  return s && s.trim() ? s : undefined
}

function decodeExamples(encoded: Record<string, string> | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!encoded)
    return out
  for (const [type, enc] of Object.entries(encoded)) {
    if (!enc || !enc.trim())
      continue
    try {
      out[type] = decodeDiagram(enc)
    }
    catch {
      // skip invalid example, default will be used
    }
  }
  return out
}

export function resolveConfig(input: ResolveInput = {}): KrokiConfig {
  const win = input.win ?? {}
  const env = input.env ?? {}
  const endpoint = nonEmpty(win.endpoint) ?? nonEmpty(env.VITE_KROKI_ENDPOINT) ?? DEFAULTS.endpoint
  return {
    title: nonEmpty(win.title) ?? nonEmpty(env.VITE_PAGE_TITLE) ?? DEFAULTS.title,
    endpoint,
    // Examples cover every Kroki type; render them on a full-featured endpoint if set,
    // otherwise reuse the main endpoint.
    exampleEndpoint: nonEmpty(win.exampleEndpoint) ?? nonEmpty(env.VITE_EXAMPLE_KROKI_ENDPOINT) ?? endpoint,
    enabledDiagrams: (win.enabledDiagrams?.length ? win.enabledDiagrams : undefined)
      ?? splitList(env.VITE_ENABLED_DIAGRAMS) ?? DEFAULTS.enabledDiagrams,
    defaultDiagram: nonEmpty(win.defaultDiagram) ?? nonEmpty(env.VITE_DEFAULT_DIAGRAM) ?? DEFAULTS.defaultDiagram,
    examples: { ...DEFAULTS.examples, ...decodeExamples(win.examples) },
    mermaidClient: win.mermaidClient ?? truthy(env.VITE_MERMAID_CLIENT_SIDE) ?? DEFAULTS.mermaidClient,
  }
}
