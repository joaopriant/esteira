import { movimentoReduzido } from './movimento'

export function GradientText({ text, className }: { text: string; className?: string }) {
  const quieto = movimentoReduzido() ? ' rb-quieto' : ''
  return <span className={`rb-gradient${quieto}${className ? ` ${className}` : ''}`}>{text}</span>
}
