import { tokensUteis } from './texto'

export function escolherArquivos<T extends { caminho: string; conteudo: string }>(
  arquivos: T[],
  consulta: string,
  nomesProduto: string[],
  limite: number,
): T[] {
  const tokens = tokensUteis(consulta, nomesProduto)
  const pontuados = arquivos
    .filter((arquivo) => !arquivo.caminho.endsWith('.md'))
    .map((arquivo) => {
      const texto = arquivo.conteudo.toLowerCase()
      const pontos = tokens.reduce((soma, token) => soma + (texto.includes(token) ? 1 : 0), 0)
      return { arquivo, pontos }
    })
    .filter((linha) => linha.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos || a.arquivo.caminho.localeCompare(b.arquivo.caminho))
  return pontuados.slice(0, limite).map((linha) => linha.arquivo)
}
