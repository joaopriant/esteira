import { movimentoReduzido } from './movimento'

export function DecryptedText({ text, className }: { text: string; className?: string }) {
  const quieto = movimentoReduzido() ? ' rb-quieto' : ''
  return <span className={`rb-decrypt${quieto}${className ? ` ${className}` : ''}`}>{text}</span>
}
