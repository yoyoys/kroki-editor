import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { i18n } from './helpers/i18n'

vi.mock('@/composables/useKrokiRender', async () => {
  const { ref } = await import('vue')
  return {
    useKrokiRender: () => ({
      imageSrc: ref('blob:x'),
      error: ref(null),
      loading: ref(false),
      renderNow: vi.fn(),
      scheduleRender: vi.fn(),
    }),
  }
})
vi.mock('@/composables/usePanzoom', () => ({
  usePanzoom: () => ({ percent: { value: 100 }, zoomIn: vi.fn(), zoomOut: vi.fn(), reset: vi.fn(), fit: vi.fn(), destroy: vi.fn(), instance: {} }),
}))

const mountOpts = { global: { plugins: [i18n] } }

describe('app', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() }) as any
    window.location.hash = ''
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
})
