import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { criarClaudeFalso, criarGitFalso } from '../src/adapters/falsos'
import { criarAplicacao } from '../src/app/criar'
import { LIMITE_CONTEXTO_WIKI } from '../src/core/wiki-plano'
import type { ClaudePort, GitPort } from '../src/ports'
import type { EsteiraApp } from '../src/app/esteira-app'

const AGORA = new Date('2026-10-24T12:00:00.000Z')
const pastas: string[] = []

type PedidoWiki = { blocoId: string; caminhos: string[]; caracteres: number }
type Contagem = { listas: string[]; leituras: string[] }

function gitContado(dataDir: string, contagem: Contagem): GitPort {
  const base = criarGitFalso(path.join(process.cwd(), 'fixtures'), path.join(dataDir, 'repos'))
  return {
    clone: (pedido) => base.clone(pedido),
    atualizar: (pedido) => base.atualizar(pedido),
    head: (dest) => base.head(dest),
    async listarArquivos(dest) {
      contagem.listas.push(path.basename(dest))
      return base.listarArquivos(dest)
    },
    async lerArquivo(dest, relativo) {
      contagem.leituras.push(`${path.basename(dest)}:${relativo}`)
      return base.lerArquivo(dest, relativo)
    },
  }
}

function claudeContado(pedidos: PedidoWiki[]): ClaudePort & { modulosGerados: string[] } {
  const base = criarClaudeFalso()
  return {
    modulosGerados: base.modulosGerados,
    async run(pedido) {
      if (pedido.papel === 'wiki') {
        pedidos.push({
          blocoId: pedido.blocoId,
          caminhos: pedido.arquivos.map((arquivo) => arquivo.caminho),
          caracteres: pedido.arquivos.reduce((soma, arquivo) => soma + arquivo.conteudo.length, 0),
        })
      }
      return base.run(pedido)
    },
  }
}

async function appContado() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-wiki-'))
  pastas.push(dataDir)
  const contagem: Contagem = { listas: [], leituras: [] }
  const pedidos: PedidoWiki[] = []
  const claude = claudeContado(pedidos)
  const app = await criarAplicacao({
    dataDir,
    modo: 'falso',
    agora: () => AGORA,
    semear: true,
    git: gitContado(dataDir, contagem),
    claude,
  })
  return { app, dataDir, contagem, pedidos, claude }
}

async function estadoNoIndice(dataDir: string, produtoId: string, moduloId: string, estado: string) {
  const indexPath = path.join(dataDir, 'wiki', produtoId, 'index.json')
  const indice = JSON.parse(await fs.readFile(indexPath, 'utf8')) as { modulos: { id: string; estado: string; erro?: string }[] }
  const modulo = indice.modulos.find((item) => item.id === moduloId)
  if (!modulo) throw new Error(`Não achei ${moduloId} no índice.`)
  modulo.estado = estado
  if (estado === 'erro') modulo.erro = 'falhou na leitura'
  else delete modulo.erro
  await fs.writeFile(indexPath, JSON.stringify(indice))
}

afterEach(async () => {
  await Promise.all(pastas.splice(0).map((pasta) => fs.rm(pasta, { recursive: true, force: true })))
})

describe('leitura da wiki', () => {
  it('lê cada arquivo uma vez, manda só o módulo e cabe no teto', async () => {
    const { app, contagem, pedidos } = await appContado()
    expect(contagem.listas).toEqual(['contas-api', 'pagamentos-api', 'app-pix'])
    expect(new Set(contagem.leituras).size).toBe(contagem.leituras.length)
    expect(contagem.leituras).toHaveLength(4)

    const wikis = [await app.wiki('pix'), await app.wiki('contas')]
    expect(pedidos.length).toBeGreaterThan(0)
    for (const pedido of pedidos) {
      const modulo = wikis.flatMap((wiki) => wiki.modulos).find((item) => item.id === pedido.blocoId)
      expect(modulo?.arquivos).toEqual(expect.arrayContaining(pedido.caminhos))
      expect(pedido.caminhos.length).toBeGreaterThan(0)
      expect(pedido.caracteres).toBeLessThanOrEqual(LIMITE_CONTEXTO_WIKI)
      expect(pedido.caminhos.every((caminho) => modulo?.arquivos.includes(caminho))).toBe(true)
    }
    const estorno = pedidos.find((pedido) => pedido.blocoId === 'pagamentos-api/estorno')
    expect(estorno?.caminhos).toEqual(['src/estorno/regra.ts'])
    expect(estorno?.caminhos.some((caminho) => caminho.includes('liquidacao'))).toBe(false)
  })

  it('parte um módulo grande em chamadas e ainda cita trecho', async () => {
    const { app, dataDir, pedidos } = await appContado()
    const pasta = path.join(dataDir, 'repos', 'pagamentos-api', 'src', 'estorno')
    const linha = 'export const regraGrande = "estorno parcial limitado ao valor original"\n'
    for (const nome of ['a.ts', 'b.ts', 'c.ts']) {
      await fs.writeFile(path.join(pasta, nome), linha + 'x'.repeat(50_000))
    }
    const marca = pedidos.length
    await app.atualizarRepositorios()
    await app.drenarWiki()
    const novos = pedidos.slice(marca)
    expect(novos.length).toBeGreaterThan(1)
    expect(novos.every((pedido) => pedido.blocoId === 'pagamentos-api/estorno')).toBe(true)
    for (const pedido of novos) {
      expect(pedido.caracteres).toBeLessThanOrEqual(LIMITE_CONTEXTO_WIKI)
      expect(pedido.caminhos.every((caminho) => caminho.startsWith('src/estorno/'))).toBe(true)
    }
    const caminhos = new Set(novos.flatMap((pedido) => pedido.caminhos))
    expect(caminhos).toEqual(new Set(['src/estorno/a.ts', 'src/estorno/b.ts', 'src/estorno/c.ts', 'src/estorno/regra.ts']))
    const wiki = await app.wiki('pix')
    const modulo = wiki.modulos.find((item) => item.id === 'pagamentos-api/estorno')
    expect(modulo?.estado).toBe('pronto')
    expect(modulo?.afirmacoes.some((afirmacao) => !afirmacao.semProva && afirmacao.trecho.length > 0)).toBe(true)
  })

  it('a pergunta não lista o repositório inteiro', async () => {
    const { dataDir } = await appContado()
    const contagem: Contagem = { listas: [], leituras: [] }
    const app = await criarAplicacao({
      dataDir,
      modo: 'falso',
      agora: () => AGORA,
      semear: true,
      git: gitContado(dataDir, contagem),
    })
    await app.drenarWiki()
    contagem.listas.length = 0
    contagem.leituras.length = 0
    const resposta = await app.perguntarWiki('pix', 'Como o estorno parcial é limitado?')
    expect(contagem.listas).toEqual([])
    expect(resposta.afirmacoes.some((afirmacao) => !afirmacao.semProva)).toBe(true)
    const citados = new Set(
      [await app.wiki('pix'), await app.wiki('contas')].flatMap((wiki) => wiki.modulos.flatMap((modulo) => modulo.afirmacoes.map((afirmacao) => afirmacao.caminho))),
    )
    expect(contagem.leituras.every((leitura) => citados.has(leitura.split(':').slice(1).join(':')))).toBe(true)
  })
})

