import { decodeDiagram } from './encoding'
import { EXAMPLE_GALLERY } from './exampleGallery'

export const ALL_DIAGRAM_TYPES = [
  'blockdiag',
  'bpmn',
  'bytefield',
  'seqdiag',
  'actdiag',
  'nwdiag',
  'packetdiag',
  'rackdiag',
  'c4plantuml',
  'd2',
  'dbml',
  'ditaa',
  'erd',
  'excalidraw',
  'graphviz',
  'mermaid',
  'nomnoml',
  'pikchr',
  'plantuml',
  'structurizr',
  'svgbob',
  'symbolator',
  'tikz',
  'umlet',
  'vega',
  'vegalite',
  'wavedrom',
  'wireviz',
] as const

function buildDefaultExamples(): Record<string, string> {
  const out: Record<string, string> = {}
  const haveDefault = new Set<string>()
  for (const entry of EXAMPLE_GALLERY) {
    // the type's default:true entry wins; otherwise the first-seen entry stands in
    const preferred = entry.default && !haveDefault.has(entry.diagramType)
    if (out[entry.diagramType] === undefined || preferred) {
      try {
        out[entry.diagramType] = decodeDiagram(entry.example)
        if (entry.default)
          haveDefault.add(entry.diagramType)
      }
      catch { /* skip undecodable */ }
    }
  }
  return out
}

export const DEFAULT_EXAMPLES: Record<string, string> = buildDefaultExamples()
