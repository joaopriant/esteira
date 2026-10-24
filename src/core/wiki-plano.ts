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
  anteriores: { id: string; hashes: Record<string, string> }[],
  atuais: ModuloPlanejado[],
): string[] {
  const antes = new Map(anteriores.map((modulo) => [modulo.id, modulo.hashes]))
  const ids: string[] = []
  for (const modulo of atuais) {
    const hashes = antes.get(modulo.id)
    if (!hashes) {
      ids.push(modulo.id)
      continue
    }
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
