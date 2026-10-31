import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { pausaCloneExemplo } from '../src/adapters/falsos'
import { criarAplicacao } from '../src/app/criar'
import { criarProcesso } from '../src/adapters/processo'
import {
  TIMEOUT_REDE_GIT_MS,
  criarGit,
  filtrarChavesDeRede,
  linhasDeProgresso,
  montarAmbienteGit,
} from '../src/adapters/git-cli'
import type { DecisaoProxy } from '../src/adapters/rede'
import type { GitPort, Processo } from '../src/ports'

const URL = 'https://dev.azure.com/fintech/Pagamentos/_git/pagamentos-api'
const PAT = 'pat-de-teste'
const SEM_PROXY: DecisaoProxy = { proxy: null, direto: false }

function pares(env: NodeJS.ProcessEnv): Record<string, string> {
  const total = Number(env.GIT_CONFIG_COUNT ?? 0)
  const saida: Record<string, string> = {}
  for (let i = 0; i < total; i++) saida[String(env[`GIT_CONFIG_KEY_${i}`])] = String(env[`GIT_CONFIG_VALUE_${i}`])
  return saida
}

function ambiente(
  sistema: { chave: string; valor: string }[],
  globais: string[] = [],
  decisao: DecisaoProxy = SEM_PROXY,
  base: NodeJS.ProcessEnv = {},
) {
  return montarAmbienteGit(PAT, base, sistema, globais, decisao)
}

describe('ambiente do git', () => {
  it('mantém o isolamento e copia só TLS e proxy do sistema', () => {
    const env = ambiente(
      [
        { chave: 'http.sslbackend', valor: 'schannel' },
        { chave: 'http.proxy', valor: 'http://proxy.empresa:8080' },
        { chave: 'https.proxy', valor: 'http://outro:9' },
        { chave: 'http.sslcainfo', valor: 'C:\\Program Files\\Git\\usr\\ssl\\certs\\ca-bundle.crt' },
      ],
      [],
      SEM_PROXY,
      {
        ANTHROPIC_API_KEY: 'nao-pode-ir',
        GIT_TRACE: '1',
        GIT_CONFIG_COUNT: '3',
        GIT_CONFIG_KEY_2: 'url.https://evil.example/.insteadof',
        GIT_CONFIG_VALUE_2: 'https://dev.azure.com/',
        GIT_CONFIG_GLOBAL: '/home/eu/.gitconfig',
      },
    )
    const config = pares(env)
    expect(env.GIT_CONFIG_NOSYSTEM).toBe('1')
    expect(env.GIT_LFS_SKIP_SMUDGE).toBe('1')
    expect(env.GIT_TERMINAL_PROMPT).toBe('0')
    expect(env.GIT_ALLOW_PROTOCOL).toBe('https')
    expect(env.ANTHROPIC_API_KEY).toBeUndefined()
    expect(env.GIT_TRACE).toBeUndefined()
    expect(env.GIT_CONFIG_GLOBAL).toBe('/home/eu/.gitconfig')
    expect(config['http.extraheader']).toBe(`AUTHORIZATION: Basic ${Buffer.from(`:${PAT}`).toString('base64')}`)
    expect(config['http.sslbackend']).toBe('schannel')
    expect(config['http.sslcainfo']).toContain('ca-bundle.crt')
    expect(config['http.proxy']).toBe('http://proxy.empresa:8080')
    expect(Object.values(config).join(' ')).not.toContain('evil.example')
    expect(Object.keys(config)).not.toContain('credential.helper')
  })

  it('não cobre o proxy nem o sslBackend que o usuário já definiu no global', () => {
    const env = ambiente(
      [
        { chave: 'http.sslbackend', valor: 'schannel' },
        { chave: 'http.proxy', valor: 'http://proxy.sistema:8080' },
      ],
      ['http.proxy', 'http.sslbackend'],
    )
    const config = pares(env)
    expect(config['http.sslbackend']).toBeUndefined()
    expect(config['http.proxy']).toBeUndefined()
    expect(config['http.extraheader']).toContain('Basic')
  })

  it('prefere http.proxy do sistema e, sem ele, o proxy resolvido na máquina', () => {
    const doSistema = pares(ambiente([
      { chave: 'https.proxy', valor: 'http://so-https:8080' },
      { chave: 'http.proxy', valor: 'http://http-primeiro:8080' },
    ]))
    expect(doSistema['http.proxy']).toBe('http://http-primeiro:8080')

    const daMaquina = pares(ambiente([], [], { proxy: 'socks5://10.1.1.1:1080', direto: false }))
    expect(daMaquina['http.proxy']).toBe('socks5://10.1.1.1:1080')
  })

  it('em DIRECT tira o proxy do ambiente quando o gitconfig não tem proxy', () => {
    const env = ambiente([], [], { proxy: null, direto: true }, { HTTPS_PROXY: 'http://proxy:8080', http_proxy: 'http://proxy:8080' })
    expect(env.HTTPS_PROXY).toBeUndefined()
    expect(env.http_proxy).toBeUndefined()
    expect(pares(env)['http.proxy']).toBeUndefined()
  })

  it('descarta chave fora da lista e valor com quebra de linha', () => {
    const saida = [
      'http.sslbackend\nschannel',
      'credential.helper\nmanager',
      'http.extraheader\nAuthorization: Basic ruim',
      'url.https://evil.example/.insteadof\nhttps://dev.azure.com/',
      'http.sslbackend\nschannel\nextra',
      'http.schannelcheckrevoke\ntrue',
      'http.proxy\njavascript:alert(1)',
    ].join('\0')
    expect(filtrarChavesDeRede(saida)).toEqual([
      { chave: 'http.sslbackend', valor: 'schannel' },
      { chave: 'http.schannelcheckrevoke', valor: 'true' },
    ])
  })

  it('separa o progresso que o git reescreve com retorno de carro', () => {
    const pendente = { resto: '' }
    expect(linhasDeProgresso('Receiving objects:   1% (1/10)\rReceiving objects: 100% (10/10), done.\n', pendente)).toEqual([
      'Receiving objects:   1% (1/10)',
      'Receiving objects: 100% (10/10), done.',
    ])
    expect(pendente.resto).toBe('')
    expect(linhasDeProgresso('Checking out files:  50%', pendente)).toEqual([])
    expect(linhasDeProgresso('\n', pendente)).toEqual(['Checking out files:  50%'])
  })
})

