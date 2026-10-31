import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { criarClaudeCli, DiagnosticoClaude, diagnosticarClaude, extrairJson } from '../src/adapters/claude-cli'
import { validarBinario } from '../src/adapters/seguro'
import type { PedidoClaude, Processo } from '../src/ports'

const pastas: string[] = []

beforeEach(() => {
  DiagnosticoClaude.esquecer()
})

afterEach(async () => {
  DiagnosticoClaude.esquecer()
  await Promise.all(pastas.splice(0).map((pasta) => fs.rm(pasta, { recursive: true, force: true })))
})

function pedido(parcial: Partial<PedidoClaude> = {}): PedidoClaude {
  return {
    papel: 'confrontar',
    blocoId: 'bloco',
    instrucao: 'olhe o código',
    ideia: 'estorno',
    modelo: 'modelo',
    story: { titulo: '', corpo: '', descricao: '', criteriosDeAceite: '' },
    wiki: [],
    arquivos: [],
    cards: [],
    diretorios: [],
    timeoutMs: 180_000,
    ...parcial,
  }
}

function duble(responder: (pedido: Parameters<Processo['executar']>[0]) => { codigo: number; stdout: string; stderr: string }) {
  const vistos: Parameters<Processo['executar']>[0][] = []
  const processo: Processo = {
    async executar(chamada) {
      vistos.push(chamada)
      return responder(chamada)
    },
  }
  return { processo, vistos }
}

function comVersao(
  versao: string,
  depois: { codigo: number; stdout: string; stderr: string },
) {
  return duble((chamada) => {
    if (chamada.args[0] === '--version') return { codigo: 0, stdout: versao, stderr: '' }
    return depois
  })
}

