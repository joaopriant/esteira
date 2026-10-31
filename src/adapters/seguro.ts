import path from 'node:path'

const HOSTS = [/^dev\.azure\.com$/i, /^[\w-]+\.visualstudio\.com$/i]

export function validarOrgUrl(valor: string): URL {
  let url: URL
  try {
    url = new URL(valor.trim())
  } catch {
    throw new Error('A URL da organização não é válida.')
  }
  if (url.protocol !== 'https:') throw new Error('A URL da organização precisa ser https.')
  if (!HOSTS.some((regra) => regra.test(url.hostname))) {
    throw new Error('Só aceito dev.azure.com ou visualstudio.com.')
  }
  if (url.username || url.password) throw new Error('Não coloque o token na URL.')
  return url
}

export function validarRemoto(valor: string): URL {
  const url = validarOrgUrl(valor)
  return url
}

export function validarBranch(branch: string): string {
  if (!/^[A-Za-z0-9._/-]+$/.test(branch) || branch.includes('..') || branch.startsWith('/') || branch.endsWith('/')) {
    throw new Error(`Branch inválida: ${branch}`)
  }
  return branch
}

export function validarBinario(valor: string): string {
  const texto = valor.trim()
  if (!texto || texto.includes('\0') || /[\r\n]/.test(texto)) throw new Error('Executável inválido.')
  if (texto.includes(' ')) throw new Error('O caminho do executável não pode levar argumento.')
  if (texto === 'git' || texto === 'claude') return texto
  if (!path.isAbsolute(texto)) throw new Error('Informe claude ou um caminho absoluto.')
  return texto
}

export function caminhoSeguro(raiz: string, relativo: string): string {
  if (!relativo || relativo.includes('\0')) throw new Error('Caminho inválido.')
  const base = path.resolve(raiz)
  const cheio = path.resolve(base, relativo)
  const rel = path.relative(base, cheio)
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Caminho fora da pasta permitida.')
  return cheio
}

export function nomePastaSeguro(nome: string): string {
  const limpo = nome.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  if (!limpo || limpo === '.' || limpo === '..') throw new Error('Nome de pasta inválido.')
  return limpo
}

export function contaDoPat(orgUrl: string): string {
  return `azure-devops:${validarOrgUrl(orgUrl).origin}${validarOrgUrl(orgUrl).pathname.replace(/\/$/, '')}`
}

export function contaRadar(provedor: 'teams' | 'slack' | 'whatsapp'): string {
  return `radar:${provedor}`
}

export function contaRefreshRadar(provedor: 'teams' | 'slack'): string {
  return `radar:${provedor}:refresh`
}

export function contaExpiraRadar(provedor: 'teams' | 'slack'): string {
  return `radar:${provedor}:expira`
}

export function redigirSegredo(texto: string): string {
  return texto
    .replace(/Authorization:\s*Basic\s+\S+/gi, 'Authorization: Basic [redigido]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redigido]')
    .replace(/https:\/\/[^:\s/]+:[^@\s/]+@/gi, 'https://[redigido]@')
    .slice(0, 500)
}
