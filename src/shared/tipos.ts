export type PapelBloco = 'escrever' | 'confrontar'
export type ModoBloco = 'automatico' | 'por-clique'
export type EstadoBloco = 'aguardando' | 'rodando' | 'pausado' | 'concluido' | 'erro' | 'interrompido'
export type EstadoStory = 'rodando' | 'pausada' | 'pronta' | 'erro' | 'interrompida'
export type EstadoAchado = 'pendente' | 'aceito' | 'descartado'
export type TipoAchado =
  | 'existe'
  | 'divergencia'
  | 'nao-encontrei'
  | 'ja-existe'
  | 'ajustar-aberta'
  | 'conflito'
  | 'outro'

export interface StoryTexto {
  titulo: string
  corpo: string
  descricao: string
  criteriosDeAceite: string
}

export type Evidencia =
  | { tipo: 'arquivo'; caminho: string; trecho: string; repositorio?: string }
  | { tipo: 'work-item'; id: number; titulo: string; projeto: string }
  | { tipo: 'ausencia' }

export interface Achado {
  id: string
  blocoId: string
  blocoNome: string
  texto: string
  tipo: TipoAchado
  evidencia: Evidencia
  semProva: boolean
  estado: EstadoAchado
}

export interface AchadoBruto {
  texto?: string
  tipo?: string
  evidencia?: unknown
}

export interface LinhaDiff {
  tipo: 'igual' | 'entrou' | 'saiu'
  texto: string
}

export interface DiffPendente {
  achadoId: string
  antes: StoryTexto
  depois: StoryTexto
  linhas: LinhaDiff[]
}

export interface BlocoFluxo {
  id: string
  nome: string
  papel: PapelBloco
  modo: ModoBloco
  fonte: { tipo: 'skill'; skillId: string } | { tipo: 'instrucao'; texto: string }
}

export interface PassoExecucao {
  blocoId: string
  nome: string
  papel: PapelBloco
  modo: ModoBloco
  estado: EstadoBloco
  erro?: string
}

export interface MedicaoStory {
  passou: number
  voltou: number
  atualizadoEm?: string
}

export interface Publicacao {
  acao: 'criar' | 'comentar'
  workItemId: number
  projeto: string
  em: string
}

export type ProvedorRadar = 'teams' | 'slack' | 'whatsapp' | 'granola' | 'plaud'
export type TipoSugestao = 'nova-story' | 'melhoria' | 'bug'

export interface FonteRadar {
  id: string
  produtoId: string
  provedor: ProvedorRadar
  nome: string
  referencia: string
  ativa: boolean
}

export type StatusConexao = 'conectado' | 'nao-conectado' | 'pasta-local'

export interface ConexaoRadar {
  provedor: ProvedorRadar
  nome: string
  status: StatusConexao
  detalhe: string
  explicacao: string
  tokenNoCofre: boolean
  clientId: string
  tenant: string
  oauthPronto: boolean
  pasta: string
  caminhoSalvo: string
  fontes: FonteRadar[]
}

export interface PainelConexoes {
  radar: ConexaoRadar[]
  azure: { orgUrl: string; conectado: boolean; escopos: string; detalhe: string }
  claude: { binario: string; timeoutBlocoMs: number; instalado: boolean | null; autenticado: boolean | null; detalhe: string }
  ativas: number
}

export interface SinalBruto {
  id: string
  provedor: ProvedorRadar
  fonteRef: string
  fonteNome: string
  autor: string
  local: string
  em: string
  texto: string
  fio: string
}

export interface ProvaRadar {
  provedor: ProvedorRadar
  fonteNome: string
  autor: string
  local: string
  em: string
  citacao: string
}

export interface SugestaoRadar {
  id: string
  produtoId: string
  produtoNome: string
  tipo: TipoSugestao
  titulo: string
  resumo: string
  provas: ProvaRadar[]
  estado: 'nova' | 'enviada' | 'descartada'
  storyId?: string
  criadaEm: string
}

export interface EstatisticaBloco {
  blocoId: string
  blocoNome: string
  gerados: number
  aceitos: number
  descartados: number
  pendentes: number
}

