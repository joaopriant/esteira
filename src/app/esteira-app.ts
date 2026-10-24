import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import type {
  Ajustes,
  AchadoBruto,
  AfirmacaoWiki,
  ArquivoLido,
  BlocoFluxo,
  EstadoApp,
  ModuloWiki,
  PassoExecucao,
  Produto,
  Repositorio,
  RespostaWiki,
  ResumoStory,
  SkillDisponivel,
  StoryRun,
  StoryTexto,
  WikiProduto,
} from '../shared/tipos'
import { AJUSTES_INICIAIS, STORY_VAZIA } from '../shared/tipos'
import type { Dependencias } from '../ports'
import { escolherArquivos } from '../core/arquivos-relevantes'
import { aplicarContrato } from '../core/contrato'
import { diffStory, storiesIguais } from '../core/diff-story'
import { fluxoPadrao, validarFluxo } from '../core/fluxo-padrao'
import { extrairMencoes, resolverEscopo } from '../core/mentoes'
import { prefiltrarBacklog } from '../core/prefiltro-backlog'
import { montarComentario } from '../core/publicacao'
import { dataMesesAtras, novoId } from '../core/texto'
import { definirModulos, modulosParaRegenerar } from '../core/wiki-plano'
import { criarAzureReal } from '../adapters/azure-devops'
import { criarClaudeCli } from '../adapters/claude-cli'
import { criarProcesso } from '../adapters/processo'
import { contaDoPat, nomePastaSeguro, validarOrgUrl } from '../adapters/seguro'
import type { AzurePort, ClaudePort } from '../ports'

interface ConfigDisco {
  orgUrl: string
  conectado: boolean
  tipoWorkItem: string
  campoDescricao: string
  campoCriterios: string
  areaPadrao: string
  iteracaoPadrao: string
  claudeBin: string
  timeoutBlocoMs: number
  modeloStory: string
  fluxo: BlocoFluxo[]
}

function hashTexto(texto: string): string {
  return createHash('sha256').update(texto).digest('hex')
}

function slug(nome: string): string {
  const base = nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || 'produto'
}

function moduloArquivo(id: string): string {
  return id.replace(/[^A-Za-z0-9._-]+/g, '_')
}

function interpretarSaida(json: unknown): { story?: Partial<StoryTexto>; achados: AchadoBruto[] } {
  if (!json || typeof json !== 'object') throw new Error('O bloco não devolveu JSON.')
  const obj = json as { story?: Partial<StoryTexto>; achados?: AchadoBruto[] }
  return { story: obj.story, achados: Array.isArray(obj.achados) ? obj.achados : [] }
}

export class EsteiraApp {
  private corrente: Promise<void> = Promise.resolve()
  private fila: { produtoId: string; moduloId: string }[] = []

  constructor(private readonly deps: Dependencias) {}

  async estado(): Promise<EstadoApp> {
    const ajustes = await this.ajustes()
    const produtos = await this.produtos()
    const repositorios = await this.repositorios()
    const stories = await this.listarStories()
    let pendentes = 0
    let gerando = false
    for (const produto of produtos) {
      const wiki = await this.lerWiki(produto.id)
      pendentes += wiki.modulos.filter((modulo) => modulo.estado === 'pendente' || modulo.estado === 'gerando').length
      if (wiki.modulos.some((modulo) => modulo.estado === 'gerando')) gerando = true
    }
    return {
      ajustes,
      produtos,
      repositorios,
      stories,
      filaWiki: { produtoId: produtos[0]?.id ?? '', pendentes, gerando: gerando || this.fila.length > 0 },
    }
  }

  async ajustes(): Promise<Ajustes> {
    const config = await this.config()
    return {
      orgUrl: config.orgUrl,
      tipoWorkItem: config.tipoWorkItem,
      campoDescricao: config.campoDescricao,
      campoCriterios: config.campoCriterios,
      areaPadrao: config.areaPadrao,
      iteracaoPadrao: config.iteracaoPadrao,
      claudeBin: config.claudeBin,
      timeoutBlocoMs: config.timeoutBlocoMs,
      modeloStory: config.modeloStory,
      conectado: config.conectado,
      modo: this.deps.modo,
    }
  }

  async salvarAjustes(parcial: Partial<Ajustes>): Promise<Ajustes> {
    const config = await this.config()
    const proximo: ConfigDisco = {
      ...config,
      tipoWorkItem: parcial.tipoWorkItem ?? config.tipoWorkItem,
      campoDescricao: parcial.campoDescricao ?? config.campoDescricao,
      campoCriterios: parcial.campoCriterios ?? config.campoCriterios,
      areaPadrao: parcial.areaPadrao ?? config.areaPadrao,
      iteracaoPadrao: parcial.iteracaoPadrao ?? config.iteracaoPadrao,
      claudeBin: parcial.claudeBin ?? config.claudeBin,
      timeoutBlocoMs: parcial.timeoutBlocoMs ?? config.timeoutBlocoMs,
      modeloStory: parcial.modeloStory ?? config.modeloStory,
    }
    if (!proximo.modeloStory.trim()) throw new Error('O modelo da story não pode ficar vazio.')
    if (!proximo.tipoWorkItem.trim()) throw new Error('Informe o tipo do work item.')
    await this.deps.disco.gravarJson('config.json', proximo)
    return this.ajustes()
  }

