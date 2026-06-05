function stripTrailingSlash(s: string): string {
  return s.replace(/\/+$/, '')
}

export function buildImageUrl(endpoint: string, type: string, format: string, encoded: string): string {
  return `${stripTrailingSlash(endpoint)}/${type}/${format}/${encoded}`
}

export function buildEditableHash(type: string, encoded: string): string {
  return `#${type}/${encoded}`
}

export function parseEditableHash(hash: string): { type: string, encoded: string } | null {
  const h = hash.replace(/^#/, '')
  const idx = h.indexOf('/')
  if (idx <= 0 || idx === h.length - 1)
    return null
  return { type: h.slice(0, idx), encoded: h.slice(idx + 1) }
}
