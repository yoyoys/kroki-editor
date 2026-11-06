<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  format: 'svg' | 'png'
  busy?: boolean
  /** Why the diagram can't be downloaded right now (e.g. it doesn't render). */
  blocked?: string | null
  error?: string | null
  /** Image URL the user can open directly when fetching it failed. */
  fallbackUrl?: string | null
}>()
defineEmits<{
  close: []
  downloadImage: [format: 'svg' | 'png']
}>()

const { t } = useI18n()
const format = ref(props.format)
</script>

<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="dialog">
      <header>
        <strong>{{ t('download.downloadImage') }}</strong>
        <button @click="$emit('close')">
          <Icon icon="mdi:close" />
        </button>
      </header>

      <div class="fmt">
        <span>{{ t('download.format') }}</span>
        <div class="seg">
          <button
            :class="{ on: format === 'svg' }"
            data-fmt="svg"
            @click="format = 'svg'"
          >
            SVG
          </button>
          <button
            :class="{ on: format === 'png' }"
            data-fmt="png"
            @click="format = 'png'"
          >
            PNG
          </button>
        </div>
      </div>

      <p v-if="blocked || error" class="msg" role="alert">
        {{ blocked || error }}
        <a v-if="!blocked && fallbackUrl" :href="fallbackUrl" target="_blank" rel="noopener">
          {{ t('download.openInTab') }}
        </a>
      </p>

      <div class="actions">
        <button @click="$emit('close')">
          {{ t('download.cancel') }}
        </button>
        <button class="primary" :disabled="busy || !!blocked" @click="$emit('downloadImage', format)">
          {{ t('download.download') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; background: #000a; display: flex; align-items: center; justify-content: center; z-index: 50; }
.dialog { width: min(360px, 92vw); background: var(--surface, #1e1e1e); border: 1px solid var(--border, #444); border-radius: 14px; padding: 1rem 1.2rem; }
header { display: flex; align-items: center; margin-bottom: .8rem; }
header strong { flex: 1; }
header button { background: transparent; border: 0; color: inherit; cursor: pointer; }
.fmt { display: flex; align-items: center; gap: .5rem; margin-bottom: 1rem; font-size: .8rem; }
.seg { display: flex; background: #111; border-radius: 7px; padding: 2px; }
.seg button { border: 0; color: inherit; background: transparent; padding: .2rem .7rem; border-radius: 5px; cursor: pointer; }
.seg button.on { background: var(--accent, #6c8cff); }
.actions { display: flex; justify-content: flex-end; gap: .6rem; margin-top: .9rem; }
.actions button { border: 1px solid var(--border, #444); background: transparent; color: inherit; border-radius: 6px; padding: .4rem .9rem; cursor: pointer; }
.msg { margin: 0; font-size: .8rem; color: var(--error, #e5484d); }
.msg a { display: block; margin-top: .3rem; color: var(--accent, #6c8cff); }
.actions .primary:disabled { opacity: .5; cursor: not-allowed; }
.actions .primary { background: var(--accent, #6c8cff); border-color: transparent; color: #fff; }
</style>
