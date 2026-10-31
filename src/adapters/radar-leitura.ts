import fs from 'node:fs/promises'
import path from 'node:path'
import type { LeitorRadar } from '../ports'
import type { ProvedorRadar, SinalBruto } from '../shared/tipos'
import { caminhoSeguro } from './seguro'

export interface PedidoLeitura {
  method: 'GET'
  url: string
  provedor: 'teams' | 'slack'
}

const HOSTS: Record<'teams' | 'slack', string> = {
  teams: 'graph.microsoft.com',
  slack: 'slack.com',
}

// shortcut: 40 páginas por sincronização, revisar se um canal passar disso
export const PAGINAS_MAX = 40
// shortcut: espera máxima de 30s num 429, revisar se a API pedir mais
export const ESPERA_MAX_MS = 30_000
const TENTATIVAS_MAX = 3

export function pedidoLeitura(provedor: ProvedorRadar, referencia: string, _token?: string | null): PedidoLeitura | null {
  if (provedor === 'whatsapp' || provedor === 'granola' || provedor === 'plaud') return null
  if (provedor === 'teams') {
    const partes = referencia.split('/')
    if (partes.length !== 2 || partes.some((parte) => !/^[A-Za-z0-9-]{1,80}$/.test(parte))) return null
    const [time, canal] = partes
    return {
      method: 'GET',
      url: `https://${HOSTS.teams}/v1.0/teams/${time}/channels/${canal}/messages`,
      provedor: 'teams',
    }
  }
  if (!/^[A-Z0-9]{2,32}$/.test(referencia)) return null
  return {
    method: 'GET',
    url: `https://${HOSTS.slack}/api/conversations.history?channel=${encodeURIComponent(referencia)}&limit=200`,
    provedor: 'slack',
  }
}

function sinaisDeJson(provedor: ProvedorRadar, fonteRef: string, fonteNome: string, corpo: unknown): SinalBruto[] {
  const lista = Array.isArray(corpo) ? corpo : [corpo]
  const sinais: SinalBruto[] = []
  for (const item of lista) {
    if (!item || typeof item !== 'object') continue
    const registro = item as Record<string, unknown>
    const texto = String(registro.texto ?? registro.text ?? '').trim()
    if (!texto) continue
    sinais.push({
      id: String(registro.id ?? `${provedor}-${sinais.length}-${fonteRef}`),
      provedor,
      fonteRef,
      fonteNome: String(registro.local ?? fonteNome),
      autor: String(registro.autor ?? registro.author ?? 'sem nome'),
      local: String(registro.local ?? fonteNome),
      em: String(registro.em ?? new Date(0).toISOString()),
      texto,
      fio: String(registro.fio ?? registro.id ?? fonteRef),
    })
  }
  return sinais
}

const MARCAS_BIDI = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g
const IOS = /^\[(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})[, ]\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\]\s([^:]+):\s([\s\S]*)$/i
const ANDROID = /^(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AP]M)?)\s+[-–—]\s+([^:]+):\s([\s\S]*)$/i

export function parseWhatsApp(fonteRef: string, fonteNome: string, texto: string): SinalBruto[] {
  const sinais: SinalBruto[] = []
  const linhas = texto.split(/\r?\n/)
  let atual: SinalBruto | null = null
  for (const bruta of linhas) {
    const linha = bruta.replace(MARCAS_BIDI, '').replace(/\u00a0|\u202f/g, ' ')
    const casa = linha.match(IOS) ?? linha.match(ANDROID)
    if (!casa) {
      const texto = linha.trim()
      const cabecalho = /^\[?\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}/.test(texto)
      if (atual && texto && !cabecalho) atual.texto = `${atual.texto}\n${texto}`
      continue
    }
    if (atual) sinais.push(atual)
    atual = {
      id: `${fonteRef}-${sinais.length + 1}`,
      provedor: 'whatsapp',
      fonteRef,
      fonteNome,
      autor: casa[3]!.trim(),
      local: fonteNome,
      em: casa[1]! + ' ' + casa[2]!,
      texto: casa[4]!.trim(),
      fio: fonteRef,
    }
  }
  if (atual) sinais.push(atual)
  return sinais.filter((sinal) => sinal.texto.trim())
}

async function lerArquivo(provedor: ProvedorRadar, pastaProvedor: string, relativo: string): Promise<SinalBruto[]> {
  const cheio = caminhoSeguro(pastaProvedor, relativo)
  const nome = path.basename(relativo)
  const texto = await fs.readFile(cheio, 'utf8')
  if (provedor === 'whatsapp' || nome.endsWith('.txt')) {
    if (provedor === 'whatsapp') return parseWhatsApp(relativo, nome, texto)
    return [{
      id: `${provedor}-${nome}`,
      provedor,
      fonteRef: relativo,
      fonteNome: nome,
      autor: provedor === 'plaud' ? 'nota de voz' : 'nota',
      local: nome,
      em: new Date(0).toISOString(),
      texto,
      fio: relativo,
    }]
  }
  if (nome.endsWith('.json')) return sinaisDeJson(provedor, relativo, nome, JSON.parse(texto) as unknown)
  if (nome.endsWith('.md')) {
    return [{
      id: `${provedor}-${nome}`,
      provedor,
      fonteRef: relativo,
      fonteNome: nome,
      autor: 'nota',
      local: nome,
      em: new Date(0).toISOString(),
      texto,
      fio: relativo,
    }]
  }
  return []
}

