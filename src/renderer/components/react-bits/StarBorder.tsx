import type { ReactNode } from 'react'
import { movimentoReduzido } from './movimento'

export function StarBorder({ ativo = true, className, children }: { ativo?: boolean; className?: string; children: ReactNode }) {
  const ligado = ativo && !movimentoReduzido()
  return <div className={`rb-star${ligado ? ' ativo' : ''}${className ? ` ${className}` : ''}`}>{children}</div>
}
