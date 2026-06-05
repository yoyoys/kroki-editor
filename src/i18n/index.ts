import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zhTW from './locales/zh-TW'

export type Locale = 'en' | 'zh-TW'
export const SUPPORTED: Locale[] = ['en', 'zh-TW']
export const LOCALE_STORAGE_KEY = 'kroki-locale'

export function detectLocale(languages: readonly string[], override?: string | null): Locale {
  if (override === 'en' || override === 'zh-TW')
    return override
  for (const lang of languages) {
    const l = lang.toLowerCase()
    if (l.startsWith('zh-tw') || l.startsWith('zh-hant') || l === 'zh-hant')
      return 'zh-TW'
  }
  return 'en'
}

export function createAppI18n() {
  const override = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : null
  const locale = detectLocale(typeof navigator !== 'undefined' ? navigator.languages : [], override)
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: { 'en': en, 'zh-TW': zhTW },
  })
}

export const i18n = createAppI18n()
