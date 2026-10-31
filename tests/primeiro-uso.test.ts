import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { criarAplicacao } from '../src/app/criar'
import { passoAtual, passosPrimeiroUso, textoDoAviso } from '../src/core/primeiro-uso'
import { AJUSTES_INICIAIS, type EstadoApp } from '../src/shared/tipos'

const pastas: string[] = []

afterEach(async () => {
  await Promise.all(pastas.splice(0).map((pasta) => fs.rm(pasta, { recursive: true, force: true })))
})

function estado(parcial: Partial<EstadoApp> = {}): EstadoApp {
  return {
    ajustes: { ...AJUSTES_INICIAIS },
    produtos: [],
    repositorios: [],
    stories: [],
    filaWiki: { produtoId: '', pendentes: 0, gerando: false },
    radarPendentes: 0,
    conexoesAtivas: 0,
    ...parcial,
  }
}

describe('primeiro uso', () => {
  it('começa pelo PAT e segue PAT, Claude, repositórios, produto e modelo', () => {
    const passos = passosPrimeiroUso(estado())
    expect(passos?.map((passo) => passo.id)).toEqual(['pat', 'claude', 'repos', 'produto', 'modelo'])
    expect(passoAtual(passos ?? []).id).toBe('pat')
    expect(textoDoAviso(passoAtual(passos ?? []))).toEqual({
      texto: 'Nenhuma organização conectada.',
      acao: 'Conectar em Conexões',
    })
  })

  it('no modo real o Claude só conta depois do teste', () => {
    const comPat = estado({ ajustes: { ...AJUSTES_INICIAIS, conectado: true } })
    expect(passoAtual(passosPrimeiroUso(comPat) ?? []).id).toBe('claude')
    const comClaude = estado({ ajustes: { ...AJUSTES_INICIAIS, conectado: true, claudeConferido: true } })
    expect(passoAtual(passosPrimeiroUso(comClaude) ?? []).id).toBe('repos')
    const comRepos = estado({
      ajustes: { ...AJUSTES_INICIAIS, conectado: true, claudeConferido: true },
      repositorios: [
        {
          id: 'repo-pagamentos',
          nome: 'pagamentos',
          projeto: 'Pagamentos',
          remoteUrl: 'https://dev.azure.com/fintech/Pagamentos/_git/pagamentos',
          branchPadrao: 'main',
          branchAcompanhada: 'main',
          estado: 'pronto',
          selecionado: true,
        },
      ],
    })
    expect(passoAtual(passosPrimeiroUso(comRepos) ?? []).id).toBe('produto')
    const comProduto = estado({
      ...comRepos,
      produtos: [{ id: 'pix', nome: 'PIX', repositorioIds: ['repo-pagamentos'], dependeDe: [], projetosBacklog: [], areasBacklog: [] }],
    })
    expect(passoAtual(passosPrimeiroUso(comProduto) ?? []).id).toBe('modelo')
    const pronto = estado({
      ...comProduto,
      ajustes: { ...comProduto.ajustes, modeloConferido: true },
    })
    expect(passosPrimeiroUso(pronto)).toBeNull()
  })

  it('no modo exemplo o Claude já responde e uma story some com o caminho', () => {
    const exemplo = estado({ ajustes: { ...AJUSTES_INICIAIS, modo: 'falso' } })
    const passos = passosPrimeiroUso(exemplo)
    expect(passos?.find((passo) => passo.id === 'claude')).toMatchObject({ feito: true, pronto: 'Exemplo nesta máquina' })
    expect(passoAtual(passos ?? []).id).toBe('pat')
    const comStory = estado({
      stories: [
        {
          id: 's1',
          titulo: 'Estorno',
          produtoNome: 'PIX',
          estado: 'pronta',
          aceitos: 0,
          descartados: 0,
          pendentes: 0,
          porBloco: [],
          medicao: { passou: 0, voltou: 0 },
          atualizadaEm: '2026-10-24T12:00:00.000Z',
        },
      ],
    })
    expect(passosPrimeiroUso(comStory)).toBeNull()
  })

  it('grava o teste do Claude e a confirmação do modelo', async () => {
    const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-primeiro-'))
    pastas.push(dataDir)
    const app = await criarAplicacao({ dataDir, modo: 'falso', semear: false, agora: () => new Date('2026-10-31T12:00:00.000Z') })
    expect((await app.ajustes()).claudeConferido).toBe(false)
    expect((await app.ajustes()).modeloConferido).toBe(false)
    expect(passosPrimeiroUso(await app.estado())?.find((passo) => passo.id === 'pat')?.feito).toBe(false)
    await app.testarClaude()
    expect((await app.ajustes()).claudeConferido).toBe(true)
    await app.salvarAjustes({ claudeBin: '/usr/bin/claude' })
    expect((await app.ajustes()).claudeConferido).toBe(false)
    await app.salvarAjustes({ modeloStory: 'Como PM\nEu quero ver a prova' })
    expect((await app.ajustes()).modeloConferido).toBe(true)
    const semeado = await criarAplicacao({
      dataDir: await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-primeiro-semente-')).then((pasta) => {
        pastas.push(pasta)
        return pasta
      }),
      modo: 'falso',
      semear: true,
      agora: () => new Date('2026-10-31T12:00:00.000Z'),
    })
    expect(passosPrimeiroUso(await semeado.estado())).toBeNull()
  })
})
