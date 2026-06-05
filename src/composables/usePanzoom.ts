import Panzoom from '@panzoom/panzoom'
import { ref } from 'vue'

export function usePanzoom(el: HTMLElement) {
  const pz = Panzoom(el, {
    pinch: true,
    cursor: 'grab',
    maxScale: 8,
    minScale: 0.1,
    // Deliberately NO wheel listener → no scroll-zoom.
  })
  const percent = ref(100)

  function sync() {
    percent.value = pz.getScale() * 100
  }
  el.addEventListener('panzoomchange', sync)

  function zoomIn() {
    pz.zoomIn()
    sync()
  }
  function zoomOut() {
    pz.zoomOut()
    sync()
  }
  function reset() {
    pz.zoom(1, { animate: true })
    pz.pan(0, 0, { animate: true })
    sync()
  }
  function fit(containerW: number, containerH: number, contentW: number, contentH: number) {
    if (!contentW || !contentH)
      return
    const scale = Math.min(containerW / contentW, containerH / contentH)
    pz.zoom(scale, { animate: true })
    pz.pan(0, 0, { animate: true })
    sync()
  }
  function destroy() {
    el.removeEventListener('panzoomchange', sync)
    pz.destroy()
  }

  return { instance: pz, percent, zoomIn, zoomOut, reset, fit, destroy }
}
