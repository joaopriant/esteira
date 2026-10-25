import { movimentoReduzido } from './movimento'

export function BlurText({ text, className }: { text: string; className?: string }) {
  const quieto = movimentoReduzido() ? ' rb-quieto' : ''
  return <span className={`rb-blur${quieto}${className ? ` ${className}` : ''}`}>{text}</span>
}
