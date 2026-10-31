import { useEffect, useState } from 'react'
import type { PassoId } from '../../core/primeiro-uso'
import type { EstadoApp, FonteRadar, PainelConexoes, StatusConexao } from '../../shared/tipos'
import { chamar } from '../api'
import { AcaoPrimaria } from '../components/react-bits/AcaoPrimaria'
import { AnimatedList } from '../components/react-bits/AnimatedList'
import { BlurText } from '../components/react-bits/BlurText'
import { CountUp } from '../components/react-bits/CountUp'
import { ShinyText } from '../components/react-bits/ShinyText'
import { SpotlightCard } from '../components/react-bits/SpotlightCard'
import { Erro, mensagemDe } from '../ui'

const ROTULO: Record<StatusConexao, string> = {
  conectado: 'Conectado',
  'pasta-local': 'Pasta local ativa',
  'nao-conectado': 'Não conectado',
}

export function ConexoesView({
  estado,
  recarregar,
  foco = '',
}: {
  estado: EstadoApp
  recarregar: () => Promise<void>
  foco?: Extract<PassoId, 'pat' | 'claude'> | ''
}) {
  const [painel, setPainel] = useState<PainelConexoes | null>(null)
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState('')
  const [avisos, setAvisos] = useState<Record<string, string>>({})

  async function ler() {
    setPainel(await chamar<PainelConexoes>('painelConexoes'))
  }

  useEffect(() => {
    let vivo = true
    ler().catch((falha: unknown) => {
      if (vivo) setErro(mensagemDe(falha))
    })
    return () => {
      vivo = false
    }
  }, [])

  useEffect(() => {
    if (foco !== 'pat' && foco !== 'claude') return
    document.getElementById(foco === 'pat' ? 'passo-pat' : 'passo-claude')?.scrollIntoView({ block: 'start' })
  }, [foco, painel])

  async function agir(chave: string, trabalho: () => Promise<string>) {
    setOcupado(chave)
    setErro('')
    try {
      const texto = await trabalho()
      setAvisos((atual) => ({ ...atual, [chave]: texto }))
      await ler()
      await recarregar()
    } catch (falha) {
      setAvisos((atual) => ({ ...atual, [chave]: mensagemDe(falha) }))
    } finally {
      setOcupado('')
    }
  }

  if (!painel && !erro) return <p>Abrindo as conexões.</p>

  return (
    <div className="conexoes">
      <div className="titulo">
        <h1><BlurText text="Conexões" /></h1>
        <p className="sub" style={{ margin: 0 }}>
          <CountUp to={painel?.ativas ?? estado.conexoesAtivas} /> ativas nesta máquina
        </p>
      </div>
      <p className="sub">O token de leitura fica no cofre. O app não grava PAT nem token no config.json e não envia mensagem de volta ao canal.</p>
      <Erro texto={erro} />

      <section>
        <h2>Fontes do Radar</h2>
        <p className="sub">Somente leitura. Cada canal, grupo ou pasta fica ligado a um produto.</p>
        {painel && (
          <AnimatedList className="conexoes-grade">
            {painel.radar.map((conexao) => (
              <CartaoFonte
                key={conexao.provedor}
                conexao={conexao}
                produtos={estado.produtos}
                ocupado={ocupado}
                aviso={avisos[conexao.provedor] ?? ''}
                aoAgir={agir}
              />
            ))}
          </AnimatedList>
        )}
      </section>

      <section>
        <h2>Motor e board</h2>
        <p className="sub">O que escreve a story e o que publica no board.</p>
        {painel && (
          <div className="conexoes-grade">
            <CartaoAzure painel={painel} ocupado={ocupado} aviso={avisos.azure ?? ''} aoAgir={agir} foco={foco} />
            <CartaoClaude painel={painel} ocupado={ocupado} aviso={avisos.claude ?? ''} aoAgir={agir} foco={foco} />
          </div>
        )}
      </section>
    </div>
  )
}

