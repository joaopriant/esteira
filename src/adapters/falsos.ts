import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { melhorCitacao, classificarTipo } from '../core/radar'
import type { Achado, StoryTexto, WorkItem } from '../shared/tipos'
import type { AzurePort, ClaudePort, GitPort, PedidoClaude } from '../ports'
import { ExecucaoParada } from './processo'
import { caminhoSeguro } from './seguro'
import { REPOS_EXEMPLO } from '../app/exemplo'

function hashArquivo(texto: string): string {
  return createHash('sha256').update(texto).digest('hex')
}

async function copiarPasta(origem: string, destino: string) {
  await fs.mkdir(destino, { recursive: true })
  const entradas = await fs.readdir(origem, { withFileTypes: true })
  for (const entrada of entradas) {
    const de = path.join(origem, entrada.name)
    const para = path.join(destino, entrada.name)
    if (entrada.isDirectory()) await copiarPasta(de, para)
    else if (entrada.isFile()) await fs.copyFile(de, para)
  }
}

async function caminhar(raiz: string, atual = ''): Promise<string[]> {
  const absoluto = caminhoSeguro(raiz, atual || '.')
  const entradas = await fs.readdir(absoluto, { withFileTypes: true })
  const arquivos: string[] = []
  for (const entrada of entradas) {
    if (entrada.name === '.git' || entrada.name === 'node_modules') continue
    const relativo = atual ? `${atual}/${entrada.name}` : entrada.name
    if (entrada.isDirectory()) arquivos.push(...(await caminhar(raiz, relativo)))
    else arquivos.push(relativo)
  }
  return arquivos.sort()
}

async function mapaHashes(dest: string): Promise<Map<string, string>> {
  const mapa = new Map<string, string>()
  for (const relativo of await caminhar(dest)) {
    const texto = await fs.readFile(caminhoSeguro(dest, relativo), 'utf8')
    mapa.set(relativo, hashArquivo(texto))
  }
  return mapa
}

// Segura o clone só no `npm run dev:ui` com ESTEIRA_FAKE=1, para a coluna Clone
// mostrar o avanço. O teste constrói o modo falso sem essa variável e não espera.
export async function pausaCloneExemplo(aoProgredir?: (linha: string) => void): Promise<void> {
  if (process.env.ESTEIRA_FAKE !== '1') return
  aoProgredir?.('Receiving objects: 42% (120/286)')
  await new Promise((resolve) => setTimeout(resolve, 12_000))
}

export function criarGitFalso(fixturesDir: string, raizRepos: string): GitPort {
  const hashes = new Map<string, Map<string, string>>()
  function destino(dest: string): string {
    const relativo = path.relative(raizRepos, path.resolve(dest))
    return caminhoSeguro(raizRepos, relativo || '.')
  }
  return {
    async clone({ url, dest, aoProgredir }) {
      const nome = path.basename(new URL(url).pathname)
      const pasta = destino(dest)
      await copiarPasta(path.join(fixturesDir, nome), pasta)
      hashes.set(pasta, await mapaHashes(pasta))
      await pausaCloneExemplo(aoProgredir)
    },
    async atualizar({ dest }) {
      const pasta = destino(dest)
      const atuais = await mapaHashes(pasta)
      const antes = hashes.get(pasta) ?? new Map<string, string>()
      const mudou: string[] = []
      for (const [arquivo, hash] of atuais) {
        if (antes.get(arquivo) !== hash) mudou.push(arquivo)
      }
      for (const arquivo of antes.keys()) {
        if (!atuais.has(arquivo)) mudou.push(arquivo)
      }
      hashes.set(pasta, atuais)
      return { arquivosAlterados: mudou }
    },
    async listarArquivos(dest) {
      return caminhar(destino(dest))
    },
    async lerArquivo(dest, relativo) {
      return fs.readFile(caminhoSeguro(destino(dest), relativo), 'utf8')
    },
    async head() {
      return 'exemplo'
    },
  }
}

export class AzureFalso implements AzurePort {
  comentarios: { id: number; projeto: string; texto: string }[] = []
  atualizacoesDeCampo = 0
  private descricoes = new Map<number, string>()

  constructor(private itens: WorkItem[]) {
    for (const item of itens) this.descricoes.set(item.id, item.descricao)
  }

  async listarRepositorios() {
    return REPOS_EXEMPLO
  }

