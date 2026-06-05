<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@/composables/useClipboard'
import { useLocale } from '@/composables/useLocale'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{
  title?: string
  diagramTypes: string[]
  type: string
  mode: 'edit' | 'view'
  isMobile: boolean
  imageUrl: string
}>()
const emit = defineEmits<{
  'update:type': [type: string]
  'update:mode': [mode: 'edit' | 'view']
  'share': []
  'fullscreen': []
  'examples': []
}>()

const { t } = useI18n()
const { locale, toggle: toggleLocale } = useLocale()
const { theme, toggle: toggleTheme } = useTheme()
const { copied, copy } = useClipboard()
</script>

<template>
  <header class="toolbar">
    <span class="logo">🪁 {{ props.title || t('app.title') }}</span>

    <select
      :value="type"
      @change="emit('update:type', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="d in diagramTypes" :key="d" :value="d">
        {{ d }}
      </option>
    </select>

    <button data-act="examples" :title="t('toolbar.examples')" @click="emit('examples')">
      <Icon icon="mdi:view-gallery-outline" />
    </button>

    <div v-if="isMobile" class="seg">
      <button :class="{ on: mode === 'edit' }" data-mode="edit" @click="emit('update:mode', 'edit')">
        <Icon icon="mdi:pencil" /> {{ t('toolbar.edit') }}
      </button>
      <button :class="{ on: mode === 'view' }" data-mode="view" @click="emit('update:mode', 'view')">
        <Icon icon="mdi:eye" /> {{ t('toolbar.view') }}
      </button>
    </div>

    <span class="spacer" />

    <button data-act="lang" :title="t('toolbar.language')" @click="toggleLocale">
      <Icon icon="mdi:translate" /> {{ locale === 'zh-TW' ? '中' : 'EN' }}
    </button>
    <button data-act="theme" :title="t('toolbar.theme')" @click="toggleTheme">
      <Icon :icon="theme === 'dark' ? 'mdi:weather-night' : 'mdi:white-balance-sunny'" />
    </button>
    <button
      data-act="copy-image"
      class="copy"
      :class="{ ok: copied === 'toolbar' }"
      :title="copied === 'toolbar' ? t('share.copied') : t('toolbar.copyImage')"
      @click="copy(props.imageUrl, 'toolbar')"
    >
      <Icon :icon="copied === 'toolbar' ? 'mdi:check' : 'mdi:link-variant'" />
    </button>
    <button data-act="share" @click="emit('share')">
      <Icon icon="mdi:share-variant" /> {{ t('toolbar.share') }}
    </button>
    <button data-act="fullscreen" :title="t('toolbar.fullscreen')" @click="emit('fullscreen')">
      <Icon icon="mdi:fullscreen" />
    </button>
  </header>
</template>

<style scoped>
.toolbar { display: flex; align-items: center; gap: .6rem; padding: .55rem .8rem; border-bottom: 1px solid var(--border, #3a3a3a); }
.logo { font-weight: 600; font-size: .95rem; }
.spacer { flex: 1; }
select { padding: .25rem .5rem; border-radius: 6px; background: #222; color: inherit; border: 1px solid var(--border, #444); }
.seg { display: flex; background: #111; border-radius: 8px; padding: 2px; }
.seg button { border: 0; background: transparent; color: inherit; padding: .25rem .6rem; border-radius: 6px; cursor: pointer; font-size: .8rem; }
.seg button.on { background: var(--accent, #6c8cff); }
button { background: transparent; border: 0; color: inherit; cursor: pointer; display: inline-flex; align-items: center; gap: .3rem; }
[data-act="share"] { background: var(--accent, #6c8cff); border-radius: 6px; padding: .3rem .6rem; }
.copy.ok { color: #4caf50; }
</style>
