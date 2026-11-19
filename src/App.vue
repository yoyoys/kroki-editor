<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeEditor from '@/components/CodeEditor.vue'
import DownloadDialog from '@/components/DownloadDialog.vue'
import ExamplesDialog from '@/components/ExamplesDialog.vue'
import FullscreenPreview from '@/components/FullscreenPreview.vue'
import Preview from '@/components/Preview.vue'
import ShareDialog from '@/components/ShareDialog.vue'
import Toolbar from '@/components/Toolbar.vue'
import { loadConfig } from '@/composables/useKrokiConfig'
import { useKrokiRender } from '@/composables/useKrokiRender'
import {
  DIAGRAM_SOURCE_ACCEPT,
  downloadBlob,
  imageFilename,
  mimeForType,
  readFileAsText,
  sourceFilename,
  typeForExtension,
} from '@/lib/diagramFile'
import { buildEditableHash, buildImageUrl, parseEditableHash } from '@/lib/diagramUrl'
import { decodeDiagram, encodeDiagram } from '@/lib/encoding'
import { renderMermaidSvg } from '@/lib/mermaidRender'

const config = loadConfig()
document.title = config.title
const { t } = useI18n()
// Theme is owned by Toolbar (useTheme there applies data-theme on mount).

const type = ref(config.defaultDiagram)
const source = ref(config.examples[type.value] ?? config.examples[config.defaultDiagram] ?? '')
const format = ref<'svg' | 'png'>('svg')
const mode = ref<'edit' | 'view'>('edit')
const fullscreen = ref(false)
const shareOpen = ref(false)
const examplesOpen = ref(false)
const downloadImageOpen = ref(false)
const downloadFormat = ref<'svg' | 'png'>('svg')
const downloadBusy = ref(false)
const downloadError = ref<string | null>(null)
// Set when the image couldn't be fetched (e.g. no CORS); the dialog offers it as a link.
const downloadFallbackUrl = ref<string | null>(null)
const isMobile = ref(false)

const fileInput = ref<HTMLInputElement>()
const pendingOpen = ref(false)
const openError = ref<string | null>(null)

const editorWidth = ref(50) // percent of the body width (desktop only)
let dragging = false

function onDrag(e: PointerEvent) {
  if (!dragging)
    return
  const pct = (e.clientX / window.innerWidth) * 100
  editorWidth.value = Math.min(80, Math.max(20, pct))
}
function stopDrag() {
  dragging = false
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', stopDrag)
}
function startDrag() {
  dragging = true
  window.addEventListener('pointermove', onDrag)
  window.addEventListener('pointerup', stopDrag)
}

const parsed = parseEditableHash(window.location.hash)
if (parsed) {
  type.value = parsed.type
  try {
    source.value = decodeDiagram(parsed.encoded)
  }
  catch { /* keep example */ }
}

const { imageSrc, error, loading, renderNow } = useKrokiRender({
  endpoint: config.endpoint,
  source,
  type,
  format,
  debounceMs: 400,
  mermaidClient: config.mermaidClient,
})

const encoded = computed(() => encodeDiagram(source.value))
const imageUrl = computed(() => buildImageUrl(config.endpoint, type.value, format.value, encoded.value))

let hashTimer: ReturnType<typeof setTimeout> | undefined
function syncHash() {
  window.history.replaceState(null, '', buildEditableHash(type.value, encoded.value))
}
function scheduleHashSync() {
  clearTimeout(hashTimer)
  hashTimer = setTimeout(syncHash, 400)
}
// One debounced hash update covers both source edits and type switches (both change `encoded`).
watch(encoded, scheduleHashSync)

const isDirty = computed(() => source.value.trim() !== '' && source.value !== (config.examples[type.value] ?? ''))

const pendingType = ref<string | null>(null)

function onTypeChange(next: string) {
  if (next === type.value)
    return
  // If the editor holds unsaved edits, ask before replacing them with the new example.
  if (isDirty.value) {
    pendingType.value = next
    return
  }
  // Pristine editor: switch and load the new type's example directly.
  type.value = next
  source.value = config.examples[next] ?? ''
}

