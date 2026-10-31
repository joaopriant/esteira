import type { EstadoApp } from '../shared/tipos'

export type PassoId = 'pat' | 'claude' | 'repos' | 'produto' | 'modelo'
export type TelaPasso = 'conexoes' | 'produtos' | 'ajustes'

export interface PassoPrimeiroUso {
  id: PassoId
  nome: string
  tela: TelaPasso
  feito: boolean
  falta: string
  pronto: string
}

type EstadoPassos = Pick<EstadoApp, 'ajustes' | 'repositorios' | 'produtos' | 'stories'>

export function passosPrimeiroUso(estado: EstadoPassos): PassoPrimeiroUso[] | null {
  if (estado.stories.length > 0) return null
  const { ajustes, repositorios, produtos } = estado
  const claude = ajustes.modo === 'falso' || ajustes.claudeConferido
  const repos = repositorios.some((repo) => repo.selecionado && repo.estado === 'pronto')
  const passos: PassoPrimeiroUso[] = [
    { id: 'pat', nome: 'PAT', tela: 'conexoes', feito: ajustes.conectado, falta: 'Colar em Conexões', pronto: 'No cofre' },
    {
      id: 'claude',
      nome: 'Claude',
      tela: 'conexoes',
      feito: claude,
      falta: 'Testar em Conexões',
      pronto: ajustes.modo === 'falso' ? 'Exemplo nesta máquina' : 'Assinatura conferida',
    },
    { id: 'repos', nome: 'Repositórios', tela: 'produtos', feito: repos, falta: 'Trazer em Produtos', pronto: 'Clone pronto' },
    { id: 'produto', nome: 'Produto', tela: 'produtos', feito: produtos.length > 0, falta: 'Nomear em Produtos', pronto: 'Conjunto salvo' },
    { id: 'modelo', nome: 'Modelo', tela: 'ajustes', feito: ajustes.modeloConferido, falta: 'Conferir em Ajustes', pronto: 'Modelo da empresa' },
  ]
  if (passos.every((passo) => passo.feito)) return null
  return passos
}

export function passoAtual(passos: PassoPrimeiroUso[]): PassoPrimeiroUso {
  return passos.find((passo) => !passo.feito) ?? passos[0]
}

export function textoDoAviso(passo: PassoPrimeiroUso): { texto: string; acao: string } {
  if (passo.id === 'pat') return { texto: 'Nenhuma organização conectada.', acao: 'Conectar em Conexões' }
  return { texto: `Próximo: ${passo.nome}.`, acao: passo.falta }
}
