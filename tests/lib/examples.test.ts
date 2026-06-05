import { describe, expect, it } from 'vitest'
import { ALL_DIAGRAM_TYPES, DEFAULT_EXAMPLES } from '@/lib/examples'

describe('examples', () => {
  it('lists all known Kroki diagram types', () => {
    expect(ALL_DIAGRAM_TYPES).toContain('plantuml')
    expect(ALL_DIAGRAM_TYPES).toContain('mermaid')
    expect(ALL_DIAGRAM_TYPES.length).toBeGreaterThan(10)
  })

  it('provides a non-empty default example for the common types', () => {
    for (const t of ['plantuml', 'mermaid', 'graphviz', 'd2', 'bpmn', 'svgbob']) {
      expect(DEFAULT_EXAMPLES[t]?.length, t).toBeGreaterThan(0)
    }
  })

  it('decodes recognizable content', () => {
    expect(DEFAULT_EXAMPLES.mermaid).toMatch(/graph|flowchart|sequenceDiagram/)
    expect(DEFAULT_EXAMPLES.graphviz).toMatch(/digraph|graph/)
  })
})
