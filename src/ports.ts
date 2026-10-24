import type { Ajustes, ArquivoLido, StoryTexto, WorkItem, AfirmacaoWiki, Achado } from './shared/tipos'

export interface AzurePort {
  listarRepositorios(): Promise<
    { id: string; nome: string; projeto: string; remoteUrl: string; branchPadrao: string }[]
  >
  listarWorkItems(filtro: { projetos: string[]; areas: string[]; fechadosDesde: string }): Promise<WorkItem[]>
  obterWorkItem(projeto: string, id: number): Promise<WorkItem>
  criarWorkItem(pedido: {
    projeto: string
    tipo: string
    titulo: string
    descricao: string
    criterios: string
    campoDescricao: string
    campoCriterios: string
    area?: string
    iteracao?: string
  }): Promise<WorkItem>
  comentar(projeto: string, id: number, texto: string): Promise<void>
}

export interface PedidoClaude {
  papel: 'escrever' | 'confrontar' | 'aplicar' | 'wiki' | 'pergunta'
  blocoId: string
  instrucao: string
  ideia: string
  modelo: string
  story: StoryTexto
  achado?: Achado
  wiki: AfirmacaoWiki[]
  arquivos: { repositorio: string; caminho: string; conteudo: string }[]
  cards: WorkItem[]
  pergunta?: string
  diretorios: string[]
  timeoutMs: number
}

export interface RespostaClaude {
  json: unknown
  bruto: string
}

export interface ClaudePort {
  run(pedido: PedidoClaude): Promise<RespostaClaude>
}

export interface GitPort {
  clone(pedido: { url: string; dest: string; branch: string; pat: string }): Promise<void>
  atualizar(pedido: { dest: string; branch: string; pat: string }): Promise<{ arquivosAlterados: string[] }>
  listarArquivos(dest: string): Promise<string[]>
  lerArquivo(dest: string, relativo: string): Promise<string>
  head(dest: string): Promise<string>
}

export interface SecretStore {
  ler(conta: string): Promise<string | null>
  gravar(conta: string, segredo: string): Promise<void>
  apagar(conta: string): Promise<void>
}

export interface Disco {
  lerJson<T>(relativo: string): Promise<T | null>
  gravarJson(relativo: string, valor: unknown): Promise<void>
  listar(relativo: string): Promise<string[]>
  caminho(relativo: string): string
}

export interface Processo {
  executar(pedido: {
    comando: string
    args: string[]
    cwd?: string
    env?: NodeJS.ProcessEnv
    entrada?: string
    timeoutMs: number
  }): Promise<{ codigo: number; stdout: string; stderr: string }>
}

export interface Dependencias {
  dataDir: string
  modo: 'real' | 'falso'
  agora: () => Date
  disco: Disco
  azure: AzurePort
  claude: ClaudePort
  git: GitPort
  segredos: SecretStore
  skillsDir: string
  skillsUsuario?: string
  pat?: () => Promise<string | null>
}

export type { Ajustes, ArquivoLido }
