import type { Locale } from '@/i18n'
import { useI18n } from 'vue-i18n'
import { LOCALE_STORAGE_KEY, SUPPORTED } from '@/i18n'

export function useLocale() {
  const { locale } = useI18n()

  function setLocale(next: Locale) {
    locale.value = next
    localStorage.setItem(LOCALE_STORAGE_KEY, next)
  }
  function toggle() {
    const idx = SUPPORTED.indexOf(locale.value as Locale)
    setLocale(SUPPORTED[(idx + 1) % SUPPORTED.length])
  }

  return { locale, setLocale, toggle, supported: SUPPORTED }
}
