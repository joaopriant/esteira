import type { Achado, AchadoBruto, PapelBloco, StoryTexto } from '../shared/tipos'
import { classificarEvidencia, type ArquivoProva, type CardProva } from './evidencia'
import { chaveProva, impressaoAchado } from './texto'

export function aplicarContrato(entrada: {
  papel: PapelBloco
  blocoId: string
  blocoNome: string
  story: StoryTexto
  achados: Achado[]
  saidaStory?: Partial<StoryTexto> | null
  saidaAchados: AchadoBruto[]
  arquivos: ArquivoProva[]
  cards: CardProva[]
  novoId: () => string
}): { story: StoryTexto; achados: Achado[]; storyIgnorada: boolean } {
  const conhecidas = new Set(
    entrada.achados.map((achado) =>
      impressaoAchado(achado.tipo, achado.texto, chaveDe(achado)),
    ),
  )
  const novos: Achado[] = []
  for (const bruto of entrada.saidaAchados) {
    const texto = (bruto.texto ?? '').trim()
    if (!texto) continue
    const classe = classificarEvidencia(bruto, entrada.arquivos, entrada.cards)
    const impressao = impressaoAchado(classe.tipo, texto, chaveDe({ tipo: classe.tipo, evidencia: classe.evidencia, texto }))
    if (conhecidas.has(impressao)) continue
    conhecidas.add(impressao)
    novos.push({
      id: entrada.novoId(),
      blocoId: entrada.blocoId,
      blocoNome: entrada.blocoNome,
      texto,
      tipo: classe.tipo,
      evidencia: classe.evidencia,
      semProva: classe.semProva,
      estado: 'pendente',
    })
  }

  if (entrada.papel === 'confrontar') {
    return { story: entrada.story, achados: [...entrada.achados, ...novos], storyIgnorada: true }
  }

  const saida = entrada.saidaStory
  const story: StoryTexto = {
    titulo: saida?.titulo?.trim() || entrada.story.titulo,
    corpo: saida?.corpo?.trim() || entrada.story.corpo,
    descricao: saida?.descricao?.trim() || entrada.story.descricao,
    criteriosDeAceite: saida?.criteriosDeAceite?.trim() || entrada.story.criteriosDeAceite,
  }
  return { story, achados: [...entrada.achados, ...novos], storyIgnorada: false }
}

function chaveDe(achado: { tipo: string; texto: string; evidencia: Achado['evidencia'] | { tipo: string; caminho?: string; trecho?: string; id?: number } }): string {
  const ev = achado.evidencia
  if (ev.tipo === 'arquivo') return chaveProva({ tipo: 'arquivo', caminho: ev.caminho, trecho: ev.trecho })
  if (ev.tipo === 'work-item') return chaveProva({ tipo: 'work-item', id: ev.id })
  return chaveProva({ tipo: 'ausencia' })
}
