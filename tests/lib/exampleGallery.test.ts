import { describe, expect, it } from 'vitest'
import { decodeDiagram } from '@/lib/encoding'
import { EXAMPLE_GALLERY } from '@/lib/exampleGallery'

describe('exampleGallery', () => {
  it('has many examples across types', () => {
    expect(EXAMPLE_GALLERY.length).toBeGreaterThan(100)
    const types = new Set(EXAMPLE_GALLERY.map(e => e.diagramType))
    expect(types.has('plantuml')).toBe(true)
    expect(types.has('mermaid')).toBe(true)
  })

  it('every example decodes without throwing', () => {
    for (const e of EXAMPLE_GALLERY)
      expect(() => decodeDiagram(e.example), `${e.diagramType}/${e.description}`).not.toThrow()
  })

  it('every type has exactly... at least one default', () => {
    const byType = new Map<string, number>()
    for (const e of EXAMPLE_GALLERY.filter(e => e.default))
      byType.set(e.diagramType, (byType.get(e.diagramType) ?? 0) + 1)
    expect([...byType.values()].every(n => n >= 1)).toBe(true)
  })
})
