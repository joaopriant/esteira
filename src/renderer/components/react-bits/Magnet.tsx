import { useRef, type PointerEvent, type ReactNode } from 'react'
import { movimentoReduzido } from './movimento'

export function Magnet({ children, strength = 6 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  function mover(evento: PointerEvent<HTMLSpanElement>) {
    const el = ref.current
    if (!el || movimentoReduzido()) return
    const caixa = el.getBoundingClientRect()
    if (caixa.width === 0 || caixa.height === 0) return
    const dx = ((evento.clientX - caixa.left) / caixa.width - 0.5) * strength
    const dy = ((evento.clientY - caixa.top) / caixa.height - 0.5) * strength
    el.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`
  }

  function sair() {
    if (ref.current) ref.current.style.transform = ''
  }

  return (
    <span className="rb-magnet" ref={ref} onPointerMove={mover} onPointerLeave={sair}>
      {children}
    </span>
  )
}
