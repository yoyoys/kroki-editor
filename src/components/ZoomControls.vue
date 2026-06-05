<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'

defineProps<{ percent: number, bgMode?: 'light' | 'dark' }>()
defineEmits<{
  zoomIn: []
  zoomOut: []
  fit: []
  reset: []
  toggleBg: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="zoom-controls">
    <button data-act="out" :title="t('zoom.out')" @click="$emit('zoomOut')">
      <Icon icon="mdi:minus" />
    </button>
    <span class="percent">{{ Math.round(percent) }}%</span>
    <button data-act="in" :title="t('zoom.in')" @click="$emit('zoomIn')">
      <Icon icon="mdi:plus" />
    </button>
    <span class="sep" />
    <button data-act="fit" :title="t('zoom.fit')" @click="$emit('fit')">
      <Icon icon="mdi:fit-to-screen-outline" />
    </button>
    <button data-act="reset" title="100%" @click="$emit('reset')">
      1:1
    </button>
    <template v-if="bgMode">
      <span class="sep" />
      <button data-act="bg" :title="t('zoom.background')" @click="$emit('toggleBg')">
        <Icon :icon="bgMode === 'light' ? 'mdi:circle-half-full' : 'mdi:circle-outline'" />
      </button>
    </template>
  </div>
</template>

<style scoped>
.zoom-controls { display: flex; align-items: center; gap: .3rem; background: var(--surface-overlay, #2a2a2ad9); border: 1px solid var(--border, #555); border-radius: 10px; padding: .3rem .4rem; }
.percent { min-width: 46px; text-align: center; font-size: .78rem; }
.sep { width: 1px; height: 20px; background: var(--border, #555); margin: 0 .2rem; }
button { background: transparent; border: 0; color: inherit; cursor: pointer; padding: .2rem .4rem; border-radius: 6px; }
button:hover { background: var(--hover, #ffffff14); }
</style>
