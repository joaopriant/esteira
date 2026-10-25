import { useRef, type HTMLAttributes, type PointerEvent, type ReactNode } from 'react'

type Alvo = 'article' | 'div' | 'section'

interface Props extends HTMLAttributes<HTMLElement> {
  as?: Alvo
  children?: ReactNode
}

export function SpotlightCard({ as = 'div', className, onPointerMove, children, ...rest }: Props) {
  const ref = useRef<HTMLElement | null>(null)

  function mover(evento: PointerEvent<HTMLElement>) {
    onPointerMove?.(evento)
    const el = ref.current
    if (!el) return
    const caixa = el.getBoundingClientRect()
    el.style.setProperty('--mouse-x', `${evento.clientX - caixa.left}px`)
    el.style.setProperty('--mouse-y', `${evento.clientY - caixa.top}px`)
  }

  const classe = `rb-spotlight${className ? ` ${className}` : ''}`
  if (as === 'article') {
    return (
      <article ref={(no) => { ref.current = no }} className={classe} onPointerMove={mover} {...rest}>
        {children}
      </article>
    )
  }
  if (as === 'section') {
    return (
      <section ref={(no) => { ref.current = no }} className={classe} onPointerMove={mover} {...rest}>
        {children}
      </section>
    )
  }
  return (
    <div ref={(no) => { ref.current = no }} className={classe} onPointerMove={mover} {...rest}>
      {children}
    </div>
  )
}
