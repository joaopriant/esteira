import path from 'node:path'
import type { GitPort, Processo } from '../ports'
import { RedeDoSistema, type DecisaoProxy } from './rede'
import { caminhoSeguro, redigirSegredo, validarBranch, validarRemoto } from './seguro'

// Clone e pull na rede da empresa passam fácil de 3 min.
export const TIMEOUT_REDE_GIT_MS = 30 * 60 * 1000

const CHAVES_REDE = new Set([
  'http.sslbackend',
  'http.sslcainfo',
  'http.sslcapath',
  'http.proxy',
  'https.proxy',
  'http.schannelusesslcainfo',
  'http.schannelcheckrevoke',
])

const VARS_PROXY = ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'http_proxy', 'https_proxy', 'all_proxy']
const VARS_TRACE = ['GIT_TRACE', 'GIT_TRACE_PACKET', 'GIT_TRACE_CURL', 'GIT_CURL_VERBOSE']

export function filtrarChavesDeRede(saida: string): { chave: string; valor: string }[] {
  const mapa = new Map<string, string>()
  for (const registro of saida.split('\0')) {
    const quebra = registro.indexOf('\n')
    if (quebra < 0) continue
    const chave = registro.slice(0, quebra).trim().toLowerCase()
    const valor = registro.slice(quebra + 1).replace(/\r$/, '')
    if (!CHAVES_REDE.has(chave) || !valorAceito(chave, valor)) continue
    mapa.set(chave, valor)
  }
  return [...mapa].map(([chave, valor]) => ({ chave, valor }))
}

export function linhasDeProgresso(texto: string, pendente: { resto: string }): string[] {
  const partes = (pendente.resto + texto).split(/\r\n|\n|\r/)
  pendente.resto = partes.pop() ?? ''
  return partes.map((linha) => linha.trim()).filter(Boolean)
}

export function montarAmbienteGit(
  pat: string,
  base: NodeJS.ProcessEnv,
  sistema: { chave: string; valor: string }[],
  chavesGlobais: string[],
  decisao: DecisaoProxy,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...base }
  delete env.ANTHROPIC_API_KEY
  delete env.ANTHROPIC_AUTH_TOKEN
  for (const nome of VARS_TRACE) delete env[nome]
  // GIT_CONFIG_KEY_* que já venha no ambiente injetaria insteadOf ou outro header no processo do PAT.
  for (const chave of Object.keys(env)) {
    if (chave === 'GIT_CONFIG_GLOBAL') continue
    if (chave.startsWith('GIT_CONFIG_')) delete env[chave]
  }
  env.GIT_TERMINAL_PROMPT = '0'
  // Só https: um submódulo ou redirect não leva o git a ext::, file:// ou ssh.
  env.GIT_ALLOW_PROTOCOL = 'https'
  // O sistema inteiro fica de fora: no Git for Windows ele traz credential.helper
  // (gravaria o PAT fora do cofre) e pode trazer url.*.insteadOf ou outro extraheader.
  // O ~/.gitconfig continua valendo. Da config de sistema só entram TLS e proxy,
  // e só quando o global não definiu a mesma chave.
  env.GIT_CONFIG_NOSYSTEM = '1'
  // Ponteiro no lugar do binário. A wiki lê texto; um smudge de LFS derruba o clone.
  env.GIT_LFS_SKIP_SMUDGE = '1'

  const bloqueadas = new Set(chavesGlobais.map(slot))
  const pares: [string, string][] = [['http.extraheader', `AUTHORIZATION: Basic ${Buffer.from(`:${pat}`).toString('base64')}`]]
  let proxyGit: string | undefined
  for (const item of sistema) {
    if (bloqueadas.has(slot(item.chave))) continue
    if (slot(item.chave) === 'proxy') {
      if (!proxyGit || item.chave === 'http.proxy') proxyGit = item.valor
      continue
    }
    pares.push([item.chave, item.valor])
  }
  if (proxyGit) pares.push(['http.proxy', proxyGit])
  else if (!bloqueadas.has('proxy') && decisao.proxy && /^(https?|socks5h?):\/\/\S+$/i.test(decisao.proxy)) {
    pares.push(['http.proxy', decisao.proxy])
  } else if (!bloqueadas.has('proxy') && decisao.direto) {
    for (const nome of VARS_PROXY) delete env[nome]
  }

  pares.forEach(([chave, valor], indice) => {
    env[`GIT_CONFIG_KEY_${indice}`] = chave
    env[`GIT_CONFIG_VALUE_${indice}`] = valor
  })
  env.GIT_CONFIG_COUNT = String(pares.length)
  return env
}

