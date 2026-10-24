import type { Produto, Repositorio } from '../shared/tipos'

export function extrairMencoes(texto: string): string[] {
  const achadas = new Set<string>()
  for (const match of texto.matchAll(/(^|[\s(])@([\w.-]+)/g)) {
    const nome = match[2]
    if (nome) achadas.add(nome)
  }
  return [...achadas]
}

export function resolverEscopo(
  mencoes: string[],
  produto: Produto,
  produtos: Produto[],
  repositorios: Repositorio[],
): { repositorioIds: string[]; avisos: string[] } {
  const porId = new Map(produtos.map((item) => [item.id, item]))
  const base = new Set<string>(produto.repositorioIds)
  for (const id of produto.dependeDe) {
    const ligado = porId.get(id)
    if (!ligado) continue
    for (const repoId of ligado.repositorioIds) base.add(repoId)
  }
  if (mencoes.length === 0) return { repositorioIds: [...base], avisos: [] }

  const escolhidos = new Set<string>()
  const avisos: string[] = []
  const reposPorNome = new Map(repositorios.map((repo) => [repo.nome.toLowerCase(), repo]))
  const produtosPorNome = new Map(produtos.map((item) => [item.nome.toLowerCase(), item]))

  for (const mencao of mencoes) {
    const chave = mencao.toLowerCase()
    const repo = reposPorNome.get(chave)
    if (repo) {
      if (!base.has(repo.id) && !repo.selecionado) {
        avisos.push(`@${mencao} está fora do produto e dos repositórios escolhidos.`)
        continue
      }
      escolhidos.add(repo.id)
      continue
    }
    const alvo = produtosPorNome.get(chave)
    if (alvo) {
      for (const repoId of alvo.repositorioIds) {
        if (base.has(repoId) || alvo.id === produto.id || produto.dependeDe.includes(alvo.id)) escolhidos.add(repoId)
      }
      if (alvo.repositorioIds.length === 0) avisos.push(`@${mencao} não tem repositório.`)
      continue
    }
    avisos.push(`Não encontrei @${mencao}. A busca segue no produto e nos ligados.`)
  }

  if (escolhidos.size === 0) return { repositorioIds: [...base], avisos }
  return { repositorioIds: [...escolhidos], avisos }
}
