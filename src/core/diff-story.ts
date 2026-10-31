import { diffLines } from 'diff'
import type { Achado, LinhaDiff, StoryTexto } from '../shared/tipos'

const MARCA_SEM_PROVA = '[sem prova]'
const MARCA_PERGUNTA = 'Pergunta em aberto:'

export function serializarStory(story: StoryTexto): string {
  return [`Título: ${story.titulo}`, '', story.corpo, '', 'Descrição:', story.descricao, '', 'Critérios de aceite:', story.criteriosDeAceite, ''].join('\n')
}

export function diffStory(antes: StoryTexto, depois: StoryTexto): LinhaDiff[] {
  const partes = diffLines(serializarStory(antes), serializarStory(depois))
  const linhas: LinhaDiff[] = []
  for (const parte of partes) {
    const tipo = parte.added ? 'entrou' : parte.removed ? 'saiu' : 'igual'
    const blocos = parte.value.replace(/\n$/, '').split('\n')
    for (const texto of blocos) {
      if (texto === '' && blocos.length > 1) continue
      linhas.push({ tipo, texto })
    }
  }
  return linhas
}

export function storiesIguais(a: StoryTexto, b: StoryTexto): boolean {
  return serializarStory(a) === serializarStory(b)
}

/** Achado sem prova ou “não encontrei” não entra na story como fato. */
export function comMarcaDoAchado(achado: Pick<Achado, 'tipo' | 'texto' | 'semProva'>, proposto: StoryTexto): StoryTexto {
  if (achado.tipo === 'nao-encontrei') return comLinha(proposto, MARCA_PERGUNTA, `- Pergunta em aberto: ${achado.texto}`)
  if (achado.semProva) return comLinha(proposto, MARCA_SEM_PROVA, `- Ajuste: ${achado.texto} [sem prova]`)
  return proposto
}

function comLinha(story: StoryTexto, marca: string, linha: string): StoryTexto {
  const texto = `${story.titulo}\n${story.corpo}\n${story.descricao}\n${story.criteriosDeAceite}`
  if (texto.includes(marca)) return story
  const criterios = story.criteriosDeAceite.trim()
  return { ...story, criteriosDeAceite: criterios ? `${criterios}\n${linha}` : linha }
}
