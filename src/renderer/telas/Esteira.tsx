import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { Achado, EstadoApp, LinhaDiff, Publicacao, StoryRun, StoryTexto } from '../../shared/tipos'
import { STORY_VAZIA } from '../../shared/tipos'
import { acaoInicialDoBoard, frasePublicacao, idDoCardAberto, urlDoCard } from '../../core/publicacao'
import { chamar } from '../api'
import { AcaoPrimaria } from '../components/react-bits/AcaoPrimaria'
import { AnimatedList } from '../components/react-bits/AnimatedList'
import { BlurText } from '../components/react-bits/BlurText'
import { DecryptedText } from '../components/react-bits/DecryptedText'
import { ShinyText } from '../components/react-bits/ShinyText'
import { SpotlightCard } from '../components/react-bits/SpotlightCard'
import { Erro, TIPO_ACHADO, Vazio, mensagemDe, rotuloStory } from '../ui'

const ORDEM = { pendente: 0, aceito: 1, descartado: 2 }

export function EsteiraView({ estado, recarregar, abrirId }: { estado: EstadoApp; recarregar: () => Promise<void>; abrirId?: string }) {
  const [storyId, setStoryId] = useState(estado.stories[0]?.id ?? '')
  const [nova, setNova] = useState(estado.stories.length === 0)
  const [story, setStory] = useState<StoryRun | null>(null)
  const [rascunho, setRascunho] = useState<StoryTexto>(STORY_VAZIA)
  const [ideia, setIdeia] = useState('')
  const [produtoId, setProdutoId] = useState(estado.produtos[0]?.id ?? '')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState('')
  const [acaoPublicar, setAcaoPublicar] = useState<'criar' | 'comentar'>('criar')
  const [projeto, setProjeto] = useState('')
  const [area, setArea] = useState(estado.ajustes.areaPadrao)
  const [iteracao, setIteracao] = useState(estado.ajustes.iteracaoPadrao)
  const [cardId, setCardId] = useState('')
  const seguir = useRef(true)

  useEffect(() => {
    if (!abrirId) return
    setNova(false)
    setStoryId(abrirId)
  }, [abrirId])

  useEffect(() => {
    if (nova || !storyId) {
      setStory(null)
      return
    }
    let vivo = true
    setErro('')
    chamar<StoryRun>('obterStory', { id: storyId })
      .then((lida) => {
        if (!vivo) return
        setStory(lida)
        setRascunho(lida.story)
        const produto = estado.produtos.find((item) => item.id === lida.produtoId)
        setProjeto((atual) => atual || produto?.projetosBacklog[0] || '')
      })
      .catch((falha: unknown) => {
        if (vivo) setErro(mensagemDe(falha))
      })
    return () => {
      vivo = false
    }
    // O produto da story aberta basta para preencher o projeto uma vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, nova])

  // Cada bloco grava a story. Ler de novo no mesmo canal atualiza o trilho e os achados.
  useEffect(() => {
    if (nova || !story || story.estado !== 'rodando') return
    seguir.current = true
    const id = story.id
    let vivo = true
    async function ler() {
      if (!vivo || !seguir.current) return
      try {
        const lida = await chamar<StoryRun>('obterStory', { id })
        if (!vivo || !seguir.current) return
        setStory(lida)
        setRascunho(lida.story)
      } catch {
        /* a próxima leitura tenta de novo */
      }
    }
    void ler()
    const timer = setInterval(() => void ler(), 400)
    return () => {
      vivo = false
      clearInterval(timer)
    }
  }, [nova, story?.id, story?.estado])

  const pendentes = story?.achados.filter((achado) => achado.estado === 'pendente').length ?? 0
  const cardAceito = story ? idDoCardAberto(story.achados, { somenteAceito: true }) : null
  const cardSugerido = story ? idDoCardAberto(story.achados) : null

  useEffect(() => {
    const inicial = acaoInicialDoBoard(story?.achados ?? [])
    setAcaoPublicar(inicial.acao)
    setCardId(inicial.cardId)
  }, [story?.id, cardAceito])
  const achados = useMemo(() => {
    if (!story) return []
    return [...story.achados].sort((a, b) => ORDEM[a.estado] - ORDEM[b.estado])
  }, [story])
  const sujo = story ? JSON.stringify(story.story) !== JSON.stringify(rascunho) : false

  async function agir(rotulo: string, trabalho: () => Promise<void>) {
    setOcupado(rotulo)
    setErro('')
    try {
      await trabalho()
      await recarregar()
    } catch (falha) {
      setErro(mensagemDe(falha))
    } finally {
      setOcupado('')
    }
  }

  async function gravarRascunho(id: string): Promise<StoryRun> {
    if (!sujo) return story as StoryRun
    const gravada = await chamar<StoryRun>('editarStory', { id, story: rascunho })
    setStory(gravada)
    setRascunho(gravada.story)
    return gravada
  }

  function aplicar(proxima: StoryRun) {
    setStory(proxima)
    setRascunho(proxima.story)
    setStoryId(proxima.id)
    setNova(false)
  }

  async function parar() {
    if (!story) return
    seguir.current = false
    setOcupado('Parando')
    setErro('')
    try {
      aplicar(await chamar<StoryRun>('pararEsteira', { id: story.id }))
      await recarregar()
    } catch (falha) {
      seguir.current = true
      setErro(mensagemDe(falha))
    } finally {
      setOcupado('')
    }
  }

  if (estado.produtos.length === 0) {
    return (
      <>
        <h1><BlurText text="Esteira" /></h1>
        <p className="sub">A story precisa de um produto para saber qual código ler.</p>
        <Vazio>Nenhum produto ainda. Em Produtos, escolha os repositórios e dê um nome ao conjunto.</Vazio>
      </>
    )
  }

  return (
    <>
      <div className="titulo">
        <h1>{nova ? <BlurText text="Nova story" /> : <DecryptedText text={story?.story.titulo || 'Story sem título'} />}</h1>
        <div className="acoes">
          {story?.estado === 'rodando' && (
            <button className="btn" type="button" disabled={ocupado === 'Parando'} onClick={() => void parar()}>
              {ocupado === 'Parando' ? 'Parando' : 'Parar'}
            </button>
          )}
          {!nova && (
            <button
              className="btn-sec"
              type="button"
              onClick={() => {
                if (story?.produtoId) setProdutoId(story.produtoId)
                setNova(true)
              }}
              disabled={Boolean(ocupado) || story?.estado === 'rodando'}
            >
              Nova story
            </button>
          )}
          {nova && estado.stories.length > 0 && (
            <button className="btn-sec" type="button" onClick={() => setNova(false)}>
              Voltar à story
            </button>
          )}
          {(story?.estado === 'pausada' || story?.estado === 'interrompida') && (
            <AcaoPrimaria type="button" disabled={Boolean(ocupado)} onClick={() => void agir('Continuando', async () => aplicar(await chamar<StoryRun>('continuar', { id: story.id })))}>
              {ocupado === 'Continuando' ? <ShinyText text="Continuando" /> : 'Continuar'}
            </AcaoPrimaria>
          )}
          {story?.estado === 'interrompida' && (
            <button
              className="btn-sec"
              type="button"
              disabled={Boolean(ocupado)}
              onClick={() => void agir('Recomeçando', async () => aplicar(await chamar<StoryRun>('recomecar', { id: story.id })))}
            >
              {ocupado === 'Recomeçando' ? 'Recomeçando' : 'Recomeçar'}
            </button>
          )}
          {!nova && story?.estado === 'pronta' && !story.diffPendente && !story.publicacao && (
            // A seção do board fica abaixo da story; este botão leva até ela quando publicar vira a ação principal.
            <button
              className={pendentes === 0 ? 'btn' : 'btn-sec'}
              type="button"
              disabled={Boolean(ocupado)}
              onClick={() => {
                const secao = document.getElementById('board')
                secao?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                secao?.querySelector<HTMLElement>('input, button')?.focus({ preventScroll: true })
              }}
            >
              Publicar no board
            </button>
          )}
        </div>
      </div>
      <p className="sub">{nova ? 'A ideia entra aqui. A esteira escreve no modelo e confronta com a wiki, o código e o backlog.' : sublinha(story, pendentes)}</p>
      <Erro texto={erro} />

      {!nova && estado.stories.length > 1 && (
        <label className="campo estreito">
          <span>Story aberta</span>
          <select value={storyId} onChange={(evento) => setStoryId(evento.target.value)}>
            {estado.stories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.titulo || 'Story sem título'} · {item.produtoNome}
              </option>
            ))}
          </select>
        </label>
      )}

      {nova ? (
        <form
          className="medida"
          onSubmit={(evento) => {
            evento.preventDefault()
            void agir('Rodando', async () => {
              const criada = await chamar<StoryRun>('iniciarEsteira', { ideia, produtoId })
              setIdeia('')
              aplicar(criada)
            })
          }}
        >
          <label className="campo">
            <span>Ideia central</span>
            <textarea className="alto" value={ideia} onChange={(evento) => setIdeia(evento.target.value)} required placeholder="O que o cliente precisa conseguir fazer" />
          </label>
          <p className="sub">Use @pagamentos-api ou @Contas para estreitar. Sem @, entra o produto inteiro e o que ele declara depender.</p>
          <label className="campo estreito">
            <span>Produto</span>
            <select value={produtoId} onChange={(evento) => setProdutoId(evento.target.value)}>
              {estado.produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </select>
          </label>
          <AcaoPrimaria type="submit" disabled={Boolean(ocupado) || !ideia.trim()}>
            {ocupado === 'Rodando' ? <ShinyText text="Rodando a esteira" /> : 'Rodar a esteira'}
          </AcaoPrimaria>
        </form>
      ) : (
        story && (
          <>
            {story.provasOrigem && story.provasOrigem.length > 0 && (
              <section className="ajuste">
                <h2>Veio do Radar</h2>
                <p className="sub">A ideia entrou com o trecho original. A esteira escreve e confronta em cima disso.</p>
                {story.provasOrigem.map((prova, indice) => (
                  <blockquote className="prova" key={`${prova.em}-${indice}`}>
                    <span className="caminho">
                      {prova.local} · {prova.autor} · {prova.em}
                    </span>
                    {prova.citacao}
                  </blockquote>
                ))}
              </section>
            )}
            <ol className="trilho" aria-live="polite" aria-busy={story.estado === 'rodando'}>
              {story.passos.map((passo) => (
                <li key={passo.blocoId} className={passo.estado} aria-current={passo.estado === 'rodando' || passo.estado === 'pausado' || passo.estado === 'interrompido' ? 'step' : undefined}>
                  <strong>{passo.nome}</strong>
                  <small>
                    {passo.modo === 'por-clique' ? 'por clique' : 'automático'}
                    {' · '}
                    {rotuloPasso(passo.estado)}
                    {passo.erro ? ` · ${passo.erro}` : ''}
                  </small>
                </li>
              ))}
            </ol>
            {story.avisos.length > 0 && <p className="sub">{story.avisos.join(' ')}</p>}
            {story.diffPendente && (
              <section className="ajuste">
                <h2>Ajuste para aprovar</h2>
                <p className="sub">A story só muda depois deste clique. Cancelar deixa o texto como está.</p>
                <Diff linhas={story.diffPendente.linhas} />
                <div className="acoes">
                  <AcaoPrimaria
                    type="button"
                    disabled={Boolean(ocupado)}
                    onClick={() => void agir('Aplicando', async () => aplicar(await chamar<StoryRun>('aprovarDiff', { id: story.id })))}
                  >
                    {ocupado === 'Aplicando' ? <ShinyText text="Aplicando" /> : 'Aplicar ajuste'}
                  </AcaoPrimaria>
                  <button
                    className="btn-sec"
                    type="button"
                    disabled={Boolean(ocupado)}
                    onClick={() => void agir('Cancelando', async () => aplicar(await chamar<StoryRun>('cancelarDiff', { id: story.id })))}
                  >
                    Não aplicar
                  </button>
                </div>
              </section>
            )}
            <div className="grade">
              <form
                onSubmit={(evento) => {
                  evento.preventDefault()
                  void agir('Salvando', async () => aplicar(await gravarRascunho(story.id)))
                }}
              >
                <label className="campo">
                  <span>Título</span>
                  <input value={rascunho.titulo} onChange={(evento) => setRascunho({ ...rascunho, titulo: evento.target.value })} disabled={Boolean(story.diffPendente) || story.estado === 'rodando'} />
                </label>
                <label className="campo">
                  <span>Story</span>
                  <textarea className="alto" value={rascunho.corpo} onChange={(evento) => setRascunho({ ...rascunho, corpo: evento.target.value })} disabled={Boolean(story.diffPendente) || story.estado === 'rodando'} />
                </label>
                <label className="campo">
                  <span>Descrição</span>
                  <textarea value={rascunho.descricao} onChange={(evento) => setRascunho({ ...rascunho, descricao: evento.target.value })} disabled={Boolean(story.diffPendente) || story.estado === 'rodando'} />
                </label>
                <label className="campo">
                  <span>Critérios de aceite</span>
                  <textarea value={rascunho.criteriosDeAceite} onChange={(evento) => setRascunho({ ...rascunho, criteriosDeAceite: evento.target.value })} disabled={Boolean(story.diffPendente) || story.estado === 'rodando'} />
                </label>
                <div className="acoes">
                  <button className="btn-sec" type="submit" disabled={!sujo || Boolean(ocupado) || Boolean(story.diffPendente) || story.estado === 'rodando'}>
                    Salvar texto
                  </button>
                  <button
                    className="btn-texto"
                    type="button"
                    disabled={Boolean(ocupado) || Boolean(story.diffPendente) || story.estado === 'rodando'}
                    onClick={() =>
                      void agir('Reconfrontando', async () => {
                        await gravarRascunho(story.id)
                        aplicar(await chamar<StoryRun>('reconfrontar', { id: story.id }))
                      })
                    }
                  >
                    Reconfrontar
                  </button>
                </div>
                {story.estado === 'pronta' && !story.diffPendente && (
                  <Publicar
                    publicacao={story.publicacao}
                    orgUrl={estado.ajustes.orgUrl}
                    pendentes={pendentes}
                    cardSugerido={cardSugerido}
                    acao={acaoPublicar}
                    setAcao={setAcaoPublicar}
                    projeto={projeto}
                    setProjeto={setProjeto}
                    area={area}
                    setArea={setArea}
                    iteracao={iteracao}
                    setIteracao={setIteracao}
                    cardId={cardId}
                    setCardId={setCardId}
                    projetos={estado.produtos.find((item) => item.id === story.produtoId)?.projetosBacklog ?? []}
                    ocupado={ocupado}
                    passou={story.medicao.passou}
                    voltou={story.medicao.voltou}
                    aoPublicar={() =>
                      void agir('Publicando', async () => {
                        await gravarRascunho(story.id)
                        const pedido =
                          acaoPublicar === 'criar'
                            ? { acao: 'criar' as const, projeto, area: area || undefined, iteracao: iteracao || undefined }
                            : { acao: 'comentar' as const, workItemId: Number(cardId) }
                        aplicar(await chamar<StoryRun>('publicar', { id: story.id, pedido }))
                      })
                    }
                    aoVoto={(voto) => void agir('Registrando', async () => aplicar(await chamar<StoryRun>('registrarVolta', { id: story.id, voto })))}
                  />
                )}
              </form>
              <section className="achados" id="achados">
                <header className="titulo">
                  <h2>Achados</h2>
                  <span className="num">{pendentes} pendentes</span>
                </header>
                {achados.length === 0 && (
                  <Vazio>{story.estado === 'rodando' ? 'Os achados aparecem aqui quando o bloco termina.' : 'Nenhum achado nesta story.'}</Vazio>
                )}
                <AnimatedList>
                {achados.map((achado, indice) => (
                  <Fragment key={achado.id}>
                  {achado.estado !== 'pendente' && achados[indice - 1]?.estado === 'pendente' && <p className="achados-resolvidos">Decididos</p>}
                  <AchadoCard
                    achado={achado}
                    travado={Boolean(ocupado) || Boolean(story.diffPendente) || story.estado === 'rodando'}
                    aoAceitar={() =>
                      void agir('Preparando', async () => {
                        await gravarRascunho(story.id)
                        aplicar(await chamar<StoryRun>('aceitarAchado', { id: story.id, achadoId: achado.id }))
                      })
                    }
                    aoDescartar={() => void agir('Descartando', async () => aplicar(await chamar<StoryRun>('descartarAchado', { id: story.id, achadoId: achado.id })))}
                  />
                  </Fragment>
                ))}
                </AnimatedList>
              </section>
            </div>
          </>
        )
      )}
    </>
  )
}

