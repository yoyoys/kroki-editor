<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CodeEditor from '@/components/CodeEditor.vue'
import ExamplesDialog from '@/components/ExamplesDialog.vue'
import FullscreenPreview from '@/components/FullscreenPreview.vue'
import Preview from '@/components/Preview.vue'
import ShareDialog from '@/components/ShareDialog.vue'
import Toolbar from '@/components/Toolbar.vue'
import { loadConfig } from '@/composables/useKrokiConfig'
import { useKrokiRender } from '@/composables/useKrokiRender'
import { buildEditableHash, buildImageUrl, parseEditableHash } from '@/lib/diagramUrl'
import { decodeDiagram, encodeDiagram } from '@/lib/encoding'

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
const isMobile = ref(false)

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
      @share="shareOpen = true"
      @fullscreen="fullscreen = true"
      @examples="examplesOpen = true"
    />

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
</style>
