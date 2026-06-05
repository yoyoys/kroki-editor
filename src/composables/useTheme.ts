import { ref, watchEffect } from 'vue'

type Theme = 'light' | 'dark'
const STORAGE_KEY = 'kroki-theme'

function systemTheme(): Theme {
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  const theme = ref<Theme>(stored ?? systemTheme())

  watchEffect(() => {
    document.documentElement.dataset.theme = theme.value
  })

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, theme.value)
  }

  return { theme, toggle }
}
