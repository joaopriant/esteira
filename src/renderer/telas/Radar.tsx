import { useEffect, useMemo, useState } from 'react'
import type { EstadoApp, FonteRadar, ProvedorRadar, SugestaoRadar, TipoSugestao } from '../../shared/tipos'
import { chamar } from '../api'
import { Erro, Vazio, mensagemDe } from '../ui'

const PROVEDORES: ProvedorRadar[] = ['teams', 'slack', 'whatsapp', 'granola', 'plaud']

const NOME_PROVEDOR: Record<ProvedorRadar, string> = {
  teams: 'Teams',
  slack: 'Slack',
  whatsapp: 'WhatsApp',
  granola: 'Granola',
  plaud: 'Plaud',
}

const NOME_TIPO: Record<TipoSugestao, string> = {
  'nova-story': 'Nova User Story',
  melhoria: 'Melhoria',
  bug: 'Bug/Ajuste',
}

function hora(valor: string): string {
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return valor
  return data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
}

export function RadarView({
  estado,
  recarregar,
  aoEnviar,
}: {
  estado: EstadoApp
  recarregar: () => Promise<void>
  aoEnviar: (storyId: string) => void
}) {
  const [fontes, setFontes] = useState<FonteRadar[]>([])
  const [sugestoes, setSugestoes] = useState<SugestaoRadar[]>([])
  const [provedor, setProvedor] = useState<ProvedorRadar | 'todas'>('todas')
  const [produtoId, setProdutoId] = useState('todos')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [ocupado, setOcupado] = useState('')
  const [pronto, setPronto] = useState(false)
  const [novaFonte, setNovaFonte] = useState({ provedor: 'teams' as ProvedorRadar, nome: '', referencia: '', produtoId: estado.produtos[0]?.id ?? '' })
  const [catalogo, setCatalogo] = useState<{ referencia: string; nome: string }[]>([])
  const [importacao, setImportacao] = useState({ provedor: 'granola' as 'granola' | 'plaud', autor: '', local: '', texto: '', produtoId: estado.produtos[0]?.id ?? '' })

  async function carregar() {
    const [listaFontes, lista] = await Promise.all([
      chamar<FonteRadar[]>('fontesRadar'),
      chamar<SugestaoRadar[]>('sugestoesRadar'),
    ])
    setFontes(listaFontes)
    setSugestoes(lista)
    setPronto(true)
  }

  useEffect(() => {
    let vivo = true
    carregar().catch((falha: unknown) => {
      if (vivo) setErro(mensagemDe(falha))
    })
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    let vivo = true
    chamar<{ referencia: string; nome: string }[]>('catalogoRadar', { provedor: novaFonte.provedor })
      .then((lista) => {
        if (vivo) setCatalogo(lista)
      })
      .catch(() => {
        if (vivo) setCatalogo([])
      })
    return () => {
      vivo = false
    }
  }, [novaFonte.provedor])

  const fila = useMemo(
    () =>
      sugestoes.filter((item) => {
        if (item.estado !== 'nova') return false
        if (produtoId !== 'todos' && item.produtoId !== produtoId) return false
        if (provedor !== 'todas' && !item.provas.some((prova) => prova.provedor === provedor)) return false
        return true
      }),
    [sugestoes, produtoId, provedor],
  )

  async function agir(rotulo: string, trabalho: () => Promise<void>) {
    setOcupado(rotulo)
    setErro('')
    setOk('')
    try {
      await trabalho()
      await carregar()
      await recarregar()
    } catch (falha) {
      setErro(mensagemDe(falha))
    } finally {
      setOcupado('')
    }
  }

  if (!pronto && !erro) return <p>Abrindo o radar.</p>

  return (
    <>
      <div className="titulo">
        <h1>Radar</h1>
        <button className="btn" type="button" disabled={Boolean(ocupado)} onClick={() => void agir('Lendo', async () => { await chamar('sincronizarRadar', {}); setOk('Fontes lidas. Só entrou o que tem trecho literal.') })}>
          {ocupado === 'Lendo' ? 'Lendo fontes' : 'Ler fontes agora'}
        </button>
      </div>
      <p className="sub">Teams, Slack, WhatsApp, Granola e Plaud em leitura. A sugestão traz quem falou, onde, quando e o trecho. Nada é enviado de volta ao canal.</p>
      <Erro texto={erro} />
      {ok && <p className="sub status ok" role="status">{ok}</p>}

      <div className="escolha" role="group" aria-label="Filtrar por fonte">
        <button type="button" className="btn-sec" aria-pressed={provedor === 'todas'} onClick={() => setProvedor('todas')}>Todas</button>
        {PROVEDORES.map((item) => (
          <button key={item} type="button" className="btn-sec" aria-pressed={provedor === item} onClick={() => setProvedor(item)}>
            {NOME_PROVEDOR[item]}
          </button>
        ))}
      </div>
      {estado.produtos.length > 1 && (
        <label className="campo estreito">
          <span>Produto</span>
          <select value={produtoId} onChange={(evento) => setProdutoId(evento.target.value)}>
            <option value="todos">Todos</option>
            {estado.produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>{produto.nome}</option>
            ))}
          </select>
        </label>
      )}

      <section>
        <h2>Fila · {fila.length}</h2>
        {fila.length === 0 && <Vazio>Nenhuma sugestão neste filtro. Ruído e texto sem trecho verificável ficam de fora.</Vazio>}
        {fila.map((item) => (
          <article className="sinal" key={item.id}>
            <header>
              <span>
                <span className={`pilula ${item.tipo === 'bug' ? 'aviso' : item.tipo === 'melhoria' ? '' : 'ok'}`}>{NOME_TIPO[item.tipo]}</span>
                <span className="pilula">{item.provas.map((prova) => NOME_PROVEDOR[prova.provedor]).filter((nome, indice, lista) => lista.indexOf(nome) === indice).join(' · ')}</span>
              </span>
              <small>{item.produtoNome}</small>
            </header>
            <h3>{item.titulo}</h3>
            <p>{item.resumo}</p>
            {item.provas.map((prova, indice) => (
              <blockquote className="prova" key={`${item.id}-${indice}`}>
                <span className="caminho">{prova.local} · {prova.autor} · {hora(prova.em)}</span>
                {prova.citacao}
              </blockquote>
            ))}
            <div className="acoes">
              <button
                className="btn"
                type="button"
                disabled={Boolean(ocupado)}
                onClick={() => void agir(item.id, async () => {
                  const story = await chamar<{ id: string }>('enviarParaEsteira', { id: item.id })
                  aoEnviar(story.id)
                })}
              >
                {ocupado === item.id ? 'Abrindo a esteira' : 'Mandar para a Esteira'}
              </button>
              <button className="btn-texto btn-perigo" type="button" disabled={Boolean(ocupado)} onClick={() => void agir(`d-${item.id}`, async () => { await chamar('descartarSugestao', { id: item.id }) })}>
                Descartar
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="bloco medida">
        <h2>Fontes monitoradas</h2>
        <p className="sub">Cada fonte fica ligada a um produto. Desligar para de ler. O token de Teams ou Slack, se houver, fica no cofre e não volta para esta tela.</p>
        {fontes.length === 0 && <Vazio>Nenhuma fonte ainda. Escolha um canal abaixo ou importe uma transcrição.</Vazio>}
        <ul className="fontes">
          {fontes.map((fonte) => (
            <li key={fonte.id}>
              <div>
                <strong>{fonte.nome}</strong>
                <small>{NOME_PROVEDOR[fonte.provedor]} · {estado.produtos.find((produto) => produto.id === fonte.produtoId)?.nome ?? fonte.produtoId}</small>
              </div>
              <div className="acoes">
                <button
                  className="btn-sec"
                  type="button"
                  disabled={Boolean(ocupado)}
                  onClick={() => void agir(fonte.id, async () => {
                    await chamar('salvarFonteRadar', { ...fonte, ativa: !fonte.ativa })
                  })}
                >
                  {fonte.ativa ? 'Ligada' : 'Desligada'}
                </button>
                <button className="btn-texto" type="button" disabled={Boolean(ocupado) || !fonte.ativa} onClick={() => void agir(fonte.id, async () => { await chamar('sincronizarRadar', { fonteId: fonte.id }) })}>
                  Ler
                </button>
              </div>
            </li>
          ))}
        </ul>
        <form
          className="linha"
          onSubmit={(evento) => {
            evento.preventDefault()
            void agir('Fonte', async () => {
              await chamar('salvarFonteRadar', {
                id: '',
                produtoId: novaFonte.produtoId,
                provedor: novaFonte.provedor,
                nome: novaFonte.nome || catalogo.find((item) => item.referencia === novaFonte.referencia)?.nome || novaFonte.referencia,
                referencia: novaFonte.referencia,
                ativa: true,
              })
              setNovaFonte((atual) => ({ ...atual, nome: '', referencia: '' }))
              setOk('Fonte ligada. Ler agora puxa o que já está no canal.')
            })
          }}
        >
          <label className="campo">
            <span>Canal</span>
            <select value={novaFonte.provedor} onChange={(evento) => setNovaFonte((atual) => ({ ...atual, provedor: evento.target.value as ProvedorRadar, referencia: '' }))}>
              {PROVEDORES.map((item) => (
                <option key={item} value={item}>{NOME_PROVEDOR[item]}</option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Qual</span>
            <input
              list="catalogo-radar"
              value={novaFonte.referencia}
              placeholder={catalogo[0]?.referencia ?? 'referência ou arquivo'}
              onChange={(evento) => {
                const referencia = evento.target.value
                const achado = catalogo.find((item) => item.referencia === referencia)
                setNovaFonte((atual) => ({ ...atual, referencia, nome: achado?.nome ?? atual.nome }))
              }}
              required
            />
            <datalist id="catalogo-radar">
              {catalogo.map((item) => (
                <option key={item.referencia} value={item.referencia}>{item.nome}</option>
              ))}
            </datalist>
          </label>
          <label className="campo">
            <span>Produto</span>
            <select value={novaFonte.produtoId} onChange={(evento) => setNovaFonte((atual) => ({ ...atual, produtoId: evento.target.value }))}>
              {estado.produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>{produto.nome}</option>
              ))}
            </select>
          </label>
          <button className="btn-sec" type="submit" disabled={Boolean(ocupado) || estado.produtos.length === 0}>Ligar fonte</button>
        </form>
      </section>

      <section className="bloco medida">
        <h2>Importar transcrição</h2>
        <p className="sub">Cole uma nota do Granola ou um trecho do Plaud. O texto entra como dado, não como ordem.</p>
        <form
          onSubmit={(evento) => {
            evento.preventDefault()
            void agir('Importando', async () => {
              const criadas = await chamar<SugestaoRadar[]>('importarTranscricao', importacao)
              setImportacao((atual) => ({ ...atual, texto: '', autor: '', local: '' }))
              setOk(criadas.length > 0 ? 'Transcrição virou sugestão com o trecho citado.' : 'Nada virou sugestão. O texto era curto demais ou só tinha ruído.')
            })
          }}
        >
          <div className="linha">
            <label className="campo">
              <span>Origem</span>
              <select value={importacao.provedor} onChange={(evento) => setImportacao((atual) => ({ ...atual, provedor: evento.target.value as 'granola' | 'plaud' }))}>
                <option value="granola">Granola</option>
                <option value="plaud">Plaud</option>
              </select>
            </label>
            <label className="campo">
              <span>Quem falou</span>
              <input value={importacao.autor} onChange={(evento) => setImportacao((atual) => ({ ...atual, autor: evento.target.value }))} required />
            </label>
            <label className="campo">
              <span>Reunião ou nota</span>
              <input value={importacao.local} onChange={(evento) => setImportacao((atual) => ({ ...atual, local: evento.target.value }))} required />
            </label>
          </div>
          <label className="campo">
            <span>Transcrição</span>
            <textarea value={importacao.texto} onChange={(evento) => setImportacao((atual) => ({ ...atual, texto: evento.target.value }))} required placeholder="Cole o trecho. Pedidos dentro do texto são ignorados." />
          </label>
          <button className="btn-sec" type="submit" disabled={Boolean(ocupado)}>Importar</button>
        </form>
      </section>

    </>
  )
}
