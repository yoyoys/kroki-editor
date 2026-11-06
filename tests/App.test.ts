import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadBlob, readFileAsText } from '@/lib/diagramFile'
import { i18n } from './helpers/i18n'

const downloadBlobMock = vi.mocked(downloadBlob)
const readFileMock = vi.mocked(readFileAsText)
// Initial render state handed to the mocked useKrokiRender on mount.
const renderState = vi.hoisted(() => ({ error: null as unknown }))

vi.mock('@/composables/useKrokiRender', async () => {
  const { ref } = await import('vue')
  return {
    useKrokiRender: () => ({
      imageSrc: ref('blob:x'),
      error: ref(renderState.error),
      loading: ref(false),
      renderNow: vi.fn(),
      scheduleRender: vi.fn(),
    }),
  }
})
vi.mock('@/composables/usePanzoom', () => ({
  usePanzoom: () => ({ percent: { value: 100 }, zoomIn: vi.fn(), zoomOut: vi.fn(), reset: vi.fn(), fit: vi.fn(), destroy: vi.fn(), instance: {} }),
}))

vi.mock('@/lib/diagramFile', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/diagramFile')>()
  return {
    ...actual,
    downloadBlob: vi.fn(),
    readFileAsText: vi.fn(actual.readFileAsText),
  }
})

const mountOpts = { global: { plugins: [i18n] } }

