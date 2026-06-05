import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import FullscreenPreview from '@/components/FullscreenPreview.vue'
import { i18n } from '../helpers/i18n'

vi.mock('@/composables/usePanzoom', () => ({
  usePanzoom: () => ({
    percent: { value: 100 },
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    reset: vi.fn(),
    fit: vi.fn(),
    destroy: vi.fn(),
    instance: {},
  }),
}))

describe('fullscreenPreview', () => {
  it('renders image + minimap and emits close on exit click', async () => {
    const wrapper = mount(FullscreenPreview, {
      props: { imageSrc: 'blob:x' },
      attachTo: document.body,
      global: { plugins: [i18n] },
    })
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('.minimap').exists()).toBe(true)
    await wrapper.find('[data-exit]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})
