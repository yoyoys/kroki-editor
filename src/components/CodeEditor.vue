<script setup lang="ts">
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { bracketMatching, HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { searchKeymap } from '@codemirror/search'
import { Compartment, EditorState, StateEffect, StateField } from '@codemirror/state'
import { Decoration, drawSelection, EditorView, keymap, lineNumbers } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { languageFor } from '@/lib/editorLanguage'

const props = defineProps<{ modelValue: string, errorLine?: number | null, language?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// Token colours come from CSS variables (defined per app theme in styles.css),
// so highlighting adapts to light/dark without swapping editor themes.
const highlightStyle = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.operatorKeyword], color: 'var(--cm-keyword)' },
  { tag: [t.string, t.special(t.string), t.regexp], color: 'var(--cm-string)' },
  { tag: [t.number, t.bool, t.null, t.atom], color: 'var(--cm-number)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--cm-comment)', fontStyle: 'italic' },
  { tag: [t.propertyName, t.attributeName], color: 'var(--cm-property)' },
  { tag: [t.typeName, t.className, t.tagName, t.namespace], color: 'var(--cm-type)' },
  { tag: [t.operator, t.punctuation, t.bracket, t.separator], color: 'var(--cm-punct)' },
])

const languageCompartment = new Compartment()

// Highlight the line a render error points at (red gutter accent + line background).
const setErrorLine = StateEffect.define<number | null>()
const errorLineDeco = Decoration.line({ class: 'cm-error-line' })
const errorLineField = StateField.define({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes)
    for (const e of tr.effects) {
      if (e.is(setErrorLine)) {
        const ln = e.value
        if (ln == null || ln < 1 || ln > tr.state.doc.lines) {
          deco = Decoration.none
        }
        else {
          const line = tr.state.doc.line(ln)
          deco = Decoration.set([errorLineDeco.range(line.from)])
        }
      }
    }
    return deco
  },
  provide: f => EditorView.decorations.from(f),
})

const host = ref<HTMLDivElement>()
let view: EditorView | undefined

function applyErrorLine() {
  view?.dispatch({ effects: setErrorLine.of(props.errorLine ?? null) })
}

onMounted(() => {
  view = new EditorView({
    parent: host.value!,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        bracketMatching(),
        languageCompartment.of(languageFor(props.language ?? '') ?? []),
        syntaxHighlighting(highlightStyle),
        history(),
        drawSelection(),
        errorLineField,
        EditorState.allowMultipleSelections.of(true),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => {
          if (u.docChanged)
            emit('update:modelValue', u.state.doc.toString())
        }),
      ],
    }),
  })
  applyErrorLine()
})

watch(() => props.modelValue, (val) => {
  if (view && val !== view.state.doc.toString()) {
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: val } })
  }
})

watch(() => props.errorLine, applyErrorLine)

watch(() => props.language, (lang) => {
  view?.dispatch({ effects: languageCompartment.reconfigure(languageFor(lang ?? '') ?? []) })
})

onBeforeUnmount(() => view?.destroy())
</script>

<template>
  <div ref="host" class="code-editor" />
</template>

<style scoped>
.code-editor { height: 100%; overflow: auto; }
.code-editor :deep(.cm-editor) { height: 100%; }
.code-editor :deep(.cm-editor.cm-focused) { outline: none; }
/* Align CodeMirror's chrome with the app theme (its default is a light gutter). */
.code-editor :deep(.cm-gutters) { background: transparent; border-right: 1px solid var(--border, #3a3a3a); color: color-mix(in srgb, currentColor 42%, transparent); }
.code-editor :deep(.cm-activeLineGutter) { background: transparent; color: color-mix(in srgb, currentColor 75%, transparent); }
.code-editor :deep(.cm-activeLine) { background: color-mix(in srgb, currentColor 6%, transparent); }
.code-editor :deep(.cm-selectionBackground) { background: color-mix(in srgb, var(--accent, #6c8cff) 28%, transparent) !important; }
.code-editor :deep(.cm-cursor) { border-left-color: currentColor; }
.code-editor :deep(.cm-error-line) { background: rgb(220 60 60 / 16%); box-shadow: inset 3px 0 0 #e0504d; }
</style>
