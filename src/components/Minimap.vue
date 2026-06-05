<script setup lang="ts">
defineProps<{
  imageSrc: string | null
  viewport: { x: number, y: number, w: number, h: number }
}>()
</script>

<template>
  <div class="minimap">
    <img v-if="imageSrc" :src="imageSrc" alt="overview">
    <div
      class="vp"
      :style="{ left: `${viewport.x * 100}%`, top: `${viewport.y * 100}%`, width: `${viewport.w * 100}%`, height: `${viewport.h * 100}%` }"
    />
  </div>
</template>

<style scoped>
.minimap { position: absolute; right: .8rem; bottom: .8rem; width: 140px; height: 96px; background: #111c; border: 1px solid var(--border, #555); border-radius: 8px; overflow: hidden; }
.minimap img { width: 100%; height: 100%; object-fit: contain; opacity: .6; }
.vp { position: absolute; border: 2px solid var(--accent, #6c8cff); background: #6c8cff22; border-radius: 3px; pointer-events: none; }
</style>
