import { ref } from 'vue'

/**
 * Copy text to the clipboard and track which item was just copied so the UI can
 * show a transient "Copied!" hint. `copied` holds the last key (defaults to the
 * copied text) and resets after `resetMs`.
 */
export function useClipboard(resetMs = 1500) {
  const copied = ref<string | null>(null)
  let timer: ReturnType<typeof setTimeout> | undefined

  async function copy(text: string, key: string = text) {
    try {
      await navigator.clipboard?.writeText(text)
    }
    catch {
      // clipboard may be unavailable (insecure context); still flash the hint
    }
    copied.value = key
    clearTimeout(timer)
    timer = setTimeout(() => {
      copied.value = null
    }, resetMs)
  }

  return { copied, copy }
}
