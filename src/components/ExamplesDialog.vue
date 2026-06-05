<script setup lang="ts">
import type { Directive } from 'vue'
import type { GalleryExample } from '@/lib/exampleGallery'
import { Icon } from '@iconify/vue'
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildImageUrl } from '@/lib/diagramUrl'
import { EXAMPLE_GALLERY } from '@/lib/exampleGallery'

const props = defineProps<{ endpoint: string, dirty: boolean }>()
const emit = defineEmits<{ use: [entry: GalleryExample], close: [] }>()

const { t } = useI18n()
const query = ref('')
const pending = ref<GalleryExample | null>(null)

// Lazy thumbnails: a card's image URL is only requested once the card scrolls
// near the viewport, so opening the gallery doesn't fire one request per example.
const shown = ref(new Set<string>())
let observer: IntersectionObserver | null = null
function thumbObserver(): IntersectionObserver | null {
  if (observer || typeof IntersectionObserver === 'undefined')
    return observer
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        shown.value.add((entry.target as HTMLElement).dataset.thumbKey ?? '')
        observer?.unobserve(entry.target)
      }
    }
  }, { rootMargin: '600px' })
  return observer
}
const vThumb: Directive<HTMLElement, string> = {
  mounted(el, binding) {
    const obs = thumbObserver()
    if (!obs) { // no IntersectionObserver (e.g. jsdom) → load eagerly
      shown.value.add(binding.value)
      return
    }
    el.dataset.thumbKey = binding.value
    obs.observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
onUnmounted(() => observer?.disconnect())

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q)
    return EXAMPLE_GALLERY
  return EXAMPLE_GALLERY.filter((e) => {
    const hay = `${e.title} ${e.description} ${e.diagramType} ${(e.keywords ?? []).join(' ')}`.toLowerCase()
    return hay.includes(q)
  })
})

function thumb(e: GalleryExample) {
  return buildImageUrl(props.endpoint, e.diagramType, 'svg', e.example)
}
function onUse(e: GalleryExample) {
  if (props.dirty)
    pending.value = e
  else
    emit('use', e)
}
function confirmReplace() {
  if (pending.value)
    emit('use', pending.value)
  pending.value = null
}
</script>

<template>
  <div class="backdrop" @click.self="pending ? (pending = null) : emit('close')">
    <div class="dialog" data-dialog="examples">
      <header>
        <strong>{{ t('examples.title') }}</strong>
        <input v-model="query" class="search" :placeholder="t('examples.search')">
        <button class="close" :title="t('examples.close')" @click="emit('close')">
          <Icon icon="mdi:close" />
        </button>
      </header>

      <div class="grid">
        <div
          v-for="e in filtered"
          :key="e.example"
          v-thumb="e.example"
          class="card"
          role="button"
          tabindex="0"
          :title="t('examples.use')"
          @click="onUse(e)"
          @keydown.enter="onUse(e)"
        >
          <div class="thumb">
            <img v-if="shown.has(e.example)" :src="thumb(e)" :alt="e.title">
            <Icon v-else icon="mdi:image-outline" class="thumb-ph" />
          </div>
          <div class="meta">
            <div class="title-row">
              <strong>{{ e.title }}</strong>
              <span class="type">{{ e.diagramType }}</span>
            </div>
            <p v-if="e.description" class="desc">
              {{ e.description }}
            </p>
          </div>
          <a v-if="e.doc" class="docs" :href="e.doc" :title="t('examples.docs')" target="_blank" rel="noopener" @click.stop>
            <Icon icon="mdi:book-open-variant" />
          </a>
        </div>
        <p v-if="!filtered.length" class="empty">
          {{ t('examples.empty') }}
        </p>
      </div>

      <div v-if="pending" class="confirm" @click.self="pending = null">
        <div class="confirm-box">
          <p>{{ t('examples.confirmReplace') }}</p>
          <div class="confirm-actions">
            <button @click="pending = null">
              {{ t('examples.cancel') }}
            </button>
            <button class="danger" @click="confirmReplace">
              {{ t('examples.replace') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop { position: fixed; inset: 0; background: #000a; display: flex; align-items: center; justify-content: center; z-index: 50; padding: 2vh 2vw; }
.dialog { position: relative; width: min(1100px, 96vw); max-height: 92vh; display: flex; flex-direction: column; background: var(--surface, #1e1e1e); border: 1px solid var(--border, #444); border-radius: 14px; overflow: hidden; }
header { display: flex; align-items: center; gap: .8rem; padding: .9rem 1.1rem; border-bottom: 1px solid var(--border, #444); }
header strong { font-size: 1.05rem; }
.search { flex: 1; max-width: 360px; margin-left: auto; background: #111; border: 1px solid var(--border, #444); border-radius: 8px; color: inherit; padding: .4rem .7rem; font-size: .85rem; }
.close { background: transparent; border: 0; color: inherit; cursor: pointer; }
.grid { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); align-items: start; align-content: start; gap: 1.25rem; padding: 1.25rem; overflow-y: auto; background: var(--bg, #161616); }
.card { position: relative; display: flex; flex-direction: column; border: 1px solid var(--border, #3a3a3a); border-radius: 12px; background: var(--surface-2, #2a2a2e); box-shadow: 0 2px 8px rgb(0 0 0 / 22%); cursor: pointer; transition: border-color .12s, box-shadow .12s, transform .12s; }
.card:hover, .card:focus-visible { border-color: var(--accent, #6c8cff); box-shadow: 0 6px 18px rgb(0 0 0 / 32%); transform: translateY(-2px); outline: none; }
.thumb { flex: 0 0 150px; margin: .6rem .6rem 0; border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: .5rem; }
.thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
.thumb-ph { font-size: 2.2rem; color: #c8c8c8; }
.meta { padding: .55rem .75rem .7rem; }
.title-row { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; }
.title-row strong { font-weight: 600; }
.type { font-size: .65rem; opacity: .5; font-family: monospace; }
.desc { margin: .3rem 0 0; font-size: .78rem; opacity: .7; }
.docs { position: absolute; top: .4rem; right: .4rem; color: #333; background: #fffd; border-radius: 6px; padding: .15rem .25rem; opacity: .85; display: inline-flex; }
.docs:hover { opacity: 1; }
.empty { grid-column: 1 / -1; text-align: center; opacity: .6; padding: 2rem; }
.confirm { position: absolute; inset: 0; background: #000b; display: flex; align-items: center; justify-content: center; }
.confirm-box { background: var(--surface, #1e1e1e); border: 1px solid var(--border, #444); border-radius: 12px; padding: 1.1rem 1.3rem; max-width: 360px; }
.confirm-actions { display: flex; justify-content: flex-end; gap: .6rem; margin-top: 1rem; }
.confirm-actions button { border: 1px solid var(--border, #444); background: transparent; color: inherit; border-radius: 6px; padding: .35rem .9rem; cursor: pointer; }
.confirm-actions .danger { background: var(--accent, #6c8cff); border-color: transparent; color: #fff; }
</style>
