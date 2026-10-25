import { movimentoReduzido } from './movimento'

export function ShinyText({ text, className }: { text: string; className?: string }) {
  const quieto = movimentoReduzido() ? ' rb-quieto' : ''
  return <span className={`rb-shiny${quieto}${className ? ` ${className}` : ''}`}>{text}</span>
}
