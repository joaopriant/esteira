const IGNORAR = ['node_modules', '.git', 'dist', 'build', 'bin', 'obj', 'coverage', 'out', 'release']

export interface ArquivoModulo {
  repositorioId: string
  repositorioNome: string
  caminho: string
  hash: string
}

export interface ModuloPlanejado {
  id: string
  nome: string
  repositorioId: string
  repositorioNome: string
  arquivos: string[]
  hashes: Record<string, string>
}

function ignorado(caminho: string): boolean {
  const partes = caminho.split(/[/\\]/)
  return partes.some((parte) => IGNORAR.includes(parte))
}

function segmento(caminho: string): string {
  const partes = caminho.split(/[/\\]/).filter(Boolean)
  const src = partes.indexOf('src')
  if (src >= 0 && partes.length > src + 2) return partes[src + 1] ?? 'src'
  if (partes.length >= 2) return partes[0] ?? 'raiz'
  return 'raiz'
}

/** shortcut: 80 mil caracteres por chamada da wiki; rever se um módulo precisar caber inteiro numa chamada só. */
export const LIMITE_CONTEXTO_WIKI = 80_000

const ESTADOS_A_REFAZER = new Set(['erro', 'pendente', 'gerando'])

export function definirModulos(arquivos: ArquivoModulo[]): ModuloPlanejado[] {
  const grupos = new Map<string, ModuloPlanejado>()
  for (const arquivo of arquivos) {
    if (ignorado(arquivo.caminho)) continue
    if (!/\.(ts|tsx|js|jsx|cs|java|py|go|rb|kt|php|json|md)$/i.test(arquivo.caminho)) continue
    const nome = segmento(arquivo.caminho)
    const id = `${arquivo.repositorioNome}/${nome}`
    const atual = grupos.get(id) ?? {
      id,
      nome,
      repositorioId: arquivo.repositorioId,
      repositorioNome: arquivo.repositorioNome,
      arquivos: [],
      hashes: {},
    }
    atual.arquivos.push(arquivo.caminho)
    atual.hashes[arquivo.caminho] = arquivo.hash
    grupos.set(id, atual)
  }
  return [...grupos.values()].sort((a, b) => a.id.localeCompare(b.id))
}

export function modulosParaRegenerar(
  anteriores: { id: string; hashes: Record<string, string>; estado?: string }[],
  atuais: ModuloPlanejado[],
): string[] {
  const antes = new Map(anteriores.map((modulo) => [modulo.id, modulo]))
  const ids: string[] = []
  for (const modulo of atuais) {
    const anterior = antes.get(modulo.id)
    if (!anterior || (anterior.estado !== undefined && ESTADOS_A_REFAZER.has(anterior.estado))) {
      ids.push(modulo.id)
      continue
    }
    const hashes = anterior.hashes
    const chaves = new Set([...Object.keys(hashes), ...Object.keys(modulo.hashes)])
    for (const chave of chaves) {
      if (hashes[chave] !== modulo.hashes[chave]) {
        ids.push(modulo.id)
        break
      }
    }
  }
  return ids
}

export function fatiarPorContexto<T extends { conteudo: string }>(arquivos: T[], limite = LIMITE_CONTEXTO_WIKI): T[][] {
  const lotes: T[][] = []
  let lote: T[] = []
  let usado = 0
  for (const arquivo of arquivos) {
    if (lote.length > 0 && usado + arquivo.conteudo.length > limite) {
      lotes.push(lote)
      lote = []
      usado = 0
    }
    lote.push(arquivo)
    usado += arquivo.conteudo.length
  }
  if (lote.length > 0) lotes.push(lote)
  return lotes
}