describe('app', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() }) as any
    window.location.hash = ''
    downloadBlobMock.mockClear()
    readFileMock.mockClear()
    renderState.error = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mounts with toolbar, editor and preview', async () => {
    const App = (await import('@/App.vue')).default
    const w = mount(App, mountOpts)
    expect(w.find('.toolbar').exists()).toBe(true)
    expect(w.find('.code-editor').exists()).toBe(true)
    expect(w.find('.preview').exists()).toBe(true)
  })

  it('opens the share dialog', async () => {
    const App = (await import('@/App.vue')).default
    const w = mount(App, mountOpts)
    await w.find('[data-act="share"]').trigger('click')
    expect(w.find('.dialog').exists()).toBe(true)
  })

  it('opens the examples dialog', async () => {
    const App = (await import('@/App.vue')).default
    const w = mount(App, mountOpts)
    await w.find('[data-act="examples"]').trigger('click')
    expect(w.find('[data-dialog="examples"]').exists()).toBe(true)
  })

  it('switches type without prompting when the editor is pristine', async () => {
    const App = (await import('@/App.vue')).default
    const w = mount(App, mountOpts)
    await w.find('select').setValue('mermaid')
    expect(w.find('[data-confirm="type-change"]').exists()).toBe(false)
    expect((w.find('select').element as HTMLSelectElement).value).toBe('mermaid')
  })

  it('prompts before clearing edited content, and loads the example on confirm', async () => {
    const { encodeDiagram } = await import('@/lib/encoding')
    // Load a custom (dirty) source via the hash so it differs from the type default.
    window.location.hash = `#plantuml/${encodeDiagram('@startuml\nMY EDIT\n@enduml')}`
    const App = (await import('@/App.vue')).default
    const w = mount(App, mountOpts)

    await w.find('select').setValue('mermaid')
    // dirty → confirm appears, type not yet switched
    expect(w.find('[data-confirm="type-change"]').exists()).toBe(true)

    await w.find('[data-confirm="type-change"] .primary').trigger('click')
    expect(w.find('[data-confirm="type-change"]').exists()).toBe(false)
    expect((w.find('select').element as HTMLSelectElement).value).toBe('mermaid')
  })

  it('clicking open triggers the file input when the editor is pristine', async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click')
    const App = (await import('@/App.vue')).default
    const w = mount(App, mountOpts)
    await w.find('[data-act="open"]').trigger('click')
    expect(click).toHaveBeenCalled()
  })

  it('download-source downloads the current source with a type-based filename', async () => {
    const App = (await import('@/App.vue')).default
    const w = mount(App, mountOpts)
    await w.find('[data-act="download-source"]').trigger('click')
    expect(downloadBlobMock).toHaveBeenCalledTimes(1)
    const [data, filename, mime] = downloadBlobMock.mock.calls[0]
    expect(filename).toBe('diagram.puml')
    expect(typeof data).toBe('string')
    expect(mime).toBe('text/plain')
  })

  it('download-image fetches the rendered image URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Blob(['svg'], { type: 'image/svg+xml' }), { status: 200, headers: { 'content-type': 'image/svg+xml' } }),
    )
    const originalFetch = globalThis.fetch
    globalThis.fetch = fetchMock
    try {
      const App = (await import('@/App.vue')).default
      const w = mount(App, mountOpts)
      await w.find('[data-act="download-image"]').trigger('click')
      // dialog opens with format selector
      expect(w.find('.dialog').exists()).toBe(true)
      // confirm download from the dialog
      await w.find('.actions .primary').trigger('click')
      await new Promise(r => setTimeout(r, 0))
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/plantuml/svg/'))
      expect(downloadBlobMock).toHaveBeenCalledWith(expect.any(Blob), 'diagram.svg')
      expect(w.find('.dialog').exists()).toBe(false)
    }
    finally {
      globalThis.fetch = originalFetch
    }
  })

  async function downloadWithFetch(fetchMock: typeof fetch) {
    const originalFetch = globalThis.fetch
    globalThis.fetch = fetchMock
    const open = vi.spyOn(window, 'open')
    try {
      const App = (await import('@/App.vue')).default
      const w = mount(App, mountOpts)
      await w.find('[data-act="download-image"]').trigger('click')
      await w.find('.actions .primary').trigger('click')
      await new Promise(r => setTimeout(r, 0))
      expect(open).not.toHaveBeenCalled()
      expect(downloadBlobMock).not.toHaveBeenCalled()
      return w
    }
    finally {
      globalThis.fetch = originalFetch
    }
  }

  it('download-image reports a render error from the server and keeps the dialog open', async () => {
    const w = await downloadWithFetch(vi.fn().mockResolvedValue(new Response('bad', { status: 400 })) as typeof fetch)
    expect(w.find('.dialog .msg').text()).toContain('HTTP 400')
    expect(w.find('.dialog .msg a').exists()).toBe(false)
  })

  it('download-image offers a link to the image when it cannot be fetched', async () => {
    const w = await downloadWithFetch(vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) as typeof fetch)
    const link = w.find('.dialog .msg a')
    expect(link.attributes('href')).toContain('/plantuml/svg/')
    expect(link.attributes('target')).toBe('_blank')
  })

  it('download-image is disabled while the preview shows an error', async () => {
    renderState.error = { kind: 'syntax' }
    const App = (await import('@/App.vue')).default
    const w = mount(App, mountOpts)
    await w.find('[data-act="download-image"]').trigger('click')
    expect(w.find('.actions .primary').attributes('disabled')).toBeDefined()
    expect(w.find('.dialog .msg').exists()).toBe(true)
  })

  async function openFile(w: ReturnType<typeof mount>, file: File) {
    const input = w.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    // Let the read settle, then let App apply it.
    await readFileMock.mock.results[readFileMock.mock.results.length - 1]?.value.catch(() => {})
    await new Promise(r => setTimeout(r, 0))
  }

  it('opening an unreadable file keeps the type and source and shows an error', async () => {
    readFileMock.mockRejectedValueOnce(new Error('nope'))
    const App = (await import('@/App.vue')).default
    const w = mount(App, mountOpts)
    const before = (w.find('select').element as HTMLSelectElement).value
    await openFile(w, new File(['x'], 'foo.mmd'))
    expect((w.find('select').element as HTMLSelectElement).value).toBe(before)
    expect(w.find('[data-confirm="open-error"]').text()).toContain('foo.mmd')
  })

  it('opening a file keeps the current type when it shares the extension', async () => {
    const App = (await import('@/App.vue')).default
    const w = mount(App, mountOpts)
    await w.find('select').setValue('vegalite')
    await openFile(w, new File(['{"mark":"bar"}'], 'chart.json'))
    expect((w.find('select').element as HTMLSelectElement).value).toBe('vegalite')
    expect(readFileMock).toHaveBeenCalledTimes(1)
  })

  it('opening a file infers the type from its extension', async () => {
    const App = (await import('@/App.vue')).default
    const w = mount(App, mountOpts)
    await openFile(w, new File(['graph TD; A-->B'], 'flow.mmd'))
    expect((w.find('select').element as HTMLSelectElement).value).toBe('mermaid')
  })
})
