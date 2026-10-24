import type { AchadoBruto, Evidencia, TipoAchado } from '../shared/tipos'
import { normalizarEspaco } from './texto'

const TIPOS = new Set<TipoAchado>([
  'existe',
  'divergencia',
  'nao-encontrei',
  'ja-existe',
  'ajustar-aberta',
  'conflito',
  'outro',
])

export interface ArquivoProva {
  caminho: string
  conteudo: string
  repositorio?: string
}

export interface CardProva {
  id: number
  titulo: string
  projeto: string
}

export function tipoAchado(valor: string | undefined): TipoAchado {
  if (valor && TIPOS.has(valor as TipoAchado)) return valor as TipoAchado
  return 'outro'
}

export function classificarEvidencia(
  bruto: AchadoBruto,
  arquivos: ArquivoProva[],
  cards: CardProva[],
): { tipo: TipoAchado; evidencia: Evidencia; semProva: boolean } {
  const tipo = tipoAchado(bruto.tipo)
  const ev = bruto.evidencia
  if (tipo === 'nao-encontrei') {
    return { tipo, evidencia: { tipo: 'ausencia' }, semProva: false }
  }
  if (!ev || typeof ev !== 'object') {
    return { tipo, evidencia: { tipo: 'ausencia' }, semProva: true }
  }
  const registro = ev as Record<string, unknown>
  if (registro.tipo === 'ausencia') {
    return { tipo, evidencia: { tipo: 'ausencia' }, semProva: true }
  }
  if (registro.tipo === 'arquivo') {
    const caminho = String(registro.caminho ?? '')
    const trecho = String(registro.trecho ?? '')
    const repositorio = registro.repositorio ? String(registro.repositorio) : undefined
    const trechoNorm = normalizarEspaco(trecho)
    const casa = arquivos.find((arquivo) => {
      const mesmoCaminho = caminho === arquivo.caminho || caminho.endsWith('/' + arquivo.caminho) || arquivo.caminho.endsWith(caminho)
      if (!mesmoCaminho && caminho !== '') return false
      if (trechoNorm.length < 8) return false
      return normalizarEspaco(arquivo.conteudo).includes(trechoNorm)
    })
    if (!casa) {
      return {
        tipo,
        evidencia: { tipo: 'arquivo', caminho, trecho, repositorio },
        semProva: true,
      }
    }
    return {
      tipo,
      evidencia: {
        tipo: 'arquivo',
        caminho: casa.caminho,
        trecho,
        repositorio: repositorio ?? casa.repositorio,
      },
      semProva: false,
    }
  }
  if (registro.tipo === 'work-item') {
    const id = Number(registro.id)
    const card = cards.find((item) => item.id === id)
    if (!card || !Number.isInteger(id)) {
      return {
        tipo,
        evidencia: {
          tipo: 'work-item',
          id: Number.isFinite(id) ? id : 0,
          titulo: String(registro.titulo ?? ''),
          projeto: String(registro.projeto ?? ''),
        },
        semProva: true,
      }
    }
    return {
      tipo,
      evidencia: { tipo: 'work-item', id: card.id, titulo: card.titulo, projeto: card.projeto },
      semProva: false,
    }
  }
  return { tipo, evidencia: { tipo: 'ausencia' }, semProva: true }
}
