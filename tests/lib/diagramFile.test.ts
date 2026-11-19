import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DIAGRAM_SOURCE_ACCEPT,
  downloadBlob,
  extensionForType,
  imageFilename,
  mimeForType,
  readFileAsText,
  sourceFilename,
  typeForExtension,
} from '@/lib/diagramFile'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('extensionForType', () => {
  it('maps known diagram types to extensions', () => {
    expect(extensionForType('mermaid')).toBe('mmd')
    expect(extensionForType('plantuml')).toBe('puml')
    expect(extensionForType('c4plantuml')).toBe('puml')
    expect(extensionForType('bpmn')).toBe('bpmn')
    expect(extensionForType('d2')).toBe('d2')
  })
  it('defaults to txt for unknown types', () => {
    expect(extensionForType('ditaa')).toBe('txt')
    expect(extensionForType('')).toBe('txt')
  })
})

describe('mimeForType', () => {
  it('returns the mime for a diagram type', () => {
    expect(mimeForType('bpmn')).toBe('application/xml')
    expect(mimeForType('vega')).toBe('application/json')
    expect(mimeForType('mermaid')).toBe('text/plain')
    expect(mimeForType('unknown')).toBe('text/plain')
  })
})

describe('typeForExtension', () => {
  it('infers diagram type from a file extension', () => {
    expect(typeForExtension('puml')).toBe('plantuml')
    expect(typeForExtension('PUMl')).toBe('plantuml')
    expect(typeForExtension('mmd')).toBe('mermaid')
    expect(typeForExtension('d2')).toBe('d2')
    expect(typeForExtension('dot')).toBe('graphviz')
    expect(typeForExtension('tex')).toBe('tikz')
    expect(typeForExtension('yaml')).toBe('wireviz')
  })
  it('accepts common alternative extensions', () => {
    expect(typeForExtension('yml')).toBe('wireviz')
    expect(typeForExtension('gv')).toBe('graphviz')
    expect(typeForExtension('pu')).toBe('plantuml')
    expect(typeForExtension('mermaid')).toBe('mermaid')
    expect(typeForExtension('excalidraw')).toBe('excalidraw')
  })
  it('keeps the current type when it reads the extension', () => {
    expect(typeForExtension('json', 'vegalite')).toBe('vegalite')
    expect(typeForExtension('json', 'wavedrom')).toBe('wavedrom')
    expect(typeForExtension('puml', 'c4plantuml')).toBe('c4plantuml')
    expect(typeForExtension('json', 'plantuml')).toBe('vega')
  })
  it('only returns enabled types', () => {
    expect(typeForExtension('tex', 'plantuml', ['plantuml', 'mermaid'])).toBeUndefined()
    expect(typeForExtension('json', 'plantuml', ['plantuml', 'wavedrom'])).toBe('wavedrom')
  })
  it('returns undefined for unknown or missing extensions', () => {
    expect(typeForExtension('xyz')).toBeUndefined()
    expect(typeForExtension(undefined)).toBeUndefined()
  })
})

describe('sourceFilename / imageFilename', () => {
  it('builds download filenames', () => {
    expect(sourceFilename('mermaid')).toBe('diagram.mmd')
    expect(sourceFilename('plantuml')).toBe('diagram.puml')
    expect(sourceFilename('d2')).toBe('diagram.d2')
    expect(imageFilename('svg')).toBe('diagram.svg')
    expect(imageFilename('png')).toBe('diagram.png')
  })
})

describe('diagram source accept list', () => {
  it('lists every readable extension once', () => {
    const exts = DIAGRAM_SOURCE_ACCEPT.split(',')
    expect(exts).toEqual(expect.arrayContaining(['.puml', '.yml', '.gv', '.excalidraw', '.txt']))
    expect(new Set(exts).size).toBe(exts.length)
  })
})

describe('readFileAsText', () => {
  it('reads a file as text', async () => {
    const file = new File(['line1\nline2'], 'notes.puml', { type: 'text/plain' })
    await expect(readFileAsText(file)).resolves.toBe('line1\nline2')
  })
})

describe('downloadBlob', () => {
  it('creates a download anchor with the filename and revokes the URL later', () => {
    vi.useFakeTimers()
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click')
    const append = vi.spyOn(document.body, 'appendChild')
    const remove = vi.spyOn(document.body, 'removeChild')

    let anchor: HTMLAnchorElement | null = null
    const originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag)
      if (tag === 'a' && !anchor) {
        anchor = el as HTMLAnchorElement
      }
      return el
    })

    downloadBlob(new Blob(['diagram data']), 'my.diagram.puml', 'text/plain')

    expect(createUrl).toHaveBeenCalled()
    expect(anchor).not.toBeNull()
    expect(anchor!.download).toBe('my.diagram.puml')
    expect(anchor!.href).toBe('blob:mock-url')
    expect(click).toHaveBeenCalled()
    expect(append).toHaveBeenCalledWith(anchor)
    expect(remove).toHaveBeenCalledWith(anchor)
    expect(revoke).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(revoke).toHaveBeenCalledWith('blob:mock-url')
  })

  it('wraps a string in a blob with the given type', () => {
    const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadBlob('graph {}', 'diagram.dot', 'text/plain')
    const blob = createUrl.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/plain')
  })
})