  async conectar(orgUrl: string, pat: string): Promise<Ajustes> {
    const url = validarOrgUrl(orgUrl)
    if (!pat.trim()) throw new Error('Informe o PAT.')
    await this.deps.segredos.gravar(contaDoPat(url.toString()), pat.trim())
    const config = await this.config()
    config.orgUrl = url.toString().replace(/\/$/, '')
    config.conectado = true
    await this.deps.disco.gravarJson('config.json', config)
    await (await this.clienteAzure()).listarRepositorios()
    return this.ajustes()
  }

  async desconectar(): Promise<void> {
    const config = await this.config()
    if (config.orgUrl) await this.deps.segredos.apagar(contaDoPat(config.orgUrl))
    config.conectado = false
    await this.deps.disco.gravarJson('config.json', config)
  }

  async listarRepositoriosRemotos() {
    await this.exigirConexao()
    return (await this.clienteAzure()).listarRepositorios()
  }

  async salvarSelecao(ids: string[], branches: Record<string, string> = {}): Promise<Repositorio[]> {
    await this.exigirConexao()
    const pat = await this.lerPat()
    const remotos = await (await this.clienteAzure()).listarRepositorios()
    const atuais = await this.repositorios()
    const proximos: Repositorio[] = []
    for (const remoto of remotos) {
      validarOrgUrl(remoto.remoteUrl)
      const anterior = atuais.find((repo) => repo.id === remoto.id)
      const selecionado = ids.includes(remoto.id)
      const branch = branches[remoto.id] || anterior?.branchAcompanhada || remoto.branchPadrao
      const registro: Repositorio = {
        id: remoto.id,
        nome: remoto.nome,
        projeto: remoto.projeto,
        remoteUrl: remoto.remoteUrl,
        branchPadrao: remoto.branchPadrao,
        branchAcompanhada: branch,
        caminhoLocal: anterior?.caminhoLocal,
        ultimoCommit: anterior?.ultimoCommit,
        estado: selecionado ? 'clonando' : 'nao-clonado',
        selecionado,
      }
      if (!selecionado) {
        proximos.push(registro)
        continue
      }
      const pasta = path.join(this.deps.dataDir, 'repos', nomePastaSeguro(remoto.nome))
      registro.caminhoLocal = pasta
      try {
        if (anterior?.estado === 'pronto' && anterior.caminhoLocal) {
          await this.deps.git.atualizar({ dest: pasta, branch, pat })
        } else {
          await this.deps.git.clone({ url: remoto.remoteUrl, dest: pasta, branch, pat })
        }
        registro.estado = 'pronto'
        registro.ultimoCommit = await this.deps.git.head(pasta)
        registro.erro = undefined
      } catch (erro) {
        registro.estado = 'erro'
        registro.erro = erro instanceof Error ? erro.message : 'Falha ao clonar.'
      }
      proximos.push(registro)
    }
    await this.deps.disco.gravarJson('repositorios.json', proximos)
    return proximos
  }

  async atualizarRepositorios(): Promise<{ arquivosAlterados: string[] }> {
    await this.exigirConexao()
    const pat = await this.lerPat()
    const repos = await this.repositorios()
    const alterados: string[] = []
    for (const repo of repos) {
      if (!repo.selecionado || !repo.caminhoLocal || repo.estado === 'nao-clonado') continue
      const resultado = await this.deps.git.atualizar({ dest: repo.caminhoLocal, branch: repo.branchAcompanhada, pat })
      repo.ultimoCommit = await this.deps.git.head(repo.caminhoLocal)
      repo.estado = 'pronto'
      alterados.push(...resultado.arquivosAlterados.map((arquivo) => `${repo.nome}/${arquivo}`))
    }
    await this.deps.disco.gravarJson('repositorios.json', repos)
    if (alterados.length > 0) {
      for (const produto of await this.produtos()) await this.gerarWiki(produto.id)
    }
    return { arquivosAlterados: alterados }
  }

  async produtos(): Promise<Produto[]> {
    return (await this.deps.disco.lerJson<Produto[]>('produtos.json')) ?? []
  }

  async salvarProduto(entrada: Produto): Promise<Produto> {
    const repos = await this.repositorios()
    const produtos = await this.produtos()
    if (!entrada.nome.trim()) throw new Error('Dê um nome ao produto.')
    if (entrada.repositorioIds.length === 0) throw new Error('Escolha ao menos um repositório.')
    for (const id of entrada.repositorioIds) {
      if (!repos.some((repo) => repo.id === id && repo.selecionado)) throw new Error('Repositório ainda não está clonado.')
    }
    for (const id of entrada.dependeDe) {
      if (id === entrada.id) throw new Error('Um produto não depende dele mesmo.')
      if (!produtos.some((produto) => produto.id === id) && id !== entrada.id) {
        throw new Error('Produto ligado não existe.')
      }
    }
    const id = entrada.id || slug(entrada.nome)
    const produto: Produto = { ...entrada, id, nome: entrada.nome.trim() }
    const indice = produtos.findIndex((item) => item.id === id)
    if (indice >= 0) produtos[indice] = produto
    else produtos.push(produto)
    await this.deps.disco.gravarJson('produtos.json', produtos)
    await this.gerarWiki(produto.id)
    return produto
  }

  async removerProduto(id: string): Promise<void> {
    const produtos = (await this.produtos()).filter((produto) => produto.id !== id)
    for (const produto of produtos) produto.dependeDe = produto.dependeDe.filter((dep) => dep !== id)
    await this.deps.disco.gravarJson('produtos.json', produtos)
  }