describe('versão, assinatura, cota e timeout', () => {
  it('exige 2.1.259 por causa de --permission-prompts', () => {
    expect(DiagnosticoClaude.antiga([2, 1, 259])).toBe(false)
    expect(DiagnosticoClaude.antiga([2, 1, 260])).toBe(false)
    expect(DiagnosticoClaude.antiga([2, 2, 0])).toBe(false)
    expect(DiagnosticoClaude.antiga([2, 1, 258])).toBe(true)
    expect(DiagnosticoClaude.antiga([2, 0, 9])).toBe(true)
    expect(DiagnosticoClaude.mensagemVersao([2, 1, 200])).toContain('2.1.200')
    expect(DiagnosticoClaude.mensagemVersao([2, 1, 200])).toContain('2.1.259')
  })

  it('não chama o bloco quando a versão é antiga', async () => {
    const { processo, vistos } = comVersao('2.1.200 (Claude Code)', { codigo: 0, stdout: '', stderr: '' })
    const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-claude-'))
    pastas.push(pasta)
    const claude = criarClaudeCli(processo, 'claude', pasta)
    await expect(claude.run(pedido())).rejects.toThrow(/2\.1\.200/)
    await expect(claude.run(pedido())).rejects.toThrow(/--permission-prompts/)
    expect(vistos.some((item) => item.args[0] === '-p')).toBe(false)
    expect(await fs.readdir(pasta)).toEqual([])
  })

  it('lê a versão uma vez e manda --no-session-persistence', async () => {
    const { processo, vistos } = comVersao('2.1.259 (Claude Code)', {
      codigo: 0,
      stdout: JSON.stringify({ structured_output: { achados: [] }, is_error: false }),
      stderr: '',
    })
    const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-claude-'))
    pastas.push(pasta)
    const claude = criarClaudeCli(processo, 'claude', pasta)
    await claude.run(pedido())
    await claude.run(pedido({ papel: 'wiki', blocoId: 'wiki-modulo' }))
    expect(vistos.filter((item) => item.args[0] === '--version')).toHaveLength(1)
    const blocos = vistos.filter((item) => item.args[0] === '-p')
    expect(blocos).toHaveLength(2)
    expect(blocos[0]?.args).toContain('--no-session-persistence')
    expect(blocos[0]?.args).toContain('--permission-prompts')
    expect(blocos[0]?.timeoutMs).toBe(180_000)
    expect(blocos[1]?.timeoutMs).toBe(600_000)
    expect(blocos.every((item) => item.env?.ANTHROPIC_API_KEY === undefined)).toBe(true)
  })

  it('explica o limite de uso só com a frase do stderr, sem o código do stdout', async () => {
    const codigoCliente = 'TOKEN_CODIGO_CLIENTE_9f3a'
    const { processo } = comVersao('2.1.300 (Claude Code)', {
      codigo: 1,
      stdout: `export const segredo = "${codigoCliente}"\nThe usage limit of this story is 3`,
      stderr: "prefixo\nYou've hit your session limit · resets 3:45pm\nconst vazou = true",
    })
    const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-claude-'))
    pastas.push(pasta)
    const erro = await criarClaudeCli(processo, 'claude', pasta).run(pedido()).then(
      () => {
        throw new Error('devia falhar')
      },
      (capturado: unknown) => capturado,
    )
    expect(erro).toBeInstanceOf(Error)
    const mensagem = erro instanceof Error ? erro.message : ''
    expect(mensagem).toMatch(/limite de uso/)
    expect(mensagem).toMatch(/You've hit your session limit/)
    expect(mensagem).not.toContain(codigoCliente)
    expect(mensagem).not.toContain('vazou')
    expect(mensagem).not.toContain('usage limit of this story')
    expect(await fs.readdir(pasta)).toEqual([])

    expect(() => extrairJson(JSON.stringify({ is_error: true, result: 'Failed to authenticate' }))).toThrow(
      /O Claude Code devolveu erro: Failed to authenticate/,
    )
    expect(extrairJson(JSON.stringify({ structured_output: { achados: [{ texto: 'a' }] } }))).toMatchObject({
      achados: [{ texto: 'a' }],
    })
    expect(extrairJson('antes ```json\n{"achados":[]}\n``` depois')).toMatchObject({ achados: [] })
  })

  it('não trata story sobre usage limit como cota', async () => {
    const codigoCliente = 'TOKEN_STORY_USAGE_1c'
    const { processo } = comVersao('2.1.259', {
      codigo: 1,
      stdout: JSON.stringify({
        is_error: false,
        structured_output: { story: `The usage limit of the product is 3. ${codigoCliente}` },
      }),
      stderr: 'falha de rede',
    })
    const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-claude-'))
    pastas.push(pasta)
    await expect(criarClaudeCli(processo, 'claude', pasta).run(pedido())).rejects.toThrow(/falha de rede/)
    await expect(criarClaudeCli(processo, 'claude', pasta).run(pedido())).rejects.not.toThrow(/limite de uso/)
  })

  it('lê o limite de uso no stderr quando não há JSON', async () => {
    const { processo } = comVersao('2.1.259', {
      codigo: 1,
      stdout: '',
      stderr: "You've hit your weekly limit · resets Mon 12:00am",
    })
    const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-claude-'))
    pastas.push(pasta)
    await expect(criarClaudeCli(processo, 'claude', pasta).run(pedido())).rejects.toThrow(/weekly limit/)
  })

  it('aviso de limite no stderr não derruba execução que deu certo', async () => {
    const { processo } = comVersao('2.1.259', {
      codigo: 0,
      stdout: JSON.stringify({ structured_output: { achados: [] } }),
      stderr: 'warning: you are close to your usage limit',
    })
    const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-claude-'))
    pastas.push(pasta)
    await expect(criarClaudeCli(processo, 'claude', pasta).run(pedido())).resolves.toMatchObject({ json: { achados: [] } })
  })

  it('corta em 500 caracteres o stderr e o erro do JSON', () => {
    const longo = `inicio ${'x'.repeat(3_000)} RABO_QUE_NAO_ENTRA`
    const doStderr = DiagnosticoClaude.falha({ codigo: 1, stdout: '', stderr: longo }) ?? ''
    const doJson = DiagnosticoClaude.falha({ codigo: 1, stdout: JSON.stringify({ is_error: true, result: longo, error: longo }), stderr: '' }) ?? ''
    for (const mensagem of [doStderr, doJson]) {
      expect(mensagem).toContain('inicio')
      expect(mensagem.length).toBeLessThanOrEqual(500)
      expect(mensagem).not.toContain('RABO_QUE_NAO_ENTRA')
    }
  })

  it('lê a versão só no começo do stdout', async () => {
    expect(DiagnosticoClaude.lerVersao('2.1.259 (Claude Code)')).toEqual([2, 1, 259])
    expect(DiagnosticoClaude.lerVersao('Node.js v22.4.0')).toBeNull()
    expect(DiagnosticoClaude.lerVersao('aviso 2.1.259')).toBeNull()
    const { processo, vistos } = duble(() => ({
      codigo: 0,
      stdout: 'Node.js v22.4.0',
      stderr: '2.1.259 (Claude Code)',
    }))
    const teste = await diagnosticarClaude(processo, 'claude')
    expect(teste.autenticado).toBe(false)
    expect(teste.detalhe).toMatch(/Não consegui ler a versão/)
    expect(teste.detalhe).not.toContain('22.4.0')
    expect(vistos.some((item) => item.args[0] === 'auth')).toBe(false)

    DiagnosticoClaude.esquecer()
    const antiga = duble(() => ({ codigo: 0, stdout: '2.1.200 (Claude Code)', stderr: 'Node.js v22.4.0' }))
    const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-claude-'))
    pastas.push(pasta)
    await expect(criarClaudeCli(antiga.processo, 'claude', pasta).run(pedido())).rejects.toThrow(/2\.1\.200/)
  })

  it('separa versão e auth que demoram de executável que não está', async () => {
    const demorou = duble(() => {
      throw new Error('O processo claude passou de 30000 ms.')
    })
    const lento = await diagnosticarClaude(demorou.processo, 'claude')
    expect(lento.detalhe).toMatch(/demorou/)
    expect(lento.detalhe).not.toMatch(/não encontrei/i)
    expect(demorou.vistos[0]?.timeoutMs).toBe(30_000)

    DiagnosticoClaude.esquecer()
    const sumiu = duble(() => {
      throw new Error('spawn ENOENT')
    })
    const ausente = await diagnosticarClaude(sumiu.processo, 'claude')
    expect(ausente.detalhe).toMatch(/não encontrei/i)
    expect(ausente.detalhe).not.toMatch(/demorou/)

    DiagnosticoClaude.esquecer()
    const authLento = duble((chamada) => {
      if (chamada.args[0] === '--version') return { codigo: 0, stdout: '2.1.259 (Claude Code)', stderr: '' }
      throw new Error('O processo claude passou de 30000 ms.')
    })
    const status = await diagnosticarClaude(authLento.processo, 'claude')
    expect(status.instalado).toBe(true)
    expect(status.detalhe).toMatch(/auth status demorou/)
    expect(status.detalhe).not.toMatch(/não encontrei/i)
    expect(authLento.vistos.every((item) => item.timeoutMs === 30_000)).toBe(true)
  })

  it('mostra se auth status é a assinatura, sem gastar prompt', async () => {
    const { processo, vistos } = duble((chamada) => {
      if (chamada.args[0] === '--version') return { codigo: 0, stdout: '2.1.259 (Claude Code)', stderr: '' }
      return {
        codigo: 0,
        stdout: `aviso\n${JSON.stringify({ loggedIn: true, authMethod: 'claude.ai', subscriptionType: 'max' })}`,
        stderr: '',
      }
    })
    const teste = await diagnosticarClaude(processo, 'claude')
    expect(teste).toMatchObject({ instalado: true, autenticado: true })
    expect(teste.detalhe).toContain('assinatura')
    expect(teste.detalhe).toContain('claude.ai')
    expect(teste.detalhe).toContain('max')
    expect(teste.detalhe).toContain('2.1.259')
    expect(vistos.some((item) => item.args[0] === '-p')).toBe(false)
    expect(vistos.map((item) => item.args.join(' '))).toEqual(['--version', 'auth status'])
    expect(vistos.every((item) => item.env?.ANTHROPIC_API_KEY === undefined)).toBe(true)
  })

  it('distingue chave, token, terceiro e deslogado', async () => {
    const casos = [
      ['api_key', /chave de API/],
      ['api_key_helper', /chave de API/],
      ['oauth_token', /oauth_token/],
      ['third_party', /terceiros/],
      ['none', /não está logado/],
    ] as const
    for (const [metodo, mensagem] of casos) {
      DiagnosticoClaude.esquecer()
      const { processo, vistos } = duble((chamada) => {
        if (chamada.args[0] === '--version') return { codigo: 0, stdout: '2.1.259', stderr: '' }
        return { codigo: metodo === 'none' ? 1 : 0, stdout: JSON.stringify({ loggedIn: metodo !== 'none', authMethod: metodo }), stderr: '' }
      })
      const teste = await diagnosticarClaude(processo, 'C:\\Program Files\\Claude\\claude.exe')
      expect(teste.autenticado).toBe(false)
      expect(teste.instalado).toBe(true)
      expect(teste.detalhe).toMatch(mensagem)
      expect(vistos.some((item) => item.args[0] === '-p')).toBe(false)
    }
  })

  it('recusa versão antiga antes do auth status e explica binário ausente', async () => {
    const antiga = duble(() => ({ codigo: 0, stdout: '2.0.1', stderr: '' }))
    const teste = await diagnosticarClaude(antiga.processo, 'claude')
    expect(teste.instalado).toBe(true)
    expect(teste.autenticado).toBe(false)
    expect(teste.detalhe).toMatch(/2\.0\.1/)
    expect(antiga.vistos.some((item) => item.args[0] === 'auth')).toBe(false)

    const sumiu = duble(() => {
      throw new Error('spawn ENOENT')
    })
    expect(await diagnosticarClaude(sumiu.processo, 'claude')).toMatchObject({
      instalado: false,
      autenticado: false,
    })
  })

  it('aceita caminho com espaço e recusa argumento no binário', () => {
    expect(validarBinario('claude')).toBe('claude')
    expect(validarBinario('claude.cmd')).toBe('claude.cmd')
    expect(validarBinario('C:\\Program Files\\Claude Code\\claude.exe')).toBe('C:\\Program Files\\Claude Code\\claude.exe')
    expect(validarBinario('C:\\Program Files (x86)\\Claude\\claude.exe')).toContain('(x86)')
    expect(validarBinario('/usr/local/bin/claude')).toBe('/usr/local/bin/claude')
    expect(() => validarBinario('claude --danger')).toThrow(/argumento/)
    expect(() => validarBinario('C:\\Claude\\claude.exe & calc')).toThrow(/inválido/)
    expect(() => validarBinario('"C:\\Program Files\\claude.exe"')).toThrow(/aspas/)
    expect(() => validarBinario('..\\claude.exe')).toThrow(/absoluto/)
  })
})