export async function lerPasta(raiz: string, provedor: ProvedorRadar, referencia: string): Promise<SinalBruto[]> {
  const pasta = caminhoSeguro(raiz, provedor)
  try {
    await fs.access(pasta)
  } catch {
    return []
  }
  if (referencia && referencia !== '.') {
    try {
      return await lerArquivo(provedor, pasta, referencia)
    } catch {
      return []
    }
  }
  const nomes = await fs.readdir(pasta)
  const sinais: SinalBruto[] = []
  for (const nome of nomes) {
    if (nome.startsWith('.')) continue
    try {
      sinais.push(...(await lerArquivo(provedor, pasta, nome)))
    } catch {
      /* arquivo ilegível não entra */
    }
  }
  return sinais
}

function sinaisDaApi(provedor: 'teams' | 'slack', referencia: string, json: unknown): SinalBruto[] {
  if (!json || typeof json !== 'object') return []
  if (provedor === 'teams') {
    const valor = (json as { value?: unknown[] }).value ?? []
    return valor.flatMap((item, indice) => {
      if (!item || typeof item !== 'object') return []
      const mensagem = item as { id?: string; createdDateTime?: string; from?: { user?: { displayName?: string } }; body?: { content?: string } }
      const texto = String(mensagem.body?.content ?? '').replace(/<[^>]+>/g, ' ').trim()
      if (!texto) return []
      return [{
        id: mensagem.id || `teams-api-${indice}`,
        provedor: 'teams' as const,
        fonteRef: referencia,
        fonteNome: referencia,
        autor: mensagem.from?.user?.displayName || 'sem nome',
        local: `Teams · ${referencia}`,
        em: mensagem.createdDateTime || new Date(0).toISOString(),
        texto,
        fio: mensagem.id || referencia,
      }]
    })
  }
  const mensagens = (json as { messages?: unknown[] }).messages ?? []
  return mensagens.flatMap((item, indice) => {
    if (!item || typeof item !== 'object') return []
    const mensagem = item as { user?: string; text?: string; ts?: string }
    const texto = String(mensagem.text ?? '').trim()
    if (!texto) return []
    return [{
      id: mensagem.ts || `slack-api-${indice}`,
      provedor: 'slack' as const,
      fonteRef: referencia,
      fonteNome: referencia,
      autor: mensagem.user || 'sem nome',
      local: `Slack · ${referencia}`,
      em: mensagem.ts ? new Date(Number(mensagem.ts) * 1000).toISOString() : new Date(0).toISOString(),
      texto,
      fio: mensagem.ts || referencia,
    }]
  })
}

function urlHttps(valor: string, host: string, caminho: string): URL | null {
  let url: URL
  try {
    url = new URL(valor)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.hostname !== host) return null
  if (url.username || url.password) return null
  if (url.port && url.port !== '443') return null
  if (url.pathname !== caminho) return null
  return url
}

export class PaginasRadar {
  static espera(retryAfter: string | null): number {
    if (retryAfter == null || retryAfter.trim() === '') return 1000
    const segundos = Number(retryAfter)
    if (!Number.isFinite(segundos) || segundos < 0) return 1000
    return Math.min(Math.round(segundos * 1000), ESPERA_MAX_MS)
  }

  static urlTeamsPermitida(url: string, referencia: string): boolean {
    const partes = referencia.split('/')
    if (partes.length !== 2) return false
    const [time, canal] = partes
    return Boolean(urlHttps(url, HOSTS.teams, `/v1.0/teams/${time}/channels/${canal}/messages`))
  }

  static urlSlackPermitida(url: string, referencia: string): boolean {
    const parsed = urlHttps(url, HOSTS.slack, '/api/conversations.history')
    return Boolean(parsed && parsed.searchParams.get('channel') === referencia)
  }