  async repositorios(): Promise<Repositorio[]> {
    return (await this.deps.disco.lerJson<Repositorio[]>('repositorios.json')) ?? []
  }

  async fluxo(): Promise<BlocoFluxo[]> {
    return (await this.config()).fluxo
  }

  async salvarFluxo(blocos: BlocoFluxo[]): Promise<BlocoFluxo[]> {
    const erro = validarFluxo(blocos)
    if (erro) throw new Error(erro)
    const config = await this.config()
    config.fluxo = blocos
    await this.deps.disco.gravarJson('config.json', config)
    return blocos
  }

  async listarSkills(): Promise<SkillDisponivel[]> {
    const listas = await Promise.all([
      this.skillsDa(this.deps.skillsDir, 'embutida'),
      this.deps.skillsUsuario ? this.skillsDa(this.deps.skillsUsuario, 'usuario') : Promise.resolve([]),
    ])
    const porId = new Map<string, SkillDisponivel>()
    for (const skill of listas.flat()) porId.set(skill.id, skill)
    return [...porId.values()]
  }

  async wiki(produtoId: string): Promise<WikiProduto> {
    return this.lerWiki(produtoId)
  }

  async gerarWiki(produtoId: string): Promise<WikiProduto> {
    const produto = await this.produto(produtoId)
    const arquivos = await this.arquivosDos(produto.repositorioIds)
    const planejados = definirModulos(arquivos)
    const atual = await this.lerWiki(produtoId)
    const regenerar = new Set(modulosParaRegenerar(atual.modulos, planejados))
    const modulos: ModuloWiki[] = planejados.map((plano) => {
      const anterior = atual.modulos.find((modulo) => modulo.id === plano.id)
      if (anterior && !regenerar.has(plano.id)) return { ...anterior, arquivos: plano.arquivos, hashes: plano.hashes }
      return {
        id: plano.id,
        produtoId,
        nome: plano.nome,
        repositorioId: plano.repositorioId,
        repositorioNome: plano.repositorioNome,
        estado: 'pendente',
        arquivos: plano.arquivos,
        hashes: plano.hashes,
        conteudo: '',
        afirmacoes: [],
      }
    })
    await this.gravarWiki(produtoId, modulos)
    for (const id of regenerar) this.fila.push({ produtoId, moduloId: id })
    this.corrente = this.corrente.then(() => this.processarFila())
    return this.lerWiki(produtoId)
  }

  async drenarWiki(): Promise<void> {
    await this.corrente
  }

  async perguntarWiki(produtoId: string, pergunta: string): Promise<RespostaWiki> {
    if (!pergunta.trim()) throw new Error('Escreva a pergunta.')
    const produto = await this.produto(produtoId)
    const ligados = await this.produtosLigados(produto)
    const afirmacoes: AfirmacaoWiki[] = []
    for (const item of [produto, ...ligados]) {
      const wiki = await this.lerWiki(item.id)
      for (const modulo of wiki.modulos) {
        if (modulo.estado !== 'pronto') continue
        afirmacoes.push(...modulo.afirmacoes)
      }
    }
    const arquivos = await this.arquivosDos(await this.idsDeRepos(produto))
    const ajustes = await this.ajustes()
    const resposta = await (await this.clienteClaude()).run({
      papel: 'pergunta',
      blocoId: 'pergunta-wiki',
      instrucao: 'Responda a pergunta só com o que a wiki prova.',
      ideia: pergunta,
      modelo: ajustes.modeloStory,
      story: STORY_VAZIA,
      wiki: afirmacoes,
      arquivos: [],
      cards: [],
      pergunta,
      diretorios: [],
      timeoutMs: ajustes.timeoutBlocoMs,
    })
    const json = resposta.json as { resposta?: string; afirmacoes?: { texto?: string; caminho?: string; trecho?: string }[] }
    const classificadas = (json.afirmacoes ?? []).map((item) => {
      const bruto = { texto: item.texto, tipo: 'existe', evidencia: { tipo: 'arquivo', caminho: item.caminho, trecho: item.trecho } }
      const aplicado = aplicarContrato({
        papel: 'confrontar',
        blocoId: 'pergunta',
        blocoNome: 'Pergunta',
        story: STORY_VAZIA,
        achados: [],
        saidaAchados: [bruto],
        arquivos: arquivos.map((arquivo) => ({ caminho: arquivo.caminho, conteudo: arquivo.conteudo, repositorio: arquivo.repositorioNome })),
        cards: [],
        novoId: () => novoId('af'),
      })
      const achado = aplicado.achados[0]
      return {
        texto: item.texto ?? '',
        caminho: achado?.evidencia.tipo === 'arquivo' ? achado.evidencia.caminho : (item.caminho ?? ''),
        trecho: item.trecho ?? '',
        semProva: achado?.semProva ?? true,
        repositorio: achado?.evidencia.tipo === 'arquivo' ? achado.evidencia.repositorio : undefined,
      }
    })
    const texto = (json.resposta ?? '').trim() || 'Não encontrei.'
    return { pergunta, resposta: texto, afirmacoes: classificadas }
  }

