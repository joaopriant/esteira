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
  const [retorno, setRetorno] = useState<{ secao: string; ok: boolean; texto: string } | null>(null)
  const [ocupado, setOcupado] = useState('')

  // O retorno aparece ao lado do botão que o pediu, não no topo da página.
  async function agir(secao: string, rotulo: string, trabalho: () => Promise<void>, sucesso = 'Guardado nesta máquina.') {
    setOcupado(rotulo)
    setRetorno(null)
    try {
      await trabalho()
      await recarregar()
      setRetorno({ secao, ok: true, texto: sucesso })
    } catch (falha) {
      setRetorno({ secao, ok: false, texto: mensagemDe(falha) })
    } finally {
      setOcupado('')
    }
  }

  // Função comum, não componente: um componente declarado aqui dentro seria recriado a cada render,
  // e o span de status nasceria já com o texto, sem ser anunciado pelo leitor de tela.
  function mostrarRetorno(secao: string) {
    if (retorno?.secao !== secao) return <span className="status" role="status" />
    if (!retorno.ok) return <Erro texto={retorno.texto} />
    return (
      <span className="status ok" role="status">
        {retorno.texto}
      </span>
    )
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

      <section className="secao">
        <div>
          <h2>Organização</h2>
          <p className="ajuda">O token fica no cofre da máquina. O app pede Code Read e Work Items Read & Write.</p>
        </div>
        <form
          className="painel"
          onSubmit={(evento) => {
            evento.preventDefault()
            void agir(
              'org',
              'Conectando',
              async () => {
                await chamar('conectar', { orgUrl, pat })
                setPat('')
              },
              'Conectada. O token foi para o cofre da máquina.',
            )
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
                  void agir(
                    'org',
                    'Desconectando',
                    async () => {
                      await chamar('desconectar')
                    },
                    'Desconectada. O token saiu do cofre.',
                  )
                }
              >
                {ocupado === 'Desconectando' ? 'Desconectando' : 'Desconectar'}
              </button>
            )}
            {mostrarRetorno('org')}
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
            void agir('modelo', 'Salvando modelo', async () => {
              await salvar({ modeloStory: modelo })
            })
          }}
        >
          <label className="campo">
            <span>Modelo</span>
            <textarea className="alto" value={modelo} onChange={(evento) => setModelo(evento.target.value)} />
          </label>
          <div className="acoes">
            <button className="btn-sec" type="submit" disabled={Boolean(ocupado) || modelo === inicial.modeloStory}>
              {ocupado === 'Salvando modelo' ? 'Salvando' : 'Salvar modelo'}
            </button>
            {mostrarRetorno('modelo')}
          </div>
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
            void agir('board', 'Salvando board', async () => {
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
          <div className="acoes">
            <button className="btn-sec" type="submit" disabled={Boolean(ocupado)}>
              {ocupado === 'Salvando board' ? 'Salvando' : 'Salvar board'}
            </button>
            {mostrarRetorno('board')}
          </div>
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
            void agir('claude', 'Salvando Claude', async () => {
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
          <div className="acoes">
            <button className="btn-sec" type="submit" disabled={Boolean(ocupado)}>
              {ocupado === 'Salvando Claude' ? 'Salvando' : 'Salvar Claude'}
            </button>
            {mostrarRetorno('claude')}
          </div>
        </form>
      </section>
    </div>
  )
}
