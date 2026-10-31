import { z, ZodError } from 'zod'
import { redigirSegredo } from '../adapters/seguro'
import type { EsteiraApp } from './esteira-app'

const vazio = z.object({}).passthrough()
const id = z.object({ id: z.string().min(1).max(80) })
const storyTexto = z.object({
  titulo: z.string().max(300),
  corpo: z.string().max(100_000),
  descricao: z.string().max(100_000),
  criteriosDeAceite: z.string().max(100_000),
})

const esquemas: Record<string, z.ZodTypeAny> = {
  estado: vazio,
  conectar: z.object({ orgUrl: z.string().min(8).max(200), pat: z.string().min(1).max(256) }),
  desconectar: vazio,
  listarRepositorios: vazio,
  andamentoClone: vazio,
  salvarSelecao: z.object({
    ids: z.array(z.string().max(80)).max(100),
    branches: z.record(z.string().max(80), z.string().max(200)).optional(),
  }),
  atualizarRepositorios: vazio,
  salvarProduto: z.object({
    id: z.string().max(80),
    nome: z.string().min(1).max(80),
    repositorioIds: z.array(z.string().max(80)).min(1).max(40),
    dependeDe: z.array(z.string().max(80)).max(20),
    projetosBacklog: z.array(z.string().max(200)).max(20),
    areasBacklog: z.array(z.string().max(300)).max(20),
  }),
  removerProduto: id,
  salvarFluxo: z.object({
    blocos: z.array(z.object({
      id: z.string().min(1).max(80),
      nome: z.string().min(1).max(120),
      papel: z.enum(['escrever', 'confrontar']),
      modo: z.enum(['automatico', 'por-clique']),
      fonte: z.union([
        z.object({ tipo: z.literal('skill'), skillId: z.string().min(1).max(120) }),
        z.object({ tipo: z.literal('instrucao'), texto: z.string().min(1).max(20_000) }),
      ]),
    })).min(1).max(20),
  }),
  listarSkills: vazio,
  fluxo: vazio,
  wiki: z.object({ produtoId: z.string().min(1).max(80) }),
  gerarWiki: z.object({ produtoId: z.string().min(1).max(80) }),
  perguntarWiki: z.object({ produtoId: z.string().min(1).max(80), pergunta: z.string().min(1).max(4_000) }),
  obterStory: id,
  iniciarEsteira: z.object({ ideia: z.string().min(1).max(20_000), produtoId: z.string().min(1).max(80) }),
  pararEsteira: id,
  continuar: id,
  recomecar: id,
  editarStory: id.extend({ story: storyTexto }),
  reconfrontar: id,
  aceitarAchado: id.extend({ achadoId: z.string().min(1).max(80) }),
  aprovarDiff: id.extend({ story: storyTexto.optional() }),
  cancelarDiff: id,
  descartarAchado: id.extend({ achadoId: z.string().min(1).max(80) }),
  publicar: z.object({
    id: z.string().min(1).max(80),
    pedido: z.discriminatedUnion('acao', [
      z.object({
        acao: z.literal('criar'),
        projeto: z.string().min(1).max(200),
        area: z.string().max(300).optional(),
        iteracao: z.string().max(300).optional(),
      }),
      z.object({ acao: z.literal('comentar'), workItemId: z.number().int().positive() }),
    ]),
  }),
  registrarVolta: id.extend({ voto: z.enum(['passou', 'voltou']) }),
  fontesRadar: vazio,
  salvarFonteRadar: z.object({
    id: z.string().max(80),
    produtoId: z.string().min(1).max(80),
    provedor: z.enum(['teams', 'slack', 'whatsapp', 'granola', 'plaud']),
    nome: z.string().min(1).max(120),
    referencia: z.string().min(1).max(300),
    ativa: z.boolean(),
  }),
  removerFonteRadar: id,
  catalogoRadar: z.object({ provedor: z.enum(['teams', 'slack', 'whatsapp', 'granola', 'plaud']) }),
  importarTranscricao: z.object({
    produtoId: z.string().min(1).max(80),
    provedor: z.enum(['teams', 'slack', 'whatsapp', 'granola', 'plaud']),
    autor: z.string().min(1).max(120),
    local: z.string().min(1).max(160),
    texto: z.string().min(1).max(20_000),
    em: z.string().max(40).optional(),
  }),
  sincronizarRadar: z.object({ fonteId: z.string().min(1).max(80).optional() }),
  sugestoesRadar: vazio,
  descartarSugestao: id,
  enviarParaEsteira: id,
  conectarRadar: z.object({ provedor: z.enum(['teams', 'slack', 'whatsapp']), token: z.string().min(8).max(500) }),
  desconectarRadar: z.object({ provedor: z.enum(['teams', 'slack', 'whatsapp', 'granola', 'plaud']) }),
  salvarPastaRadar: z.object({ provedor: z.enum(['whatsapp', 'granola', 'plaud']), caminho: z.string().max(300) }),
  testarRadar: z.object({ provedor: z.enum(['teams', 'slack', 'whatsapp', 'granola', 'plaud']) }),
  testarAzure: vazio,
  testarClaude: vazio,
  painelConexoes: vazio,
  credenciaisRadar: vazio,
  lerSkillTexto: z.object({ id: z.string().min(1).max(80) }),
  estatisticasBlocos: vazio,
  presetsFluxo: vazio,
  salvarAjustes: z.object({
    tipoWorkItem: z.string().min(1).max(80).optional(),
    campoDescricao: z.string().min(1).max(120).optional(),
    campoCriterios: z.string().min(1).max(120).optional(),
    areaPadrao: z.string().max(300).optional(),
    iteracaoPadrao: z.string().max(300).optional(),
    claudeBin: z.string().min(1).max(300).optional(),
    timeoutBlocoMs: z.number().int().min(5_000).max(600_000).optional(),
    modeloStory: z.string().min(1).max(20_000).optional(),
  }),
}

