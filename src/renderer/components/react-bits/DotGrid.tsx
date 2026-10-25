import { useEffect, useRef } from 'react'

export function DotGrid() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const pai = canvas?.parentElement
    if (!canvas || !pai) return
    const desenhar = () => {
      const w = pai.clientWidth
      const h = pai.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#d7e2e6'
      for (let y = 12; y < h; y += 22) {
        for (let x = 12; x < w; x += 22) {
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    desenhar()
    const obs = new ResizeObserver(desenhar)
    obs.observe(pai)
    return () => obs.disconnect()
  }, [])

  return <canvas ref={ref} className="rb-dots" aria-hidden="true" />
}
