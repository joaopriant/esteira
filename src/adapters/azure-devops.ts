import type { WorkItem } from '../shared/tipos'
import type { AzurePort } from '../ports'
import { textoEmHtml } from '../core/publicacao'
import { dataMesesAtras } from '../core/texto'
import { validarOrgUrl } from './seguro'

// Categoria Completed nos processos Agile, Scrum e CMMI
// (workflow-and-state-categories): Closed no Agile e no CMMI, Done no Scrum.
// Test Case, Test Suite e Test Plan usam os mesmos nomes nos três: Closed, Completed e Inactive.
// Resolved não entra: no Agile e no CMMI o item ainda está no backlog.
const ESTADOS_FECHADOS = ['Closed', 'Done', 'Completed', 'Inactive']
const LOTE_WORK_ITEMS = 200

const CAMPOS = [
  'System.Id',
  'System.Title',
  'System.Description',
  'System.State',
  'System.AreaPath',
  'System.IterationPath',
  'System.AssignedTo',
  'System.WorkItemType',
  'System.TeamProject',
  'System.ChangedDate',
  'Microsoft.VSTS.Common.AcceptanceCriteria',
  'Microsoft.VSTS.Common.ClosedDate',
]

export interface RepoBruto {
  id: string
  nome: string
  projeto: string
  remoteUrl: string
  branchPadrao: string
}

export interface WorkItemBruto {
  id: number
  fields: Record<string, unknown>
}

export interface AzureSdk {
  listarRepos(): Promise<RepoBruto[]>
  consultar(projeto: string, wiql: string): Promise<number[]>
  obterVarios(ids: number[]): Promise<WorkItemBruto[]>
  obter(id: number): Promise<WorkItemBruto>
  criar(projeto: string, tipo: string, documento: { op: string; path: string; value: string }[]): Promise<WorkItemBruto>
  adicionarComentario(projeto: string, id: number, texto: string): Promise<void>
}

function texto(valor: unknown): string {
  if (typeof valor === 'string') return valor
  if (valor == null) return ''
  return String(valor)
}

function pessoa(valor: unknown): { nome: string; id?: string } | undefined {
  if (!valor) return undefined
  if (typeof valor === 'string') return { nome: valor }
  if (typeof valor === 'object') {
    const registro = valor as { displayName?: string; uniqueName?: string; id?: string }
    const nome = registro.displayName || registro.uniqueName
    if (!nome) return undefined
    return { nome, id: registro.id }
  }
  return undefined
}

export function lerWorkItem(bruto: WorkItemBruto): WorkItem {
  const campos = bruto.fields ?? {}
  const fechado = campos['Microsoft.VSTS.Common.ClosedDate']
  return {
    id: bruto.id,
    projeto: texto(campos['System.TeamProject']),
    tipo: texto(campos['System.WorkItemType']),
    titulo: texto(campos['System.Title']),
    descricao: texto(campos['System.Description']),
    criterios: texto(campos['Microsoft.VSTS.Common.AcceptanceCriteria']),
    estado: texto(campos['System.State']),
    areaPath: texto(campos['System.AreaPath']),
    iterationPath: texto(campos['System.IterationPath']),
    atribuidoA: pessoa(campos['System.AssignedTo']),
    fechadoEm: fechado ? new Date(texto(fechado)).toISOString() : null,
    alteradoEm: texto(campos['System.ChangedDate']) || new Date(0).toISOString(),
  }
}

function wiql(areas: string[], fechadosDesde: string): string {
  const data = fechadosDesde.slice(0, 10)
  const fechados = ESTADOS_FECHADOS.map((estado) => `'${estado}'`).join(', ')
  const area =
    areas.length === 0
      ? ''
      : `AND (${areas.map((item) => `[System.AreaPath] UNDER '${item.replace(/'/g, "''")}'`).join(' OR ')})`
  return `
    SELECT [System.Id]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
      AND [System.State] <> 'Removed'
      AND (
        [System.State] NOT IN (${fechados})
        OR [Microsoft.VSTS.Common.ClosedDate] >= '${data}'
      )
      ${area}
    ORDER BY [System.ChangedDate] DESC
  `
}

