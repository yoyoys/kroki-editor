import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ExamplesDialog from '@/components/ExamplesDialog.vue'
import { i18n } from '../helpers/i18n'

function mountDialog(dirty = false) {
  return mount(ExamplesDialog, {
    props: { endpoint: 'https://k.io', dirty },
    global: { plugins: [i18n] },
  })
}

describe('examplesDialog', () => {
  it('renders many example cards', () => {
    const w = mountDialog()
    expect(w.findAll('.card').length).toBeGreaterThan(50)
  })

  it('filters cards by search query', async () => {
    const w = mountDialog()
    const all = w.findAll('.card').length
    await w.find('.search').setValue('mermaid')
    const some = w.findAll('.card').length
    expect(some).toBeGreaterThan(0)
    expect(some).toBeLessThan(all)
  })

  it('emits use immediately when clicking a card and not dirty', async () => {
    const w = mountDialog(false)
    await w.find('.card').trigger('click')
    expect(w.emitted('use')).toHaveLength(1)
  })

  it('asks to confirm when dirty, then emits use on replace', async () => {
    const w = mountDialog(true)
    await w.find('.card').trigger('click')
    expect(w.emitted('use')).toBeUndefined()
    expect(w.find('.confirm').exists()).toBe(true)
    await w.find('.confirm .danger').trigger('click')
    expect(w.emitted('use')).toHaveLength(1)
  })
})