describe('criarGit com dublê', () => {
  it('clona blobless, com progresso, timeout longo e o PAT só no ambiente', async () => {
    const chamadas: { args: string[]; env: NodeJS.ProcessEnv; timeoutMs: number }[] = []
    const progresso: string[] = []
    const processo: Processo = {
      async executar(pedido) {
        chamadas.push({ args: pedido.args, env: pedido.env ?? {}, timeoutMs: pedido.timeoutMs })
        if (pedido.args[0] === 'config') return { codigo: pedido.args.includes('--system') ? 0 : 1, stdout: sistema(), stderr: '' }
        pedido.aoSaida?.('stderr', 'Receiving objects:   1% (1/10)\rReceiving objects: 100% (10/10), done.\nAuthorization: Basic segredo-no-progresso\r')
        return { codigo: 0, stdout: '', stderr: '' }
      },
    }
    const anterior = process.env.ANTHROPIC_API_KEY
    process.env.ANTHROPIC_API_KEY = 'nao-pode-ir'
    const raiz = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-git-'))
    try {
      const git = criarGit(processo, raiz, { decidirProxy: async () => ({ proxy: 'http://proxy.empresa:8080', direto: false }) })
      await git.clone({
        url: URL,
        dest: path.join(raiz, 'pagamentos-api'),
        branch: 'main',
        pat: PAT,
        aoProgredir: (linha) => progresso.push(linha),
      })
    } finally {
      if (anterior === undefined) delete process.env.ANTHROPIC_API_KEY
      else process.env.ANTHROPIC_API_KEY = anterior
      await fs.rm(raiz, { recursive: true, force: true })
    }

    const config = chamadas.filter((chamada) => chamada.args[0] === 'config')
    expect(config.map((chamada) => chamada.args)).toEqual([
      ['config', '--system', '--list', '-z'],
      ['config', '--global', '--list', '-z'],
    ])
    expect(JSON.stringify(config[0]?.env)).not.toContain(PAT)
    expect(config[0]?.env.GIT_CONFIG_NOSYSTEM).toBeUndefined()

    const clone = chamadas.find((chamada) => chamada.args[0] === 'clone')
    expect(clone?.args).toEqual(['clone', '--filter=blob:none', '--progress', '--branch', 'main', '--single-branch', URL, path.join(raiz, 'pagamentos-api')])
    expect(clone?.timeoutMs).toBe(TIMEOUT_REDE_GIT_MS)
    expect(clone?.args.join(' ')).not.toContain(PAT)
    expect(clone?.env.ANTHROPIC_API_KEY).toBeUndefined()
    expect(clone?.env.GIT_CONFIG_NOSYSTEM).toBe('1')
    expect(clone?.env.GIT_LFS_SKIP_SMUDGE).toBe('1')
    expect(pares(clone?.env ?? {})['http.sslbackend']).toBe('schannel')
    expect(pares(clone?.env ?? {})['http.proxy']).toBe('http://proxy.sistema:8080')
    expect(progresso).toEqual([
      'Receiving objects:   1% (1/10)',
      'Receiving objects: 100% (10/10), done.',
      'Authorization: Basic [redigido]',
    ])
  })

  it('mostra o fim do erro, sem o segredo, e segue se o sistema não tem config', async () => {
    const processo: Processo = {
      async executar(pedido) {
        if (pedido.args[0] === 'config') return { codigo: 1, stdout: '', stderr: 'fatal: não achei' }
        if (pedido.args[0] === 'clone') {
          pedido.aoSaida?.('stderr', `${'x'.repeat(3000)}\nfatal: sumiu Authorization: Basic segredo-que-nao-pode-vazar\n`)
          return { codigo: 1, stdout: '', stderr: 'so o começo' }
        }
        return { codigo: 0, stdout: '', stderr: '' }
      },
    }
    const raiz = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-git-'))
    const git = criarGit(processo, raiz, { decidirProxy: async () => SEM_PROXY })
    await expect(git.clone({ url: URL, dest: path.join(raiz, 'repo'), branch: 'main', pat: PAT })).rejects.toThrow(/sumiu/)
    await expect(git.clone({ url: URL, dest: path.join(raiz, 'repo'), branch: 'main', pat: PAT })).rejects.toThrow(/\[redigido\]/)
    await expect(git.clone({ url: URL, dest: path.join(raiz, 'repo'), branch: 'main', pat: PAT })).rejects.not.toThrow(/segredo-que-nao-pode-vazar/)
    await fs.rm(raiz, { recursive: true, force: true })
  })

  it('atualiza com o mesmo ambiente, progresso e o diff dos nomes', async () => {
    const chamadas: { args: string[]; timeoutMs: number }[] = []
    const progresso: string[] = []
    const processo: Processo = {
      async executar(pedido) {
        chamadas.push({ args: pedido.args, timeoutMs: pedido.timeoutMs })
        if (pedido.args[0] === 'config') return { codigo: 1, stdout: '', stderr: '' }
        if (pedido.args[0] === 'rev-parse') return { codigo: 0, stdout: 'abc\n', stderr: '' }
        if (pedido.args[0] === 'pull') {
          pedido.aoSaida?.('stderr', 'Updating files: 100% (2/2), done.\n')
          return { codigo: 0, stdout: '', stderr: '' }
        }
        if (pedido.args[0] === 'diff') return { codigo: 0, stdout: 'src/a.ts\n', stderr: '' }
        return { codigo: 1, stdout: '', stderr: 'inesperado' }
      },
    }
    const raiz = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-git-'))
    const git = criarGit(processo, raiz, { decidirProxy: async () => SEM_PROXY })
    const mudou = await git.atualizar({
      url: URL,
      dest: path.join(raiz, 'repo'),
      branch: 'develop',
      pat: PAT,
      aoProgredir: (linha) => progresso.push(linha),
    })
    await git.head(path.join(raiz, 'repo'))
    expect(mudou.arquivosAlterados).toEqual(['src/a.ts'])
    expect(progresso).toEqual(['Updating files: 100% (2/2), done.'])
    const pull = chamadas.find((chamada) => chamada.args[0] === 'pull')
    expect(pull?.args).toEqual(['pull', '--ff-only', '--progress', 'origin', 'develop'])
    expect(pull?.timeoutMs).toBe(TIMEOUT_REDE_GIT_MS)
    expect(chamadas.filter((chamada) => chamada.args[0] === 'config')).toHaveLength(2)
    expect(chamadas.some((chamada) => chamada.args[0] === 'diff' && chamada.args.includes('abc'))).toBe(true)
    await fs.rm(raiz, { recursive: true, force: true })
  })

  it('pede o proxy do host real do remoto, inclusive visualstudio.com', async () => {
    const vistos: string[] = []
    const processo: Processo = {
      async executar(pedido) {
        if (pedido.args[0] === 'config') return { codigo: 1, stdout: '', stderr: '' }
        if (pedido.args[0] === 'rev-parse') return { codigo: 0, stdout: 'abc\n', stderr: '' }
        if (pedido.args[0] === 'pull') return { codigo: 0, stdout: '', stderr: '' }
        if (pedido.args[0] === 'diff') return { codigo: 0, stdout: '', stderr: '' }
        return { codigo: 1, stdout: '', stderr: 'inesperado' }
      },
    }
    const raiz = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-git-'))
    const git = criarGit(processo, raiz, {
      decidirProxy: async (url) => {
        vistos.push(url)
        return SEM_PROXY
      },
    })
    const remoto = 'https://fabrikam.visualstudio.com/Projeto/_git/repo'
    await git.atualizar({ url: remoto, dest: path.join(raiz, 'repo'), branch: 'main', pat: PAT })
    expect(vistos).toEqual([remoto])
    await fs.rm(raiz, { recursive: true, force: true })
  })

  it('recusa branch inválida sem chamar o git', async () => {
    let chamadas = 0
    const processo: Processo = {
      async executar() {
        chamadas += 1
        return { codigo: 0, stdout: '', stderr: '' }
      },
    }
    const raiz = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-git-'))
    const git = criarGit(processo, raiz)
    await expect(git.clone({ url: URL, dest: path.join(raiz, 'repo'), branch: 'feature;rm', pat: PAT })).rejects.toThrow(/Branch/)
    await expect(git.clone({ url: URL, dest: path.join(raiz, 'repo'), branch: '-main', pat: PAT })).rejects.toThrow(/Branch/)
    expect(chamadas).toBe(0)
    await fs.rm(raiz, { recursive: true, force: true })
  })
})