  async listarStories(): Promise<ResumoStory[]> {
    const nomes = await this.deps.disco.listar('stories')
    const resumos: ResumoStory[] = []
    for (const nome of nomes) {
      if (!nome.endsWith('.json')) continue
      const story = await this.deps.disco.lerJson<StoryRun>(`stories/${nome}`)
      if (story) resumos.push(resumir(story))
    }
    return resumos.sort((a, b) => b.atualizadaEm.localeCompare(a.atualizadaEm))
  }

  async obterStory(id: string): Promise<StoryRun> {
    const story = await this.deps.disco.lerJson<StoryRun>(`stories/${id}.json`)
    if (!story) throw new Error('Não encontrei essa story.')
    return story
  }

  async iniciarEsteira(ideia: string, produtoId: string): Promise<StoryRun> {
    if (!ideia.trim()) throw new Error('Escreva a ideia central.')
    const produto = await this.produto(produtoId)
    const produtos = await this.produtos()
    const repos = await this.repositorios()
    const mencoes = extrairMencoes(ideia)
    const escopo = resolverEscopo(mencoes, produto, produtos, repos)
    const fluxo = await this.fluxo()
    const agora = this.deps.agora().toISOString()
    const story: StoryRun = {
      id: novoId('story'),
      ideia: ideia.trim(),
      produtoId: produto.id,
      produtoNome: produto.nome,
      mencoes,
      avisos: escopo.avisos,
      story: STORY_VAZIA,
      achados: [],
      blocos: fluxo,
      passos: fluxo.map((bloco) => passoDe(bloco)),
      estado: 'rodando',
      medicao: { passou: 0, voltou: 0 },
      criadaEm: agora,
      atualizadaEm: agora,
    }
    await this.gravarStory(story)
    return this.avancar(story, false)
  }

  async continuar(id: string): Promise<StoryRun> {
    const story = await this.obterStory(id)
    const passo = story.passos.find((item) => item.estado === 'pausado' || item.estado === 'erro')
    if (!passo) throw new Error('Nada para continuar.')
    const bloco = story.blocos.find((item) => item.id === passo.blocoId)
    if (!bloco) throw new Error('O bloco não está mais nesta story.')
    await this.rodarBloco(story, bloco)
    if (story.estado === 'erro') return story
    return this.avancar(story, false)
  }

  async editarStory(id: string, texto: StoryTexto): Promise<StoryRun> {
    const story = await this.obterStory(id)
    if (story.diffPendente) throw new Error('Aprove ou cancele o ajuste antes de editar.')
    story.story = {
      titulo: texto.titulo,
      corpo: texto.corpo,
      descricao: texto.descricao,
      criteriosDeAceite: texto.criteriosDeAceite,
    }
    story.atualizadaEm = this.deps.agora().toISOString()
    await this.gravarStory(story)
    return story
  }

  async reconfrontar(id: string): Promise<StoryRun> {
    const story = await this.obterStory(id)
    if (story.diffPendente) throw new Error('Aprove ou cancele o ajuste antes de reconfrontar.')
    for (const passo of story.passos) {
      if (passo.papel === 'escrever') continue
      passo.estado = 'aguardando'
      passo.erro = undefined
    }
    story.erro = undefined
    return this.avancar(story, true)
  }

  async aceitarAchado(id: string, achadoId: string): Promise<StoryRun> {
    const story = await this.obterStory(id)
    if (story.diffPendente) throw new Error('Já existe um ajuste esperando aprovação.')
    const achado = story.achados.find((item) => item.id === achadoId)
    if (!achado || achado.estado !== 'pendente') throw new Error('Esse achado não está pendente.')
    const ajustes = await this.ajustes()
    const resposta = await (await this.clienteClaude()).run({
      papel: 'aplicar',
      blocoId: 'aplicar-achado',
      instrucao: 'Aplique o achado na story. Mantenha o modelo. Não invente prova.',
      ideia: story.ideia,
      modelo: ajustes.modeloStory,
      story: story.story,
      achado,
      wiki: [],
      arquivos: [],
      cards: [],
      diretorios: [],
      timeoutMs: ajustes.timeoutBlocoMs,
    })
    const saida = interpretarSaida(resposta.json)
    const depois: StoryTexto = {
      titulo: saida.story?.titulo?.trim() || story.story.titulo,
      corpo: saida.story?.corpo?.trim() || story.story.corpo,
      descricao: saida.story?.descricao?.trim() || story.story.descricao,
      criteriosDeAceite: saida.story?.criteriosDeAceite?.trim() || story.story.criteriosDeAceite,
    }
    if (storiesIguais(story.story, depois)) throw new Error('O ajuste não mudou a story.')
    story.diffPendente = { achadoId, antes: story.story, depois, linhas: diffStory(story.story, depois) }
    story.atualizadaEm = this.deps.agora().toISOString()
    await this.gravarStory(story)
    return story
  }

  async aprovarDiff(id: string, editada?: StoryTexto): Promise<StoryRun> {
    const story = await this.obterStory(id)
    if (!story.diffPendente) throw new Error('Não há ajuste para aprovar.')
    const achado = story.achados.find((item) => item.id === story.diffPendente?.achadoId)
    story.story = editada ?? story.diffPendente.depois
    if (achado) achado.estado = 'aceito'
    story.diffPendente = undefined
    story.atualizadaEm = this.deps.agora().toISOString()
    await this.gravarStory(story)
    return story
  }

