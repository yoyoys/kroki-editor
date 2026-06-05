import { describe, expect, it } from 'vitest'
import { resolveConfig } from '@/lib/config'
import { encodeDiagram } from '@/lib/encoding'

describe('resolveConfig', () => {
  it('falls back to defaults when nothing provided', () => {
    const c = resolveConfig({ win: {}, env: {} })
    expect(c.endpoint).toBe('https://kroki.io')
    expect(c.defaultDiagram).toBe('plantuml')
    expect(c.enabledDiagrams.length).toBeGreaterThan(0)
  })

  it('uses env when window config absent', () => {
    const c = resolveConfig({ win: {}, env: { VITE_KROKI_ENDPOINT: 'https://e.test', VITE_DEFAULT_DIAGRAM: 'mermaid' } })
    expect(c.endpoint).toBe('https://e.test')
    expect(c.defaultDiagram).toBe('mermaid')
  })

  it('window config overrides env', () => {
    const c = resolveConfig({
      win: { endpoint: 'https://w.test', enabledDiagrams: ['plantuml', 'd2'] },
      env: { VITE_KROKI_ENDPOINT: 'https://e.test' },
    })
    expect(c.endpoint).toBe('https://w.test')
    expect(c.enabledDiagrams).toEqual(['plantuml', 'd2'])
  })

  it('decodes encoded examples and merges over defaults', () => {
    const c = resolveConfig({
      win: { examples: { plantuml: encodeDiagram('@startuml\nCUSTOM\n@enduml') } },
      env: {},
    })
    expect(c.examples.plantuml).toContain('CUSTOM')
    expect(c.examples.mermaid).toMatch(/flowchart|graph/)
  })

  it('ignores an example that fails to decode', () => {
    const c = resolveConfig({ win: { examples: { plantuml: '!!!not-valid!!!' } }, env: {} })
    expect(c.examples.plantuml).toContain('Order Service')
  })

  it('treats empty injected strings as absent', () => {
    const c = resolveConfig({ win: { endpoint: '', defaultDiagram: '', enabledDiagrams: [], examples: { plantuml: '' } }, env: {} })
    expect(c.endpoint).toBe('https://kroki.io')
    expect(c.defaultDiagram).toBe('plantuml')
    expect(c.examples.plantuml).toContain('Order Service')
  })

  it('exampleEndpoint falls back to the main endpoint when unset', () => {
    const c = resolveConfig({ win: { endpoint: 'https://main.test', exampleEndpoint: '' }, env: {} })
    expect(c.exampleEndpoint).toBe('https://main.test')
  })

  it('exampleEndpoint uses its own value when provided (win or env)', () => {
    const fromWin = resolveConfig({ win: { endpoint: 'https://main.test', exampleEndpoint: 'https://ex.test' }, env: {} })
    expect(fromWin.exampleEndpoint).toBe('https://ex.test')
    const fromEnv = resolveConfig({ win: {}, env: { VITE_KROKI_ENDPOINT: 'https://main.test', VITE_EXAMPLE_KROKI_ENDPOINT: 'https://ex.test' } })
    expect(fromEnv.exampleEndpoint).toBe('https://ex.test')
  })

  it('resolves the page title from window, then env, then default', () => {
    expect(resolveConfig({ win: {}, env: {} }).title).toBe('Kroki Editor')
    expect(resolveConfig({ win: {}, env: { VITE_PAGE_TITLE: 'My Diagrams' } }).title).toBe('My Diagrams')
    expect(resolveConfig({ win: { title: 'Win Title' }, env: { VITE_PAGE_TITLE: 'Env Title' } }).title).toBe('Win Title')
    expect(resolveConfig({ win: { title: '' }, env: {} }).title).toBe('Kroki Editor')
  })

  it('mermaidClient defaults off and parses env/window flags', () => {
    expect(resolveConfig({ win: {}, env: {} }).mermaidClient).toBe(false)
    expect(resolveConfig({ win: {}, env: { VITE_MERMAID_CLIENT_SIDE: 'true' } }).mermaidClient).toBe(true)
    expect(resolveConfig({ win: {}, env: { VITE_MERMAID_CLIENT_SIDE: 'false' } }).mermaidClient).toBe(false)
    expect(resolveConfig({ win: { mermaidClient: true }, env: {} }).mermaidClient).toBe(true)
  })
})