describe('progresso na tela', () => {
  it('o andamento fica visível enquanto o clone não termina', async () => {
    const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-andamento-'))
    let soltar = () => {}
    const trava = new Promise<void>((resolve) => {
      soltar = resolve
    })
    const git: GitPort = {
      async clone(pedido) {
        pedido.aoProgredir?.('Receiving objects: 40%')
        await trava
      },
      async atualizar() {
        return { arquivosAlterados: [] }
      },
      async listarArquivos() {
        return []
      },
      async lerArquivo() {
        return ''
      },
      async head() {
        return 'abc1234'
      },
    }
    const app = await criarAplicacao({ dataDir, modo: 'falso', agora: () => new Date('2026-10-24T12:00:00.000Z'), semear: false, git })
    await app.conectar('https://dev.azure.com/fintech', 'pat-de-exemplo-nao-grave-isto')
    const pendente = app.salvarSelecao(['repo-pagamentos'])
    await ate(async () => (await app.andamentoClone()).some((item) => item.progresso === 'Receiving objects: 40%'))
    expect(await app.andamentoClone()).toEqual([{ id: 'repo-pagamentos', progresso: 'Receiving objects: 40%' }])
    soltar()
    const repos = await pendente
    expect(repos.find((repo) => repo.id === 'repo-pagamentos')?.estado).toBe('pronto')
    expect(await app.andamentoClone()).toEqual([])
    await fs.rm(dataDir, { recursive: true, force: true })
  })
})