export async function despachar(app: EsteiraApp, canal: string, corpo: unknown): Promise<unknown> {
  try {
    return await executar(app, canal, corpo)
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : 'Falha'
    throw new Error(redigirSegredo(mensagem) || 'Não consegui completar.')
  }
}

async function executar(app: EsteiraApp, canal: string, corpo: unknown): Promise<unknown> {
  const esquema = esquemas[canal]
  if (!esquema) throw new Error('Canal desconhecido.')
  let dados: any
  try {
    dados = esquema.parse(corpo ?? {})
  } catch (erro) {
    if (erro instanceof ZodError) throw new Error('Os dados enviados não servem.')
    throw erro
  }
  switch (canal) {
    case 'estado':
      return app.estado()
    case 'conectar':
      return app.conectar(dados.orgUrl, dados.pat)
    case 'desconectar':
      await app.desconectar()
      return { ok: true }
    case 'listarRepositorios':
      return app.listarRepositoriosRemotos()
    case 'andamentoClone':
      return app.andamentoClone()
    case 'salvarSelecao':
      return app.salvarSelecao(dados.ids, dados.branches ?? {})
    case 'atualizarRepositorios':
      return app.atualizarRepositorios()
    case 'salvarProduto':
      return app.salvarProduto(dados)
    case 'removerProduto':
      await app.removerProduto(dados.id)
      return { ok: true }
    case 'salvarFluxo':
      return app.salvarFluxo(dados.blocos)
    case 'listarSkills':
      return app.listarSkills()
    case 'fluxo':
      return app.fluxo()
    case 'wiki':
      return app.wiki(dados.produtoId)
    case 'gerarWiki':
      return app.gerarWiki(dados.produtoId)
    case 'perguntarWiki':
      return app.perguntarWiki(dados.produtoId, dados.pergunta)
    case 'obterStory':
      return app.obterStory(dados.id)
    case 'iniciarEsteira':
      return app.iniciarEsteira(dados.ideia, dados.produtoId)
    case 'pararEsteira':
      return app.parar(dados.id)
    case 'continuar':
      return app.continuar(dados.id)
    case 'recomecar':
      return app.recomecar(dados.id)
    case 'editarStory':
      return app.editarStory(dados.id, dados.story)
    case 'reconfrontar':
      return app.reconfrontar(dados.id)
    case 'aceitarAchado':
      return app.aceitarAchado(dados.id, dados.achadoId)
    case 'aprovarDiff':
      return app.aprovarDiff(dados.id, dados.story)
    case 'cancelarDiff':
      return app.cancelarDiff(dados.id)
    case 'descartarAchado':
      return app.descartarAchado(dados.id, dados.achadoId)
    case 'publicar':
      return app.publicar(dados.id, dados.pedido)
    case 'registrarVolta':
      return app.registrarVolta(dados.id, dados.voto)
    case 'salvarAjustes':
      return app.salvarAjustes(dados)
    case 'fontesRadar':
      return app.fontesRadar()
    case 'salvarFonteRadar':
      return app.salvarFonteRadar(dados)
    case 'removerFonteRadar':
      await app.removerFonteRadar(dados.id)
      return { ok: true }
    case 'catalogoRadar':
      return app.catalogoRadar(dados.provedor)
    case 'importarTranscricao':
      return app.importarTranscricao(dados)
    case 'sincronizarRadar':
      return app.sincronizarRadar(dados.fonteId)
    case 'sugestoesRadar':
      return app.sugestoesRadar()
    case 'descartarSugestao':
      return app.descartarSugestao(dados.id)
    case 'enviarParaEsteira':
      return app.enviarParaEsteira(dados.id)
    case 'conectarRadar':
      return app.conectarRadar(dados.provedor, dados.token)
    case 'desconectarRadar':
      return app.desconectarRadar(dados.provedor)
    case 'salvarPastaRadar':
      return app.salvarPastaRadar(dados.provedor, dados.caminho)
    case 'testarRadar':
      return app.testarRadar(dados.provedor)
    case 'testarAzure':
      return app.testarAzure()
    case 'testarClaude':
      return app.testarClaude()
    case 'painelConexoes':
      return app.painelConexoes()
    case 'credenciaisRadar':
      return app.credenciaisRadar()
    case 'lerSkillTexto':
      return app.lerSkillTexto(dados.id)
    case 'estatisticasBlocos':
      return app.estatisticasBlocos()
    case 'presetsFluxo':
      return app.presetsFluxo()
    default:
      throw new Error('Canal desconhecido.')
  }
}
