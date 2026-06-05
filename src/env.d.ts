/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAGE_TITLE?: string
  readonly VITE_KROKI_ENDPOINT?: string
  readonly VITE_EXAMPLE_KROKI_ENDPOINT?: string
  readonly VITE_ENABLED_DIAGRAMS?: string
  readonly VITE_DEFAULT_DIAGRAM?: string
  readonly VITE_MERMAID_CLIENT_SIDE?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface RawKrokiConfig {
  title?: string
  endpoint?: string
  exampleEndpoint?: string
  enabledDiagrams?: string[]
  defaultDiagram?: string
  examples?: Record<string, string>
  mermaidClient?: boolean
}
interface Window {
  __KROKI_CONFIG__?: RawKrokiConfig
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, any>
  export default component
}