  async cancelarDiff(id: string): Promise<StoryRun> {
    const story = await this.obterStory(id)
    story.diffPendente = undefined
    story.atualizadaEm = this.deps.agora().toISOString()
    await this.gravarStory(story)
    return story
  }

  async descartarAchado(id: string, achadoId: string): Promise<StoryRun> {
    const story = await this.obterStory(id)
    const achado = story.achados.find((item) => item.id === achadoId)
    if (!achado || achado.estado !== 'pendente') throw new Error('Esse achado não está pendente.')
    achado.estado = 'descartado'
    if (story.diffPendente?.achadoId === achadoId) story.diffPendente = undefined
    story.atualizadaEm = this.deps.agora().toISOString()
    await this.gravarStory(story)
    return story
  }

  async publicar(
    id: string,
    pedido: { acao: 'criar'; projeto: string; area?: string; iteracao?: string } | { acao: 'comentar'; workItemId: number },
  ): Promise<StoryRun> {
    const story = await this.obterStory(id)
    if (story.diffPendente) throw new Error('Aprove ou cancele o ajuste antes de publicar.')
    if (!story.story.titulo.trim() && !story.story.corpo.trim()) throw new Error('A story ainda está vazia.')
    const ajustes = await this.ajustes()
    const quando = this.deps.agora().toISOString()
    if (pedido.acao === 'comentar') {
      const item = await (await this.clienteAzure()).obterWorkItem('', pedido.workItemId)
      const antes = item.descricao
      const texto = montarComentario({
        story: story.story,
        achadosAceitos: story.achados.filter((achado) => achado.estado === 'aceito'),
        responsavel: item.atribuidoA,
      })
      const azure = await this.clienteAzure()
      await azure.comentar(item.projeto, item.id, texto)
      const depois = await azure.obterWorkItem(item.projeto, item.id)
      if (depois.descricao !== antes) throw new Error('A descrição do card mudou. A publicação foi interrompida.')
      story.publicacao = { acao: 'comentar', workItemId: item.id, projeto: item.projeto, em: quando }
    } else {
      if (!pedido.projeto.trim()) throw new Error('Informe o projeto do board.')
      const criado = await (await this.clienteAzure()).criarWorkItem({
        projeto: pedido.projeto,
        tipo: ajustes.tipoWorkItem,
        titulo: story.story.titulo || story.ideia,
        descricao: story.story.corpo || story.story.descricao,
        criterios: story.story.criteriosDeAceite,
        campoDescricao: ajustes.campoDescricao,
        campoCriterios: ajustes.campoCriterios,
        area: pedido.area || ajustes.areaPadrao || undefined,
        iteracao: pedido.iteracao || ajustes.iteracaoPadrao || undefined,
      })
      story.publicacao = { acao: 'criar', workItemId: criado.id, projeto: criado.projeto, em: quando }
    }
    story.atualizadaEm = quando
    await this.gravarStory(story)
    return story
  }

  async registrarVolta(id: string, voto: 'passou' | 'voltou'): Promise<StoryRun> {
    const story = await this.obterStory(id)
    if (!story.publicacao) throw new Error('Publique a story antes de registrar a volta.')
    story.medicao[voto] += 1
    story.medicao.atualizadoEm = this.deps.agora().toISOString()
    story.atualizadaEm = story.medicao.atualizadoEm
    await this.gravarStory(story)
    return story
  }

  private async avancar(story: StoryRun, pularEscrever: boolean): Promise<StoryRun> {
    for (const bloco of story.blocos) {
      const passo = story.passos.find((item) => item.blocoId === bloco.id)
      if (!passo || passo.estado === 'concluido') continue
      if (pularEscrever && bloco.papel === 'escrever') continue
      if (bloco.modo === 'por-clique' && passo.estado === 'aguardando') {
        passo.estado = 'pausado'
        story.estado = 'pausada'
        story.pausadaNoBlocoId = bloco.id
        story.atualizadaEm = this.deps.agora().toISOString()
        await this.gravarStory(story)
        return story
      }
      await this.rodarBloco(story, bloco)
      if (story.estado === 'erro') return story
    }
    story.estado = 'pronta'
    story.pausadaNoBlocoId = undefined
    story.erro = undefined
    story.atualizadaEm = this.deps.agora().toISOString()
    await this.gravarStory(story)
    return story
  }

  private async rodarBloco(story: StoryRun, bloco: BlocoFluxo): Promise<void> {
    const passo = story.passos.find((item) => item.blocoId === bloco.id)
    if (!passo) return
    passo.estado = 'rodando'
    passo.erro = undefined
    story.estado = 'rodando'
    story.pausadaNoBlocoId = undefined
    await this.gravarStory(story)
    try {
      const preparado = await this.preparar(story, bloco)
      const ajustes = await this.ajustes()
      const instrucao = await this.instrucaoDo(bloco)
      const resposta = await (await this.clienteClaude()).run({
        papel: bloco.papel === 'escrever' ? 'escrever' : 'confrontar',
        blocoId: bloco.id,
        instrucao,
        ideia: story.ideia,
        modelo: ajustes.modeloStory,
        story: story.story,
        wiki: preparado.wiki,
        arquivos: preparado.enviados,
        cards: preparado.cards,
        diretorios: preparado.diretorios,
        timeoutMs: ajustes.timeoutBlocoMs,
      })
      const saida = interpretarSaida(resposta.json)
      const aplicado = aplicarContrato({
        papel: bloco.papel,
        blocoId: bloco.id,
        blocoNome: bloco.nome,
        story: story.story,
        achados: story.achados,
        saidaStory: saida.story,
        saidaAchados: saida.achados,
        arquivos: preparado.prova,
        cards: preparado.cards.map((card) => ({ id: card.id, titulo: card.titulo, projeto: card.projeto })),
        novoId: () => novoId('achado'),
      })
      story.story = aplicado.story
      story.achados = aplicado.achados
      passo.estado = 'concluido'
    } catch (erro) {
      passo.estado = 'erro'
      passo.erro = erro instanceof Error ? erro.message : 'O bloco falhou.'
      story.estado = 'erro'
      story.erro = passo.erro
    }
    story.atualizadaEm = this.deps.agora().toISOString()
    await this.gravarStory(story)
  }

