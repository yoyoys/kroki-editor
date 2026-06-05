import type { Extension } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { sql } from '@codemirror/lang-sql'
import { xml } from '@codemirror/lang-xml'
import { yaml } from '@codemirror/lang-yaml'
import { LanguageSupport, StreamLanguage } from '@codemirror/language'
import { stex } from '@codemirror/legacy-modes/mode/stex'
import { mermaid } from 'codemirror-lang-mermaid'
import { blockdiagLanguage, d2Language, dotLanguage, plantumlLanguage } from './streamLanguages'

const JSON_TYPES = new Set(['vega', 'vegalite', 'excalidraw', 'wavedrom'])
const XML_TYPES = new Set(['bpmn'])
const YAML_TYPES = new Set(['wireviz'])
const PLANTUML_TYPES = new Set(['plantuml', 'c4plantuml'])
const BLOCKDIAG_TYPES = new Set(['blockdiag', 'seqdiag', 'actdiag', 'nwdiag', 'packetdiag', 'rackdiag'])

/**
 * A CodeMirror language extension for the given diagram type, or null when we
 * have nothing to offer (it then renders as plain text).
 *
 * Ready grammars: mermaid, JSON (vega/vegalite/excalidraw/wavedrom), XML (bpmn),
 * YAML (wireviz), LaTeX (tikz), SQL (dbml, loose). The rest use small in-house
 * stream tokenizers (PlantUML, D2, GraphViz/dot, blockdiag family).
 */
export function languageFor(type: string): Extension | null {
  if (type === 'mermaid')
    return mermaid()
  if (PLANTUML_TYPES.has(type))
    return plantumlLanguage()
  if (type === 'd2')
    return d2Language()
  if (type === 'graphviz')
    return dotLanguage()
  if (BLOCKDIAG_TYPES.has(type))
    return blockdiagLanguage()
  if (type === 'tikz')
    return new LanguageSupport(StreamLanguage.define(stex))
  if (type === 'dbml')
    return sql()
  if (JSON_TYPES.has(type))
    return json()
  if (XML_TYPES.has(type))
    return xml()
  if (YAML_TYPES.has(type))
    return yaml()
  return null
}

export function hasHighlighting(type: string): boolean {
  return languageFor(type) !== null
}
