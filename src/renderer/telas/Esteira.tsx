import { useEffect, useMemo, useState } from 'react'
import type { Achado, EstadoApp, LinhaDiff, StoryRun, StoryTexto } from '../../shared/tipos'
import { STORY_VAZIA } from '../../shared/tipos'
import { chamar } from '../api'
import { Erro, TIPO_ACHADO, Vazio, mensagemDe, rotuloStory } from '../ui'

const ORDEM = { pendente: 0, aceito: 1, descartado: 2 }

export function EsteiraView({ estado, recarregar }: { estado: EstadoApp; recarregar: () => Promise<void> }) {
  const [storyId, setStoryId] = useState(estado.stories[0]?.id ?? '')
  const [nova, setNova] = useState(estado.stories.length === 0)
  const [story, setStory] = useState<StoryRun | null>(null)
  const [rascunho, setRascunho] = useState<StoryTexto>(STORY_VAZIA)
  const [ideia, setIdeia] = useState('')
  const [produtoId, setProdutoId] = useState(estado.produtos[0]?.id ?? '')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState('')
  const [acaoPublicar, setAcaoPublicar] = useState<'criar' | 'comentar'>('comentar')
  const [projeto, setProjeto] = useState('')
  const [area, setArea] = useState(estado.ajustes.areaPadrao)
  const [iteracao, setIteracao] = useState(estado.ajustes.iteracaoPadrao)
  const [cardId, setCardId] = useState('')

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

  const pendentes = story?.achados.filter((achado) => achado.estado === 'pendente').length ?? 0
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

  if (estado.produtos.length === 0) {
    return (
      <>
        <h1>Esteira</h1>
        <p className="sub">A story precisa de um produto para saber qual código ler.</p>
        <Vazio>Nenhum produto ainda. Em Produtos, escolha os repositórios e dê um nome ao conjunto.</Vazio>
      </>
    )
  }

  return (
    <>
      <div className="titulo">
        <h1>{nova ? 'Nova story' : story?.story.titulo || 'Story sem título'}</h1>
        <div className="acoes">
          {!nova && (
            <button
              className="btn-sec"
              type="button"
              onClick={() => {
                if (story?.produtoId) setProdutoId(story.produtoId)
                setNova(true)
              }}
              disabled={Boolean(ocupado)}
            >
              Nova story
            </button>
          )}
          {nova && estado.stories.length > 0 && (
            <button className="btn-sec" type="button" onClick={() => setNova(false)}>
              Voltar à story
            </button>
          )}
          {story?.estado === 'pausada' && (
            <button className="btn" type="button" disabled={Boolean(ocupado)} onClick={() => void agir('Continuando', async () => aplicar(await chamar<StoryRun>('continuar', { id: story.id })))}>
              {ocupado === 'Continuando' ? 'Continuando' : 'Continuar'}
            </button>
          )}
        </div>
      </div>
      <p className="sub">{nova ? 'A ideia entra aqui. A esteira escreve no modelo e confronta com a wiki, o código e o backlog.' : sublinha(story, pendentes)}</p>
      <Erro texto={erro} />

      {!nova && estado.stories.length > 1 && (
        <label className="campo">
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
          <label className="campo">
            <span>Produto</span>
            <select value={produtoId} onChange={(evento) => setProdutoId(evento.target.value)}>
              {estado.produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" type="submit" disabled={Boolean(ocupado) || !ideia.trim()}>
            {ocupado === 'Rodando' ? 'Rodando a esteira' : 'Rodar a esteira'}
          </button>
        </form>
      ) : (
        story && (
          <>
            <ol className="trilho">
              {story.passos.map((passo) => (
                <li key={passo.blocoId} className={passo.estado}>
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
              <section>
                <h2>Ajuste para aprovar</h2>
                <p className="sub">A story só muda depois deste clique. Cancelar deixa o texto como está.</p>
                <Diff linhas={story.diffPendente.linhas} />
                <div className="acoes">
                  <button
                    className="btn"
                    type="button"
                    disabled={Boolean(ocupado)}
                    onClick={() => void agir('Aplicando', async () => aplicar(await chamar<StoryRun>('aprovarDiff', { id: story.id })))}
                  >
                    Aplicar ajuste
                  </button>
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
                  <input value={rascunho.titulo} onChange={(evento) => setRascunho({ ...rascunho, titulo: evento.target.value })} disabled={Boolean(story.diffPendente)} />
                </label>
                <label className="campo">
                  <span>Story</span>
                  <textarea className="alto" value={rascunho.corpo} onChange={(evento) => setRascunho({ ...rascunho, corpo: evento.target.value })} disabled={Boolean(story.diffPendente)} />
                </label>
                <label className="campo">
                  <span>Descrição</span>
                  <textarea value={rascunho.descricao} onChange={(evento) => setRascunho({ ...rascunho, descricao: evento.target.value })} disabled={Boolean(story.diffPendente)} />
                </label>
                <label className="campo">
                  <span>Critérios de aceite</span>
                  <textarea value={rascunho.criteriosDeAceite} onChange={(evento) => setRascunho({ ...rascunho, criteriosDeAceite: evento.target.value })} disabled={Boolean(story.diffPendente)} />
                </label>
                <div className="acoes">
                  <button className="btn-sec" type="submit" disabled={!sujo || Boolean(ocupado) || Boolean(story.diffPendente)}>
                    Salvar texto
                  </button>
                  <button
                    className="btn-texto"
                    type="button"
                    disabled={Boolean(ocupado) || Boolean(story.diffPendente)}
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
                    publicada={Boolean(story.publicacao)}
                    registro={story.publicacao ? `${story.publicacao.acao === 'criar' ? 'Card criado' : 'Comentário'} #${story.publicacao.workItemId} em ${story.publicacao.projeto}` : ''}
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
              <section className="achados">
                <header className="titulo">
                  <h2>Achados</h2>
                  <span className="num">{pendentes} pendentes</span>
                </header>
                {achados.length === 0 && <Vazio>Nenhum achado nesta story.</Vazio>}
                {achados.map((achado) => (
                  <AchadoCard
                    key={achado.id}
                    achado={achado}
                    travado={Boolean(ocupado) || Boolean(story.diffPendente)}
                    aoAceitar={() =>
                      void agir('Preparando', async () => {
                        await gravarRascunho(story.id)
                        aplicar(await chamar<StoryRun>('aceitarAchado', { id: story.id, achadoId: achado.id }))
                      })
                    }
                    aoDescartar={() => void agir('Descartando', async () => aplicar(await chamar<StoryRun>('descartarAchado', { id: story.id, achadoId: achado.id })))}
                  />
                ))}
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
  if (story.estado === 'erro') return story.erro || 'A esteira parou com erro.'
  if (story.estado === 'pausada') {
    const nome = story.passos.find((passo) => passo.blocoId === story.pausadaNoBlocoId)?.nome ?? 'um bloco'
    return `Parada em ${nome}. Este bloco espera um clique.`
  }
  if (story.diffPendente) return 'Um ajuste está esperando aprovação. A story ainda não mudou.'
  if (pendentes > 0) return `${pendentes} ${pendentes === 1 ? 'achado pede' : 'achados pedem'} uma decisão antes do board.`
  if (story.publicacao) {
    const verbo = story.publicacao.acao === 'criar' ? 'Card criado' : 'Comentário publicado'
    return `${verbo} no #${story.publicacao.workItemId}. A descrição do card não foi alterada.`
  }
  if (story.estado === 'pronta') return `${story.produtoNome} · pronta para o board. Publicar só acontece no clique.`
  return `${story.produtoNome} · ${rotuloStory(story.estado)}`
}

function rotuloPasso(estado: string): string {
  if (estado === 'concluido') return 'feito'
  if (estado === 'rodando') return 'rodando'
  if (estado === 'pausado') return 'esperando'
  if (estado === 'erro') return 'erro'
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
  return (
    <article className="achado">
      <header>
        <strong>{achado.blocoNome}</strong>
        <span>
          <span className="pilula">{TIPO_ACHADO[achado.tipo]}</span>{' '}
          {achado.semProva && <span className="pilula aviso">sem prova</span>}{' '}
          {achado.estado === 'aceito' && <span className="pilula ok">aceito</span>}
          {achado.estado === 'descartado' && <span className="pilula nao">descartado</span>}
          {achado.estado === 'pendente' && <span className="pilula">pendente</span>}
        </span>
      </header>
      <p>{achado.texto}</p>
      <Prova achado={achado} />
      {achado.estado === 'pendente' && (
        <div className="acoes">
          <button className="btn-sec" type="button" disabled={travado} onClick={aoAceitar}>
            Aceitar
          </button>
          <button className="btn-texto" type="button" disabled={travado} onClick={aoDescartar}>
            Descartar
          </button>
        </div>
      )}
    </article>
  )
}

function Prova({ achado }: { achado: Achado }) {
  if (achado.evidencia.tipo === 'arquivo') {
    return (
      <p className="prova">
        <small>
          {achado.evidencia.repositorio ? `${achado.evidencia.repositorio} · ` : ''}
          {achado.evidencia.caminho || 'arquivo'}
        </small>
        {achado.semProva ? 'sem prova' : achado.evidencia.trecho}
      </p>
    )
  }
  if (achado.evidencia.tipo === 'work-item') {
    return (
      <p className="prova">
        <small>{achado.evidencia.projeto}</small>
        #{achado.evidencia.id} {achado.evidencia.titulo}
      </p>
    )
  }
  return (
    <p className="prova">
      <small>{achado.semProva ? 'sem prova' : 'não encontrei'}</small>
    </p>
  )
}

function Publicar(props: {
  publicada: boolean
  registro: string
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
  return (
    <section className="bloco">
      <h2>Board</h2>
      {props.publicada && (
        <>
          <p className="sub">{props.registro}. A descrição do card não foi alterada.</p>
          <p>
            Passou <span className="num">{props.passou}</span>
            {' · '}
            Voltou <span className="num">{props.voltou}</span>
          </p>
          <div className="acoes">
            <button className="btn-sec" type="button" disabled={Boolean(props.ocupado)} onClick={() => props.aoVoto('passou')}>
              Passou
            </button>
            <button className="btn-sec" type="button" disabled={Boolean(props.ocupado)} onClick={() => props.aoVoto('voltou')}>
              Voltou
            </button>
          </div>
        </>
      )}
      <p className="sub">Criar abre um card novo. Comentar menciona o responsável e não mexe na descrição.</p>
      <div className="escolha">
        <button type="button" className="btn-sec" aria-pressed={props.acao === 'comentar'} onClick={() => props.setAcao('comentar')}>
          Comentar em card
        </button>
        <button type="button" className="btn-sec" aria-pressed={props.acao === 'criar'} onClick={() => props.setAcao('criar')}>
          Criar card
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
      <button className="btn" type="button" disabled={Boolean(props.ocupado) || (props.acao === 'comentar' ? !props.cardId : !props.projeto.trim())} onClick={props.aoPublicar}>
        {props.ocupado === 'Publicando' ? 'Publicando' : 'Publicar no board'}
      </button>
    </section>
  )
}