  async listarWorkItems(filtro: { projetos: string[]; areas: string[]; fechadosDesde: string }) {
    const desde = new Date(filtro.fechadosDesde).getTime()
    return this.itens.filter((item) => {
      if (filtro.projetos.length > 0 && !filtro.projetos.some((projeto) => projeto.toLowerCase() === item.projeto.toLowerCase())) return false
      if (item.estado.toLowerCase() === 'removed') return false
      if (item.fechadoEm && new Date(item.fechadoEm).getTime() < desde) return false
      if (filtro.areas.length === 0) return true
      return filtro.areas.some((area) => {
        const a = item.areaPath.toLowerCase()
        const b = area.replace(/\//g, '\\').toLowerCase()
        return a === b || a.startsWith(`${b}\\`)
      })
    })
  }

  async obterWorkItem(_projeto: string, id: number) {
    const item = this.itens.find((candidato) => candidato.id === id)
    if (!item) throw new Error(`Não encontrei o card ${id}.`)
    return { ...item, descricao: this.descricoes.get(id) ?? item.descricao }
  }

  async criarWorkItem(pedido: {
    projeto: string
    tipo: string
    titulo: string
    descricao: string
    criterios: string
    area?: string
    iteracao?: string
  }) {
    const item: WorkItem = {
      id: 8000 + this.itens.length,
      projeto: pedido.projeto,
      tipo: pedido.tipo,
      titulo: pedido.titulo,
      descricao: pedido.descricao,
      criterios: pedido.criterios,
      estado: 'New',
      areaPath: pedido.area ?? '',
      iterationPath: pedido.iteracao ?? '',
      fechadoEm: null,
      alteradoEm: new Date().toISOString(),
    }
    this.itens.push(item)
    this.descricoes.set(item.id, item.descricao)
    return item
  }

  async comentar(projeto: string, id: number, texto: string) {
    const antes = this.descricoes.get(id)
    this.comentarios.push({ id, projeto, texto })
    if (this.descricoes.get(id) !== antes) this.atualizacoesDeCampo += 1
  }
}

function linhaCitavel(conteudo: string): string | undefined {
  return conteudo
    .split('\n')
    .map((linha) => linha.trim())
    .find((linha) => linha.length >= 20)
}

function storyEscrita(pedido: PedidoClaude): StoryTexto {
  const corpo = pedido.modelo.includes('Eu quero <capacidade>')
    ? pedido.modelo.replace('Eu quero <capacidade>', `Eu quero ${pedido.ideia}`)
    : `${pedido.modelo.trim()}\n\n${pedido.ideia}`
  return {
    titulo: pedido.ideia.slice(0, 90),
    corpo,
    descricao: pedido.ideia,
    criteriosDeAceite: '- A regra da ideia está explícita.',
  }
}

// shortcut: atraso só no modo exemplo via ESTEIRA_PASSO_MS, revisar se o preview ganhar relógio próprio.
async function pausaExemplo(sinal: AbortSignal | undefined, papel: PedidoClaude['papel']): Promise<void> {
  if (papel !== 'escrever' && papel !== 'confrontar') {
    if (sinal?.aborted) throw new ExecucaoParada()
    return
  }
  const ms = Number(process.env.ESTEIRA_PASSO_MS ?? 0)
  if (!Number.isFinite(ms) || ms <= 0) {
    if (sinal?.aborted) throw new ExecucaoParada()
    return
  }
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      sinal?.removeEventListener('abort', abortar)
      resolve()
    }, ms)
    const abortar = () => {
      clearTimeout(timer)
      reject(new ExecucaoParada())
    }
    if (sinal?.aborted) abortar()
    else sinal?.addEventListener('abort', abortar, { once: true })
  })
}