describe('pausa do clone no modo exemplo', () => {
  it('não segura o clone quando ESTEIRA_FAKE não está ligado', async () => {
    const anterior = process.env.ESTEIRA_FAKE
    delete process.env.ESTEIRA_FAKE
    const linhas: string[] = []
    try {
      await pausaCloneExemplo((linha) => linhas.push(linha))
    } finally {
      if (anterior === undefined) delete process.env.ESTEIRA_FAKE
      else process.env.ESTEIRA_FAKE = anterior
    }
    expect(linhas).toEqual([])
  })

  it('mostra uma linha de progresso do git enquanto o exemplo segura o clone', async () => {
    vi.useFakeTimers()
    const anterior = process.env.ESTEIRA_FAKE
    process.env.ESTEIRA_FAKE = '1'
    const linhas: string[] = []
    try {
      const pendente = pausaCloneExemplo((linha) => linhas.push(linha))
      expect(linhas).toEqual(['Receiving objects: 42% (120/286)'])
      await vi.advanceTimersByTimeAsync(12_000)
      await pendente
    } finally {
      if (anterior === undefined) delete process.env.ESTEIRA_FAKE
      else process.env.ESTEIRA_FAKE = anterior
      vi.useRealTimers()
    }
  })
})

describe('processo', () => {
  it('entrega o stderr enquanto o processo ainda roda', async () => {
    const partes: string[] = []
    const processo = criarProcesso()
    const resultado = await processo.executar({
      comando: process.execPath,
      args: ['-e', 'process.stderr.write("aa\\rbb\\n")'],
      timeoutMs: 5_000,
      aoSaida: (canal, texto) => {
        if (canal === 'stderr') partes.push(texto)
      },
    })
    expect(resultado.codigo).toBe(0)
    expect(partes.join('')).toBe('aa\rbb\n')
  })
})

function sistema(): string {
  return ['http.sslbackend\nschannel', 'http.proxy\nhttp://proxy.sistema:8080', 'credential.helper\nmanager'].join('\0') + '\0'
}

async function ate(pronto: () => Promise<boolean>) {
  for (let i = 0; i < 50; i++) {
    if (await pronto()) return
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('o andamento não apareceu')
}