function resolveTypeChange(clear: boolean) {
  const next = pendingType.value
  if (!next)
    return
  type.value = next
  if (clear)
    source.value = config.examples[next] ?? ''
  pendingType.value = null
}

// ---- open diagram source from a local file ----

function onOpen() {
  if (isDirty.value) {
    pendingOpen.value = true
    return
  }
  fileInput.value?.click()
}

function resolveOpen(confirm: boolean) {
  pendingOpen.value = false
  if (confirm)
    fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file)
    return
  // reset so the same file can be re-selected
  if (input)
    input.value = ''
  let text: string
  try {
    text = await readFileAsText(file)
  }
  catch {
    openError.value = t('open.readError', { name: file.name })
    return
  }
  // Try to pick the right diagram type from the file extension.
  const ext = file.name.includes('.') ? file.name.split('.').pop() : undefined
  const inferred = typeForExtension(ext, type.value, config.enabledDiagrams)
  if (inferred)
    type.value = inferred
  source.value = text
}

// ---- download rendered image ----

// Returns an error message, or null once the download has started.
async function downloadImage(selectedFormat: 'svg' | 'png'): Promise<string | null> {
  // Same renderer as the preview, so the file matches what the user sees.
  if (config.mermaidClient && type.value === 'mermaid' && selectedFormat === 'svg') {
    try {
      downloadBlob(await renderMermaidSvg(source.value), imageFilename('svg'), 'image/svg+xml')
      return null
    }
    catch {
      return t('download.failed')
    }
  }
  const url = buildImageUrl(config.endpoint, type.value, selectedFormat, encoded.value)
  let res: Response
  try {
    res = await fetch(url)
  }
  catch {
    // Likely a cross-origin endpoint without CORS: let the user open it themselves.
    downloadFallbackUrl.value = url
    return t('download.networkError')
  }
  if (!res.ok)
    return t('download.httpError', { status: res.status })
  downloadBlob(await res.blob(), imageFilename(selectedFormat))
  return null
}

// ---- download diagram source ----

function downloadSource() {
  downloadBlob(source.value, sourceFilename(type.value), mimeForType(type.value))
}

// ---- download dialog ----

function openDownloadDialog() {
  downloadFormat.value = format.value
  downloadError.value = null
  downloadFallbackUrl.value = null
  downloadImageOpen.value = true
}

async function onDownloadImage(selectedFormat: 'svg' | 'png') {
  downloadError.value = null
  downloadFallbackUrl.value = null
  downloadBusy.value = true
  try {
    downloadError.value = await downloadImage(selectedFormat)
  }
  catch {
    downloadError.value = t('download.failed')
  }
  finally {
    downloadBusy.value = false
  }
  if (!downloadError.value)
    downloadImageOpen.value = false
}

function onUseExample(entry: { diagramType: string, example: string }) {
  type.value = entry.diagramType
  source.value = decodeDiagram(entry.example)
  examplesOpen.value = false
}

function updateBreakpoint() {
  isMobile.value = window.matchMedia('(max-width: 760px)').matches
}

onMounted(() => {
  updateBreakpoint()
  window.addEventListener('resize', updateBreakpoint)
  // Render the initial diagram (example or hash-loaded); the watch only fires on change.
  renderNow()
})
onUnmounted(() => {
  window.removeEventListener('resize', updateBreakpoint)
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', stopDrag)
})

const host = computed(() => `${window.location.origin}${window.location.pathname}`.replace(/\/$/, ''))
</script>

