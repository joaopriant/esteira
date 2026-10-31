import { useEffect, useState } from 'react'
import type { Ajustes, EstadoApp } from '../../shared/tipos'
import { chamar } from '../api'
import { BlurText } from '../components/react-bits/BlurText'
import { SpotlightCard } from '../components/react-bits/SpotlightCard'
import { Erro, mensagemDe } from '../ui'

export function AjustesView({
  estado,
  recarregar,
  aoConexoes,
  foco = '',
}: {
  estado: EstadoApp
  recarregar: () => Promise<void>
  aoConexoes?: () => void
  foco?: 'modelo' | ''
}) {
  const inicial = estado.ajustes
  const [modelo, setModelo] = useState(inicial.modeloStory)
  const [tipo, setTipo] = useState(inicial.tipoWorkItem)
  const [campoDescricao, setCampoDescricao] = useState(inicial.campoDescricao)
  const [campoCriterios, setCampoCriterios] = useState(inicial.campoCriterios)
  const [area, setArea] = useState(inicial.areaPadrao)
  const [iteracao, setIteracao] = useState(inicial.iteracaoPadrao)
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

  useEffect(() => {
    if (foco !== 'modelo') return
    document.getElementById('passo-modelo')?.scrollIntoView({ block: 'start' })
  }, [foco])

  async function salvar(parcial: Partial<Ajustes>) {
    await chamar('salvarAjustes', parcial)
  }

  return (
    <div className="ajustes">
      <h1><BlurText text="Ajustes" /></h1>
      <p className="sub">Modelo da story e campos do card. Token, pasta e Claude ficam em Conexões.</p>
      <SpotlightCard className="painel" style={{ marginBottom: 8 }}>
        <h2>Conexões</h2>
        <p className="ajuda">Azure DevOps, Claude Code e as fontes do Radar saíram daqui. O PAT e os tokens continuam no cofre da máquina.</p>
        {aoConexoes && (
          <button className="btn-sec" type="button" onClick={aoConexoes}>Abrir Conexões</button>
        )}
      </SpotlightCard>

      <section className={foco === 'modelo' ? 'secao passo-atual' : 'secao'} id="passo-modelo">
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
            <button className="btn-sec" type="submit" disabled={Boolean(ocupado) || (modelo === inicial.modeloStory && inicial.modeloConferido)}>
              {ocupado === 'Salvando modelo' ? 'Salvando' : modelo === inicial.modeloStory && !inicial.modeloConferido ? 'Usar este modelo' : 'Salvar modelo'}
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
          <label className="campo">
            <span>Campo da descrição</span>
            <input value={campoDescricao} onChange={(evento) => setCampoDescricao(evento.target.value)} spellCheck={false} />
          </label>
          <label className="campo">
            <span>Campo dos critérios</span>
            <input value={campoCriterios} onChange={(evento) => setCampoCriterios(evento.target.value)} spellCheck={false} />
          </label>
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

    </div>
  )
}
