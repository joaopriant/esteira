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