  private async preparar(story: StoryRun, bloco: BlocoFluxo) {
    const produto = await this.produto(story.produtoId)
    const produtos = await this.produtos()
    const repos = await this.repositorios()
    const escopo = resolverEscopo(story.mencoes, produto, produtos, repos)
    const ids = escopo.repositorioIds
    const arquivos = await this.arquivosDos(ids)
    const prova = arquivos.map((arquivo) => ({
      caminho: arquivo.caminho,
      conteudo: arquivo.conteudo,
      repositorio: arquivo.repositorioNome,
    }))
    const nomes = [produto, ...(await this.produtosLigados(produto))].map((item) => item.nome)
    const wiki = bloco.id === 'confrontar-wiki' || bloco.fonte.tipo === 'instrucao' ? await this.afirmacoesDe(produto) : bloco.papel === 'confrontar' && bloco.id !== 'confrontar-codigo' && bloco.id !== 'confrontar-backlog' ? await this.afirmacoesDe(produto) : []
    const enviados =
      bloco.id === 'confrontar-codigo'
        ? escolherArquivos(prova, story.ideia, nomes, 8)
        : []
    let cards = [] as Awaited<ReturnType<typeof this.cardsDe>>
    if (bloco.id === 'confrontar-backlog' || (bloco.papel === 'confrontar' && bloco.id !== 'confrontar-wiki' && bloco.id !== 'confrontar-codigo' && bloco.fonte.tipo === 'instrucao')) {
      cards = await this.cardsDe(produto, `${story.ideia}\n${story.story.corpo}`)
    }
    const diretorios = repos.filter((repo) => ids.includes(repo.id) && repo.caminhoLocal).map((repo) => repo.caminhoLocal!) 
    return { prova, enviados, wiki: bloco.id === 'escrever-story' ? [] : wiki, cards: bloco.id === 'escrever-story' ? [] : cards, diretorios }
  }

  private async cardsDe(produto: Produto, consulta: string) {
    const grupo = [produto, ...(await this.produtosLigados(produto))]
    const projetos = [...new Set(grupo.flatMap((item) => item.projetosBacklog))]
    const areas = [...new Set(grupo.flatMap((item) => item.areasBacklog))]
    const nomes = grupo.map((item) => item.nome)
    const itens = await (await this.clienteAzure()).listarWorkItems({
      projetos,
      areas,
      fechadosDesde: dataMesesAtras(this.deps.agora(), 12).toISOString(),
    })
    return prefiltrarBacklog(itens, consulta, {
      agora: this.deps.agora(),
      projetos,
      areas,
      mesesFechados: 12,
      nomesProduto: nomes,
      limite: 12,
    })
  }

  private async afirmacoesDe(produto: Produto): Promise<AfirmacaoWiki[]> {
    const grupo = [produto, ...(await this.produtosLigados(produto))]
    const afirmacoes: AfirmacaoWiki[] = []
    for (const item of grupo) {
      const wiki = await this.lerWiki(item.id)
      for (const modulo of wiki.modulos) {
        if (modulo.estado === 'pronto') afirmacoes.push(...modulo.afirmacoes)
      }
    }
    return afirmacoes
  }

  private async produtosLigados(produto: Produto): Promise<Produto[]> {
    const todos = await this.produtos()
    return produto.dependeDe.flatMap((id) => {
      const achado = todos.find((item) => item.id === id)
      return achado ? [achado] : []
    })
  }

  private async idsDeRepos(produto: Produto): Promise<string[]> {
    const ligados = await this.produtosLigados(produto)
    return [...new Set([produto, ...ligados].flatMap((item) => item.repositorioIds))]
  }

  private async arquivosDos(ids: string[]): Promise<ArquivoLido[]> {
    const repos = await this.repositorios()
    const lidos: ArquivoLido[] = []
    for (const repo of repos) {
      if (!ids.includes(repo.id) || !repo.caminhoLocal || repo.estado !== 'pronto') continue
      const lista = await this.deps.git.listarArquivos(repo.caminhoLocal)
      for (const caminho of lista) {
        let conteudo = ''
        try {
          conteudo = await this.deps.git.lerArquivo(repo.caminhoLocal, caminho)
        } catch {
          continue
        }
        if (conteudo.includes('\0')) continue
        if (conteudo.length > 80_000) conteudo = conteudo.slice(0, 80_000)
        lidos.push({
          repositorioId: repo.id,
          repositorioNome: repo.nome,
          caminho,
          conteudo,
          hash: hashTexto(conteudo),
        })
      }
    }
    return lidos
  }

