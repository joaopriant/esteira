import { Children, type ReactNode } from 'react'
import { movimentoReduzido } from './movimento'

export function AnimatedList({ children, className }: { children: ReactNode; className?: string }) {
  const itens = Children.toArray(children)
  const quieto = movimentoReduzido()
  return (
    <div className={className}>
      {itens.map((item, indice) => {
        const chave = item && typeof item === 'object' && 'key' in item && item.key != null ? String(item.key) : String(indice)
        return (
          <div key={chave} className={quieto ? undefined : 'rb-item'} style={quieto ? undefined : { animationDelay: `${indice * 45}ms` }}>
            {item}
          </div>
        )
      })}
    </div>
  )
}
