import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AzureFalso } from '../src/adapters/falsos'
import { criarAplicacao } from '../src/app/criar'
import { itensExemplo } from '../src/app/exemplo'
import { azurePeloSdk, type AzureSdk } from '../src/adapters/azure-devops'
import { criarClaudeCli, DiagnosticoClaude, extrairJson } from '../src/adapters/claude-cli'
import { criarClaudeFalso } from '../src/adapters/falsos'
import { criarProcesso, ExecucaoParada, ligarEncerramento, planoDeMorte } from '../src/adapters/processo'
import type { ClaudePort, Disco, Processo } from '../src/ports'
import type { EsteiraApp } from '../src/app/esteira-app'

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

    const rodada = await ateOFim(app, 'Permitir estorno parcial de um PIX já liquidado, sem passar do valor original.')
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
    const pausada = await ateOFim(app, 'Estorno parcial do PIX liquidado.')
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
    const inicio = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado.', 'pix')
    const rodada = await app.aguardar(inicio.id)
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

describe('progresso ao vivo', () => {
  it('devolve o id na hora e emite um evento por bloco, na ordem', async () => {
    const { app } = await appDeTeste()
    const eventos: { storyId: string; blocoId: string; fase: string; achados: number }[] = []
    app.ouvir((evento) => eventos.push(evento))
    const inicio = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado, sem passar do valor original.', 'pix')
    expect(inicio.estado).toBe('rodando')
    expect(inicio.passos.every((passo) => passo.estado === 'aguardando')).toBe(true)
    const fim = await app.aguardar(inicio.id)
    const doRun = eventos.filter((evento) => evento.storyId === inicio.id)
    expect(doRun.map((evento) => `${evento.blocoId}:${evento.fase}`)).toEqual([
      'escrever-story:rodando',
      'escrever-story:concluido',
      'confrontar-wiki:rodando',
      'confrontar-wiki:concluido',
      'confrontar-codigo:rodando',
      'confrontar-codigo:concluido',
      'confrontar-backlog:rodando',
      'confrontar-backlog:concluido',
    ])
    const contagens = doRun.map((evento) => evento.achados)
    for (let i = 1; i < contagens.length; i += 1) expect(contagens[i]).toBeGreaterThanOrEqual(contagens[i - 1] ?? 0)
    expect(doRun.find((evento) => evento.blocoId === 'escrever-story' && evento.fase === 'concluido')?.achados).toBe(0)
    expect(doRun.find((evento) => evento.blocoId === 'confrontar-wiki' && evento.fase === 'concluido')?.achados).toBeGreaterThan(0)
    expect(fim.estado).toBe('pronta')
    expect(fim.achados.length).toBe(doRun.at(-1)?.achados)
  })

  it('parar no meio interrompe o bloco e guarda os achados já gravados', async () => {
    const base = criarClaudeFalso()
    let travar = false
    const claude: ClaudePort = {
      async run(pedido) {
        if (travar && pedido.blocoId === 'confrontar-codigo') {
          await new Promise((_resolve, reject) => {
            const abortar = () => reject(new ExecucaoParada())
            if (pedido.sinal?.aborted) abortar()
            else pedido.sinal?.addEventListener('abort', abortar, { once: true })
          })
        }
        return base.run(pedido)
      },
    }
    const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-'))
    pastas.push(dataDir)
    const app = await criarAplicacao({ dataDir, modo: 'falso', agora: () => AGORA, semear: true, claude })
    travar = true
    const eventos: { storyId: string; blocoId: string; fase: string; achados: number }[] = []
    app.ouvir((evento) => eventos.push(evento))
    const inicio = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado.', 'pix')
    try {
      await vi.waitFor(() => {
        expect(eventos.some((evento) => evento.storyId === inicio.id && evento.blocoId === 'confrontar-codigo' && evento.fase === 'rodando')).toBe(true)
      })
      const parada = await app.parar(inicio.id)
      const doRun = eventos.filter((evento) => evento.storyId === inicio.id)
      expect(doRun.map((evento) => `${evento.blocoId}:${evento.fase}`)).toEqual([
        'escrever-story:rodando',
        'escrever-story:concluido',
        'confrontar-wiki:rodando',
        'confrontar-wiki:concluido',
        'confrontar-codigo:rodando',
        'confrontar-codigo:interrompido',
      ])
      expect(parada.estado).toBe('interrompida')
      expect(parada.passos.map((passo) => passo.estado)).toEqual(['concluido', 'concluido', 'interrompido', 'aguardando'])
      const wiki = doRun.find((evento) => evento.blocoId === 'confrontar-wiki' && evento.fase === 'concluido')
      expect(wiki?.achados).toBeGreaterThan(0)
      expect(parada.achados.length).toBe(wiki?.achados)
      expect(parada.achados.every((achado) => achado.blocoId === 'confrontar-wiki')).toBe(true)
      expect(parada.story.titulo).not.toBe('TÍTULO QUE O CONFRONTO NÃO PODE GRAVAR')
      expect(JSON.stringify(parada.achados)).not.toContain('O código já limita')
      const disco = JSON.parse(await fs.readFile(path.join(dataDir, 'stories', `${inicio.id}.json`), 'utf8')) as {
        estado: string
        achados: { blocoId: string; texto: string }[]
        story: { titulo: string }
      }
      expect(disco.estado).toBe('interrompida')
      expect(disco.achados).toEqual(parada.achados)
      expect(disco.story.titulo).toBe(parada.story.titulo)
      await expect(app.parar(inicio.id)).resolves.toMatchObject({ estado: 'interrompida' })
    } finally {
      await app.parar(inicio.id).catch(() => undefined)
    }
  })

  it('parar durante a gravação do último bloco deixa a story num estado final', async () => {
    const { app, dataDir } = await appDeTeste()
    const trava = segurarUltimaGravacao(app)
    const inicio = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado.', 'pix')
    await vi.waitFor(() => expect(trava.dentro()).toBe(true), { timeout: 5_000 })
    const parando = app.parar(inicio.id)
    trava.soltar()
    const story = await parando
    expect(story.estado).toBe('pronta')
    expect(story.passos.every((passo) => passo.estado === 'concluido')).toBe(true)
    expect(story.achados.length).toBeGreaterThan(0)
    const disco = JSON.parse(await fs.readFile(path.join(dataDir, 'stories', `${inicio.id}.json`), 'utf8')) as { estado: string }
    expect(disco.estado).toBe('pronta')
    await expect(app.parar(inicio.id)).resolves.toMatchObject({ estado: 'pronta' })
  })

  it('erro no último bloco não deixa a story rodando', async () => {
    const base = criarClaudeFalso()
    const claude: ClaudePort = {
      async run(pedido) {
        if (pedido.blocoId === 'confrontar-backlog') throw new Error('o backlog falhou')
        return base.run(pedido)
      },
    }
    const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-'))
    pastas.push(dataDir)
    const app = await criarAplicacao({ dataDir, modo: 'falso', agora: () => AGORA, semear: true, claude })
    const fim = await app.aguardar((await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado.', 'pix')).id)
    expect(fim.estado).toBe('erro')
    expect(fim.erro).toContain('backlog falhou')
    expect(fim.achados.length).toBeGreaterThan(0)
    expect(fim.passos.map((passo) => passo.estado)).toEqual(['concluido', 'concluido', 'concluido', 'erro'])
    const disco = JSON.parse(await fs.readFile(path.join(dataDir, 'stories', `${fim.id}.json`), 'utf8')) as { estado: string }
    expect(disco.estado).toBe('erro')
    await expect(app.parar(fim.id)).resolves.toMatchObject({ estado: 'erro' })
  })

  it('recusa editar a story enquanto a esteira roda', async () => {
    const { app, soltar } = await appQueTravaNoCodigo()
    let id = ''
    const rodando = quandoCodigoRodar(app, () => id)
    const inicio = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado.', 'pix')
    id = inicio.id
    try {
      await rodando
      await expect(
        app.editarStory(inicio.id, { titulo: 'mudou', corpo: 'x', descricao: '', criteriosDeAceite: '' }),
      ).rejects.toThrow('A esteira está rodando. Pare ou espere o fim para editar a story.')
      const durante = await app.obterStory(inicio.id)
      expect(durante.story.titulo).not.toBe('mudou')
      expect(durante.achados.length).toBeGreaterThan(0)
      const parada = await app.parar(inicio.id)
      const editada = await app.editarStory(inicio.id, { ...parada.story, titulo: 'Título editado depois' })
      expect(editada.story.titulo).toBe('Título editado depois')
      expect(editada.achados.map((achado) => achado.id)).toEqual(parada.achados.map((achado) => achado.id))
    } finally {
      soltar()
      await app.parar(inicio.id).catch(() => undefined)
    }
  })

  it('continuar retoma do bloco interrompido sem perder o que já foi gravado', async () => {
    const { app, soltar } = await appQueTravaNoCodigo()
    let id = ''
    const rodando = quandoCodigoRodar(app, () => id)
    const inicio = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado.', 'pix')
    id = inicio.id
    try {
      await rodando
      const parada = await app.parar(inicio.id)
      const ids = parada.achados.map((achado) => achado.id)
      expect(ids.length).toBeGreaterThan(0)
      expect(parada.story.titulo.length).toBeGreaterThan(0)
      soltar()
      const pronta = await app.continuar(parada.id)
      expect(pronta.estado).toBe('pronta')
      expect(pronta.story.titulo).toBe(parada.story.titulo)
      expect(ids.every((id) => pronta.achados.some((achado) => achado.id === id))).toBe(true)
      expect(pronta.passos.map((passo) => passo.estado)).toEqual(['concluido', 'concluido', 'concluido', 'concluido'])
      expect(pronta.achados.some((achado) => achado.blocoId === 'confrontar-codigo')).toBe(true)
    } finally {
      soltar()
      await app.parar(inicio.id).catch(() => undefined)
    }
  })

  it('recomeçar roda do início e mantém os achados já gravados', async () => {
    const { app, soltar } = await appQueTravaNoCodigo()
    let id = ''
    const rodando = quandoCodigoRodar(app, () => id)
    const inicio = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado.', 'pix')
    id = inicio.id
    try {
      await rodando
      const parada = await app.parar(inicio.id)
      const ids = parada.achados.map((achado) => achado.id)
      soltar()
      const pronta = await app.recomecar(parada.id)
      expect(pronta.estado).toBe('pronta')
      expect(ids.every((id) => pronta.achados.some((achado) => achado.id === id))).toBe(true)
      expect(pronta.passos.every((passo) => passo.estado === 'concluido')).toBe(true)
    } finally {
      soltar()
      await app.parar(inicio.id).catch(() => undefined)
    }
  })

  it('parar interrompe uma execução disparada por continuar', async () => {
    const { app } = await appQueTravaNoCodigo()
    let id = ''
    const rodando = quandoCodigoRodar(app, () => id)
    const inicio = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado.', 'pix')
    id = inicio.id
    try {
      await rodando
      await app.parar(inicio.id)
      const denovo = quandoCodigoRodar(app, () => inicio.id)
      const continuando = app.continuar(inicio.id)
      await denovo
      const parada = await app.parar(inicio.id)
      expect(parada.estado).toBe('interrompida')
      expect(parada.passos.find((passo) => passo.blocoId === 'confrontar-codigo')?.estado).toBe('interrompido')
      await expect(continuando).resolves.toMatchObject({ estado: 'interrompida' })
    } finally {
      await app.parar(inicio.id).catch(() => undefined)
    }
  })

  it('parar interrompe uma execução disparada por recomeçar', async () => {
    const { app } = await appQueTravaNoCodigo()
    let id = ''
    const rodando = quandoCodigoRodar(app, () => id)
    const inicio = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado.', 'pix')
    id = inicio.id
    try {
      await rodando
      await app.parar(inicio.id)
      const denovo = quandoCodigoRodar(app, () => inicio.id)
      const recomecando = app.recomecar(inicio.id)
      await denovo
      const parada = await app.parar(inicio.id)
      expect(parada.estado).toBe('interrompida')
      expect(parada.passos.find((passo) => passo.blocoId === 'confrontar-codigo')?.estado).toBe('interrompido')
      await expect(recomecando).resolves.toMatchObject({ estado: 'interrompida' })
    } finally {
      await app.parar(inicio.id).catch(() => undefined)
    }
  })

  it('parar reconcilia uma story rodando sem execução viva', async () => {
    const { app, dataDir } = await appDeTeste()
    const [resumo] = await app.listarStories()
    const arquivo = path.join(dataDir, 'stories', `${resumo!.id}.json`)
    const story = JSON.parse(await fs.readFile(arquivo, 'utf8')) as { estado: string; passos: { estado: string }[] }
    story.estado = 'rodando'
    story.passos[2]!.estado = 'rodando'
    story.passos[3]!.estado = 'aguardando'
    await fs.writeFile(arquivo, JSON.stringify(story))
    const parada = await app.parar(resumo!.id)
    expect(parada.estado).toBe('interrompida')
    expect(parada.passos.map((passo) => passo.estado)).toEqual(['concluido', 'concluido', 'interrompido', 'aguardando'])
    expect(JSON.parse(await fs.readFile(arquivo, 'utf8'))).toMatchObject({ estado: 'interrompida' })
  })

  it('abrir o app marca como interrompida a story que ficou rodando', async () => {
    const { app, dataDir } = await appQueTravaNoCodigo()
    let id = ''
    const rodando = quandoCodigoRodar(app, () => id)
    const inicio = await app.iniciarEsteira('Permitir estorno parcial de um PIX já liquidado.', 'pix')
    id = inicio.id
    try {
      await rodando
      const reaberto = await criarAplicacao({ dataDir, modo: 'falso', agora: () => AGORA })
      const story = await reaberto.obterStory(inicio.id)
      expect(story.estado).toBe('interrompida')
      expect(story.passos.find((passo) => passo.blocoId === 'confrontar-codigo')?.estado).toBe('interrompido')
      await expect(reaberto.continuar(inicio.id)).resolves.toMatchObject({ estado: 'pronta' })
    } finally {
      await app.parar(inicio.id).catch(() => undefined)
    }
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
    DiagnosticoClaude.esquecer()
    const vistos: { args: string[]; env: NodeJS.ProcessEnv; comando: string }[] = []
    const processo: Processo = {
      async executar(pedido) {
        vistos.push({ args: pedido.args, env: pedido.env ?? {}, comando: pedido.comando })
        if (pedido.args[0] === '--version') return { codigo: 0, stdout: '2.1.259 (Claude Code)', stderr: '' }
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
    const chamada = vistos.find((item) => item.args[0] === '-p')
    expect(chamada?.comando).toBe('claude')
    expect(chamada?.args.join(' ')).not.toContain('--bare')
    expect(chamada?.args).toContain('--permission-prompts')
    expect(chamada?.args).toContain('--no-session-persistence')
    expect(chamada?.args).toContain('--disallowedTools')
    expect(chamada?.args.join(' ')).toContain('Bash')
    expect(chamada?.args).toContain('--add-dir')
    expect(vistos.every((item) => item.env.ANTHROPIC_API_KEY === undefined)).toBe(true)
    expect(chamada?.args.join(' ')).not.toContain('nao-pode-ir')
  })

  it('parar mata o processo do claude -p e não usa a saída cortada', async () => {
    const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-claude-'))
    pastas.push(pasta)
    const pidfile = path.join(pasta, 'pids')
    const controle = new AbortController()
    const pids: number[] = []
    const processo = criarProcesso()
    const script = [
      "const fs = require('node:fs')",
      "const { spawn } = require('node:child_process')",
      "const neto = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })",
      "fs.writeFileSync(process.env.ESTEIRA_PIDFILE, String(process.pid) + '\\n' + String(neto.pid) + '\\n')",
      'setInterval(() => {}, 1000)',
    ].join('\n')
    const promessa = processo.executar({
      comando: process.execPath,
      args: ['-e', script],
      env: { ...process.env, ESTEIRA_PIDFILE: pidfile },
      timeoutMs: 4_000,
      sinal: controle.signal,
    })
    try {
      const texto = await esperarTexto(pidfile)
      pids.push(...texto.split('\n').map((linha) => Number(linha)).filter((pid) => pid > 0))
      expect(pids.length).toBe(2)
      expect(vivo(pids[0]!)).toBe(true)
      expect(vivo(pids[1]!)).toBe(true)
      controle.abort()
      await expect(promessa).rejects.toMatchObject({ name: 'AbortError' })
      await vi.waitFor(() => {
        expect(vivo(pids[0]!)).toBe(false)
        expect(vivo(pids[1]!)).toBe(false)
      })
    } finally {
      controle.abort()
      for (const pid of pids) {
        try { process.kill(-pid, 'SIGKILL') } catch { /* já saiu */ }
        try { process.kill(pid, 'SIGKILL') } catch { /* já saiu */ }
      }
    }

    const parcial = JSON.stringify({ structured_output: { achados: [{ texto: 'não pode entrar', tipo: 'existe' }] } })
    const claude = criarClaudeCli({
      executar(pedido) {
        return new Promise((_resolve, reject) => {
          pedido.sinal?.addEventListener('abort', () => reject(new ExecucaoParada()), { once: true })
          if (pedido.sinal?.aborted) reject(new ExecucaoParada())
        })
      },
    }, 'claude', pasta)
    const corte = new AbortController()
    const resposta = claude.run({
      papel: 'confrontar',
      blocoId: 'confrontar-codigo',
      instrucao: parcial,
      ideia: 'estorno',
      modelo: 'modelo',
      story: { titulo: '', corpo: '', descricao: '', criteriosDeAceite: '' },
      wiki: [],
      arquivos: [],
      cards: [],
      diretorios: [],
      timeoutMs: 1000,
      sinal: corte.signal,
    })
    corte.abort()
    await expect(resposta).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('before-quit e will-quit matam a árvore do claude -p', async () => {
    expect(planoDeMorte(42, 'win32')).toEqual({ comando: 'taskkill', args: ['/pid', '42', '/t', '/f'] })
    const ouvintes = new Map<string, () => void>()
    ligarEncerramento({
      on(evento, ouvinte) {
        ouvintes.set(evento, ouvinte)
      },
    })
    expect(ouvintes.has('before-quit')).toBe(true)
    expect(ouvintes.has('will-quit')).toBe(true)
    const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-claude-'))
    pastas.push(pasta)
    const pidfile = path.join(pasta, 'pids')
    const pids: number[] = []
    const promessa = criarProcesso().executar({
      comando: process.execPath,
      args: ['-e', scriptNeto()],
      env: { ...process.env, ESTEIRA_PIDFILE: pidfile },
      timeoutMs: 4_000,
    })
    try {
      const texto = await esperarTexto(pidfile)
      pids.push(...texto.split('\n').map((linha) => Number(linha)).filter((pid) => pid > 0))
      expect(vivo(pids[0]!)).toBe(true)
      expect(vivo(pids[1]!)).toBe(true)
      ouvintes.get('before-quit')?.()
      await vi.waitFor(() => {
        expect(vivo(pids[0]!)).toBe(false)
        expect(vivo(pids[1]!)).toBe(false)
      })
      ouvintes.get('will-quit')?.()
      await expect(Promise.race([promessa, Promise.resolve('encerrou')])).resolves.toBeTruthy()
    } finally {
      ouvintes.get('will-quit')?.()
      for (const pid of pids) {
        try { process.kill(pid, 'SIGKILL') } catch { /* já saiu */ }
      }
    }
  })
})

async function ateOFim(app: EsteiraApp, ideia: string) {
  const inicio = await app.iniciarEsteira(ideia, 'pix')
  return app.aguardar(inicio.id)
}

function vivo(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

async function esperarTexto(caminho: string): Promise<string> {
  const inicio = Date.now()
  while (Date.now() - inicio < 3_000) {
    try {
      const texto = await fs.readFile(caminho, 'utf8')
      if (texto.trim()) return texto
    } catch {
      /* o processo ainda não gravou */
    }
    await new Promise((resolver) => setTimeout(resolver, 20))
  }
  throw new Error('o processo não registrou o pid')
}

function scriptNeto(): string {
  return [
    "const fs = require('node:fs')",
    "const { spawn } = require('node:child_process')",
    "const neto = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })",
    "fs.writeFileSync(process.env.ESTEIRA_PIDFILE, String(process.pid) + '\\n' + String(neto.pid) + '\\n')",
    'setInterval(() => {}, 1000)',
  ].join('\n')
}

// Espera pelo evento, não pelo disco: ler o arquivo enquanto a esteira grava dá EPERM no rename do Windows.
function quandoCodigoRodar(app: EsteiraApp, id: () => string): Promise<void> {
  return new Promise((resolve) => {
    const largar = app.ouvir((evento) => {
      if (evento.storyId !== id() || evento.blocoId !== 'confrontar-codigo' || evento.fase !== 'rodando') return
      largar()
      resolve()
    })
  })
}

async function appQueTravaNoCodigo(): Promise<{ app: EsteiraApp; dataDir: string; soltar: () => void }> {
  const base = criarClaudeFalso()
  let travar = false
  const claude: ClaudePort = {
    async run(pedido) {
      if (travar && pedido.blocoId === 'confrontar-codigo') {
        await new Promise((_resolve, reject) => {
          const abortar = () => reject(new ExecucaoParada())
          if (pedido.sinal?.aborted) abortar()
          else pedido.sinal?.addEventListener('abort', abortar, { once: true })
        })
      }
      return base.run(pedido)
    },
  }
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-'))
  pastas.push(dataDir)
  const app = await criarAplicacao({ dataDir, modo: 'falso', agora: () => AGORA, semear: true, claude })
  travar = true
  return {
    app,
    dataDir,
    soltar() {
      travar = false
    },
  }
}

function segurarUltimaGravacao(app: EsteiraApp): { dentro: () => boolean; soltar: () => void } {
  const deps = (app as unknown as { deps: { disco: Disco } }).deps
  const disco = deps.disco
  let dentro = false
  let soltar = () => {}
  const trava = new Promise<void>((resolver) => {
    soltar = resolver
  })
  deps.disco = {
    caminho: (relativo) => disco.caminho(relativo),
    lerJson: (relativo) => disco.lerJson(relativo),
    listar: (relativo) => disco.listar(relativo),
    async gravarJson(relativo, valor) {
      const story = valor as { estado?: string; passos?: { estado: string }[] }
      const ultima =
        relativo.startsWith('stories/') &&
        story.estado === 'rodando' &&
        !!story.passos?.length &&
        story.passos.every((passo) => passo.estado === 'concluido')
      if (ultima && !dentro) {
        dentro = true
        await trava
      }
      await disco.gravarJson(relativo, valor)
    },
  }
  return { dentro: () => dentro, soltar: () => soltar() }
}

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
