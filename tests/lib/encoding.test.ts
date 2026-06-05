import { describe, expect, it } from 'vitest'
import { decodeDiagram, encodeDiagram } from '@/lib/encoding'

describe('encoding', () => {
  it('round-trips a diagram source', () => {
    const source = '@startuml\nAlice -> Bob: Hello\n@enduml'
    const encoded = encodeDiagram(source)
    expect(decodeDiagram(encoded)).toBe(source)
  })

  it('produces url-safe output (no + / =)', () => {
    const encoded = encodeDiagram('a'.repeat(200))
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('handles unicode', () => {
    const source = '節點 -> 節點2: 你好'
    expect(decodeDiagram(encodeDiagram(source))).toBe(source)
  })
})
