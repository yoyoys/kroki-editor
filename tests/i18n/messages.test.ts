import { describe, expect, it } from 'vitest'
import en from '@/i18n/locales/en'
import zhTW from '@/i18n/locales/zh-TW'

function keys(obj: Record<string, any>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  )
}

describe('i18n catalogs', () => {
  it('en and zh-TW have identical key sets', () => {
    expect(keys(en).sort()).toEqual(keys(zhTW).sort())
  })

  it('include core keys', () => {
    expect(en).toHaveProperty('toolbar.share')
    expect(zhTW).toHaveProperty('previewError.syntax')
  })
})