export interface StoryRun {
  id: string
  ideia: string
  produtoId: string
  produtoNome: string
  mencoes: string[]
  avisos: string[]
  story: StoryTexto
  achados: Achado[]
  blocos: BlocoFluxo[]
  passos: PassoExecucao[]
  estado: EstadoStory
  pausadaNoBlocoId?: string
  diffPendente?: DiffPendente
  publicacao?: Publicacao
  medicao: MedicaoStory
  criadaEm: string
  atualizadaEm: string
  erro?: string
  provasOrigem?: ProvaRadar[]
  sugestaoId?: string
}

export interface Produto {
  id: string
  nome: string
  repositorioIds: string[]
  dependeDe: string[]
  projetosBacklog: string[]
  areasBacklog: string[]
}

export interface Repositorio {
  id: string
  nome: string
  projeto: string
  remoteUrl: string
  branchPadrao: string
  branchAcompanhada: string
  caminhoLocal?: string
  ultimoCommit?: string
  estado: 'nao-clonado' | 'clonando' | 'pronto' | 'erro'
  selecionado: boolean
  erro?: string
}

export interface WorkItem {
  id: number
  projeto: string
  tipo: string
  titulo: string
  descricao: string
  criterios: string
  estado: string
  areaPath: string
  iterationPath: string
  atribuidoA?: { nome: string; id?: string }
  fechadoEm?: string | null
  alteradoEm: string
}

export interface Ajustes {
  orgUrl: string
  tipoWorkItem: string
  campoDescricao: string
  campoCriterios: string
  areaPadrao: string
  iteracaoPadrao: string
  claudeBin: string
  timeoutBlocoMs: number
  modeloStory: string
  conectado: boolean
  modo: 'real' | 'falso'
  claudeConferido: boolean
  modeloConferido: boolean
}

export interface AfirmacaoWiki {
  texto: string
  caminho: string
  trecho: string
  semProva: boolean
  repositorio?: string
}

export interface ModuloWiki {
  id: string
  produtoId: string
  nome: string
  repositorioId: string
  repositorioNome: string
  estado: 'pendente' | 'gerando' | 'pronto' | 'erro'
  arquivos: string[]
  hashes: Record<string, string>
  conteudo: string
  afirmacoes: AfirmacaoWiki[]
  erro?: string
  atualizadoEm?: string
}

export interface WikiProduto {
  produtoId: string
  modulos: ModuloWiki[]
}

export interface RespostaWiki {
  pergunta: string
  resposta: string
  afirmacoes: AfirmacaoWiki[]
}

export interface SkillDisponivel {
  id: string
  nome: string
  origem: 'embutida' | 'usuario'
  papelSugerido: PapelBloco
}

export interface ArquivoLido {
  repositorioId: string
  repositorioNome: string
  caminho: string
  conteudo: string
  hash: string
}

export interface EstadoApp {
  ajustes: Ajustes
  produtos: Produto[]
  repositorios: Repositorio[]
  stories: ResumoStory[]
  filaWiki: { produtoId: string; pendentes: number; gerando: boolean }
  radarPendentes: number
  conexoesAtivas: number
}

export interface ResumoStory {
  id: string
  titulo: string
  produtoNome: string
  estado: EstadoStory
  aceitos: number
  descartados: number
  pendentes: number
  porBloco: { blocoNome: string; aceitos: number; descartados: number }[]
  medicao: MedicaoStory
  publicacao?: Publicacao
  atualizadaEm: string
}

export const STORY_VAZIA: StoryTexto = {
  titulo: '',
  corpo: '',
  descricao: '',
  criteriosDeAceite: '',
}

export const MODELO_INICIAL = `Como cliente do produto
Eu quero <capacidade>
Para <resultado>

Contexto

Critérios de aceite

Regras de negócio

Fora de escopo
`

export const AJUSTES_INICIAIS: Ajustes = {
  orgUrl: '',
  tipoWorkItem: 'User Story',
  campoDescricao: 'System.Description',
  campoCriterios: 'Microsoft.VSTS.Common.AcceptanceCriteria',
  areaPadrao: '',
  iteracaoPadrao: '',
  claudeBin: 'claude',
  timeoutBlocoMs: 180_000,
  modeloStory: MODELO_INICIAL,
  conectado: false,
  modo: 'real',
  claudeConferido: false,
  modeloConferido: false,
}
