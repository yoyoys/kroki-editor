import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Preview from '@/components/Preview.vue'
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

const opts = { global: { plugins: [i18n] } }

describe('preview', () => {
  it('shows the image when provided', () => {
    const wrapper = mount(Preview, { props: { imageSrc: 'blob:x', error: null }, ...opts })
    expect(wrapper.find('img').attributes('src')).toBe('blob:x')
  })

  it('shows a rendering indicator while loading', () => {
    const wrapper = mount(Preview, { props: { imageSrc: null, error: null, loading: true }, ...opts })
    expect(wrapper.find('.rendering').exists()).toBe(true)
    expect(wrapper.text()).toContain('Rendering')
    // the empty prompt is suppressed while loading
    expect(wrapper.find('.empty').exists()).toBe(false)
  })

  it('shows a classified error bar when error present, keeping the last image', () => {
    const wrapper = mount(Preview, {
      props: { imageSrc: 'blob:x', error: { kind: 'syntax', line: 3, raw: 'Error line 3: oops' } },
      ...opts,
    })
    expect(wrapper.find('.error-bar').exists()).toBe(true)
    expect(wrapper.find('img').exists()).toBe(true)
    // friendly message + line hint shown; raw text is behind the details toggle (hidden by default)
    expect(wrapper.text()).toContain('Diagram syntax error')
    expect(wrapper.text()).toContain('line 3')
    expect(wrapper.find('.error-detail').exists()).toBe(false)
  })

  it('reveals raw detail when the details toggle is clicked', async () => {
    const wrapper = mount(Preview, {
      props: { imageSrc: 'blob:x', error: { kind: 'syntax', line: 3, raw: 'Error line 3: oops' } },
      ...opts,
    })
    await wrapper.find('.error-toggle').trigger('click')
    expect(wrapper.find('.error-detail').text()).toContain('oops')
  })
})
