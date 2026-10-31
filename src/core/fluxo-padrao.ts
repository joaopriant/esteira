import type { BlocoFluxo } from '../shared/tipos'

export function fluxoPadrao(): BlocoFluxo[] {
  return [
    {
      id: 'escrever-story',
      nome: 'Escrever a story',
      papel: 'escrever',
      modo: 'automatico',
      fonte: { tipo: 'skill', skillId: 'escrever-story' },
    },
    {
      id: 'confrontar-wiki',
      nome: 'Confrontar com a wiki',
      papel: 'confrontar',
      modo: 'automatico',
      fonte: { tipo: 'skill', skillId: 'confrontar-wiki' },
    },
    {
      id: 'confrontar-codigo',
      nome: 'Confrontar com o código',
      papel: 'confrontar',
      modo: 'automatico',
      fonte: { tipo: 'skill', skillId: 'confrontar-codigo' },
    },
    {
      id: 'confrontar-backlog',
      nome: 'Confrontar com o backlog',
      papel: 'confrontar',
      modo: 'automatico',
      fonte: { tipo: 'skill', skillId: 'confrontar-backlog' },
    },
  ]
}

export function fluxoSoConfrontos(): BlocoFluxo[] {
  return fluxoPadrao().filter((bloco) => bloco.papel === 'confrontar')
}

export function fluxoRadarRapido(): BlocoFluxo[] {
  return fluxoPadrao().filter((bloco) => bloco.id === 'escrever-story' || bloco.id === 'confrontar-backlog')
}

export function moverBloco(blocos: BlocoFluxo[], de: number, para: number): BlocoFluxo[] {
  if (de === para || de < 0 || para < 0 || de >= blocos.length || para >= blocos.length) return blocos
  const copia = [...blocos]
  const [item] = copia.splice(de, 1)
  if (!item) return blocos
  copia.splice(para, 0, item)
  return copia
}

export function inserirBloco(blocos: BlocoFluxo[], indice: number, bloco: BlocoFluxo): BlocoFluxo[] {
  const copia = [...blocos]
  const destino = Math.max(0, Math.min(indice, copia.length))
  copia.splice(destino, 0, bloco)
  return copia
}

export function duplicarBloco(blocos: BlocoFluxo[], indice: number, id: string): BlocoFluxo[] {
  const origem = blocos[indice]
  if (!origem) return blocos
  const nome = origem.nome.endsWith('cópia') ? origem.nome : `${origem.nome} cópia`
  const copia: BlocoFluxo = {
    ...origem,
    id,
    nome: nome.slice(0, 120),
    fonte: origem.fonte.tipo === 'skill' ? { tipo: 'skill', skillId: origem.fonte.skillId } : { tipo: 'instrucao', texto: origem.fonte.texto },
  }
  return inserirBloco(blocos, indice + 1, copia)
}

export function fraseContrato(blocos: BlocoFluxo[], indice: number): string {
  const bloco = blocos[indice]
  if (!bloco) return ''
  if (bloco.papel === 'escrever') {
    const recebe = indice === 0 ? 'Ideia do PM ou sugestão do Radar' : `Story do bloco ${indice}`
    return `${recebe} → story no modelo`
  }
  const antes = blocos.slice(0, indice)
  const confrontosAntes = antes.filter((item) => item.papel === 'confrontar').length
  const autor = antes.map((item) => item.papel).lastIndexOf('escrever')
  const story = autor < 0 ? 'Ideia do PM, ainda sem story' : `Story do bloco ${autor + 1}`
  const recebe = indice === 0 ? story : `${story} + achados ${confrontosAntes}`
  return `${recebe} → só novos achados (não reescreve a story)`
}

export function validarFluxo(blocos: BlocoFluxo[]): string | null {
  if (blocos.length === 0) return 'A esteira precisa de pelo menos um bloco.'
  const ids = new Set<string>()
  for (const bloco of blocos) {
    if (!bloco.id.trim() || !bloco.nome.trim()) return 'Todo bloco precisa de nome.'
    if (ids.has(bloco.id)) return 'Há dois blocos com o mesmo id.'
    ids.add(bloco.id)
    if (bloco.papel !== 'escrever' && bloco.papel !== 'confrontar') return 'Papel de bloco inválido.'
    if (bloco.modo !== 'automatico' && bloco.modo !== 'por-clique') return 'Modo de bloco inválido.'
    if (bloco.fonte.tipo === 'instrucao' && !bloco.fonte.texto.trim()) return `O bloco ${bloco.nome} está sem instrução.`
    if (bloco.fonte.tipo === 'skill' && !bloco.fonte.skillId.trim()) return `O bloco ${bloco.nome} está sem skill.`
  }
  return null
}
