import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTheme } from '@/composables/useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.dataset.theme = ''
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn() }) as any
  })

  it('defaults to system (dark via matchMedia) and applies data-theme', () => {
    const { theme } = useTheme()
    expect(theme.value).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('toggles and persists to localStorage', () => {
    const { theme, toggle } = useTheme()
    toggle()
    expect(theme.value).toBe('light')
    expect(localStorage.getItem('kroki-theme')).toBe('light')
  })
})
