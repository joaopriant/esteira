import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { AzureFalso } from '../src/adapters/falsos'
import { criarAplicacao } from '../src/app/criar'
import { itensExemplo } from '../src/app/exemplo'
import { azurePeloSdk, type AzureSdk } from '../src/adapters/azure-devops'
import { criarClaudeCli, extrairJson } from '../src/adapters/claude-cli'
import type { Processo } from '../src/ports'

const AGORA = new Date('2026-10-24T12:00:00.000Z')
const pastas: string[] = []

async function appDeTeste() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-'))
  pastas.push(dataDir)
  const app = await criarAplicacao({ dataDir, modo: 'falso', agora: () => AGORA, semear: true })
  return { app, dataDir }
}

afterEach(async () => {
  await Promise.all(pastas.splice(0).map((pasta) => fs.rm(pasta, { recursive: true, force: true })))
})

describe('esteira padrão com falsos', () => {
  it('escreve, confronta, aplica diff, publica comentário sem mexer na descrição e mede a volta', async () => {
    const { app, dataDir } = await appDeTeste()
    const wiki = await app.wiki('pix')
    expect(wiki.modulos.every((modulo) => modulo.estado === 'pronto')).toBe(true)
    expect(wiki.modulos.some((modulo) => modulo.afirmacoes.some((item) => !item.semProva))).toBe(true)

    const rodada = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado, sem passar do valor original.', 'pix')
    expect(rodada.estado).toBe('pronta')
    expect(rodada.story.titulo).not.toBe('TÍTULO QUE O CONFRONTO NÃO PODE GRAVAR')
    expect(rodada.story.corpo).toContain('estorno parcial')
    expect(rodada.passos.map((passo) => passo.estado)).toEqual(['concluido', 'concluido', 'concluido', 'concluido'])

    const comProva = rodada.achados.filter((achado) => achado.evidencia.tipo === 'arquivo' && !achado.semProva)
    expect(comProva.length).toBeGreaterThan(0)
    expect(rodada.achados.some((achado) => achado.semProva)).toBe(true)
    expect(rodada.achados.some((achado) => achado.tipo === 'nao-encontrei' || achado.texto.toLowerCase().includes('não encontrei') || achado.evidencia.tipo === 'work-item')).toBe(true)
    const cards = rodada.achados.flatMap((achado) => (achado.evidencia.tipo === 'work-item' ? [achado.evidencia.id] : []))
    expect(cards).toContain(1300)
    expect(cards).toContain(1042)
    expect(cards).not.toContain(880)

    const alvo = rodada.achados.find((achado) => achado.semProva && achado.estado === 'pendente')
    expect(alvo).toBeTruthy()
    const comDiff = await app.aceitarAchado(rodada.id, alvo!.id)
    expect(comDiff.diffPendente?.linhas.some((linha) => linha.tipo === 'entrou')).toBe(true)
    const aprovada = await app.aprovarDiff(rodada.id)
    expect(aprovada.story.criteriosDeAceite).toContain('Ajuste:')
    expect(aprovada.story.criteriosDeAceite).toContain('[sem prova]')
    expect(aprovada.story.criteriosDeAceite.split('[sem prova]')).toHaveLength(2)
    expect(aprovada.achados.find((achado) => achado.id === alvo!.id)?.estado).toBe('aceito')

    const outro = aprovada.achados.find((achado) => achado.estado === 'pendente')
    expect(outro).toBeTruthy()
    const descartada = await app.descartarAchado(rodada.id, outro!.id)
    expect(descartada.achados.find((achado) => achado.id === outro!.id)?.estado).toBe('descartado')

    const deNovo = await app.reconfrontar(rodada.id)
    const textosVelhos = new Set([alvo!.texto, outro!.texto])
    expect(deNovo.achados.filter((achado) => textosVelhos.has(achado.texto) && achado.estado === 'pendente')).toHaveLength(0)

    const publicada = await app.publicar(rodada.id, { acao: 'comentar', workItemId: 1300 })
    expect(publicada.publicacao?.acao).toBe('comentar')
    const arquivoCard = JSON.stringify(publicada)
    expect(arquivoCard).not.toContain('System.Description')

    const inicio = performance.now()
    const medida = await app.registrarVolta(rodada.id, 'voltou')
    expect(performance.now() - inicio).toBeLessThan(2000)
    expect(medida.medicao.voltou).toBe(1)

    const textos = await lerTudo(dataDir)
    expect(textos).not.toContain('pat-de-exemplo-nao-grave-isto')
  })

  it('pausa no bloco por clique e segue quando o PM manda', async () => {
    const { app } = await appDeTeste()
    const fluxo = await app.fluxo()
    fluxo[2] = { ...fluxo[2]!, modo: 'por-clique' }
    await app.salvarFluxo(fluxo)
    const pausada = await app.iniciarEsteira('Estorno parcial do PIX liquidado.', 'pix')
    expect(pausada.estado).toBe('pausada')
    expect(pausada.pausadaNoBlocoId).toBe('confrontar-codigo')
    const pronta = await app.continuar(pausada.id)
    expect(pronta.estado).toBe('pronta')
  })

  it('regenera só o módulo do arquivo alterado', async () => {
    const { app, dataDir } = await appDeTeste()
    const claude = (app as unknown as { deps: { claude: { modulosGerados: string[] } } }).deps
    const antes = claude.claude.modulosGerados.length
    const arquivo = path.join(dataDir, 'repos', 'pagamentos-api', 'src', 'estorno', 'regra.ts')
    await fs.appendFile(arquivo, '\nexport const limiteExtra = 1\n')
    const atualizacao = await app.atualizarRepositorios()
    expect(atualizacao.arquivosAlterados.some((item) => item.includes('estorno/regra.ts'))).toBe(true)
    await app.drenarWiki()
    const novos = claude.claude.modulosGerados.slice(antes)
    expect(novos).toEqual(['pagamentos-api/estorno'])
  })
})

