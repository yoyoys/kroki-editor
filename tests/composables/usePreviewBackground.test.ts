import { beforeEach, describe, expect, it } from 'vitest'
import { usePreviewBackground } from '@/composables/usePreviewBackground'

describe('usePreviewBackground', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to a near-white background', () => {
    const { mode, color } = usePreviewBackground()
    // module singleton may carry state across tests; force a known state
    if (mode.value !== 'light')
      usePreviewBackground().toggle()
    expect(mode.value).toBe('light')
    expect(color.value.toLowerCase()).toMatch(/^#f/)
  })

  it('toggles to near-black and persists', () => {
    const { mode, color, toggle } = usePreviewBackground()
    if (mode.value !== 'light')
      toggle()
    toggle()
    expect(mode.value).toBe('dark')
    expect(color.value.toLowerCase()).toMatch(/^#1/)
    expect(localStorage.getItem('kroki-preview-bg')).toBe('dark')
    toggle() // restore for other tests
  })
})
