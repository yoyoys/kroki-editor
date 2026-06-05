<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@/composables/useClipboard'
import { buildEditableHash, buildImageUrl } from '@/lib/diagramUrl'

const props = defineProps<{
  endpoint: string
  host: string
  type: string
  encoded: string
}>()
defineEmits<{ close: [] }>()

const { t } = useI18n()
const STORAGE_KEY = 'kroki-share-expanded'
const format = ref<'svg' | 'png'>('svg')
const expanded = ref(localStorage.getItem(STORAGE_KEY) === '1')

const imageUrl = computed(() => buildImageUrl(props.endpoint, props.type, format.value, props.encoded))
const embedMd = computed(() => `![](${imageUrl.value})`)
const editableUrl = computed(() => `${props.host}/${buildEditableHash(props.type, props.encoded)}`)
const editableMd = computed(() => `[diagram](${editableUrl.value})`)

const { copied, copy } = useClipboard()

function toggleEditable() {
  expanded.value = !expanded.value
  localStorage.setItem(STORAGE_KEY, expanded.value ? '1' : '0')
}
</script>

<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="dialog">
      <header>
        <strong>{{ t('share.title') }}</strong>
        <button @click="$emit('close')">
          <Icon icon="mdi:close" />
        </button>
      </header>

      <div class="fmt">
        <span>{{ t('share.format') }}</span>
        <div class="seg">
          <button :class="{ on: format === 'svg' }" data-fmt="svg" @click="format = 'svg'">
            SVG
          </button>
          <button :class="{ on: format === 'png' }" data-fmt="png" @click="format = 'png'">
            PNG
          </button>
        </div>
      </div>

      <label>{{ t('share.imageUrl') }}</label>
      <div class="row">
        <input :value="imageUrl" readonly>
        <button class="copy" :class="{ ok: copied === 'image' }" @click="copy(imageUrl, 'image')">
          <Icon :icon="copied === 'image' ? 'mdi:check' : 'mdi:content-copy'" />
          <span v-if="copied === 'image'">{{ t('share.copied') }}</span>
        </button>
      </div>

      <label>{{ t('share.embed') }}</label>
      <div class="row">
        <input :value="embedMd" readonly>
        <button class="copy" :class="{ ok: copied === 'embed' }" @click="copy(embedMd, 'embed')">
          <Icon :icon="copied === 'embed' ? 'mdi:check' : 'mdi:content-copy'" />
          <span v-if="copied === 'embed'">{{ t('share.copied') }}</span>
        </button>
      </div>

      <button class="toggle" data-toggle-editable @click="toggleEditable">
        <Icon :icon="expanded ? 'mdi:chevron-down' : 'mdi:chevron-right'" /> {{ t('share.editable') }}
      </button>

      <div v-if="expanded" data-editable class="editable">
        <label>{{ t('share.editableUrl') }}</label>
        <div class="row">
          <input :value="editableUrl" readonly>
          <button class="copy" :class="{ ok: copied === 'editableUrl' }" @click="copy(editableUrl, 'editableUrl')">
            <Icon :icon="copied === 'editableUrl' ? 'mdi:check' : 'mdi:content-copy'" />
            <span v-if="copied === 'editableUrl'">{{ t('share.copied') }}</span>
          </button>
        </div>
        <label>{{ t('share.editableMd') }}</label>
        <div class="row">
          <input :value="editableMd" readonly>
          <button class="copy" :class="{ ok: copied === 'editableMd' }" @click="copy(editableMd, 'editableMd')">
            <Icon :icon="copied === 'editableMd' ? 'mdi:check' : 'mdi:content-copy'" />
            <span v-if="copied === 'editableMd'">{{ t('share.copied') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; background: #000a; display: flex; align-items: center; justify-content: center; z-index: 50; }
.dialog { width: min(460px, 92vw); background: var(--surface, #1e1e1e); border: 1px solid var(--border, #444); border-radius: 14px; padding: 1rem 1.2rem; }
header { display: flex; align-items: center; margin-bottom: .8rem; }
header strong { flex: 1; }
header button, .row button { background: transparent; border: 0; color: inherit; cursor: pointer; }
.row .copy { display: inline-flex; align-items: center; gap: .25rem; font-size: .65rem; white-space: nowrap; border-radius: 6px; padding: 0 .4rem; }
.row .copy.ok { color: #4caf50; }
.fmt { display: flex; align-items: center; gap: .5rem; margin-bottom: 1rem; font-size: .8rem; }
.seg { display: flex; background: #111; border-radius: 7px; padding: 2px; }
.seg button { border: 0; color: inherit; background: transparent; padding: .2rem .7rem; border-radius: 5px; cursor: pointer; }
.seg button.on { background: var(--accent, #6c8cff); }
label { display: block; font-size: .62rem; opacity: .6; text-transform: uppercase; margin: .5rem 0 .2rem; }
.row { display: flex; gap: .4rem; }
.row input { flex: 1; font-family: monospace; font-size: .72rem; background: #111; border: 1px solid var(--border, #444); border-radius: 6px; color: inherit; padding: .35rem .5rem; }
.toggle { width: 100%; text-align: left; background: #161616; border: 1px dashed var(--border, #444); border-radius: 8px; color: inherit; padding: .45rem .5rem; margin-top: .9rem; cursor: pointer; }
.editable { border: 1px dashed var(--border, #444); border-top: 0; border-radius: 0 0 8px 8px; padding: .2rem .5rem .7rem; }
</style>