export function criarClaudeFalso(): ClaudePort & { modulosGerados: string[] } {
  const modulosGerados: string[] = []
  return {
    modulosGerados,
    async run(pedido) {
      await pausaExemplo(pedido.sinal, pedido.papel)
      if (pedido.papel === 'wiki') {
        modulosGerados.push(pedido.blocoId)
        const afirmacoes = pedido.arquivos.flatMap((arquivo) => {
          const trecho = linhaCitavel(arquivo.conteudo)
          if (!trecho) return []
          return [{ texto: `Regra encontrada em ${arquivo.caminho}.`, caminho: arquivo.caminho, trecho }]
        })
        return {
          json: { titulo: pedido.blocoId, resumo: 'Leitura do módulo a partir dos arquivos.', afirmacoes: afirmacoes.slice(0, 4) },
          bruto: '',
        }
      }
      if (pedido.papel === 'radar') {
        const sugestoes = (pedido.sinais ?? []).flatMap((sinal) => {
          const citacao = melhorCitacao(sinal.texto)
          if (!citacao) return []
          const tipo = classificarTipo(sinal.texto)
          return [{
            sinalId: sinal.id,
            tipo,
            titulo: citacao.slice(0, 90),
            resumo: citacao,
            citacao,
          }]
        })
        return { json: { sugestoes }, bruto: '' }
      }
      if (pedido.papel === 'pergunta') {
        const prova = pedido.wiki.find((item) => !item.semProva && item.trecho)
        if (!prova) return { json: { resposta: 'Não encontrei isso na wiki.', afirmacoes: [] }, bruto: '' }
        return {
          json: {
            resposta: prova.texto,
            afirmacoes: [{ texto: prova.texto, caminho: prova.caminho, trecho: prova.trecho }],
          },
          bruto: '',
        }
      }
      if (pedido.papel === 'aplicar' && pedido.achado) {
        const linha =
          pedido.achado.tipo === 'nao-encontrei'
            ? `- Pergunta em aberto: ${pedido.achado.texto}`
            : pedido.achado.semProva
              ? `- Ajuste: ${pedido.achado.texto} [sem prova]`
              : `- Ajuste: ${pedido.achado.texto}`
        const story: StoryTexto = {
          ...pedido.story,
          criteriosDeAceite: `${pedido.story.criteriosDeAceite}\n${linha}`.trim(),
        }
        return { json: { story, achados: [] }, bruto: '' }
      }
      if (pedido.papel === 'escrever') {
        return { json: { story: storyEscrita(pedido), achados: [] }, bruto: '' }
      }
      const storyBloqueada: StoryTexto = { ...pedido.story, titulo: 'TÍTULO QUE O CONFRONTO NÃO PODE GRAVAR' }
      if (pedido.blocoId === 'confrontar-wiki') {
        const uteis = pedido.wiki.filter((item) => item.trecho && !item.semProva)
        const achados =
          uteis.length === 0
            ? [{ texto: 'Não encontrei esta regra na wiki.', tipo: 'nao-encontrei', evidencia: { tipo: 'ausencia' } }]
            : uteis.slice(0, 2).map((item) => ({
                texto: item.texto,
                tipo: 'existe',
                evidencia: { tipo: 'arquivo', caminho: item.caminho, trecho: item.trecho, repositorio: item.repositorio },
              }))
        return { json: { story: storyBloqueada, achados }, bruto: '' }
      }
      if (pedido.blocoId === 'confrontar-codigo') {
        const arquivo = pedido.arquivos.find((item) => item.conteudo.toLowerCase().includes('valor')) ?? pedido.arquivos[0]
        if (!arquivo) {
          return {
            json: {
              story: storyBloqueada,
              achados: [{ texto: 'Não encontrei a regra no código.', tipo: 'nao-encontrei', evidencia: { tipo: 'ausencia' } }],
            },
            bruto: '',
          }
        }
        const trecho = linhaCitavel(arquivo.conteudo) ?? ''
        return {
          json: {
            story: storyBloqueada,
            achados: [
              {
                texto: 'O código já limita o estorno ao valor original.',
                tipo: 'existe',
                evidencia: { tipo: 'arquivo', caminho: arquivo.caminho, trecho, repositorio: arquivo.repositorio },
              },
              { texto: 'Isto é um palpite sem arquivo.', tipo: 'divergencia' },
            ],
          },
          bruto: '',
        }
      }
      if (pedido.blocoId === 'confrontar-backlog') {
        const achados: { texto: string; tipo: string; evidencia: { tipo: string; id?: number; titulo?: string; projeto?: string } }[] = pedido.cards.map((card) => ({
          texto: card.fechadoEm
            ? `Já existe o card fechado #${card.id} sobre o assunto.`
            : `Dá para ajustar o card aberto #${card.id} em vez de abrir outro.`,
          tipo: card.fechadoEm ? 'ja-existe' : 'ajustar-aberta',
          evidencia: { tipo: 'work-item', id: card.id, titulo: card.titulo, projeto: card.projeto },
        }))
        if (achados.length === 0) {
          achados.push({
            texto: 'Não encontrei card no backlog sobre isso.',
            tipo: 'nao-encontrei',
            evidencia: { tipo: 'ausencia' },
          })
        }
        return { json: { story: storyBloqueada, achados }, bruto: '' }
      }
      return {
        json: {
          story: pedido.papel === 'confrontar' ? storyBloqueada : pedido.story,
          achados:
            pedido.papel === 'confrontar'
              ? [{ texto: 'Não encontrei nada para esta instrução.', tipo: 'nao-encontrei', evidencia: { tipo: 'ausencia' } }]
              : [],
        },
        bruto: '',
      }
    },
  }
}

export type { Achado }
