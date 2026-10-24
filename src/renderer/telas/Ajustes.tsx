import { useState } from 'react'
import type { Ajustes, EstadoApp } from '../../shared/tipos'
import { chamar } from '../api'
import { Erro, mensagemDe } from '../ui'

export function AjustesView({ estado, recarregar }: { estado: EstadoApp; recarregar: () => Promise<void> }) {
  const inicial = estado.ajustes
  const [orgUrl, setOrgUrl] = useState(inicial.orgUrl)
  const [pat, setPat] = useState('')
  const [modelo, setModelo] = useState(inicial.modeloStory)
  const [tipo, setTipo] = useState(inicial.tipoWorkItem)
  const [campoDescricao, setCampoDescricao] = useState(inicial.campoDescricao)
  const [campoCriterios, setCampoCriterios] = useState(inicial.campoCriterios)
  const [area, setArea] = useState(inicial.areaPadrao)
  const [iteracao, setIteracao] = useState(inicial.iteracaoPadrao)
  const [claudeBin, setClaudeBin] = useState(inicial.claudeBin)
  const [timeoutSeg, setTimeoutSeg] = useState(String(Math.round(inicial.timeoutBlocoMs / 1000)))
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [ocupado, setOcupado] = useState('')

  async function agir(rotulo: string, trabalho: () => Promise<void>) {
    setOcupado(rotulo)
    setErro('')
    setOk('')
    try {
      await trabalho()
      await recarregar()
      setOk('Guardado nesta máquina.')
    } catch (falha) {
      setErro(mensagemDe(falha))
    } finally {
      setOcupado('')
    }
  }

  async function salvar(parcial: Partial<Ajustes>) {
    await chamar('salvarAjustes', parcial)
  }

  return (
    <div className="ajustes">
      <h1>Ajustes</h1>
      <p className="sub">
        {inicial.conectado ? `${inicial.orgUrl} está conectada.` : 'Nenhuma organização conectada.'} O PAT não volta para esta tela.
        {inicial.modo === 'falso' ? ' Esta prévia usa Azure e Claude de exemplo.' : ''}
      </p>
      <Erro texto={erro} />
      {ok && <p className="sub">{ok}</p>}

      <section className="secao">
        <div>
          <h2>Organização</h2>
          <p className="ajuda">O token fica no cofre da máquina. O app pede Code Read e Work Items Read & Write.</p>
        </div>
        <form
          className="painel"
          onSubmit={(evento) => {
            evento.preventDefault()
            void agir('Conectando', async () => {
              await chamar('conectar', { orgUrl, pat })
              setPat('')
            })
          }}
        >
          <label className="campo">
            <span>URL</span>
            <input value={orgUrl} onChange={(evento) => setOrgUrl(evento.target.value)} placeholder="https://dev.azure.com/sua-org" autoComplete="off" />
          </label>
          <label className="campo">
            <span>PAT</span>
            <input type="password" value={pat} onChange={(evento) => setPat(evento.target.value)} autoComplete="new-password" placeholder={inicial.conectado ? 'já guardado, só preencha para trocar' : 'cola aqui uma vez'} />
          </label>
          <div className="acoes">
            <button className="btn" type="submit" disabled={Boolean(ocupado) || !pat.trim()}>
              {ocupado === 'Conectando' ? 'Conectando' : 'Conectar'}
            </button>
            {inicial.conectado && (
              <button
                className="btn-sec"
                type="button"
                disabled={Boolean(ocupado)}
                onClick={() =>
                  void agir('Desconectando', async () => {
                    await chamar('desconectar')
                  })
                }
              >
                Desconectar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="secao">
        <div>
          <h2>Modelo da story</h2>
          <p className="ajuda">O bloco que escreve segue este texto. Troque pelo modelo da empresa.</p>
        </div>
        <form
          className="painel"
          onSubmit={(evento) => {
            evento.preventDefault()
            void agir('Salvando modelo', async () => {
              await salvar({ modeloStory: modelo })
            })
          }}
        >
          <label className="campo">
            <span>Modelo</span>
            <textarea className="alto" value={modelo} onChange={(evento) => setModelo(evento.target.value)} />
          </label>
          <button className="btn" type="submit" disabled={Boolean(ocupado)}>
            Salvar modelo
          </button>
        </form>
      </section>

      <section className="secao">
        <div>
          <h2>Card no board</h2>
          <p className="ajuda">Vale para card novo. Comentário em card existente não usa estes campos e não altera a descrição.</p>
        </div>
        <form
          className="painel"
          onSubmit={(evento) => {
            evento.preventDefault()
            void agir('Salvando board', async () => {
              await salvar({
                tipoWorkItem: tipo,
                campoDescricao,
                campoCriterios,
                areaPadrao: area,
                iteracaoPadrao: iteracao,
              })
            })
          }}
        >
          <label className="campo">
            <span>Tipo</span>
            <input value={tipo} onChange={(evento) => setTipo(evento.target.value)} />
          </label>
          <div className="linha">
            <label className="campo">
              <span>Campo da descrição</span>
              <input value={campoDescricao} onChange={(evento) => setCampoDescricao(evento.target.value)} />
            </label>
            <label className="campo">
              <span>Campo dos critérios</span>
              <input value={campoCriterios} onChange={(evento) => setCampoCriterios(evento.target.value)} />
            </label>
          </div>
          <div className="linha">
            <label className="campo">
              <span>Área padrão</span>
              <input value={area} onChange={(evento) => setArea(evento.target.value)} />
            </label>
            <label className="campo">
              <span>Iteração padrão</span>
              <input value={iteracao} onChange={(evento) => setIteracao(evento.target.value)} />
            </label>
          </div>
          <button className="btn" type="submit" disabled={Boolean(ocupado)}>
            Salvar board
          </button>
        </form>
      </section>

      <section className="secao">
        <div>
          <h2>Claude Code</h2>
          <p className="ajuda">O app chama o CLI já logado na sua assinatura. Não há chave de API aqui.</p>
        </div>
        <form
          className="painel"
          onSubmit={(evento) => {
            evento.preventDefault()
            void agir('Salvando Claude', async () => {
              const segundos = Number(timeoutSeg)
              if (!Number.isFinite(segundos)) throw new Error('O tempo limite precisa ser um número de segundos.')
              await salvar({ claudeBin, timeoutBlocoMs: Math.round(segundos * 1000) })
            })
          }}
        >
          <label className="campo">
            <span>Executável</span>
            <input value={claudeBin} onChange={(evento) => setClaudeBin(evento.target.value)} />
          </label>
          <label className="campo">
            <span>Tempo limite de cada bloco, em segundos</span>
            <input value={timeoutSeg} onChange={(evento) => setTimeoutSeg(evento.target.value)} inputMode="numeric" />
          </label>
          <button className="btn" type="submit" disabled={Boolean(ocupado)}>
            Salvar Claude
          </button>
        </form>
      </section>
    </div>
  )
}