describe('retomada da wiki', () => {
  it('ao abrir, retoma módulo travado em pendente', async () => {
    const { dataDir } = await appContado()
    await estadoNoIndice(dataDir, 'pix', 'pagamentos-api/liquidacao', 'pendente')
    const contagem: Contagem = { listas: [], leituras: [] }
    const claude = criarClaudeFalso()
    const app = await abrir(dataDir, contagem, claude)
    await app.drenarWiki()
    expect(contagem.listas).toEqual([])
    expect(contagem.leituras).toEqual(['pagamentos-api:src/liquidacao/service.ts'])
    expect(claude.modulosGerados).toEqual(['pagamentos-api/liquidacao'])
    expect((await app.wiki('pix')).modulos.find((modulo) => modulo.id === 'pagamentos-api/liquidacao')?.estado).toBe('pronto')
  })

  it('ao abrir, retoma módulo travado em gerando e não refaz o que está pronto', async () => {
    const { dataDir } = await appContado()
    await estadoNoIndice(dataDir, 'pix', 'pagamentos-api/estorno', 'gerando')
    const contagem: Contagem = { listas: [], leituras: [] }
    const claude = criarClaudeFalso()
    const app = await abrir(dataDir, contagem, claude)
    await app.drenarWiki()
    expect(contagem.listas).toEqual([])
    expect(contagem.leituras).toEqual(['pagamentos-api:src/estorno/regra.ts'])
    expect(claude.modulosGerados).toEqual(['pagamentos-api/estorno'])
    const wiki = await app.wiki('pix')
    expect(wiki.modulos.find((modulo) => modulo.id === 'pagamentos-api/estorno')?.estado).toBe('pronto')
    expect(wiki.modulos.find((modulo) => modulo.id === 'pagamentos-api/liquidacao')?.estado).toBe('pronto')
    expect(wiki.modulos.find((modulo) => modulo.id === 'pagamentos-api/estorno')?.afirmacoes.some((item) => !item.semProva)).toBe(true)
  })

  it('ao abrir, não refaz módulo em erro; gerar de novo refaz sem mudar o hash', async () => {
    const { dataDir } = await appContado()
    await estadoNoIndice(dataDir, 'pix', 'pagamentos-api/estorno', 'erro')
    const contagem: Contagem = { listas: [], leituras: [] }
    const claude = criarClaudeFalso()
    const app = await abrir(dataDir, contagem, claude)
    await app.drenarWiki()
    expect(claude.modulosGerados).toEqual([])
    expect(contagem.leituras).toEqual([])
    expect((await app.wiki('pix')).modulos.find((modulo) => modulo.id === 'pagamentos-api/estorno')?.estado).toBe('erro')

    await app.gerarWiki('pix')
    await app.drenarWiki()
    expect(claude.modulosGerados).toEqual(['pagamentos-api/estorno'])
    const wiki = await app.wiki('pix')
    expect(wiki.modulos.find((modulo) => modulo.id === 'pagamentos-api/estorno')?.estado).toBe('pronto')
    expect(wiki.modulos.find((modulo) => modulo.id === 'pagamentos-api/liquidacao')?.estado).toBe('pronto')
    expect(wiki.modulos.find((modulo) => modulo.id === 'pagamentos-api/estorno')?.afirmacoes.some((item) => !item.semProva)).toBe(true)
  })
})

async function abrir(dataDir: string, contagem: Contagem, claude: ClaudePort): Promise<EsteiraApp> {
  return criarAplicacao({
    dataDir,
    modo: 'falso',
    agora: () => AGORA,
    semear: true,
    git: gitContado(dataDir, contagem),
    claude,
  })
}