export function azurePeloSdk(sdk: AzureSdk): AzurePort {
  return {
    listarRepositorios: () => sdk.listarRepos(),
    async listarWorkItems(filtro) {
      const ids = new Set<number>()
      const projetos = filtro.projetos.length > 0 ? filtro.projetos : ['']
      for (const projeto of projetos) {
        if (!projeto) continue
        const encontrados = await sdk.consultar(projeto, wiql(filtro.areas, filtro.fechadosDesde))
        // shortcut: 500 itens por projeto; rever se o pré-filtro perder card antigo demais na ordenação.
        for (const id of encontrados.slice(0, 500)) ids.add(id)
      }
      if (ids.size === 0) return []
      const brutos = await sdk.obterVarios([...ids])
      return brutos.map(lerWorkItem)
    },
    async obterWorkItem(_projeto, id) {
      return lerWorkItem(await sdk.obter(id))
    },
    async criarWorkItem(pedido) {
      const documento: { op: string; path: string; value: string }[] = [
        { op: 'add', path: '/fields/System.Title', value: pedido.titulo },
        { op: 'add', path: `/fields/${pedido.campoDescricao}`, value: textoEmHtml(pedido.descricao) },
        { op: 'add', path: `/fields/${pedido.campoCriterios}`, value: textoEmHtml(pedido.criterios) },
      ]
      if (pedido.area) documento.push({ op: 'add', path: '/fields/System.AreaPath', value: pedido.area })
      if (pedido.iteracao) documento.push({ op: 'add', path: '/fields/System.IterationPath', value: pedido.iteracao })
      return lerWorkItem(await sdk.criar(pedido.projeto, pedido.tipo, documento))
    },
    async comentar(projeto, id, texto) {
      await sdk.adicionarComentario(projeto, id, texto)
    },
  }
}

interface RepoOficial {
  id?: string
  name?: string
  project?: { name?: string }
  remoteUrl?: string
  defaultBranch?: string
  isDisabled?: boolean
}

interface ItemOficial {
  id?: number
  fields?: Record<string, unknown> | null
}

interface RegraAzure {
  fieldReferenceName?: string | null
  fieldStatusFlags?: string
  errorMessage?: string
}

export interface ClientesOficiais {
  git: { getRepositories(): Promise<RepoOficial[] | null | undefined> }
  wit: {
    queryByWiql(wiql: { query: string }, opcoes?: { project?: string }): Promise<{ workItems?: ({ id?: number } | null)[] | null }>
    getWorkItems(ids: number[], fields?: string[]): Promise<ItemOficial[] | null | undefined>
    getWorkItem(id: number, fields?: string[]): Promise<ItemOficial>
    createWorkItem(headers: null, documento: { op: string; path: string; value: string }[], projeto: string, tipo: string): Promise<ItemOficial | null | undefined>
    addComment(pedido: { text: string }, projeto: string, id: number): Promise<unknown>
  }
}

function itemBruto(item: ItemOficial | null | undefined, idPadrao = 0): WorkItemBruto {
  return { id: item?.id ?? idPadrao, fields: (item?.fields ?? {}) as Record<string, unknown> }
}

function regrasDe(valor: unknown): RegraAzure[] {
  if (!valor || typeof valor !== 'object') return []
  const lista = (valor as { customProperties?: { RuleValidationErrors?: unknown } }).customProperties?.RuleValidationErrors
  if (!Array.isArray(lista)) return []
  return lista.filter((item): item is RegraAzure => Boolean(item) && typeof item === 'object')
}

function mensagemSolta(erro: unknown): string {
  if (!erro || typeof erro !== 'object') return ''
  const mensagem = (erro as { message?: unknown }).message
  return typeof mensagem === 'string' ? mensagem : ''
}

function limparCampo(nome: string): string {
  return nome.replace(/\s+/g, ' ').trim().slice(0, 120)
}

function rotuloCampo(regra: RegraAzure): string | undefined {
  const flags = regra.fieldStatusFlags ?? ''
  const mensagem = regra.errorMessage ?? ''
  if (!/required/i.test(flags) && !/Error code:\s*Required\b/i.test(mensagem)) return undefined
  const mostrado = /Rule Error for field (.+?)\. Error code:/i.exec(mensagem)?.[1]
  const nome = limparCampo(mostrado ?? '')
  const referencia = regra.fieldReferenceName?.trim() || undefined
  if (nome && referencia && referencia !== nome) return `"${nome}" (${referencia})`.slice(0, 180)
  const escolhido = nome || (referencia ? limparCampo(referencia) : '')
  return escolhido ? `"${escolhido}"` : undefined
}

