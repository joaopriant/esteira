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
