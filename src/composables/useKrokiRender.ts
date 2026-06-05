import type { Ref } from 'vue'
import type { ClassifiedError } from '@/lib/krokiError'
import { ref, watch } from 'vue'
import { buildImageUrl } from '@/lib/diagramUrl'
import { encodeDiagram } from '@/lib/encoding'
import { classifyKrokiError } from '@/lib/krokiError'
import { renderMermaidSvg } from '@/lib/mermaidRender'

interface RenderOptions {
  endpoint: string
  source: Ref<string>
  type: Ref<string>
  format: Ref<string>
  debounceMs?: number
  /** When true, Mermaid diagrams are rendered in the browser instead of via Kroki. */
  mermaidClient?: boolean
}

export function useKrokiRender(opts: RenderOptions) {
  const imageSrc = ref<string | null>(null)
  const error = ref<ClassifiedError | null>(null)
  const loading = ref(false)
  let lastObjectUrl: string | null = null
  let timer: ReturnType<typeof setTimeout> | undefined

  function setImage(blob: Blob) {
    if (lastObjectUrl)
      URL.revokeObjectURL(lastObjectUrl)
    lastObjectUrl = URL.createObjectURL(blob)
    imageSrc.value = lastObjectUrl
  }

  function message(e: unknown): string {
    return e instanceof Error ? e.message : String(e)
  }

  async function renderNow() {
    const src = opts.source.value
    if (!src.trim()) {
      error.value = null
      return
    }
    loading.value = true
    try {
      // Client-side Mermaid: render in the browser, skip Kroki entirely.
      if (opts.mermaidClient && opts.type.value === 'mermaid') {
        try {
          const svg = await renderMermaidSvg(src)
          setImage(new Blob([svg], { type: 'image/svg+xml' }))
          error.value = null
        }
        catch (e) {
          // Mermaid failures are syntax errors, not network ones.
          error.value = classifyKrokiError({ status: 400, body: message(e) })
        }
        return
      }

      const encoded = encodeDiagram(src)
      const url = buildImageUrl(opts.endpoint, opts.type.value, opts.format.value, encoded)
      const res = await fetch(url)
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        error.value = classifyKrokiError({ status: res.status, body })
        return
      }
      setImage(await res.blob())
      error.value = null
    }
    catch (e) {
      error.value = classifyKrokiError({ networkError: true, body: message(e) })
    }
    finally {
      loading.value = false
    }
  }

  function scheduleRender() {
    clearTimeout(timer)
    timer = setTimeout(renderNow, opts.debounceMs ?? 400)
  }

  watch([opts.source, opts.type, opts.format], scheduleRender)

  return { imageSrc, error, loading, renderNow, scheduleRender }
}
