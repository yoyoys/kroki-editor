<script setup lang="ts">
import type { ClassifiedError } from '@/lib/krokiError'
import { Icon } from '@iconify/vue'
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePanzoom } from '@/composables/usePanzoom'
import { usePreviewBackground } from '@/composables/usePreviewBackground'
import ZoomControls from './ZoomControls.vue'

defineProps<{ imageSrc: string | null, error: ClassifiedError | null, loading?: boolean }>()

const { t } = useI18n()
const { mode: bgMode, color: bgColor, toggle: toggleBg } = usePreviewBackground()
const stage = ref<HTMLDivElement>()
const content = ref<HTMLDivElement>()
const img = ref<HTMLImageElement>()
const errorOpen = ref(false)
const pz = shallowRef<ReturnType<typeof usePanzoom>>()

onMounted(() => {
  pz.value = usePanzoom(content.value!)
})
onBeforeUnmount(() => pz.value?.destroy())

function doFit() {
  if (!pz.value || !stage.value || !img.value)
    return
  pz.value.fit(stage.value.clientWidth, stage.value.clientHeight, img.value.naturalWidth, img.value.naturalHeight)
}
</script>

<template>
  <div class="preview">
    <div v-if="error" class="error-bar">
      <div class="error-msg">
        <Icon icon="mdi:alert-circle-outline" />
        <span class="error-text">
          {{ t(`previewError.${error.kind}`) }}<template v-if="error.line"> · {{ t('previewError.near', { line: error.line }) }}</template>
        </span>
        <button class="error-toggle" @click="errorOpen = !errorOpen">
          {{ t('previewError.details') }}
          <Icon :icon="errorOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" />
        </button>
      </div>
      <pre v-if="errorOpen" class="error-detail">{{ error.raw }}</pre>
    </div>

    <div ref="stage" class="stage" :style="{ background: bgColor }">
      <div ref="content" class="content">
        <img v-if="imageSrc" ref="img" :src="imageSrc" alt="diagram">
        <div v-else-if="!loading" class="empty">
          {{ t('preview.empty') }}
        </div>
      </div>

      <div v-if="loading" class="rendering">
        <Icon icon="mdi:loading" class="spin" /> {{ t('preview.rendering') }}
      </div>

      <ZoomControls
        class="overlay"
        :percent="pz?.percent.value ?? 100"
        :bg-mode="bgMode"
        @zoom-in="pz?.zoomIn()"
        @zoom-out="pz?.zoomOut()"
        @fit="doFit()"
        @reset="pz?.reset()"
        @toggle-bg="toggleBg"
      />
    </div>
  </div>
</template>

<style scoped>
.preview { position: relative; height: 100%; display: flex; flex-direction: column; }
.stage { position: relative; flex: 1; overflow: hidden; }
.content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.content img { max-width: none; user-select: none; }
.overlay { position: absolute; right: .7rem; bottom: .7rem; }
.rendering { position: absolute; top: .7rem; left: .7rem; display: flex; align-items: center; gap: .35rem; background: #000000b3; color: #fff; border-radius: 999px; padding: .25rem .7rem; font-size: .78rem; pointer-events: none; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.error-bar { background: #5a1d1d; border-bottom: 1px solid #803; color: #ffe; }
.error-msg { display: flex; gap: .4rem; align-items: center; padding: .45rem .7rem; font-size: .82rem; }
.error-text { flex: 1; min-width: 0; }
.error-toggle { flex: 0 0 auto; display: inline-flex; align-items: center; gap: .2rem; background: transparent; border: 1px solid #ffffff33; color: inherit; border-radius: 6px; padding: .1rem .4rem; font-size: .72rem; cursor: pointer; }
.error-toggle:hover { background: #ffffff14; }
.error-detail { margin: 0; padding: .2rem .7rem .5rem; max-height: 30vh; overflow: auto; font-size: .72rem; white-space: pre-wrap; opacity: .85; }
.empty { color: #888; }
</style>