function CartaoFonte({
  conexao,
  produtos,
  ocupado,
  aviso,
  aoAgir,
}: {
  conexao: PainelConexoes['radar'][number]
  produtos: EstadoApp['produtos']
  ocupado: string
  aviso: string
  aoAgir: (chave: string, trabalho: () => Promise<string>) => Promise<void>
}) {
  const pasta = conexao.provedor === 'granola' || conexao.provedor === 'plaud' || conexao.provedor === 'whatsapp'
  const token = conexao.provedor === 'teams' || conexao.provedor === 'slack' || conexao.provedor === 'whatsapp'
  const [segredo, setSegredo] = useState('')
  const [caminho, setCaminho] = useState(conexao.caminhoSalvo)
  const [nova, setNova] = useState({ nome: '', referencia: '', produtoId: produtos[0]?.id ?? '' })

  useEffect(() => {
    setCaminho(conexao.caminhoSalvo)
  }, [conexao.caminhoSalvo])

  return (
    <SpotlightCard as="article" className="conexao-card">
      <h3>{conexao.nome}</h3>
      <p className={`status-conexao`}>
        <span className={`status-ponto ${conexao.status}`} />
        {ROTULO[conexao.status]}
      </p>
      <p className="sub">{conexao.detalhe}</p>
      {pasta && <p className="sub">Pasta desta máquina: {conexao.pasta}</p>}
      {token && (
        <form
          onSubmit={(evento) => {
            evento.preventDefault()
            void aoAgir(conexao.provedor, async () => {
              await chamar('conectarRadar', { provedor: conexao.provedor, token: segredo })
              setSegredo('')
              return 'Token no cofre. Esta tela não guarda a cópia.'
            })
          }}
        >
          <label className="campo">
            <span>Token de leitura</span>
            <input type="password" value={segredo} autoComplete="new-password" placeholder={conexao.tokenNoCofre ? 'já no cofre' : 'cola aqui uma vez'} onChange={(evento) => setSegredo(evento.target.value)} />
          </label>
          <div className="acoes">
            <button className="btn-sec" type="submit" disabled={Boolean(ocupado) || segredo.trim().length < 8}>
              {ocupado === conexao.provedor ? <ShinyText text="Conectando" /> : 'Conectar'}
            </button>
          </div>
        </form>
      )}
      {pasta && (
        <form
          onSubmit={(evento) => {
            evento.preventDefault()
            void aoAgir(conexao.provedor, async () => {
              const salvo = await chamar<{ caminho: string }>('salvarPastaRadar', { provedor: conexao.provedor, caminho })
              return salvo.caminho ? 'Caminho guardado dentro de radar-import.' : 'Caminho limpo.'
            })
          }}
        >
          <label className="campo">
            <span>Arquivo ou pasta dentro de radar-import</span>
            <input value={caminho} onChange={(evento) => setCaminho(evento.target.value)} placeholder="notas/reuniao.md" />
          </label>
          <button className="btn-sec" type="submit" disabled={Boolean(ocupado)}>Conectar</button>
        </form>
      )}
      <div className="acoes">
        <button className="btn-sec" type="button" disabled={Boolean(ocupado)} onClick={() => void aoAgir(conexao.provedor, async () => {
          const teste = await chamar<{ ok: boolean; detalhe: string }>('testarRadar', { provedor: conexao.provedor })
          return teste.detalhe
        })}>
          Testar conexão
        </button>
        <button className="btn-texto" type="button" disabled={Boolean(ocupado) || (!conexao.tokenNoCofre && !conexao.caminhoSalvo)} onClick={() => void aoAgir(conexao.provedor, async () => {
          await chamar('desconectarRadar', { provedor: conexao.provedor })
          return 'Desconectado. O token saiu do cofre, se havia um.'
        })}>
          Desconectar
        </button>
      </div>
      {aviso && <p className="sub" role="status">{aviso}</p>}
      <p className="rotulo">Canais, grupos ou pastas</p>
      {conexao.fontes.length === 0 && <p className="sub">Nenhum vínculo ainda.</p>}
      <ul className="canal">
        {conexao.fontes.map((fonte) => (
          <li key={fonte.id}>
            <div>
              <strong>{fonte.nome}</strong>
              <small>{fonte.referencia} · {produtos.find((produto) => produto.id === fonte.produtoId)?.nome ?? fonte.produtoId}</small>
            </div>
            <div className="acoes">
              <button className="btn-sec" type="button" disabled={Boolean(ocupado)} onClick={() => void aoAgir(fonte.id, async () => {
                await chamar('salvarFonteRadar', { ...fonte, ativa: !fonte.ativa })
                return fonte.ativa ? 'Fonte pausada.' : 'Fonte ativa.'
              })}>
                {fonte.ativa ? 'Ativa' : 'Pausada'}
              </button>
              <button className="btn-texto" type="button" disabled={Boolean(ocupado) || !fonte.ativa} onClick={() => void aoAgir(fonte.id, async () => {
                await chamar('sincronizarRadar', { fonteId: fonte.id })
                return 'Sincronização pedida. Só entra trecho literal.'
              })}>
                Sincronizar agora
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          void aoAgir(`${conexao.provedor}-nova`, async () => {
            await chamar<FonteRadar[]>('salvarFonteRadar', {
              id: '',
              produtoId: nova.produtoId,
              provedor: conexao.provedor,
              nome: nova.nome,
              referencia: nova.referencia,
              ativa: true,
            })
            setNova((atual) => ({ ...atual, nome: '', referencia: '' }))
            return 'Vínculo gravado.'
          })
        }}
      >
        <label className="campo">
          <span>Nome</span>
          <input value={nova.nome} onChange={(evento) => setNova((atual) => ({ ...atual, nome: evento.target.value }))} required />
        </label>
        <label className="campo">
          <span>Canal, grupo ou arquivo</span>
          <input value={nova.referencia} onChange={(evento) => setNova((atual) => ({ ...atual, referencia: evento.target.value }))} required />
        </label>
        <label className="campo">
          <span>Produto</span>
          <select value={nova.produtoId} onChange={(evento) => setNova((atual) => ({ ...atual, produtoId: evento.target.value }))}>
            {produtos.map((produto) => (
              <option key={produto.id} value={produto.id}>{produto.nome}</option>
            ))}
          </select>
        </label>
        <button className="btn-sec" type="submit" disabled={Boolean(ocupado) || produtos.length === 0}>Vincular ao produto</button>
      </form>
    </SpotlightCard>
  )
}

function CartaoAzure({
  painel,
  ocupado,
  aviso,
  aoAgir,
  foco,
}: {
  painel: PainelConexoes
  ocupado: string
  aviso: string
  aoAgir: (chave: string, trabalho: () => Promise<string>) => Promise<void>
  foco: 'pat' | 'claude' | ''
}) {
  const [orgUrl, setOrgUrl] = useState(painel.azure.orgUrl)
  const [pat, setPat] = useState('')
  return (
    <SpotlightCard as="article" id="passo-pat" className={foco === 'pat' ? 'conexao-card passo-atual' : 'conexao-card'}>
      <h3>Azure DevOps</h3>
      <p className="status-conexao">
        <span className={`status-ponto ${painel.azure.conectado ? 'conectado' : 'nao-conectado'}`} />
        {painel.azure.conectado ? 'Conectado' : 'Não conectado'}
      </p>
      <p className="sub">{painel.azure.detalhe}</p>
      <p className="sub">Escopos: {painel.azure.escopos}</p>
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          void aoAgir('azure', async () => {
            await chamar('conectar', { orgUrl, pat })
            setPat('')
            return 'Organização conectada. O PAT foi para o cofre.'
          })
        }}
      >
        <label className="campo">
          <span>URL da organização</span>
          <input value={orgUrl} onChange={(evento) => setOrgUrl(evento.target.value)} placeholder="https://dev.azure.com/sua-org" autoComplete="off" />
        </label>
        <label className="campo">
          <span>PAT</span>
          <input type="password" value={pat} autoComplete="new-password" placeholder={painel.azure.conectado ? 'já no cofre' : 'cola aqui uma vez'} onChange={(evento) => setPat(evento.target.value)} />
        </label>
        <div className="acoes">
          <AcaoPrimaria type="submit" disabled={Boolean(ocupado) || !pat.trim()}>
            {ocupado === 'azure' ? <ShinyText text="Conectando" /> : 'Conectar'}
          </AcaoPrimaria>
          {painel.azure.conectado && (
            <button className="btn-texto" type="button" disabled={Boolean(ocupado)} onClick={() => void aoAgir('azure', async () => {
              await chamar('desconectar')
              return 'Desconectado. O PAT saiu do cofre.'
            })}>
              Desconectar
            </button>
          )}
          <button className="btn-sec" type="button" disabled={Boolean(ocupado)} onClick={() => void aoAgir('azure', async () => {
            const teste = await chamar<{ ok: boolean; detalhe: string }>('testarAzure')
            return teste.detalhe
          })}>
            Testar conexão
          </button>
        </div>
      </form>
      {aviso && <p className="sub" role="status">{aviso}</p>}
    </SpotlightCard>
  )
}

