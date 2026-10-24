import { useEffect, useState, type FormEvent } from 'react'
import type { EstadoApp, ModuloWiki, RespostaWiki, WikiProduto } from '../../shared/tipos'
import { chamar } from '../api'
import { Erro, Vazio, mensagemDe } from '../ui'

export function WikiView({ estado }: { estado: EstadoApp }) {
  const [produtoId, setProdutoId] = useState(estado.produtos[0]?.id ?? '')
  const [wiki, setWiki] = useState<WikiProduto | null>(null)
  const [moduloId, setModuloId] = useState('')
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState<RespostaWiki | null>(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState('')

  useEffect(() => {
    if (!produtoId) return
    let vivo = true
    setErro('')
    setResposta(null)
    chamar<WikiProduto>('wiki', { produtoId })
      .then((lida) => {
        if (!vivo) return
        setWiki(lida)
        setModuloId((atual) => (lida.modulos.some((modulo) => modulo.id === atual) ? atual : lida.modulos[0]?.id ?? ''))
      })
      .catch((falha: unknown) => {
        if (vivo) setErro(mensagemDe(falha))
      })
    return () => {
      vivo = false
    }
  }, [produtoId])

  const modulo = wiki?.modulos.find((item) => item.id === moduloId)
  const comProva = wiki?.modulos.reduce((total, item) => total + item.afirmacoes.filter((afirmacao) => !afirmacao.semProva).length, 0) ?? 0
  const semProva = wiki?.modulos.reduce((total, item) => total + item.afirmacoes.filter((afirmacao) => afirmacao.semProva).length, 0) ?? 0

  async function gerar() {
    setOcupado('Gerando')
    setErro('')
    try {
      const lida = await chamar<WikiProduto>('gerarWiki', { produtoId })
      setWiki(lida)
      setModuloId(lida.modulos[0]?.id ?? '')
    } catch (falha) {
      setErro(mensagemDe(falha))
    } finally {
      setOcupado('')
    }
  }

  async function perguntar(evento: FormEvent) {
    evento.preventDefault()
    setOcupado('Perguntando')
    setErro('')
    try {
      setResposta(await chamar<RespostaWiki>('perguntarWiki', { produtoId, pergunta }))
    } catch (falha) {
      setErro(mensagemDe(falha))
    } finally {
      setOcupado('')
    }
  }

  if (estado.produtos.length === 0) {
    return (
      <>
        <h1>Wiki</h1>
        <p className="sub">A wiki nasce do código dos produtos.</p>
        <Vazio>Cadastre um produto antes. Sem repositório clonado não há o que ler.</Vazio>
      </>
    )
  }

  const produto = estado.produtos.find((item) => item.id === produtoId)

  return (
    <>
      <div className="titulo">
        <h1>Wiki {produto ? `de ${produto.nome}` : ''}</h1>
        <button className="btn-sec" type="button" disabled={Boolean(ocupado)} onClick={() => void gerar()}>
          {ocupado === 'Gerando' ? 'Gerando' : 'Gerar de novo'}
        </button>
      </div>
      <p className="sub">
        {comProva} {comProva === 1 ? 'afirmação com trecho' : 'afirmações com trecho'} no código
        {semProva > 0 ? ` · ${semProva} sem prova` : ''}
      </p>
      <Erro texto={erro} />
      {estado.produtos.length > 1 && (
        <label className="campo estreito">
          <span>Produto</span>
          <select
            value={produtoId}
            onChange={(evento) => {
              setProdutoId(evento.target.value)
              setWiki(null)
            }}
          >
            {estado.produtos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
      )}
      {!wiki && <p>Abrindo a wiki.</p>}
      {wiki && wiki.modulos.length === 0 && <Vazio>Este produto ainda não tem módulo. Gerar de novo lê os repositórios clonados.</Vazio>}
      {wiki && wiki.modulos.length > 0 && (
        <div className="modulos">
          <div>
            {wiki.modulos.map((item) => (
              <button key={item.id} type="button" className="modulo-btn" aria-current={item.id === moduloId} onClick={() => setModuloId(item.id)}>
                {item.nome}
                <small>
                  {item.repositorioNome} · {rotuloModulo(item)}
                </small>
              </button>
            ))}
          </div>
          <div>
            {modulo && <Modulo modulo={modulo} />}
          </div>
        </div>
      )}
      <form className="bloco medida" onSubmit={(evento) => void perguntar(evento)}>
        <h2>Perguntar à wiki</h2>
        <p className="sub">A resposta cita o trecho ou diz que não encontrou.</p>
        <label className="campo">
          <span>Pergunta</span>
          <textarea value={pergunta} onChange={(evento) => setPergunta(evento.target.value)} required placeholder="Como o estorno parcial é limitado hoje?" />
        </label>
        <button className="btn" type="submit" disabled={Boolean(ocupado) || !pergunta.trim()}>
          {ocupado === 'Perguntando' ? 'Procurando' : 'Perguntar'}
        </button>
        {resposta && (
          <div className="resposta">
            <p>{resposta.resposta}</p>
            {resposta.afirmacoes.length === 0 && <p className="sub">Não encontrei prova para esta pergunta.</p>}
            {resposta.afirmacoes.map((afirmacao, indice) => (
              <p className={afirmacao.semProva ? 'prova sem' : 'prova'} key={`${afirmacao.caminho}-${indice}`}>
                {!afirmacao.semProva && <span className="caminho">{afirmacao.caminho}</span>}
                {afirmacao.semProva ? `Sem prova: ${afirmacao.texto}` : afirmacao.trecho}
              </p>
            ))}
          </div>
        )}
      </form>
    </>
  )
}

function rotuloModulo(modulo: ModuloWiki): string {
  if (modulo.estado === 'pronto') {
    const n = modulo.afirmacoes.length
    return `${n} ${n === 1 ? 'afirmação' : 'afirmações'}`
  }
  if (modulo.estado === 'gerando') return 'gerando'
  if (modulo.estado === 'erro') return 'erro'
  return 'pendente'
}

function Modulo({ modulo }: { modulo: ModuloWiki }) {
  return (
    <>
      <h2>{modulo.nome}</h2>
      <p className="sub">
        {modulo.repositorioNome} · {modulo.arquivos.length} {modulo.arquivos.length === 1 ? 'arquivo' : 'arquivos'} · {rotuloModulo(modulo)}
      </p>
      {modulo.erro && <Erro texto={modulo.erro} />}
      {modulo.estado === 'pendente' && <Vazio>Este módulo ainda não foi lido.</Vazio>}
      {modulo.estado === 'gerando' && <p>Lendo este módulo agora.</p>}
      {modulo.afirmacoes.length === 0 && modulo.estado === 'pronto' && <Vazio>A leitura não trouxe afirmação.</Vazio>}
      {modulo.afirmacoes.map((afirmacao, indice) => (
        <article className="achado" key={`${afirmacao.caminho}-${indice}`}>
          <header>
            <strong>{afirmacao.texto}</strong>
            {afirmacao.semProva && <span className="pilula aviso">sem prova</span>}
          </header>
          {afirmacao.semProva ? (
            <p className="prova sem">Sem prova: {afirmacao.caminho ? `nenhum trecho de ${afirmacao.caminho} sustenta isto.` : 'nenhum arquivo sustenta isto.'}</p>
          ) : (
            <p className="prova">
              <span className="caminho">{afirmacao.caminho}</span>
              {afirmacao.trecho}
            </p>
          )}
        </article>
      ))}
    </>
  )
}
