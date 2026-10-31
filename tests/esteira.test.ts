import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { criarAplicacao } from '../src/app/criar'
import { azurePeloSdk, type AzureSdk } from '../src/adapters/azure-devops'
import { criarClaudeCli, extrairJson } from '../src/adapters/claude-cli'
import { criarClaudeFalso } from '../src/adapters/falsos'
import { criarProcesso, ExecucaoParada } from '../src/adapters/processo'
import type { ClaudePort, Processo } from '../src/ports'
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
