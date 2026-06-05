import type { KrokiConfig } from '@/lib/config'
import { inject, provide } from 'vue'
import { resolveConfig } from '@/lib/config'

const KEY = Symbol('kroki-config')

export function loadConfig(): KrokiConfig {
  return resolveConfig({ win: window.__KROKI_CONFIG__, env: import.meta.env })
}

export function provideKrokiConfig(): KrokiConfig {
  const config = loadConfig()
  provide(KEY, config)
  return config
}

export function useKrokiConfig(): KrokiConfig {
  const config = inject<KrokiConfig>(KEY)
  if (!config)
    throw new Error('useKrokiConfig must be used under provideKrokiConfig')
  return config
}