function sublinha(story: StoryRun | null, pendentes: number): string {
  if (!story) return 'Abrindo a story.'
  if (story.estado === 'rodando') {
    const atual = story.passos.find((passo) => passo.estado === 'rodando')
    const feitos = story.passos.filter((passo) => passo.estado === 'concluido').length
    if (!atual) return `Começando. ${feitos} de ${story.passos.length} blocos terminaram.`
    return `${atual.nome} está rodando. ${feitos} de ${story.passos.length} já terminaram.`
  }
  if (story.estado === 'interrompida') {
    const nome = story.passos.find((passo) => passo.estado === 'interrompido')?.nome ?? 'um bloco'
    const n = story.achados.length
    return `Parada em ${nome}. ${n} ${n === 1 ? 'achado fica' : 'achados ficam'}. Continuar segue deste bloco.`
  }
  if (story.estado === 'erro') return story.erro || 'A esteira parou com erro.'
  if (story.estado === 'pausada') {
    const nome = story.passos.find((passo) => passo.blocoId === story.pausadaNoBlocoId)?.nome ?? 'um bloco'
    return `Parada em ${nome}. Este bloco espera um clique.`
  }
  if (story.diffPendente) return 'Um ajuste está esperando aprovação. A story ainda não mudou.'
  if (pendentes > 0) return `${pendentes} ${pendentes === 1 ? 'achado pede' : 'achados pedem'} uma decisão antes do board.`
  if (story.publicacao) return frasePublicacao(story.publicacao)
  if (story.estado === 'pronta') return `${story.produtoNome} · pronta para o board. Publicar só acontece no clique.`
  return `${story.produtoNome} · ${rotuloStory(story.estado)}`
}

