import { describe, expect, it } from 'vitest'
import { detectLocale } from '@/i18n'

describe('detectLocale', () => {
  it('maps zh-Hant / zh-TW variants to zh-TW', () => {
    expect(detectLocale(['zh-TW'])).toBe('zh-TW')
    expect(detectLocale(['zh-Hant-TW', 'en'])).toBe('zh-TW')
    expect(detectLocale(['zh-Hant'])).toBe('zh-TW')
  })

  it('falls back to en for anything else', () => {
    expect(detectLocale(['fr', 'de'])).toBe('en')
    expect(detectLocale(['zh-CN'])).toBe('en')
    expect(detectLocale([])).toBe('en')
  })

  it('prefers a stored override', () => {
    expect(detectLocale(['en'], 'zh-TW')).toBe('zh-TW')
    expect(detectLocale(['zh-TW'], 'en')).toBe('en')
  })
})
