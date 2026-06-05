import type { StringStream } from '@codemirror/language'
import { LanguageSupport, StreamLanguage } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

// A deliberately small, regex-based tokenizer (keywords / comments / strings /
// numbers / connectors) for diagram DSLs that have no real CodeMirror grammar.
// Not a parser — just enough colour to read the source comfortably.
interface DslConfig {
  keywords: string[]
  line?: string[]
  block?: [string, string]
  quotes?: string[]
  operators?: RegExp
}

interface BlockState { inBlock: boolean }

const tokenTable = {
  comment: t.comment,
  string: t.string,
  keyword: t.keyword,
  number: t.number,
  operator: t.operator,
}

function makeDsl(cfg: DslConfig): LanguageSupport {
  const keywords = new Set(cfg.keywords.map(k => k.toLowerCase()))
  const quotes = cfg.quotes ?? ['"']
  const lines = cfg.line ?? []
  const block = cfg.block

  const lang = StreamLanguage.define<BlockState>({
    startState: () => ({ inBlock: false }),
    tokenTable,
    token(stream: StringStream, state: BlockState) {
      if (state.inBlock) {
        if (block && stream.skipTo(block[1])) {
          stream.match(block[1])
          state.inBlock = false
        }
        else {
          stream.skipToEnd()
        }
        return 'comment'
      }
      if (stream.eatSpace())
        return null

      if (block && stream.match(block[0])) {
        if (stream.skipTo(block[1])) {
          stream.match(block[1])
        }
        else {
          stream.skipToEnd()
          state.inBlock = true
        }
        return 'comment'
      }
      for (const lc of lines) {
        if (stream.match(lc)) {
          stream.skipToEnd()
          return 'comment'
        }
      }

      const ch = stream.peek()
      if (ch && quotes.includes(ch)) {
        stream.next()
        let escaped = false
        let c: string | void
        // eslint-disable-next-line no-cond-assign
        while ((c = stream.next()) != null) {
          if (c === ch && !escaped)
            break
          escaped = c === '\\' && !escaped
        }
        return 'string'
      }

      // these matches intentionally consume the stream (not pure boolean tests)
      // eslint-disable-next-line e18e/prefer-regex-test
      if (stream.match(/^@\w+/))
        return 'keyword'
      // eslint-disable-next-line e18e/prefer-regex-test
      if (stream.match(/^\d+(?:\.\d+)?/))
        return 'number'
      if (cfg.operators && stream.match(cfg.operators))
        return 'operator'

      const word = stream.match(/^[\w$]+/)
      if (Array.isArray(word))
        return keywords.has(word[0].toLowerCase()) ? 'keyword' : null
      if (word)
        return null

      stream.next()
      return null
    },
  })
  return new LanguageSupport(lang)
}

export function plantumlLanguage(): LanguageSupport {
  return makeDsl({
    keywords: ['startuml', 'enduml', 'participant', 'actor', 'boundary', 'control', 'entity', 'database', 'collections', 'queue', 'class', 'interface', 'abstract', 'enum', 'annotation', 'package', 'namespace', 'node', 'component', 'rectangle', 'folder', 'frame', 'cloud', 'storage', 'agent', 'state', 'usecase', 'object', 'artifact', 'card', 'file', 'together', 'start', 'stop', 'if', 'then', 'else', 'elseif', 'endif', 'repeat', 'while', 'endwhile', 'fork', 'partition', 'split', 'detach', 'note', 'as', 'activate', 'deactivate', 'destroy', 'create', 'alt', 'opt', 'loop', 'par', 'break', 'critical', 'group', 'end', 'ref', 'over', 'left', 'right', 'of', 'top', 'bottom', 'skinparam', 'title', 'header', 'footer', 'legend', 'endlegend', 'caption', 'autonumber', 'hide', 'show', 'scale', 'newpage', 'box'],
    line: ['\''],
    block: ['/\'', '\'/'],
    operators: /^[-.<>|*o]{2,}/,
  })
}

export function d2Language(): LanguageSupport {
  return makeDsl({
    keywords: ['shape', 'style', 'direction', 'near', 'icon', 'label', 'classes', 'class', 'vars', 'fill', 'stroke', 'opacity', 'width', 'height', 'tooltip', 'link', 'grid', 'animated', 'multiple'],
    line: ['#'],
    quotes: ['"', '\''],
    operators: /^(?:<->|->|<-|--)/,
  })
}

export function dotLanguage(): LanguageSupport {
  return makeDsl({
    keywords: ['digraph', 'graph', 'subgraph', 'node', 'edge', 'strict'],
    line: ['//', '#'],
    block: ['/*', '*/'],
    operators: /^(?:->|--)/,
  })
}

export function blockdiagLanguage(): LanguageSupport {
  return makeDsl({
    keywords: ['blockdiag', 'seqdiag', 'actdiag', 'nwdiag', 'rackdiag', 'packetdiag', 'diagram', 'group', 'class', 'edge', 'network', 'peer', 'route', 'plugin', 'orientation', 'autonumber', 'span_width', 'span_height', 'node_width', 'node_height', 'default_shape'],
    line: ['//', '#'],
    operators: /^(?:<->|->|<-|--|=>)/,
  })
}
