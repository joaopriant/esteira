import path from 'node:path'
import os from 'node:os'
import type { AzurePort, ClaudePort, Disco, GitPort, LeitorRadar, SecretStore } from '../ports'
import { criarDisco } from '../adapters/disco'
import { AzureFalso, criarClaudeFalso, criarGitFalso } from '../adapters/falsos'
import { leitoresFalsos } from '../adapters/radar-falso'
import { criarLeitorReal } from '../adapters/radar-leitura'
import { CofreRadar } from '../adapters/radar-oauth'
import type { ProvedorRadar } from '../shared/tipos'
import { criarGit } from '../adapters/git-cli'
import { criarProcesso } from '../adapters/processo'
import { cofreMemoria, cofreSistema } from '../adapters/segredos'
import { EsteiraApp } from './esteira-app'
import { itensExemplo } from './exemplo'

export function pastaDeDados(): string {
  if (process.env.ESTEIRA_DATA) return process.env.ESTEIRA_DATA
  if (process.platform === 'win32') return path.join(process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming'), 'Esteira')
  const base = process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local', 'share')
  return path.join(base, 'esteira')
}

export async function criarAplicacao(opcoes: {
  dataDir?: string
  modo?: 'real' | 'falso'
  agora?: () => Date
  semear?: boolean
  azure?: AzurePort
  claude?: ClaudePort
  git?: GitPort
  skillsDir?: string
  segredos?: SecretStore
  buscar?: typeof fetch
  esperar?: (ms: number) => Promise<void>
  abrirUrl?: (url: string) => Promise<void>
  portaOauth?: number
  timeoutOauth?: number
} = {}): Promise<EsteiraApp> {
  const modo = opcoes.modo ?? (process.env.ESTEIRA_FAKE === '1' ? 'falso' : 'real')
  const dataDir = opcoes.dataDir ?? pastaDeDados()
  const agora = opcoes.agora ?? (() => new Date())
  const skillsDir = opcoes.skillsDir ?? path.join(process.cwd(), 'skills')
  const skillsUsuario = path.join(os.homedir(), '.claude', 'skills')
  const azure = opcoes.azure ?? (modo === 'falso' ? new AzureFalso(itensExemplo(agora())) : azureRealInerte())
  const claude = opcoes.claude ?? (modo === 'falso' ? criarClaudeFalso() : claudeInerte())
  const git = opcoes.git ?? (modo === 'falso' ? criarGitFalso(path.join(process.cwd(), 'fixtures'), path.join(dataDir, 'repos')) : criarGit(criarProcesso(), path.join(dataDir, 'repos')))
  const segredos = opcoes.segredos ?? (modo === 'falso' ? cofreMemoria() : cofreSistema())
  const disco = criarDisco(dataDir)
  const buscar = opcoes.buscar ?? fetch
  const app = new EsteiraApp({
    dataDir,
    modo,
    agora,
    disco,
    azure,
    claude,
    git,
    segredos,
    skillsDir,
    skillsUsuario,
    radares: modo === 'falso' ? leitoresFalsos() : leitoresReais(dataDir, segredos, disco, buscar),
    buscar,
    esperar: opcoes.esperar,
    abrirUrl: opcoes.abrirUrl ?? abrirUrlExterna,
    portaOauth: opcoes.portaOauth,
    timeoutOauth: opcoes.timeoutOauth,
  })
  if (opcoes.semear && modo === 'falso') {
    if ((await app.produtos()).length === 0) await semearExemplo(app)
    await app.semearRadarSeVazio()
  }
  return app
}

function leitoresReais(dataDir: string, segredos: SecretStore, disco: Disco, buscar: typeof fetch): LeitorRadar[] {
  const pasta = path.join(dataDir, 'radar-import')
  const provedores: ProvedorRadar[] = ['teams', 'slack', 'whatsapp', 'granola', 'plaud']
  return provedores.map((provedor) =>
    criarLeitorReal({
      provedor,
      pasta,
      buscar,
      token: () => tokenDoProvedor(disco, segredos, buscar, provedor, false),
      renovar: () => tokenDoProvedor(disco, segredos, buscar, provedor, true),
    }),
  )
}

async function tokenDoProvedor(
  disco: Disco,
  segredos: SecretStore,
  buscar: typeof fetch,
  provedor: ProvedorRadar,
  forcar: boolean,
): Promise<string | null> {
  if (provedor !== 'teams' && provedor !== 'slack') return null
  const config = await disco.lerJson<{
    clientesRadar?: {
      teams?: { clientId: string; tenant: string }
      slack?: { clientId: string }
    }
  }>('config.json')
  const cliente = config?.clientesRadar?.[provedor]
  return CofreRadar.bearer({
    segredos,
    provedor,
    clientId: cliente?.clientId ?? '',
    tenant: provedor === 'teams' ? config?.clientesRadar?.teams?.tenant || 'organizations' : '',
    buscar,
    forcar,
  })
}

async function abrirUrlExterna(url: string): Promise<void> {
  const destino = new URL(url)
  const hostOk = destino.protocol === 'https:' && (destino.hostname === 'slack.com' || destino.hostname === 'microsoft.com' || destino.hostname === 'login.microsoftonline.com')
  if (!hostOk || !process.versions.electron) return
  const electron = await import('electron')
  await electron.shell.openExternal(destino.toString())
}

function azureRealInerte(): AzurePort {
  const erro = async () => {
    throw new Error('Azure ainda não foi chamado pelo cliente real.')
  }
  return {
    listarRepositorios: erro,
    listarWorkItems: erro,
    obterWorkItem: erro,
    criarWorkItem: erro,
    comentar: erro,
  }
}

function claudeInerte(): ClaudePort {
  return {
    async run() {
      throw new Error('Claude real é montado a cada bloco.')
    },
  }
}

async function semearExemplo(app: EsteiraApp): Promise<void> {
  await app.conectar('https://dev.azure.com/fintech', 'pat-de-exemplo-nao-grave-isto')
  await app.salvarSelecao(['repo-pagamentos', 'repo-app-pix', 'repo-contas'])
  await app.salvarProduto({
    id: 'contas',
    nome: 'Contas',
    repositorioIds: ['repo-contas'],
    dependeDe: [],
    projetosBacklog: ['Contas'],
    areasBacklog: ['Empresa\\Contas'],
  })
  await app.salvarProduto({
    id: 'pix',
    nome: 'PIX',
    repositorioIds: ['repo-pagamentos', 'repo-app-pix'],
    dependeDe: ['contas'],
    projetosBacklog: ['Pagamentos'],
    areasBacklog: ['Empresa\\Pagamentos'],
  })
  await app.drenarWiki()
  const story = await app.iniciarEsteira(
    'Permitir estorno parcial de um PIX já liquidado, sem passar do valor original.',
    'pix',
  )
  const palpite = story.achados.find((achado) => achado.semProva)
  if (palpite) {
    await app.aceitarAchado(story.id, palpite.id)
    await app.aprovarDiff(story.id)
  }
  const pendente = (await app.obterStory(story.id)).achados.find((achado) => achado.estado === 'pendente')
  if (pendente) await app.descartarAchado(story.id, pendente.id)
  await app.publicar(story.id, { acao: 'comentar', workItemId: 1300 })
}