<template>
  <div class="app">
    <Toolbar
      :title="config.title"
      :diagram-types="config.enabledDiagrams"
      :type="type"
      :mode="mode"
      :is-mobile="isMobile"
      :image-url="imageUrl"
      @update:type="onTypeChange"
      @update:mode="mode = $event"
      @open="onOpen"
      @share="shareOpen = true"
      @download-image="openDownloadDialog"
      @download-source="downloadSource"
      @fullscreen="fullscreen = true"
      @examples="examplesOpen = true"
    />

    <input
      ref="fileInput"
      type="file"
      :accept="DIAGRAM_SOURCE_ACCEPT"
      class="sr-only"
      @change="onFileChange"
    >

    <main class="body" :class="{ mobile: isMobile }">
      <section
        v-show="!isMobile || mode === 'edit'"
        class="pane editor-pane"
        :style="!isMobile ? { flex: `0 0 ${editorWidth}%` } : undefined"
      >
        <CodeEditor v-model="source" :error-line="error?.line ?? null" :language="type" />
      </section>
      <div v-if="!isMobile" class="splitter" @pointerdown.prevent="startDrag" />
      <section v-show="!isMobile || mode === 'view'" class="pane preview-pane">
        <Preview :image-src="imageSrc" :error="error" :loading="loading" />
      </section>
    </main>

    <FullscreenPreview v-if="fullscreen" :image-src="imageSrc" @close="fullscreen = false" />

    <ShareDialog
      v-if="shareOpen"
      :endpoint="config.endpoint"
      :host="host"
      :type="type"
      :encoded="encoded"
      @close="shareOpen = false"
    />

    <ExamplesDialog
      v-if="examplesOpen"
      :endpoint="config.exampleEndpoint"
      :dirty="isDirty"
      @use="onUseExample"
      @close="examplesOpen = false"
    />

    <DownloadDialog
      v-if="downloadImageOpen"
      :format="downloadFormat"
      :busy="downloadBusy"
      :blocked="error ? t('download.diagramError') : null"
      :error="downloadError"
      :fallback-url="downloadFallbackUrl"
      @close="downloadImageOpen = false"
      @download-image="onDownloadImage"
    />

    <div v-if="pendingType" class="confirm-backdrop" data-confirm="type-change" @click.self="pendingType = null">
      <div class="confirm-box">
        <p>{{ t('typeChange.confirm', { type: pendingType }) }}</p>
        <div class="confirm-actions">
          <button @click="resolveTypeChange(false)">
            {{ t('typeChange.keep') }}
          </button>
          <button class="primary" @click="resolveTypeChange(true)">
            {{ t('typeChange.clear') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="pendingOpen" class="confirm-backdrop" data-confirm="open" @click.self="resolveOpen(false)">
      <div class="confirm-box">
        <p>{{ t('open.confirm') }}</p>
        <div class="confirm-actions">
          <button @click="resolveOpen(false)">
            {{ t('open.cancel') }}
          </button>
          <button class="primary" @click="resolveOpen(true)">
            {{ t('open.replace') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="openError" class="confirm-backdrop" data-confirm="open-error" @click.self="openError = null">
      <div class="confirm-box">
        <p>{{ openError }}</p>
        <div class="confirm-actions">
          <button class="primary" @click="openError = null">
            {{ t('open.ok') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app { display: flex; flex-direction: column; height: 100vh; }
.body { flex: 1; display: flex; min-height: 0; }
.pane { flex: 1; min-width: 0; }
.splitter { flex: 0 0 6px; cursor: col-resize; background: var(--border, #3a3a3a); }
.splitter:hover { background: var(--accent, #6c8cff); }
.body.mobile .pane { flex: 1 1 100%; }
.confirm-backdrop { position: fixed; inset: 0; background: #000a; display: flex; align-items: center; justify-content: center; z-index: 70; }
.confirm-box { width: min(380px, 92vw); background: var(--surface, #1e1e1e); border: 1px solid var(--border, #444); border-radius: 12px; padding: 1.1rem 1.3rem; }
.confirm-box p { margin: 0; }
.confirm-actions { display: flex; justify-content: flex-end; gap: .6rem; margin-top: 1.1rem; }
.confirm-actions button { border: 1px solid var(--border, #444); background: transparent; color: inherit; border-radius: 6px; padding: .4rem .9rem; cursor: pointer; }
.confirm-actions .primary { background: var(--accent, #6c8cff); border-color: transparent; color: #fff; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
</style>
