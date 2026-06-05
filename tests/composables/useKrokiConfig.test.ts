import { describe, expect, it } from 'vitest'
import { loadConfig } from '@/composables/useKrokiConfig'

describe('loadConfig', () => {
  it('reads window.__KROKI_CONFIG__ when present', () => {
    const original = window.__KROKI_CONFIG__
    window.__KROKI_CONFIG__ = { endpoint: 'https://win.test' }
    expect(loadConfig().endpoint).toBe('https://win.test')
    window.__KROKI_CONFIG__ = original
  })
})
