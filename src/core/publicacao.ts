import type { Achado, StoryTexto } from '../shared/tipos'

function escaparHtml(valor: string): string {
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** O Boards trata descrição, critérios e comentário como HTML: newline solto some. */
export function textoEmHtml(valor: string): string {
  if (!valor) return ''
  return valor
    .split(/\r\n|\n|\r/)
    .map((linha) => `<div>${escaparHtml(linha) || '<br>'}</div>`)
    .join('')
}

function idDeMencao(id: string | undefined): string | undefined {
  const limpo = id?.trim() ?? ''
  if (!/^[\w.-]+$/.test(limpo)) return undefined
  return limpo
}

function linhaMencao(responsavel?: { nome: string; id?: string }): string {
  if (!responsavel) return '<div>Responsável: não encontrado no card.</div>'
  const nome = escaparHtml(responsavel.nome)
  const id = idDeMencao(responsavel.id)
  if (!id) return `<div>Responsável: @${nome}</div>`
  return `<div>Responsável: <a href="#" data-vss-mention="version:2.0,${id}">@${nome}</a></div>`
}

export function montarComentario(entrada: {
  story: StoryTexto
  achadosAceitos: Achado[]
  responsavel?: { nome: string; id?: string }
}): string {
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
  const corpo = [
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
  return linhaMencao(entrada.responsavel) + textoEmHtml(corpo)
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
