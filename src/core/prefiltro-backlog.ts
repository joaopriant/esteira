import type { WorkItem } from '../shared/tipos'
import { dataMesesAtras, semAcento, tokensUteis } from './texto'

export interface FiltroBacklog {
  agora: Date
  projetos: string[]
  areas: string[]
  mesesFechados: number
  nomesProduto: string[]
  limite: number
}

function areaSob(item: string, base: string): boolean {
  const normal = (valor: string) => valor.replace(/\//g, '\\').toLowerCase()
  const a = normal(item)
  const b = normal(base)
  return a === b || a.startsWith(`${b}\\`)
}

function textoDe(item: WorkItem): { titulo: string; descricao: string; criterios: string } {
  return {
    titulo: semAcento(item.titulo),
    descricao: semAcento(item.descricao),
    criterios: semAcento(item.criterios),
  }
}

export function prefiltrarBacklog(itens: WorkItem[], consulta: string, filtro: FiltroBacklog): WorkItem[] {
  const tokens = tokensUteis(consulta, filtro.nomesProduto)
  const limite = dataMesesAtras(filtro.agora, filtro.mesesFechados)
  const projetos = new Set(filtro.projetos.map((p) => p.toLowerCase()))

  const pontuados = itens
    .filter((item) => projetos.size === 0 || projetos.has(item.projeto.toLowerCase()))
    .filter((item) => filtro.areas.length === 0 || filtro.areas.some((area) => areaSob(item.areaPath, area)))
    .filter((item) => item.estado.toLowerCase() !== 'removed')
    .filter((item) => {
      if (!item.fechadoEm) return true
      return new Date(item.fechadoEm).getTime() >= limite.getTime()
    })
    .map((item) => {
      const campos = textoDe(item)
      let pontos = 0
      for (const token of tokens) {
        if (campos.titulo.includes(token)) pontos += 3
        else if (campos.criterios.includes(token)) pontos += 2
        else if (campos.descricao.includes(token)) pontos += 1
      }
      return { item, pontos }
    })
    .filter((linha) => linha.pontos >= 3)
    .sort((a, b) => b.pontos - a.pontos || b.item.id - a.item.id)

  return pontuados.slice(0, filtro.limite).map((linha) => linha.item)
}
