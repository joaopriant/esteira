import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { criarAplicacao } from '../src/app/criar'

const pastas: string[] = []

async function appDeTeste() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-conexoes-'))
  pastas.push(dataDir)
  const app = await criarAplicacao({ dataDir, modo: 'falso', agora: () => new Date('2026-10-25T12:00:00.000Z'), semear: true })
  return { app, dataDir }
}

afterEach(async () => {
  await Promise.all(pastas.splice(0).map((pasta) => fs.rm(pasta, { recursive: true, force: true })))
})

async function lerTudo(dir: string): Promise<string> {
  const pedacos: string[] = []
  async function andar(atual: string) {
    const entradas = await fs.readdir(atual, { withFileTypes: true })
    for (const entrada of entradas) {
      const cheio = path.join(atual, entrada.name)
      if (entrada.isDirectory()) await andar(cheio)
      else pedacos.push(await fs.readFile(cheio, 'utf8'))
    }
  }
  await andar(dir)
  return pedacos.join('\n')
}

describe('conexões', () => {
  it('guarda token só no cofre e liga canal ao produto', async () => {
    const { app, dataDir } = await appDeTeste()
    const token = 'leitura-cofre-whatsapp-9f3a'
    await app.conectarRadar('whatsapp', token)
    expect(await app.credenciaisRadar()).toMatchObject({ whatsapp: true, teams: false })
    await expect(app.salvarPastaRadar('granola', '../segredo.txt')).rejects.toThrow(/pasta permitida|inválid/i)
    await app.salvarPastaRadar('granola', 'notas/reuniao.md')
    const arquivos = await lerTudo(dataDir)
    expect(arquivos).not.toContain(token)
    expect(arquivos).not.toContain('pat-de-exemplo-nao-grave-isto')

    await app.salvarFonteRadar({
      id: '',
      produtoId: 'pix',
      provedor: 'slack',
      nome: 'Canal longo de operações',
      referencia: 'C1234567890',
      ativa: true,
    })
    let painel = await app.painelConexoes()
    const slack = painel.radar.find((item) => item.provedor === 'slack')
    const fonte = slack?.fontes.find((item) => item.nome === 'Canal longo de operações')
    expect(fonte?.produtoId).toBe('pix')
    expect(fonte?.ativa).toBe(true)
    await app.salvarFonteRadar({ ...fonte!, ativa: false })
    painel = await app.painelConexoes()
    expect(painel.radar.find((item) => item.provedor === 'slack')?.fontes.find((item) => item.id === fonte!.id)?.ativa).toBe(false)
    expect(painel.radar.find((item) => item.provedor === 'granola')?.caminhoSalvo).toBe('notas/reuniao.md')
    expect(painel.radar.find((item) => item.provedor === 'granola')?.status).toBe('pasta-local')
    expect(painel.radar.find((item) => item.provedor === 'whatsapp')?.status).toBe('conectado')
    expect(painel.azure.conectado).toBe(true)
    expect(painel.claude.autenticado).toBe(true)
    expect(painel.ativas).toBeGreaterThanOrEqual(7)
    expect((await app.estado()).conexoesAtivas).toBe(painel.ativas)

    const teste = await app.testarRadar('whatsapp')
    expect(teste.status).toBe('conectado')
    expect(teste.detalhe).not.toContain(token)
    expect((await app.testarAzure()).ok).toBe(true)
    const claude = await app.testarClaude()
    expect(claude.instalado).toBe(true)
    expect(claude.detalhe).not.toContain(token)

    await app.desconectarRadar('whatsapp')
    expect((await app.credenciaisRadar()).whatsapp).toBe(false)
    expect((await app.painelConexoes()).radar.find((item) => item.provedor === 'whatsapp')?.tokenNoCofre).toBe(false)
  })
})
