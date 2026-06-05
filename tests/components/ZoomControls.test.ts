import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ZoomControls from '@/components/ZoomControls.vue'
import { i18n } from '../helpers/i18n'

describe('zoomControls', () => {
  it('shows percent and emits intents', async () => {
    const wrapper = mount(ZoomControls, { props: { percent: 140 }, global: { plugins: [i18n] } })
    expect(wrapper.text()).toContain('140%')
    await wrapper.find('[data-act="in"]').trigger('click')
    await wrapper.find('[data-act="out"]').trigger('click')
    await wrapper.find('[data-act="fit"]').trigger('click')
    await wrapper.find('[data-act="reset"]').trigger('click')
    expect(wrapper.emitted('zoomIn')).toHaveLength(1)
    expect(wrapper.emitted('zoomOut')).toHaveLength(1)
    expect(wrapper.emitted('fit')).toHaveLength(1)
    expect(wrapper.emitted('reset')).toHaveLength(1)
  })

  it('hides the background toggle unless bgMode is provided', () => {
    const wrapper = mount(ZoomControls, { props: { percent: 100 }, global: { plugins: [i18n] } })
    expect(wrapper.find('[data-act="bg"]').exists()).toBe(false)
  })

  it('shows the background toggle and emits toggleBg when bgMode is set', async () => {
    const wrapper = mount(ZoomControls, { props: { percent: 100, bgMode: 'light' }, global: { plugins: [i18n] } })
    await wrapper.find('[data-act="bg"]').trigger('click')
    expect(wrapper.emitted('toggleBg')).toHaveLength(1)
  })
})
