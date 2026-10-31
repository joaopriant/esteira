import type { ReactNode } from 'react'
import type { EstadoStory, TipoAchado } from '../shared/tipos'

export function Marca() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <path d="M2 15.5h18" fill="none" stroke="#1b6c80" strokeWidth="1.5" />
      <circle cx="5.5" cy="15.5" r="2" fill="none" stroke="#1b6c80" strokeWidth="1.5" />
      <circle cx="11" cy="15.5" r="2" fill="#1b6c80" />
      <circle cx="16.5" cy="15.5" r="2" fill="none" stroke="#1b6c80" strokeWidth="1.5" />
      <path d="M5.5 9.5h11" fill="none" stroke="#1b6c80" strokeWidth="1.5" />
    </svg>
  )
}

export function nomeOrg(url: string): string {
  try {
    const endereco = new URL(url)
    if (endereco.hostname.endsWith('visualstudio.com')) return endereco.hostname.split('.')[0] || 'organização'
    const parte = endereco.pathname.split('/').filter(Boolean)[0]
    return parte || 'organização'
  } catch {
    return 'organização'
  }
}

export function Erro({ texto }: { texto: string }) {
  if (!texto) return null
  return (
    <p className="erro" role="alert">
      {texto}
    </p>
  )
}

export function Vazio({ children }: { children: ReactNode }) {
  return <p className="vazio">{children}</p>
}

export const TIPO_ACHADO: Record<TipoAchado, string> = {
  existe: 'já existe',
  divergencia: 'diverge',
  'nao-encontrei': 'não encontrei',
  'ja-existe': 'card fechado',
  'ajustar-aberta': 'card aberto',
  conflito: 'conflito',
  outro: 'achado',
}

export function rotuloStory(estado: EstadoStory): string {
  if (estado === 'pronta') return 'pronta'
  if (estado === 'pausada') return 'pausada'
  if (estado === 'interrompida') return 'parada'
  if (estado === 'erro') return 'erro'
  return 'rodando'
}

export function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Não consegui completar.'
}
