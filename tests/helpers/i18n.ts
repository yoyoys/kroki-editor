import { createI18n } from 'vue-i18n'
import en from '@/i18n/locales/en'
import zhTW from '@/i18n/locales/zh-TW'

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { 'en': en, 'zh-TW': zhTW },
})
