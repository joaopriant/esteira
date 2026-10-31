import type { Achado, StoryTexto } from '../shared/tipos'

export function montarComentario(entrada: {
  story: StoryTexto
  achadosAceitos: Achado[]
  responsavel?: { nome: string; id?: string }
}): string {
  const mencao = entrada.responsavel
    ? entrada.responsavel.id
      ? `Responsável: <a href="#" data-vss-mention="user:${entrada.responsavel.id}">@${entrada.responsavel.nome}</a>`
      : `Responsável: @${entrada.responsavel.nome}`
    : 'Responsável: não encontrado no card.'
  const achados = entrada.achadosAceitos
    .map((achado) => {
      const prova = achado.semProva
        ? 'sem prova'
        : achado.evidencia.tipo === 'arquivo'
          ? `${achado.evidencia.caminho}`
          : achado.evidencia.tipo === 'work-item'
            ? `#${achado.evidencia.id}`
            : 'não encontrei'
      return `- ${achado.texto} (${prova})`
    })
    .join('\n')
  return [
    mencao,
    '',
    'Sugestão da Esteira. A descrição deste card não foi alterada.',
    '',
    entrada.story.corpo || entrada.story.descricao,
    '',
    'Critérios de aceite sugeridos:',
    entrada.story.criteriosDeAceite || '(nenhum)',
    '',
    achados ? `Achados aceitos:\n${achados}` : 'Nenhum achado aceito.',
  ].join('\n')
}

/** A Descrição editada lidera o campo do card. A Story entra em seguida quando for outro texto. */
export function descricaoDoCard(story: StoryTexto): string {
  const descricao = story.descricao.trim()
  const corpo = story.corpo.trim()
  if (descricao && corpo && descricao !== corpo) return `${descricao}\n\n${corpo}`
  return descricao || corpo
}

export function frasePublicacao(publicacao: { acao: 'criar' | 'comentar'; workItemId: number; projeto: string }): string {
  if (publicacao.acao === 'criar') {
    return `Card #${publicacao.workItemId} criado em ${publicacao.projeto}. A descrição e os critérios foram gravados.`
  }
  return `Comentário publicado no #${publicacao.workItemId} em ${publicacao.projeto}. A descrição do card não foi alterada.`
}

export function urlDoCard(orgUrl: string, projeto: string, id: number): string {
  const base = orgUrl.trim().replace(/\/$/, '')
  if (!base || !projeto.trim() || !Number.isInteger(id) || id <= 0) return ''
  return `${base}/${encodeURIComponent(projeto)}/_workitems/edit/${id}`
}

/** Card aberto com prova. O aceito ganha do pendente; descartado e sem prova não preenchem o número. */
export function idDoCardAberto(achados: Achado[], opcoes?: { somenteAceito?: boolean }): number | null {
  const candidatos = achados.filter((achado) => {
    if (achado.estado === 'descartado' || achado.semProva) return false
    if (achado.tipo !== 'ajustar-aberta') return false
    if (achado.evidencia.tipo !== 'work-item') return false
    if (!Number.isInteger(achado.evidencia.id) || achado.evidencia.id <= 0) return false
    if (opcoes?.somenteAceito && achado.estado !== 'aceito') return false
    return true
  })
  const escolhido = candidatos.find((item) => item.estado === 'aceito') ?? candidatos[0]
  if (!escolhido || escolhido.evidencia.tipo !== 'work-item') return null
  return escolhido.evidencia.id
}

export function acaoInicialDoBoard(achados: Achado[]): { acao: 'criar' | 'comentar'; cardId: string } {
  const aceito = idDoCardAberto(achados, { somenteAceito: true })
  if (aceito) return { acao: 'comentar', cardId: String(aceito) }
  return { acao: 'criar', cardId: '' }
}

export type PedidoPublicacao =
  | {
      acao: 'criar'
      projeto: string
      tipo: string
      titulo: string
      descricao: string
      criterios: string
      campoDescricao: string
      campoCriterios: string
      area?: string
      iteracao?: string
    }
  | {
      acao: 'comentar'
      projeto: string
      workItemId: number
      texto: string
    }