export function criarGit(
  processo: Processo,
  raizRepos: string,
  rede: { decidirProxy?: (url: string) => Promise<DecisaoProxy> } = {},
): GitPort {
  const decidir = rede.decidirProxy ?? ((url: string) => RedeDoSistema.decidir(url))
  let configCache: Promise<{ sistema: { chave: string; valor: string }[]; globais: string[] }> | undefined

  function destino(dest: string) {
    return caminhoSeguro(raizRepos, path.relative(raizRepos, path.resolve(dest)) || '.')
  }

  function configDeRede() {
    configCache ??= lerConfigDeRede(processo).catch((erro: unknown) => {
      configCache = undefined
      throw erro
    })
    return configCache
  }

  async function ambiente(pat: string, url: string) {
    const [config, decisao] = await Promise.all([configDeRede(), decidir(url)])
    return montarAmbienteGit(pat, process.env, config.sistema, config.globais, decisao)
  }

  async function rodar(
    pedido: Parameters<Processo['executar']>[0],
    oQue: string,
    aoProgredir?: (linha: string) => void,
  ) {
    const pendente = { resto: '' }
    let cauda = ''
    const resultado = await processo.executar({
      ...pedido,
      aoSaida(canal, texto) {
        if (canal !== 'stderr') return
        cauda = (cauda + texto).slice(-8_000)
        for (const linha of linhasDeProgresso(texto, pendente)) publicar(linha, aoProgredir)
      },
    })
    if (pendente.resto.trim()) publicar(pendente.resto, aoProgredir)
    if (resultado.codigo !== 0) {
      const fim = (cauda || resultado.stderr).trim().slice(-500)
      throw new Error(`${oQue}: ${redigirSegredo(fim) || 'git falhou'}`)
    }
    return resultado
  }

  return {
    async clone({ url, dest, branch, pat, aoProgredir }) {
      validarRemoto(url)
      const branchOk = validarBranch(branch)
      const pasta = destino(dest)
      // Blobless: a wiki e o confronto leem a árvore de trabalho da ponta
      // (ls-files + o arquivo no disco) e, depois do pull, só os nomes entre
      // o HEAD anterior e o novo. Isso precisa dos commits e das trees.
      // --depth 1 descarta o commit anterior e esse diff deixa de resolver.
      // --progress: o stderr não é um terminal, e o git esconde o avanço sem a flag.
      await rodar(
        {
          comando: 'git',
          args: ['clone', '--filter=blob:none', '--progress', '--branch', branchOk, '--single-branch', url, pasta],
          env: await ambiente(pat, url),
          timeoutMs: TIMEOUT_REDE_GIT_MS,
        },
        'Não consegui clonar',
        aoProgredir,
      )
    },
    async atualizar({ url, dest, branch, pat, aoProgredir }) {
      validarRemoto(url)
      const pasta = destino(dest)
      const branchOk = validarBranch(branch)
      const env = await ambiente(pat, url)
      const antes = await rodar(
        { comando: 'git', args: ['rev-parse', 'HEAD'], cwd: pasta, env, timeoutMs: 30_000 },
        'Não li o commit',
      )
      await rodar(
        { comando: 'git', args: ['pull', '--ff-only', '--progress', 'origin', branchOk], cwd: pasta, env, timeoutMs: TIMEOUT_REDE_GIT_MS },
        'Não consegui atualizar',
        aoProgredir,
      )
      const diff = await rodar(
        { comando: 'git', args: ['diff', '--name-only', antes.stdout.trim(), 'HEAD'], cwd: pasta, env, timeoutMs: 30_000 },
        'Não li os arquivos alterados',
      )
      return { arquivosAlterados: diff.stdout.split('\n').map((linha) => linha.trim()).filter(Boolean) }
    },
    async listarArquivos(dest) {
      const pasta = destino(dest)
      const resultado = await rodar(
        { comando: 'git', args: ['ls-files'], cwd: pasta, env: process.env, timeoutMs: 30_000 },
        'Não listei os arquivos',
      )
      return resultado.stdout.split('\n').map((linha) => linha.trim()).filter(Boolean)
    },
    async lerArquivo(dest, relativo) {
      const pasta = destino(dest)
      const arquivo = caminhoSeguro(pasta, relativo)
      const fs = await import('node:fs/promises')
      return fs.readFile(arquivo, 'utf8')
    },
    async head(dest) {
      const pasta = destino(dest)
      const resultado = await rodar(
        { comando: 'git', args: ['rev-parse', 'HEAD'], cwd: pasta, env: process.env, timeoutMs: 30_000 },
        'Não li o commit',
      )
      return resultado.stdout.trim()
    },
  }
}

function slot(chave: string): string {
  if (chave === 'http.proxy' || chave === 'https.proxy') return 'proxy'
  return chave
}

function valorAceito(chave: string, valor: string): boolean {
  if (!valor || valor.length > 500 || /[\u0000-\u001F\u007F]/.test(valor)) return false
  if (chave === 'http.sslbackend') return /^(openssl|schannel|secure-transport)$/i.test(valor)
  if (chave === 'http.proxy' || chave === 'https.proxy') return /^(https?|socks5h?):\/\/\S+$/i.test(valor)
  if (chave === 'http.schannelusesslcainfo' || chave === 'http.schannelcheckrevoke') return /^(true|false|yes|no)$/i.test(valor)
  return true
}

function publicar(linha: string, aoProgredir?: (linha: string) => void) {
  if (!aoProgredir) return
  const limpa = redigirSegredo(linha.trim()).slice(0, 160)
  if (!limpa) return
  try {
    aoProgredir(limpa)
  } catch {
    // a tela não pode derrubar o clone
  }
}

async function lerConfigDeRede(processo: Processo): Promise<{ sistema: { chave: string; valor: string }[]; globais: string[] }> {
  const [sistema, global] = await Promise.all([lerEscopo(processo, '--system'), lerEscopo(processo, '--global')])
  return { sistema, globais: global.map((item) => item.chave) }
}

async function lerEscopo(processo: Processo, escopo: '--system' | '--global'): Promise<{ chave: string; valor: string }[]> {
  const env: NodeJS.ProcessEnv = { ...process.env }
  delete env.ANTHROPIC_API_KEY
  delete env.ANTHROPIC_AUTH_TOKEN
  delete env.GIT_CONFIG_NOSYSTEM
  for (const chave of Object.keys(env)) {
    if (/^GIT_CONFIG_(COUNT|KEY_|VALUE_|PARAMETERS)/.test(chave)) delete env[chave]
  }
  const resultado = await processo.executar({
    comando: 'git',
    args: ['config', escopo, '--list', '-z'],
    env,
    timeoutMs: 15_000,
  })
  if (resultado.codigo !== 0) return []
  return filtrarChavesDeRede(resultado.stdout)
}