describe('criar card', () => {
  it('grava a descrição editada, não o corpo no lugar dela', async () => {
    const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-'))
    pastas.push(dataDir)
    const azure = new AzureFalso(itensExemplo(AGORA))
    const criados: { descricao: string; titulo: string }[] = []
    const original = azure.criarWorkItem.bind(azure)
    azure.criarWorkItem = async (pedido) => {
      criados.push({ descricao: pedido.descricao, titulo: pedido.titulo })
      return original(pedido)
    }
    const app = await criarAplicacao({ dataDir, modo: 'falso', agora: () => AGORA, semear: true, azure })
    const rodada = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado.', 'pix')
    const editada = { ...rodada.story, descricao: 'Descrição editada pelo PM' }
    await app.editarStory(rodada.id, editada)
    const publicada = await app.publicar(rodada.id, { acao: 'criar', projeto: 'Pagamentos' })
    expect(publicada.publicacao?.acao).toBe('criar')
    expect(criados).toHaveLength(1)
    expect(criados[0]?.descricao.startsWith('Descrição editada pelo PM')).toBe(true)
    expect(criados[0]?.descricao).toContain(editada.corpo)
    expect(criados[0]?.descricao).not.toBe(editada.corpo)
    expect(criados[0]?.titulo).toBe(editada.titulo)
  })
})

describe('adaptadores reais com dublês', () => {
  it('comentar não chama atualização de campo', async () => {
    const chamadas: string[] = []
    const sdk: AzureSdk = {
      async listarRepos() {
        return []
      },
      async consultar() {
        chamadas.push('consultar')
        return [7]
      },
      async obterVarios() {
        return []
      },
      async obter(id) {
        chamadas.push(`obter:${id}`)
        return { id, fields: { 'System.Title': 'Card', 'System.Description': 'texto original', 'System.TeamProject': 'Pagamentos' } }
      },
      async criar() {
        chamadas.push('criar')
        return { id: 1, fields: {} }
      },
      async adicionarComentario(_projeto, id) {
        chamadas.push(`comentar:${id}`)
      },
    }
    const azure = azurePeloSdk(sdk)
    await azure.comentar('Pagamentos', 7, 'sugestão')
    expect(chamadas).toEqual(['comentar:7'])
    expect(chamadas).not.toContain('criar')
  })

  it('o claude sobe sem shell, sem bare e sem a chave de API', async () => {
    const vistos: { args: string[]; env: NodeJS.ProcessEnv; comando: string }[] = []
    const processo: Processo = {
      async executar(pedido) {
        vistos.push({ args: pedido.args, env: pedido.env ?? {}, comando: pedido.comando })
        return { codigo: 0, stdout: JSON.stringify({ structured_output: { achados: [] } }), stderr: '' }
      },
    }
    const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-claude-'))
    pastas.push(pasta)
    const claude = criarClaudeCli(processo, 'claude', pasta)
    const envAntes = process.env.ANTHROPIC_API_KEY
    process.env.ANTHROPIC_API_KEY = 'nao-pode-ir'
    try {
      const resposta = await claude.run({
        papel: 'confrontar',
        blocoId: 'confrontar-codigo',
        instrucao: 'olhe o código',
        ideia: 'estorno',
        modelo: 'modelo',
        story: { titulo: '', corpo: '', descricao: '', criteriosDeAceite: '' },
        wiki: [],
        arquivos: [],
        cards: [],
        diretorios: ['/dados/repos/pagamentos-api'],
        timeoutMs: 1000,
      })
      expect(extrairJson(JSON.stringify(resposta.json))).toBeTruthy()
    } finally {
      if (envAntes === undefined) delete process.env.ANTHROPIC_API_KEY
      else process.env.ANTHROPIC_API_KEY = envAntes
    }
    expect(vistos[0]?.comando).toBe('claude')
    expect(vistos[0]?.args.join(' ')).not.toContain('--bare')
    expect(vistos[0]?.args).toContain('--disallowedTools')
    expect(vistos[0]?.args.join(' ')).toContain('Bash')
    expect(vistos[0]?.args).toContain('--add-dir')
    expect(vistos[0]?.env.ANTHROPIC_API_KEY).toBeUndefined()
    expect(vistos[0]?.args.join(' ')).not.toContain('nao-pode-ir')
  })
})

async function lerTudo(raiz: string): Promise<string> {
  const partes: string[] = []
  async function andar(dir: string) {
    const entradas = await fs.readdir(dir, { withFileTypes: true })
    for (const entrada of entradas) {
      const cheio = path.join(dir, entrada.name)
      if (entrada.isDirectory()) await andar(cheio)
      else if (entrada.name.endsWith('.json')) partes.push(await fs.readFile(cheio, 'utf8'))
    }
  }
  await andar(raiz)
  return partes.join('\n')
}
