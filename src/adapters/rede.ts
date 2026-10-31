import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import tls from 'node:tls'
import type { IRequestOptions } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'

const require = createRequire(import.meta.url)

export interface DecisaoProxy {
  proxy: string | null
  direto: boolean
}

// O SDK do Azure (typed-rest-client) só abre túnel HTTP CONNECT. SOCKS não entra aqui.
const PROXY_HTTP = /^https?:\/\//i

export class RedeDoSistema {
  private static cacheCa: Promise<string | undefined> | undefined

  static proxyDeChromium(texto: string): string | null {
    for (const parte of texto.split(';')) {
      const match = /^(PROXY|HTTPS|SOCKS5?)\s+(\S+)$/i.exec(parte.trim())
      if (!match) continue
      const destino = match[2] ?? ''
      if (!/^(\[[^\]]+\]|[^:\s]+):\d+$/.test(destino)) continue
      const tipo = (match[1] ?? '').toUpperCase()
      if (tipo === 'HTTPS') return `https://${destino}`
      if (tipo === 'SOCKS' || tipo === 'SOCKS5') return `socks5://${destino}`
      return `http://${destino}`
    }
    return null
  }

  static proxyDoAmbiente(url: string, env: NodeJS.ProcessEnv): string | null {
    let host: string
    try {
      host = new URL(url).hostname
    } catch {
      return null
    }
    const excecao = env.NO_PROXY || env.no_proxy
    if (excecao && hostIgnoraProxy(host, excecao)) return null
    const bruto = env.HTTPS_PROXY || env.https_proxy || env.HTTP_PROXY || env.http_proxy || env.ALL_PROXY || env.all_proxy
    if (!bruto || bruto.length > 300 || /[\u0000-\u001F\u007F]/.test(bruto)) return null
    if (!/^(https?|socks5h?):\/\/\S+$/i.test(bruto)) return null
    return bruto
  }

  static interpretarPac(texto: string): DecisaoProxy {
    // A ordem do PAC manda: "DIRECT; PROXY p:1" é intranet direto, proxy só se o direto cair.
    // Entrada que não entendo (SOCKS4, etc.) é pulada em favor da próxima.
    for (const parte of texto.split(';').map((item) => item.trim()).filter(Boolean)) {
      if (parte === 'DIRECT') return { proxy: null, direto: true }
      const proxy = RedeDoSistema.proxyDeChromium(parte)
      if (proxy) return { proxy, direto: false }
    }
    const amostra = texto.trim().slice(0, 120) || '(vazio)'
    throw new Error(`Não entendi o proxy do sistema: ${amostra}. Aceito DIRECT, PROXY, HTTPS ou SOCKS5.`)
  }

  static async decidir(url: string, env: NodeJS.ProcessEnv = process.env): Promise<DecisaoProxy> {
    if (process.versions.electron) {
      let texto: string
      try {
        const electron = require('electron') as typeof import('electron')
        texto = await electron.session.defaultSession.resolveProxy(url)
      } catch {
        return { proxy: RedeDoSistema.proxyDoAmbiente(url, env), direto: false }
      }
      return RedeDoSistema.interpretarPac(texto)
    }
    return { proxy: RedeDoSistema.proxyDoAmbiente(url, env), direto: false }
  }

  static pemsDe(tipo: 'system' | 'extra' | 'bundled'): string[] {
    if (typeof tls.getCACertificates !== 'function') return []
    try {
      return tls.getCACertificates(tipo).filter((pem) => pem.includes('BEGIN CERTIFICATE'))
    } catch {
      return []
    }
  }

  static pemsDoSistema(): string[] {
    return RedeDoSistema.pemsDe('system')
  }

  static pemsExtra(): string[] {
    return RedeDoSistema.pemsDe('extra')
  }

  static juntarPems(...listas: string[][]): string {
    const vistos = new Set<string>()
    const saida: string[] = []
    for (const pem of listas.flat()) {
      if (!pem.includes('BEGIN CERTIFICATE') || vistos.has(pem)) continue
      vistos.add(pem)
      saida.push(pem.trim())
    }
    return saida.length === 0 ? '' : `${saida.join('\n')}\n`
  }

  // Sem sistema nem extra, o Node já usa o pacote embutido. Com caFile o SDK troca essa lista, então extra tem de ir junto.
  static textoCa(empacotados: string[], sistema: string[], extra: string[]): string {
    if (sistema.length === 0 && extra.length === 0) return ''
    return RedeDoSistema.juntarPems(empacotados, sistema, extra)
  }

  static async arquivoCa(): Promise<string | undefined> {
    this.cacheCa ??= this.gravarCa().catch((erro: unknown) => {
      this.cacheCa = undefined
      throw erro
    })
    return this.cacheCa
  }

  static opcoesHttps(decisao: DecisaoProxy, caFile?: string): IRequestOptions | undefined {
    const opcoes: IRequestOptions = {}
    if (decisao.proxy && PROXY_HTTP.test(decisao.proxy)) {
      const partes = partirProxy(decisao.proxy)
      if (partes) opcoes.proxy = partes
    } else if (decisao.direto) {
      // proxyUrl vazio: o SDK deixa de ler HTTP_PROXY quando o PAC disse DIRECT.
      opcoes.proxy = { proxyUrl: '' }
    }
    if (caFile) opcoes.cert = { caFile }
    if (!opcoes.proxy && !opcoes.cert) return undefined
    return opcoes
  }

  static async opcoesPara(
    url: string,
    deps: {
      decidir?: (url: string) => Promise<DecisaoProxy>
      arquivoCa?: () => Promise<string | undefined>
    } = {},
  ): Promise<IRequestOptions | undefined> {
    const decidir = deps.decidir ?? ((alvo: string) => RedeDoSistema.decidir(alvo))
    const arquivoCa = deps.arquivoCa ?? (() => RedeDoSistema.arquivoCa())
    return RedeDoSistema.opcoesHttps(await decidir(url), await arquivoCa())
  }

  private static pemsEmpacotados(): string[] {
    const daApi = RedeDoSistema.pemsDe('bundled')
    if (daApi.length > 0) return daApi
    return [...tls.rootCertificates]
  }

  private static async gravarCa(): Promise<string | undefined> {
    const texto = RedeDoSistema.textoCa(RedeDoSistema.pemsEmpacotados(), RedeDoSistema.pemsDoSistema(), RedeDoSistema.pemsExtra())
    if (!texto) return undefined
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-ca-'))
    const arquivo = path.join(dir, 'ca.pem')
    await fs.writeFile(arquivo, texto, { encoding: 'utf8', mode: 0o644 })
    return arquivo
  }
}

function hostIgnoraProxy(host: string, lista: string): boolean {
  const nome = host.toLowerCase()
  for (const item of lista.split(',')) {
    const regra = item.trim().toLowerCase()
    if (!regra) continue
    if (regra === '*') return true
    const semPorta = regra.replace(/:\d+$/, '').replace(/^\./, '')
    if (!semPorta) continue
    if (nome === semPorta || nome.endsWith(`.${semPorta}`)) return true
  }
  return false
}

function partirProxy(proxyUrl: string): { proxyUrl: string; proxyUsername?: string; proxyPassword?: string } | undefined {
  let url: URL
  try {
    url = new URL(proxyUrl)
  } catch {
    return undefined
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined
  if (!url.hostname) return undefined
  const host = url.port ? url.host : `${url.host}:${url.protocol === 'https:' ? '443' : '80'}`
  const limpo = `${url.protocol}//${host}`
  if (!url.username && !url.password) return { proxyUrl: limpo }
  return {
    proxyUrl: limpo,
    proxyUsername: decodificar(url.username),
    proxyPassword: decodificar(url.password),
  }
}

function decodificar(valor: string): string {
  try {
    return decodeURIComponent(valor)
  } catch {
    return valor
  }
}
