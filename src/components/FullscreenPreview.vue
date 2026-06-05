<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePanzoom } from '@/composables/usePanzoom'
import { usePreviewBackground } from '@/composables/usePreviewBackground'
import Minimap from './Minimap.vue'
import ZoomControls from './ZoomControls.vue'

defineProps<{ imageSrc: string | null }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const { mode: bgMode, color: bgColor, toggle: toggleBg } = usePreviewBackground()
const stage = ref<HTMLDivElement>()
const content = ref<HTMLDivElement>()
const img = ref<HTMLImageElement>()
const viewport = ref({ x: 0.25, y: 0.25, w: 0.5, h: 0.5 })
const pz = shallowRef<ReturnType<typeof usePanzoom>>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape')
    emit('close')
}

onMounted(() => {
  pz.value = usePanzoom(content.value!)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  pz.value?.destroy()
  window.removeEventListener('keydown', onKey)
})

function doFit() {
  if (!pz.value || !stage.value || !img.value)
    return
  pz.value.fit(stage.value.clientWidth, stage.value.clientHeight, img.value.naturalWidth, img.value.naturalHeight)
}
</script>

<template>
  <div class="fs">
    <button class="exit" data-exit @click="emit('close')">
      <Icon icon="mdi:close" /> {{ t('fullscreen.exit') }}
    </button>

    <div ref="stage" class="stage" :style="{ background: bgColor }">
      <div ref="content" class="content">
        <img v-if="imageSrc" ref="img" :src="imageSrc" alt="diagram">
      </div>
    </div>

    <ZoomControls
      class="zc"
      :percent="pz?.percent.value ?? 100"
      :bg-mode="bgMode"
      @zoom-in="pz?.zoomIn()"
      @zoom-out="pz?.zoomOut()"
      @fit="doFit()"
      @reset="pz?.reset()"
      @toggle-bg="toggleBg"
    />

    <Minimap :image-src="imageSrc" :viewport="viewport" />
  </div>
</template>

<style scoped>
.fs { position: fixed; inset: 0; z-index: 60; background: var(--bg, #161616); }
.stage { position: absolute; inset: 0; overflow: hidden; cursor: grab; }
.content { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.content img { max-width: none; user-select: none; }
.exit { position: absolute; top: .7rem; right: .7rem; z-index: 2; background: #2a2a2acc; border: 1px solid var(--border, #555); color: inherit; border-radius: 8px; padding: .35rem .7rem; cursor: pointer; }
.zc { position: absolute; bottom: .8rem; left: 50%; transform: translateX(-50%); z-index: 2; }
</style>
