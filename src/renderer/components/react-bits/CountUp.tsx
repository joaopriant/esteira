import { useEffect, useState } from 'react'
import { movimentoReduzido } from './movimento'

export function CountUp({ to, className }: { to: number; className?: string }) {
  const [valor, setValor] = useState(() => (movimentoReduzido() ? to : 0))

  useEffect(() => {
    if (movimentoReduzido()) {
      setValor(to)
      return
    }
    let quadro = 0
    const inicio = performance.now()
    const duracao = 700
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracao)
      const suave = 1 - (1 - t) ** 3
      setValor(Math.round((to) * suave))
      if (t < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [to])

  return <span className={`num${className ? ` ${className}` : ''}`}>{valor}</span>
}