  private async processarFila(): Promise<void> {
    while (this.fila.length > 0) {
      const job = this.fila.shift()
      if (!job) return
      try {
        await this.gerarModulo(job.produtoId, job.moduloId)
      } catch (erro) {
        await this.marcarModulo(job.produtoId, job.moduloId, {
          estado: 'erro',
          erro: erro instanceof Error ? erro.message : 'Falha ao gerar o módulo.',
        })
      }
    }
  }

  private async gerarModulo(produtoId: string, moduloId: string): Promise<void> {
    const wiki = await this.lerWiki(produtoId)
    const modulo = wiki.modulos.find((item) => item.id === moduloId)
    if (!modulo) return
    await this.marcarModulo(produtoId, moduloId, { estado: 'gerando' })
    const arquivos = (await this.arquivosDos([modulo.repositorioId])).filter((arquivo) => modulo.arquivos.includes(arquivo.caminho))
    const ajustes = await this.ajustes()
    const resposta = await (await this.clienteClaude()).run({
      papel: 'wiki',
      blocoId: moduloId,
      instrucao: 'Descreva o módulo com afirmações que copiem um trecho literal de cada arquivo.',
      ideia: modulo.nome,
      modelo: ajustes.modeloStory,
      story: STORY_VAZIA,
      wiki: [],
      arquivos: arquivos.map((arquivo) => ({ repositorio: arquivo.repositorioNome, caminho: arquivo.caminho, conteudo: arquivo.conteudo })),
      cards: [],
      diretorios: [],
      timeoutMs: ajustes.timeoutBlocoMs,
    })
    const json = resposta.json as { titulo?: string; resumo?: string; afirmacoes?: { texto?: string; caminho?: string; trecho?: string }[] }
    const prova = arquivos.map((arquivo) => ({ caminho: arquivo.caminho, conteudo: arquivo.conteudo, repositorio: arquivo.repositorioNome }))
    const afirmacoes: AfirmacaoWiki[] = []
    for (const item of json.afirmacoes ?? []) {
      const aplicado = aplicarContrato({
        papel: 'confrontar',
        blocoId: moduloId,
        blocoNome: modulo.nome,
        story: STORY_VAZIA,
        achados: [],
        saidaAchados: [{ texto: item.texto, tipo: 'existe', evidencia: { tipo: 'arquivo', caminho: item.caminho, trecho: item.trecho, repositorio: modulo.repositorioNome } }],
        arquivos: prova,
        cards: [],
        novoId: () => novoId('af'),
      })
      const achado = aplicado.achados[0]
      if (!achado) continue
      afirmacoes.push({
        texto: achado.texto,
        caminho: achado.evidencia.tipo === 'arquivo' ? achado.evidencia.caminho : (item.caminho ?? ''),
        trecho: achado.evidencia.tipo === 'arquivo' ? achado.evidencia.trecho : (item.trecho ?? ''),
        semProva: achado.semProva,
        repositorio: modulo.repositorioNome,
      })
    }
    const conteudo = [`# ${json.titulo || modulo.nome}`, '', json.resumo || '', '', ...afirmacoes.map((item) => `- ${item.texto}${item.semProva ? ' (sem prova)' : ''}\n  \`${item.caminho}\``)].join('\n')
    const gravado: ModuloWiki = {
      ...modulo,
      estado: 'pronto',
      conteudo,
      afirmacoes,
      erro: undefined,
      atualizadoEm: this.deps.agora().toISOString(),
    }
    await this.deps.disco.gravarJson(`wiki/${produtoId}/modulos/${moduloArquivo(moduloId)}.json`, gravado)
    const atual = await this.lerWiki(produtoId)
    await this.gravarWiki(
      produtoId,
      atual.modulos.map((item) => (item.id === moduloId ? { ...gravado, conteudo: '', afirmacoes: gravado.afirmacoes } : item)),
    )
    await this.deps.disco.gravarJson(`wiki/${produtoId}/modulos/${moduloArquivo(moduloId)}.json`, gravado)
  }

  private async marcarModulo(produtoId: string, moduloId: string, parcial: Partial<ModuloWiki>): Promise<void> {
    const wiki = await this.lerWiki(produtoId)
    await this.gravarWiki(
      produtoId,
      wiki.modulos.map((modulo) => (modulo.id === moduloId ? { ...modulo, ...parcial } : modulo)),
    )
  }

  private async lerWiki(produtoId: string): Promise<WikiProduto> {
    const indice = await this.deps.disco.lerJson<{ modulos: ModuloWiki[] }>(`wiki/${produtoId}/index.json`)
    const modulos: ModuloWiki[] = []
    for (const modulo of indice?.modulos ?? []) {
      const cheio = await this.deps.disco.lerJson<ModuloWiki>(`wiki/${produtoId}/modulos/${moduloArquivo(modulo.id)}.json`)
      modulos.push(cheio ? { ...modulo, ...cheio, estado: cheio.estado || modulo.estado } : modulo)
    }
    return { produtoId, modulos }
  }

  private async gravarWiki(produtoId: string, modulos: ModuloWiki[]): Promise<void> {
    const leve = modulos.map((modulo) => ({ ...modulo, conteudo: '' }))
    await this.deps.disco.gravarJson(`wiki/${produtoId}/index.json`, { produtoId, modulos: leve })
  }

