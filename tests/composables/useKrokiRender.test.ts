import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useKrokiRender } from '@/composables/useKrokiRender'
import { renderMermaidSvg } from '@/lib/mermaidRender'

vi.mock('@/lib/mermaidRender', () => ({ renderMermaidSvg: vi.fn() }))

function mockFetchOnce(ok: boolean, body: string) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 400,
    blob: async () => new Blob([body], { type: 'image/svg+xml' }),
    text: async () => body,
  }) as any
}

describe('useKrokiRender', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders an image url on success', async () => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:ok')
    mockFetchOnce(true, '<svg/>')
    const source = ref('@startuml\nA->B\n@enduml')
    const type = ref('plantuml')
    const r = useKrokiRender({ endpoint: 'https://k.io', source, type, format: ref('svg'), debounceMs: 0 })
    await r.renderNow()
    expect(r.imageSrc.value).toBe('blob:ok')
    expect(r.error.value).toBeNull()
  })

  it('exposes a classified syntax error with line + raw on failure', async () => {
    mockFetchOnce(false, 'syntax error line 2')
    const r = useKrokiRender({
      endpoint: 'https://k.io',
      source: ref('bad'),
      type: ref('plantuml'),
      format: ref('svg'),
      debounceMs: 0,
    })
    await r.renderNow()
    expect(r.error.value?.kind).toBe('syntax')
    expect(r.error.value?.line).toBe(2)
    expect(r.error.value?.raw).toContain('syntax error')
  })

  it('renders mermaid client-side without hitting Kroki when enabled', async () => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mmd')
    globalThis.fetch = vi.fn() as any
    vi.mocked(renderMermaidSvg).mockResolvedValue('<svg>mmd</svg>')
    const r = useKrokiRender({
      endpoint: 'https://k.io',
      source: ref('graph TD\n A-->B'),
      type: ref('mermaid'),
      format: ref('svg'),
      debounceMs: 0,
      mermaidClient: true,
    })
    await r.renderNow()
    expect(renderMermaidSvg).toHaveBeenCalled()
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(r.imageSrc.value).toBe('blob:mmd')
    expect(r.error.value).toBeNull()
  })

  it('classifies a client-side mermaid failure as syntax', async () => {
    globalThis.fetch = vi.fn() as any
    vi.mocked(renderMermaidSvg).mockRejectedValue(new Error('Parse error on line 2: ...'))
    const r = useKrokiRender({
      endpoint: 'https://k.io',
      source: ref('bad'),
      type: ref('mermaid'),
      format: ref('svg'),
      debounceMs: 0,
      mermaidClient: true,
    })
    await r.renderNow()
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(r.error.value?.kind).toBe('syntax')
    expect(r.error.value?.line).toBe(2)
  })
})
