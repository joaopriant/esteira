import type { WorkItem } from '../shared/tipos'
import type { AzurePort } from '../ports'
import { dataMesesAtras } from '../core/texto'
import { validarOrgUrl } from './seguro'

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
        [System.State] NOT IN ('Closed', 'Done', 'Completed')
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
        { op: 'add', path: `/fields/${pedido.campoDescricao}`, value: pedido.descricao },
        { op: 'add', path: `/fields/${pedido.campoCriterios}`, value: pedido.criterios },
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

export async function sdkOficial(orgUrl: string, pat: string): Promise<AzureSdk> {
  const url = validarOrgUrl(orgUrl)
  const azdev = await import('azure-devops-node-api')
  const auth = azdev.getPersonalAccessTokenHandler(pat)
  const conexao = new azdev.WebApi(url.toString().replace(/\/$/, ''), auth)
  const git = await conexao.getGitApi()
  const wit = await conexao.getWorkItemTrackingApi()
  return {
    async listarRepos() {
      const repos = await git.getRepositories()
      return (repos ?? []).map((repo) => ({
        id: repo.id ?? '',
        nome: repo.name ?? '',
        projeto: repo.project?.name ?? '',
        remoteUrl: repo.remoteUrl ?? '',
        branchPadrao: (repo.defaultBranch ?? 'refs/heads/main').replace('refs/heads/', ''),
      }))
    },
    async consultar(projeto, consulta) {
      const resultado = await wit.queryByWiql({ query: consulta }, { project: projeto })
      return (resultado.workItems ?? []).map((item) => item.id).filter((id): id is number => typeof id === 'number')
    },
    async obterVarios(ids) {
      if (ids.length === 0) return []
      const itens = await wit.getWorkItems(ids, CAMPOS)
      return (itens ?? []).map((item) => ({ id: item.id ?? 0, fields: (item.fields ?? {}) as Record<string, unknown> }))
    },
    async obter(id) {
      const item = await wit.getWorkItem(id, CAMPOS)
      return { id: item.id ?? id, fields: (item.fields ?? {}) as Record<string, unknown> }
    },
    async criar(projeto, tipo, documento) {
      const criado = await wit.createWorkItem(null, documento as never, projeto, tipo)
      return { id: criado?.id ?? 0, fields: (criado?.fields ?? {}) as Record<string, unknown> }
    },
    async adicionarComentario(projeto, id, texto) {
      await wit.addComment({ text: texto }, projeto, id)
    },
  }
}

export async function criarAzureReal(orgUrl: string, pat: string): Promise<AzurePort> {
  return azurePeloSdk(await sdkOficial(orgUrl, pat))
}

export function fechadosDesde(agora: Date): string {
  return dataMesesAtras(agora, 12).toISOString()
}