  private async instrucaoDo(bloco: BlocoFluxo): Promise<string> {
    if (bloco.fonte.tipo === 'instrucao') return bloco.fonte.texto
    const texto = await this.lerSkill(bloco.fonte.skillId)
    if (!texto) throw new Error(`Não encontrei a skill ${bloco.fonte.skillId}.`)
    return texto
  }

  private async lerSkill(id: string): Promise<string | null> {
    if (id.includes('..') || id.includes('/') || id.includes('\\')) return null
    for (const raiz of [this.deps.skillsDir, this.deps.skillsUsuario].filter(Boolean) as string[]) {
      try {
        return await fs.readFile(path.join(raiz, id, 'SKILL.md'), 'utf8')
      } catch {
        /* próxima pasta */
      }
    }
    return null
  }

  private async skillsDa(raiz: string, origem: SkillDisponivel['origem']): Promise<SkillDisponivel[]> {
    let nomes: string[] = []
    try {
      nomes = await fs.readdir(raiz)
    } catch {
      return []
    }
    const skills: SkillDisponivel[] = []
    for (const nome of nomes) {
      if (nome.startsWith('.') || nome.includes('..')) continue
      const texto = await this.lerSkill(nome).catch(() => null)
      if (!texto && origem === 'usuario') {
        try {
          await fs.access(path.join(raiz, nome, 'SKILL.md'))
        } catch {
          continue
        }
      }
      try {
        await fs.access(path.join(raiz, nome, 'SKILL.md'))
      } catch {
        continue
      }
      const corpo = texto ?? (await fs.readFile(path.join(raiz, nome, 'SKILL.md'), 'utf8'))
      const titulo = corpo.match(/^name:\s*(.+)$/m)?.[1]?.trim() || nome
      skills.push({
        id: nome,
        nome: titulo,
        origem,
        papelSugerido: /confront/i.test(nome) ? 'confrontar' : 'escrever',
      })
    }
    return skills
  }

  private async produto(id: string): Promise<Produto> {
    const achado = (await this.produtos()).find((item) => item.id === id)
    if (!achado) throw new Error('Não encontrei o produto.')
    return achado
  }

  private async config(): Promise<ConfigDisco> {
    const gravada = await this.deps.disco.lerJson<ConfigDisco>('config.json')
    if (gravada) return gravada
    const inicial: ConfigDisco = {
      orgUrl: '',
      conectado: false,
      tipoWorkItem: AJUSTES_INICIAIS.tipoWorkItem,
      campoDescricao: AJUSTES_INICIAIS.campoDescricao,
      campoCriterios: AJUSTES_INICIAIS.campoCriterios,
      areaPadrao: '',
      iteracaoPadrao: '',
      claudeBin: 'claude',
      timeoutBlocoMs: AJUSTES_INICIAIS.timeoutBlocoMs,
      modeloStory: AJUSTES_INICIAIS.modeloStory,
      fluxo: fluxoPadrao(),
    }
    await this.deps.disco.gravarJson('config.json', inicial)
    return inicial
  }

  private async gravarStory(story: StoryRun): Promise<void> {
    await this.deps.disco.gravarJson(`stories/${story.id}.json`, story)
  }

  private async clienteAzure(): Promise<AzurePort> {
    if (this.deps.modo === 'falso') return this.deps.azure
    const config = await this.config()
    const pat = await this.lerPat()
    return criarAzureReal(config.orgUrl, pat)
  }

  private async clienteClaude(): Promise<ClaudePort> {
    if (this.deps.modo === 'falso') return this.deps.claude
    const ajustes = await this.ajustes()
    return criarClaudeCli(criarProcesso(), ajustes.claudeBin, path.join(this.deps.dataDir, 'trabalho'))
  }

  private async exigirConexao(): Promise<void> {
    const config = await this.config()
    if (!config.conectado) throw new Error('Conecte o Azure DevOps antes.')
  }

  private async lerPat(): Promise<string> {
    const config = await this.config()
    const pat = await this.deps.segredos.ler(contaDoPat(config.orgUrl))
    if (!pat) throw new Error('O PAT não está no cofre. Conecte de novo.')
    return pat
  }
}

function passoDe(bloco: BlocoFluxo): PassoExecucao {
  return { blocoId: bloco.id, nome: bloco.nome, papel: bloco.papel, modo: bloco.modo, estado: 'aguardando' }
}

export function resumir(story: StoryRun): ResumoStory {
  const porBlocoMap = new Map<string, { blocoNome: string; aceitos: number; descartados: number }>()
  for (const achado of story.achados) {
    const linha = porBlocoMap.get(achado.blocoId) ?? { blocoNome: achado.blocoNome, aceitos: 0, descartados: 0 }
    if (achado.estado === 'aceito') linha.aceitos += 1
    if (achado.estado === 'descartado') linha.descartados += 1
    porBlocoMap.set(achado.blocoId, linha)
  }
  return {
    id: story.id,
    titulo: story.story.titulo || story.ideia,
    produtoNome: story.produtoNome,
    estado: story.estado,
    aceitos: story.achados.filter((achado) => achado.estado === 'aceito').length,
    descartados: story.achados.filter((achado) => achado.estado === 'descartado').length,
    pendentes: story.achados.filter((achado) => achado.estado === 'pendente').length,
    porBloco: [...porBlocoMap.values()],
    medicao: story.medicao,
    publicacao: story.publicacao,
    atualizadaEm: story.atualizadaEm,
  }
}

