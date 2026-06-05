// Client-side Mermaid rendering. `mermaid` is large, so it is imported lazily —
// nothing is pulled into the main bundle unless this is actually called.
let initialized = false
let counter = 0

export async function renderMermaidSvg(source: string): Promise<string> {
  const { default: mermaid } = await import('mermaid')
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      // SVG <text> labels (not foreignObject) so the result renders inside an <img>.
      flowchart: { htmlLabels: false },
      class: { htmlLabels: false },
    })
    initialized = true
  }
  counter += 1
  const { svg } = await mermaid.render(`kroki-mmd-${counter}`, source)
  return svg
}
