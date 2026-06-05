import { computed, ref } from 'vue'

type BgMode = 'light' | 'dark'

const STORAGE_KEY = 'kroki-preview-bg'
const COLORS: Record<BgMode, string> = { light: '#f6f6f7', dark: '#1b1b1d' }

function initial(): BgMode {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  return stored === 'dark' ? 'dark' : 'light'
}

// Module-level singleton so the editor preview and the fullscreen preview stay in sync.
const mode = ref<BgMode>(initial())

export function usePreviewBackground() {
  const color = computed(() => COLORS[mode.value])

  function toggle() {
    mode.value = mode.value === 'light' ? 'dark' : 'light'
    localStorage.setItem(STORAGE_KEY, mode.value)
  }

  return { mode, color, toggle }
}