function CartaoClaude({
  painel,
  ocupado,
  aviso,
  aoAgir,
  foco,
}: {
  painel: PainelConexoes
  ocupado: string
  aviso: string
  aoAgir: (chave: string, trabalho: () => Promise<string>) => Promise<void>
  foco: 'pat' | 'claude' | ''
}) {
  const [binario, setBinario] = useState(painel.claude.binario)
  const [timeoutSeg, setTimeoutSeg] = useState(String(Math.round(painel.claude.timeoutBlocoMs / 1000)))
  const ligado = painel.claude.autenticado === true
  const status = painel.claude.instalado == null ? 'Não verificado' : ligado ? 'Conectado' : 'Não conectado'
  return (
    <SpotlightCard as="article" id="passo-claude" className={foco === 'claude' ? 'conexao-card passo-atual' : 'conexao-card'}>
      <h3>Claude Code CLI</h3>
      <p className="status-conexao">
        <span className={`status-ponto ${ligado ? 'conectado' : 'nao-conectado'}`} />
        {status}
      </p>
      <p className="sub">{aviso || painel.claude.detalhe}</p>
      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          void aoAgir('claude', async () => {
            const segundos = Number(timeoutSeg)
            if (!Number.isFinite(segundos)) throw new Error('O tempo limite precisa ser um número de segundos.')
            await chamar('salvarAjustes', { claudeBin: binario, timeoutBlocoMs: Math.round(segundos * 1000) })
            return 'Binário e tempo limite gravados. Não há chave de API.'
          })
        }}
      >
        <label className="campo">
          <span>Binário</span>
          <input value={binario} onChange={(evento) => setBinario(evento.target.value)} />
        </label>
        <label className="campo">
          <span>Tempo limite de cada bloco, em segundos</span>
          <input value={timeoutSeg} inputMode="numeric" onChange={(evento) => setTimeoutSeg(evento.target.value)} />
        </label>
        <div className="acoes">
          <button className="btn-sec" type="submit" disabled={Boolean(ocupado)}>Salvar</button>
          <button className="btn-sec" type="button" disabled={Boolean(ocupado)} onClick={() => void aoAgir('claude', async () => {
            const teste = await chamar<{ detalhe: string }>('testarClaude')
            return teste.detalhe
          })}>
            {ocupado === 'claude' ? <ShinyText text="Testando claude -p" /> : 'Testar conexão'}
          </button>
        </div>
      </form>
    </SpotlightCard>
  )
}
