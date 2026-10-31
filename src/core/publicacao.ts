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
