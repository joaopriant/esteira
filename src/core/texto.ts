const PARADA = new Set([
  'como', 'para', 'com', 'uma', 'uns', 'umas', 'que', 'nao', 'não', 'dos', 'das', 'pelo', 'pela',
  'por', 'num', 'numa', 'este', 'esta', 'esse', 'essa', 'isso', 'seu', 'sua', 'seus', 'suas',
  'the', 'and', 'for', 'with', 'sem', 'sob', 'entre', 'quando', 'onde', 'qual', 'quais',
  'mais', 'menos', 'muito', 'cada', 'todo', 'toda', 'todos', 'todas', 'já', 'ja', 'são', 'sao',
  'ser', 'ter', 'foi', 'era', 'vai', 'pode', 'deve', 'sobre', 'após', 'apos', 'até', 'ate',
  'pelo', 'pela', 'nos', 'nas', 'dum', 'duma', 'lhe', 'eles', 'elas', 'você', 'voce',
])

export function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function normalizarEspaco(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim()
}

export function tokenizar(texto: string): string[] {
  const limpo = semAcento(texto)
  const partes = limpo.split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !PARADA.has(t))
  return [...new Set(partes)]
}

export function tokensUteis(texto: string, nomesProduto: string[]): string[] {
  const banidos = new Set(nomesProduto.flatMap((nome) => tokenizar(nome)))
  return tokenizar(texto).filter((t) => !banidos.has(t))
}

export function impressaoAchado(tipo: string, texto: string, chaveProva: string): string {
  return `${tipo}|${normalizarEspaco(semAcento(texto))}|${chaveProva}`
}

export function chaveProva(evidencia: { tipo: string; caminho?: string; id?: number; trecho?: string }): string {
  if (evidencia.tipo === 'arquivo') return `arq:${evidencia.caminho ?? ''}:${normalizarEspaco(evidencia.trecho ?? '').slice(0, 80)}`
  if (evidencia.tipo === 'work-item') return `wi:${evidencia.id ?? ''}`
  return 'ausencia'
}

export function dataMesesAtras(agora: Date, meses: number): Date {
  const d = new Date(agora.getTime())
  d.setUTCMonth(d.getUTCMonth() - meses)
  return d
}

export function novoId(prefixo: string): string {
  return `${prefixo}-${crypto.randomUUID()}`
}