function nomesDoTexto(texto: string): string[] {
  const nomes: string[] = []
  for (const match of texto.matchAll(/Rule Error for field (.+?)\. Error code:\s*Required\b/gi)) {
    const nome = limparCampo(match[1] ?? '')
    if (nome && !nomes.includes(`"${nome}"`)) nomes.push(`"${nome}"`)
  }
  return nomes
}

function mensagemCampoObrigatorio(erro: unknown): string | null {
  const corpos: unknown[] = []
  if (erro && typeof erro === 'object' && (erro as { result?: unknown }).result) corpos.push((erro as { result: unknown }).result)
  corpos.push(erro)
  const nomes: string[] = []
  for (const corpo of corpos) {
    for (const regra of regrasDe(corpo)) {
      const nome = rotuloCampo(regra)
      if (nome && !nomes.includes(nome)) nomes.push(nome)
    }
  }
  if (nomes.length === 0) {
    for (const nome of nomesDoTexto(corpos.map(mensagemSolta).filter(Boolean).join('\n'))) {
      if (!nomes.includes(nome)) nomes.push(nome)
    }
  }
  if (nomes.length === 0) return null
  const lista = nomes.length === 1 ? nomes[0]! : nomes.length === 2 ? `${nomes[0]} e ${nomes[1]}` : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
  return `Não criei o card. O processo da empresa exige ${nomes.length > 1 ? 'os campos' : 'o campo'} ${lista}.`
}

function sdkDosClientes(git: ClientesOficiais['git'], wit: ClientesOficiais['wit']): AzureSdk {
  return {
    async listarRepos() {
      const repos = await git.getRepositories()
      return (repos ?? [])
        .filter((repo) => !repo.isDisabled)
        .map((repo) => ({
          id: repo.id ?? '',
          nome: repo.name ?? '',
          projeto: repo.project?.name ?? '',
          remoteUrl: repo.remoteUrl ?? '',
          branchPadrao: (repo.defaultBranch ?? 'refs/heads/main').replace('refs/heads/', ''),
        }))
    },
    async consultar(projeto, consulta) {
      const resultado = await wit.queryByWiql({ query: consulta }, { project: projeto })
      return (resultado.workItems ?? []).map((item) => item?.id).filter((id): id is number => typeof id === 'number')
    },
    async obterVarios(ids) {
      if (ids.length === 0) return []
      const brutos: WorkItemBruto[] = []
      for (let inicio = 0; inicio < ids.length; inicio += LOTE_WORK_ITEMS) {
        const lote = ids.slice(inicio, inicio + LOTE_WORK_ITEMS)
        const itens = await wit.getWorkItems(lote, CAMPOS)
        for (const item of itens ?? []) brutos.push(itemBruto(item))
      }
      return brutos
    },
    async obter(id) {
      return itemBruto(await wit.getWorkItem(id, CAMPOS), id)
    },
    async criar(projeto, tipo, documento) {
      try {
        return itemBruto(await wit.createWorkItem(null, documento, projeto, tipo))
      } catch (erro) {
        const mensagem = mensagemCampoObrigatorio(erro)
        if (mensagem) throw new Error(mensagem)
        throw erro
      }
    },
    async adicionarComentario(projeto, id, texto) {
      await wit.addComment({ text: texto }, projeto, id)
    },
  }
}

async function abrirClienteOficial(org: string, pat: string): Promise<ClientesOficiais> {
  const azdev = await import('azure-devops-node-api')
  const auth = azdev.getPersonalAccessTokenHandler(pat)
  const conexao = new azdev.WebApi(org, auth)
  const git = await conexao.getGitApi()
  const wit = await conexao.getWorkItemTrackingApi()
  return { git, wit }
}

export async function sdkOficial(
  orgUrl: string,
  pat: string,
  abrir?: (org: string, pat: string) => Promise<ClientesOficiais>,
): Promise<AzureSdk> {
  const org = validarOrgUrl(orgUrl).toString().replace(/\/$/, '')
  // abrir: o teste injeta o cliente do SDK. Sem ele, abre o pacote azure-devops-node-api.
  const { git, wit } = await (abrir ?? abrirClienteOficial)(org, pat)
  return sdkDosClientes(git, wit)
}

export async function criarAzureReal(orgUrl: string, pat: string): Promise<AzurePort> {
  return azurePeloSdk(await sdkOficial(orgUrl, pat))
}

export function fechadosDesde(agora: Date): string {
  return dataMesesAtras(agora, 12).toISOString()
}
