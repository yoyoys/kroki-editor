import { describe, expect, it } from 'vitest'
import { hasHighlighting, languageFor } from '@/lib/editorLanguage'

describe('editorLanguage', () => {
  it('provides a language for every supported type', () => {
    const supported = [
      'mermaid',
      'vega',
      'vegalite',
      'excalidraw',
      'wavedrom',
      'bpmn',
      'wireviz',
      'tikz',
      'dbml',
      'plantuml',
      'c4plantuml',
      'd2',
      'graphviz',
      'blockdiag',
      'seqdiag',
      'actdiag',
      'nwdiag',
      'packetdiag',
      'rackdiag',
    ]
    for (const t of supported)
      expect(languageFor(t), t).not.toBeNull()
  })

  it('returns null for types with no usable grammar', () => {
    for (const t of ['ditaa', 'svgbob', 'bytefield', 'pikchr', 'nomnoml', 'erd', 'structurizr', 'umlet'])
      expect(languageFor(t), t).toBeNull()
  })

  it('hasHighlighting mirrors languageFor', () => {
    expect(hasHighlighting('plantuml')).toBe(true)
    expect(hasHighlighting('ditaa')).toBe(false)
  })
})
