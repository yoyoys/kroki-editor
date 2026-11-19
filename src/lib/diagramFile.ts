/**
 * File helpers for opening diagram source and downloading the rendered image
 * or the diagram source.
 *
 * Diagram source is never persisted to disk by the app itself; these helpers
 * let the user import a local `.puml`/`.mmd`/… file and export the current
 * diagram as an image or source file.
 */

// Map diagram type -> file extensions it reads; the first one is used for downloads.
const EXTS_BY_TYPE: Record<string, string[]> = {
  plantuml: ['puml', 'pu', 'plantuml', 'iuml'],
  c4plantuml: ['puml', 'pu', 'plantuml', 'iuml'],
  mermaid: ['mmd', 'mermaid'],
  d2: ['d2'],
  graphviz: ['dot', 'gv'],
  dot: ['dot', 'gv'],
  bpmn: ['bpmn'],
  dbml: ['dbml'],
  tikz: ['tex'],
  wireviz: ['yaml', 'yml'],
  vega: ['json'],
  vegalite: ['json'],
  excalidraw: ['json', 'excalidraw'],
  wavedrom: ['json'],
}

// Map extension -> MIME type. Falls back to text/plain.
const MIME_BY_EXT: Record<string, string> = {
  bpmn: 'application/xml',
  tex: 'text/x-tex',
  yaml: 'text/yaml',
  json: 'application/json',
}

/** File extension (no dot) for a diagram type, e.g. `mermaid` -> `mmd`. */
export function extensionForType(type: string): string {
  return EXTS_BY_TYPE[type]?.[0] ?? 'txt'
}

/** MIME type for a diagram type, e.g. `bpmn` -> `application/xml`. */
export function mimeForType(type: string): string {
  return MIME_BY_EXT[extensionForType(type)] ?? 'text/plain'
}

/**
 * Infer a diagram type from a file extension, e.g. `.puml` -> `plantuml`.
 *
 * Several types share an extension (`.json`, `.puml`), so the current type is
 * kept when it reads that extension. Only types in `enabled` (when given) are
 * returned.
 */
export function typeForExtension(ext: string | undefined, current?: string, enabled?: readonly string[]): string | undefined {
  if (!ext)
    return undefined
  const lower = ext.toLowerCase()
  const candidates = Object.keys(EXTS_BY_TYPE)
    .filter(type => EXTS_BY_TYPE[type].includes(lower))
    .filter(type => !enabled || enabled.includes(type))
  if (current && candidates.includes(current))
    return current
  return candidates[0]
}

/** Filename suggestion for downloading the current diagram source. */
export function sourceFilename(type: string): string {
  return `diagram.${extensionForType(type)}`
}

/** Filename suggestion for downloading the rendered image. */
export function imageFilename(format: 'svg' | 'png'): string {
  return `diagram.${format}`
}

// Some browsers (Safari, older Firefox) start the download asynchronously, so the
// object URL must outlive the click.
const REVOKE_DELAY_MS = 30_000

/** Trigger a browser download of a blob, or of a string with the given MIME type. */
export function downloadBlob(data: Blob | string, filename: string, type = 'text/plain'): void {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS)
}

/** Read a File as plain text. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/** Comma-separated accept list for the file picker. */
export const DIAGRAM_SOURCE_ACCEPT = [...new Set([...Object.values(EXTS_BY_TYPE).flat(), 'txt'])]
  .map(ext => `.${ext}`)
  .join(',')
