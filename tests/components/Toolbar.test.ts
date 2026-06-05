import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Toolbar from '@/components/Toolbar.vue'
import { i18n } from '../helpers/i18n'

const base = {
  diagramTypes: ['plantuml', 'mermaid'],
  type: 'plantuml',
  mode: 'edit' as const,
  isMobile: true,
  imageUrl: 'https://k.io/plantuml/svg/ENC',
}
const opts = { props: base, global: { plugins: [i18n] } }

describe('toolbar', () => {
  beforeEach(() => {
    localStorage.clear()
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() }) as any
    i18n.global.locale.value = 'en'
  })

  it('emits type change', async () => {
    const w = mount(Toolbar, opts)
    await w.find('select').setValue('mermaid')
    expect(w.emitted('update:type')![0]).toEqual(['mermaid'])
  })

  it('shows edit/view segmented control on mobile and emits mode', async () => {
    const w = mount(Toolbar, opts)
    await w.find('[data-mode="view"]').trigger('click')
    expect(w.emitted('update:mode')![0]).toEqual(['view'])
  })

  it('hides edit/view control on desktop', () => {
    const w = mount(Toolbar, { props: { ...base, isMobile: false }, global: { plugins: [i18n] } })
    expect(w.find('[data-mode="view"]').exists()).toBe(false)
  })

  it('emits share and fullscreen', async () => {
    const w = mount(Toolbar, opts)
    await w.find('[data-act="share"]').trigger('click')
    await w.find('[data-act="fullscreen"]').trigger('click')
    expect(w.emitted('share')).toHaveLength(1)
    expect(w.emitted('fullscreen')).toHaveLength(1)
  })

  it('emits examples', async () => {
    const w = mount(Toolbar, opts)
    await w.find('[data-act="examples"]').trigger('click')
    expect(w.emitted('examples')).toHaveLength(1)
  })

  it('toggles locale via the language button', async () => {
    const w = mount(Toolbar, opts)
    expect(i18n.global.locale.value).toBe('en')
    await w.find('[data-act="lang"]').trigger('click')
    expect(i18n.global.locale.value).toBe('zh-TW')
    expect(localStorage.getItem('kroki-locale')).toBe('zh-TW')
  })

  it('copies the image URL directly and shows copied feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    const w = mount(Toolbar, opts)
    await w.find('[data-act="copy-image"]').trigger('click')
    expect(writeText).toHaveBeenCalledWith('https://k.io/plantuml/svg/ENC')
    await w.vm.$nextTick()
    // feedback state applied (check icon / ok class)
    expect(w.find('[data-act="copy-image"]').classes()).toContain('ok')
  })
})