function rotuloPasso(estado: string): string {
  if (estado === 'concluido') return 'feito'
  if (estado === 'rodando') return 'rodando'
  if (estado === 'pausado') return 'esperando'
  if (estado === 'erro') return 'erro'
  if (estado === 'interrompido') return 'parado'
  return 'na fila'
}

function Diff({ linhas }: { linhas: LinhaDiff[] }) {
  const visiveis = linhas.filter((linha) => linha.tipo !== 'igual' || linha.texto.trim())
  return (
    <div className="diff">
      {visiveis.map((linha, indice) => (
        <div key={`${indice}-${linha.tipo}`} className={linha.tipo === 'igual' ? undefined : linha.tipo}>
          {linha.tipo === 'entrou' ? '+ ' : linha.tipo === 'saiu' ? '− ' : '  '}
          {linha.texto || ' '}
        </div>
      ))}
    </div>
  )
}

function AchadoCard({
  achado,
  travado,
  aoAceitar,
  aoDescartar,
}: {
  achado: Achado
  travado: boolean
  aoAceitar: () => void
  aoDescartar: () => void
}) {
  const [confirma, setConfirma] = useState(false)
  const pergunta = achado.tipo === 'nao-encontrei'
  const classe = [achado.estado === 'pendente' ? 'achado' : 'achado resolvido', achado.semProva ? 'sem-prova' : ''].filter(Boolean).join(' ')
  return (
    <SpotlightCard as="article" className={classe}>
      <header>
        {/* O que foi achado lidera; o bloco que achou é metadado. */}
        <span className="origem">{achado.blocoNome}</span>
        {/* Pendente não leva pílula: os botões já dizem que falta decidir. Sem prova é a exceção: o selo muda o peso do aceite. */}
        <span>
          <span className="pilula">{TIPO_ACHADO[achado.tipo]}</span>
          {achado.semProva && <span className="pilula aviso">sem prova</span>}
          {achado.estado === 'aceito' && <span className="pilula ok">aceito</span>}
          {achado.estado === 'descartado' && <span className="pilula nao">descartado</span>}
        </span>
      </header>
      <p className="frase">{achado.texto}</p>
      <Prova achado={achado} />
      {achado.estado === 'pendente' && achado.semProva && confirma && (
        <div className="confirma" role="group" aria-label="Confirmar achado sem prova">
          <p>Este achado não tem prova. O trecho entra na story marcado [sem prova].</p>
          <div className="acoes">
            <button className="btn" type="button" disabled={travado} onClick={aoAceitar}>
              Confirmar
            </button>
            <button className="btn-texto" type="button" disabled={travado} onClick={() => setConfirma(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {achado.estado === 'pendente' && achado.semProva && !confirma && (
        <div className="acoes">
          <button className="btn" type="button" disabled={travado} onClick={aoDescartar}>
            Descartar
          </button>
          <button className="btn-texto" type="button" disabled={travado} onClick={() => setConfirma(true)}>
            Aceitar mesmo sem prova
          </button>
        </div>
      )}
      {achado.estado === 'pendente' && !achado.semProva && pergunta && (
        <div className="acoes">
          <button className="btn-sec" type="button" disabled={travado} onClick={aoAceitar}>
            Virar pergunta em aberto
          </button>
          <button className="btn-texto" type="button" disabled={travado} onClick={aoDescartar}>
            Descartar
          </button>
        </div>
      )}
      {achado.estado === 'pendente' && !achado.semProva && !pergunta && (
        <div className="acoes">
          <button className="btn-sec" type="button" disabled={travado} onClick={aoAceitar}>
            Aceitar
          </button>
          <button className="btn-texto" type="button" disabled={travado} onClick={aoDescartar}>
            Descartar
          </button>
        </div>
      )}
    </SpotlightCard>
  )
}

function Prova({ achado }: { achado: Achado }) {
  const ev = achado.evidencia
  // Sem prova vem antes do tipo: o que foi citado e não conferiu nunca aparece como prova.
  if (achado.semProva) {
    const motivo =
      ev.tipo === 'arquivo'
        ? `o trecho citado não está em ${ev.caminho || 'nenhum arquivo lido'}.`
        : ev.tipo === 'work-item'
          ? `o card ${ev.id ? `#${ev.id}` : 'citado'} não está no backlog.`
          : 'nenhum arquivo ou card sustenta este achado.'
    return <p className="prova sem">Sem prova: {motivo}</p>
  }
  if (achado.evidencia.tipo === 'arquivo') {
    return (
      <p className="prova">
        <span className="caminho">
          {achado.evidencia.repositorio ? `${achado.evidencia.repositorio} · ` : ''}
          {achado.evidencia.caminho || 'arquivo'}
        </span>
        {achado.evidencia.trecho}
      </p>
    )
  }
  if (achado.evidencia.tipo === 'work-item') {
    return (
      <p className="prova">
        <span className="caminho">{achado.evidencia.projeto}</span>
        #{achado.evidencia.id} {achado.evidencia.titulo}
      </p>
    )
  }
  return <p className="prova sem">Não encontrei no código nem no backlog.</p>
}

function LinkDoCard({ url, id }: { url: string; id: number }) {
  const [erro, setErro] = useState('')
  return (
    <>
      <p className="sub">
        <button
          type="button"
          className="link"
          onClick={() => {
            setErro('')
            void abrirNoBoards(url).catch((falha: unknown) => setErro(mensagemDe(falha)))
          }}
        >
          Abrir #{id} no Boards
        </button>
      </p>
      <Erro texto={erro} />
    </>
  )
}

async function abrirNoBoards(url: string) {
  if (window.esteira) {
    await chamar('abrirNoBrowser', { url })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

function Publicar(props: {
  publicacao?: Publicacao
  orgUrl: string
  pendentes: number
  cardSugerido: number | null
  acao: 'criar' | 'comentar'
  setAcao: (acao: 'criar' | 'comentar') => void
  projeto: string
  setProjeto: (valor: string) => void
  area: string
  setArea: (valor: string) => void
  iteracao: string
  setIteracao: (valor: string) => void
  cardId: string
  setCardId: (valor: string) => void
  projetos: string[]
  ocupado: string
  passou: number
  voltou: number
  aoPublicar: () => void
  aoVoto: (voto: 'passou' | 'voltou') => void
}) {
  const url = props.publicacao ? urlDoCard(props.orgUrl, props.publicacao.projeto, props.publicacao.workItemId) : ''
  return (
    <section className="bloco" id="board">
      <h2>Board</h2>
      {props.publicacao ? (
        <>
          <p className="sub">{frasePublicacao(props.publicacao)}</p>
          {url && <LinkDoCard url={url} id={props.publicacao.workItemId} />}
          <p className="rotulo">Quando o card voltar do time, registre o resultado.</p>
          <div className="acoes votos">
            <button className="btn-sec" type="button" disabled={Boolean(props.ocupado)} onClick={() => props.aoVoto('passou')}>
              Passou <span className="num">{props.passou}</span>
            </button>
            <button className="btn-sec" type="button" disabled={Boolean(props.ocupado)} onClick={() => props.aoVoto('voltou')}>
              Voltou <span className="num">{props.voltou}</span>
            </button>
          </div>
          <details className="publicar-de-novo">
            <summary>Publicar de novo</summary>
            <FormPublicar {...props} />
          </details>
        </>
      ) : (
        <FormPublicar {...props} />
      )}
    </section>
  )
}

function FormPublicar(props: Parameters<typeof Publicar>[0]) {
  const [aviso, setAviso] = useState<'pendentes' | 'duplicar' | null>(null)
  const duplicaria = props.publicacao?.acao === 'criar' && props.acao === 'criar'

  useEffect(() => {
    setAviso(null)
  }, [props.acao, props.pendentes])

  function pedir() {
    if (props.pendentes > 0) {
      setAviso('pendentes')
      return
    }
    if (duplicaria) {
      setAviso('duplicar')
      return
    }
    props.aoPublicar()
  }

  function seguirPendentes() {
    if (duplicaria) {
      setAviso('duplicar')
      return
    }
    setAviso(null)
    props.aoPublicar()
  }

  function escolherComentar() {
    props.setAcao('comentar')
    if (!props.cardId && props.cardSugerido) props.setCardId(String(props.cardSugerido))
  }

  const n = props.pendentes
  return (
    <>
      <p className="sub">Criar abre um card novo. Comentar menciona o responsável e não mexe na descrição.</p>
      <div className="escolha">
        <button type="button" className="btn-sec" aria-pressed={props.acao === 'criar'} onClick={() => props.setAcao('criar')}>
          Criar card
        </button>
        <button type="button" className="btn-sec" aria-pressed={props.acao === 'comentar'} onClick={escolherComentar}>
          Comentar em card
        </button>
      </div>
      {props.acao === 'comentar' ? (
        <label className="campo">
          <span>Número do card</span>
          <input inputMode="numeric" value={props.cardId} onChange={(evento) => props.setCardId(evento.target.value.replace(/\D/g, ''))} />
        </label>
      ) : (
        <>
          <label className="campo">
            <span>Projeto</span>
            <input list="projetos-board" value={props.projeto} onChange={(evento) => props.setProjeto(evento.target.value)} />
            <datalist id="projetos-board">
              {props.projetos.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
          <div className="linha">
            <label className="campo">
              <span>Área</span>
              <input value={props.area} onChange={(evento) => props.setArea(evento.target.value)} />
            </label>
            <label className="campo">
              <span>Iteração</span>
              <input value={props.iteracao} onChange={(evento) => props.setIteracao(evento.target.value)} />
            </label>
          </div>
        </>
      )}
      {aviso === 'pendentes' && (
        <div className="confirma" role="group" aria-label="Achados pendentes">
          <p>
            {n === 1 ? 'Há 1 achado sem decisão. Publicar agora deixa ele de fora do card.' : `Há ${n} achados sem decisão. Publicar agora deixa eles de fora do card.`}
          </p>
          <div className="acoes">
            <button className="btn" type="button" disabled={Boolean(props.ocupado)} onClick={seguirPendentes}>
              Publicar mesmo assim
            </button>
            <button
              className="btn-texto"
              type="button"
              onClick={() => {
                setAviso(null)
                document.getElementById('achados')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
            >
              Voltar aos achados
            </button>
          </div>
        </div>
      )}
      {aviso === 'duplicar' && (
        <div className="confirma" role="group" aria-label="Card já criado">
          <p>Esta story já criou o card #{props.publicacao?.workItemId}. Publicar de novo abre outro card.</p>
          <div className="acoes">
            <button className="btn" type="button" disabled={Boolean(props.ocupado)} onClick={() => { setAviso(null); props.aoPublicar() }}>
              Criar outro card
            </button>
            <button className="btn-texto" type="button" onClick={() => setAviso(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      {!aviso && (
        <AcaoPrimaria type="button" disabled={Boolean(props.ocupado) || (props.acao === 'comentar' ? !props.cardId : !props.projeto.trim())} onClick={pedir}>
          {props.ocupado === 'Publicando' ? <ShinyText text="Publicando" /> : 'Publicar no Azure Boards'}
        </AcaoPrimaria>
      )}
    </>
  )
}