  static async ler(opcoes: {
    provedor: 'teams' | 'slack'
    referencia: string
    urlInicial: string
    token: string
    buscar: typeof fetch
    esperar?: (ms: number) => Promise<void>
    renovar?: () => Promise<string | null>
  }): Promise<SinalBruto[]> {
    const esperar = opcoes.esperar ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))
    const sinais: SinalBruto[] = []
    const vistas = new Set<string>()
    let url = opcoes.urlInicial
    let token = opcoes.token
    let renovou = false
    for (let pagina = 0; pagina < PAGINAS_MAX; pagina++) {
      const permitida = opcoes.provedor === 'teams'
        ? this.urlTeamsPermitida(url, opcoes.referencia)
        : this.urlSlackPermitida(url, opcoes.referencia)
      if (!permitida || vistas.has(url)) break
      vistas.add(url)
      const obtido = await this.pagina(url, token, opcoes.buscar, esperar)
      if (obtido.status === 401 && !renovou && opcoes.renovar) {
        const novo = await opcoes.renovar()
        if (!novo) break
        token = novo
        renovou = true
        vistas.delete(url)
        pagina -= 1
        continue
      }
      if (!obtido.json) {
        if (pagina === 0) return []
        break
      }
      if (opcoes.provedor === 'slack') {
        const registro = obtido.json as { ok?: boolean }
        if (registro.ok === false) {
          if (pagina === 0) return []
          break
        }
      }
      sinais.push(...sinaisDaApi(opcoes.provedor, opcoes.referencia, obtido.json))
      const proxima = this.proxima(opcoes.provedor, opcoes.referencia, obtido.json)
      if (!proxima) break
      url = proxima
    }
    return sinais
  }

  private static proxima(provedor: 'teams' | 'slack', referencia: string, json: unknown): string | null {
    if (!json || typeof json !== 'object') return null
    if (provedor === 'teams') {
      const link = (json as { '@odata.nextLink'?: unknown })['@odata.nextLink']
      if (typeof link !== 'string' || !this.urlTeamsPermitida(link, referencia)) return null
      return link
    }
    const corpo = json as { has_more?: unknown; response_metadata?: { next_cursor?: unknown } }
    if (corpo.has_more === false) return null
    const cursor = corpo.response_metadata?.next_cursor
    if (typeof cursor !== 'string' || !/^[\w+/=-]{1,512}$/.test(cursor)) return null
    const url = new URL(`https://${HOSTS.slack}/api/conversations.history`)
    url.searchParams.set('channel', referencia)
    url.searchParams.set('limit', '200')
    url.searchParams.set('cursor', cursor)
    return url.toString()
  }

  private static async pagina(
    url: string,
    token: string,
    buscar: typeof fetch,
    esperar: (ms: number) => Promise<void>,
  ): Promise<{ status: number; json: unknown | null }> {
    let status = 0
    for (let tentativa = 0; tentativa < TENTATIVAS_MAX; tentativa++) {
      const resposta = await buscar(url, {
        method: 'GET',
        redirect: 'manual',
        headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      })
      status = resposta.status
      if (status >= 300 && status < 400) {
        await resposta.arrayBuffer().catch(() => undefined)
        return { status, json: null }
      }
      if (status === 429 || status === 503) {
        await resposta.arrayBuffer().catch(() => undefined)
        if (tentativa === TENTATIVAS_MAX - 1) return { status, json: null }
        await esperar(this.espera(resposta.headers.get('retry-after')))
        continue
      }
      if (!resposta.ok) {
        await resposta.arrayBuffer().catch(() => undefined)
        return { status, json: null }
      }
      const json: unknown = await resposta.json().catch(() => null)
      const erro = json && typeof json === 'object' ? String((json as { error?: string }).error ?? '') : ''
      if (erro === 'ratelimited') {
        if (tentativa === TENTATIVAS_MAX - 1) return { status: 429, json: null }
        await esperar(this.espera(resposta.headers.get('retry-after')))
        continue
      }
      return { status, json }
    }
    return { status, json: null }
  }
}

export function criarLeitorReal(opcoes: {
  provedor: ProvedorRadar
  pasta: string
  token: () => Promise<string | null>
  renovar?: () => Promise<string | null>
  buscar?: typeof fetch
  esperar?: (ms: number) => Promise<void>
}): LeitorRadar {
  const buscar = opcoes.buscar ?? fetch
  return {
    provedor: opcoes.provedor,
    async listarCanais() {
      const pasta = caminhoSeguro(opcoes.pasta, opcoes.provedor)
      try {
        const nomes = await fs.readdir(pasta)
        return nomes.filter((nome) => !nome.startsWith('.')).map((nome) => ({ referencia: nome, nome }))
      } catch {
        return []
      }
    },
    async ler(referencia) {
      const locais = await lerPasta(opcoes.pasta, opcoes.provedor, referencia)
      const pedido = pedidoLeitura(opcoes.provedor, referencia)
      if (!pedido) return locais
      const token = await opcoes.token()
      if (!token) return locais
      try {
        const remotos = await PaginasRadar.ler({
          provedor: pedido.provedor,
          referencia,
          urlInicial: pedido.url,
          token,
          buscar,
          esperar: opcoes.esperar,
          renovar: opcoes.renovar,
        })
        return [...locais, ...remotos]
      } catch {
        return locais
      }
    },
  }
}
