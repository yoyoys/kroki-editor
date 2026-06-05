import { describe, expect, it, vi } from 'vitest'

const panzoomInstance = {
  zoomIn: vi.fn(),
  zoomOut: vi.fn(),
  reset: vi.fn(),
  zoom: vi.fn(),
  pan: vi.fn(),
  getScale: vi.fn(() => 1),
  destroy: vi.fn(),
}
vi.mock('@panzoom/panzoom', () => ({
  default: vi.fn((_el: HTMLElement, opts: any) => {
    ;(panzoomInstance as any).opts = opts
    return panzoomInstance
  }),
}))

describe('usePanzoom', () => {
  it('inits with pinch enabled and no wheel binding, exposes controls', async () => {
    const { usePanzoom } = await import('@/composables/usePanzoom')
    const el = document.createElement('div')
    const addSpy = vi.spyOn(el, 'addEventListener')
    const removeSpy = vi.spyOn(el, 'removeEventListener')

    const pz = usePanzoom(el)

    expect((panzoomInstance as any).opts.pinch).toBe(true)
    // critical product requirement: no scroll-wheel zoom
    expect(addSpy).not.toHaveBeenCalledWith('wheel', expect.anything())
    expect(addSpy).toHaveBeenCalledWith('panzoomchange', expect.anything())

    pz.zoomIn()
    expect(panzoomInstance.zoomIn).toHaveBeenCalled()
    expect(typeof pz.percent.value).toBe('number')

    pz.destroy()
    expect(panzoomInstance.destroy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalledWith('panzoomchange', expect.anything())
  })
})
