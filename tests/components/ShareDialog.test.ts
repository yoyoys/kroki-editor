import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import ShareDialog from '@/components/ShareDialog.vue'
import { i18n } from '../helpers/i18n'

const props = {
  endpoint: 'https://k.io',
  host: 'https://app.test',
  type: 'plantuml',
  encoded: 'ENC',
}
const opts = { props, global: { plugins: [i18n] } }

describe('shareDialog', () => {
  beforeEach(() => localStorage.clear())

  it('renders the two always-visible outputs', () => {
    const w = mount(ShareDialog, opts)
    const values = w.findAll('input').map(i => (i.element as HTMLInputElement).value)
    expect(values).toContain('https://k.io/plantuml/svg/ENC')
    expect(values).toContain('![](https://k.io/plantuml/svg/ENC)')
  })

  it('switching format updates image + embed', async () => {
    const w = mount(ShareDialog, opts)
    await w.find('[data-fmt="png"]').trigger('click')
    const values = w.findAll('input').map(i => (i.element as HTMLInputElement).value)
    expect(values).toContain('https://k.io/plantuml/png/ENC')
  })

  it('editable outputs hidden by default, shown when expanded, state persisted', async () => {
    const w = mount(ShareDialog, opts)
    expect(w.find('[data-editable]').exists()).toBe(false)
    await w.find('[data-toggle-editable]').trigger('click')
    expect(w.find('[data-editable]').exists()).toBe(true)
    expect(localStorage.getItem('kroki-share-expanded')).toBe('1')
  })
})
