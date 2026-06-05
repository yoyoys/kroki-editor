import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CodeEditor from '@/components/CodeEditor.vue'

describe('codeEditor', () => {
  it('renders the initial value', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: 'hello' } })
    expect(wrapper.find('.cm-editor').exists()).toBe(true)
    expect(wrapper.text()).toContain('hello')
    wrapper.unmount()
  })

  it('mounts with an errorLine without throwing', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: 'line1\nline2\nline3', errorLine: 2 } })
    expect(wrapper.find('.cm-editor').exists()).toBe(true)
    // updating the error line should not throw
    await wrapper.setProps({ errorLine: null })
    expect(wrapper.find('.cm-editor').exists()).toBe(true)
    wrapper.unmount()
  })

  it('applies and swaps a syntax-highlighting language without throwing', async () => {
    const wrapper = mount(CodeEditor, { props: { modelValue: 'graph TD\n A-->B', language: 'mermaid' } })
    expect(wrapper.find('.cm-editor').exists()).toBe(true)
    await wrapper.setProps({ language: 'plantuml' }) // null grammar
    await wrapper.setProps({ language: 'vega' }) // json grammar
    expect(wrapper.find('.cm-editor').exists()).toBe(true)
    wrapper.unmount()
  })
})
