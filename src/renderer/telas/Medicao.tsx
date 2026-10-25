import { useState } from 'react'
import type { EstadoApp, StoryRun } from '../../shared/tipos'
import { chamar } from '../api'
import { BlurText } from '../components/react-bits/BlurText'
import { CountUp } from '../components/react-bits/CountUp'
import { SpotlightCard } from '../components/react-bits/SpotlightCard'
import { Erro, Vazio, mensagemDe } from '../ui'

export function MedicaoView({ estado, recarregar }: { estado: EstadoApp; recarregar: () => Promise<void> }) {
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState('')

  async function votar(id: string, voto: 'passou' | 'voltou') {
    setOcupado(`${id}-${voto}`)
    setErro('')
    try {
      await chamar<StoryRun>('registrarVolta', { id, voto })
      await recarregar()
    } catch (falha) {
      setErro(mensagemDe(falha))
    } finally {
      setOcupado('')
    }
  }

  const aceitos = estado.stories.reduce((total, story) => total + story.aceitos, 0)
  const descartados = estado.stories.reduce((total, story) => total + story.descartados, 0)
  const voltou = estado.stories.reduce((total, story) => total + story.medicao.voltou, 0)
  const passou = estado.stories.reduce((total, story) => total + story.medicao.passou, 0)

  return (
    <>
      <h1><BlurText text="Medição" /></h1>
      {estado.stories.length === 0 ? (
        <p className="sub">Ainda não há story para medir.</p>
      ) : (
        <SpotlightCard className="painel" style={{ marginBottom: 20 }}>
          <p>
            <CountUp to={aceitos} /> aceitos e <CountUp to={descartados} /> descartados no total. Primeira passagem registrada <CountUp to={passou} /> {passou === 1 ? 'vez' : 'vezes'}. O card voltou <CountUp to={voltou} /> {voltou === 1 ? 'vez' : 'vezes'}.
          </p>
        </SpotlightCard>
      )}
      <Erro texto={erro} />
      {estado.stories.length === 0 && <Vazio>Rode uma story na Esteira. A contagem aparece aqui, por bloco.</Vazio>}
      {estado.stories.length > 0 && (
        <div className="tabela">
        <table className="lista">
          <thead>
            <tr>
              <th>Story</th>
              <th className="num">Aceitos</th>
              <th className="num">Descartados</th>
              <th className="num">Pendentes</th>
              <th className="num">Passou</th>
              <th className="num">Voltou</th>
              <th>Volta do card</th>
            </tr>
          </thead>
          <tbody>
            {estado.stories.map((story) => (
              <tr key={story.id}>
                <td style={{ minWidth: 280 }}>
                  {story.titulo || 'Story sem título'}
                  <small>
                    {story.produtoNome}
                    {story.porBloco.length > 0
                      ? ` · ${story.porBloco.map((bloco) => `${bloco.blocoNome} ${bloco.aceitos} ${bloco.aceitos === 1 ? 'aceito' : 'aceitos'}, ${bloco.descartados} ${bloco.descartados === 1 ? 'descartado' : 'descartados'}`).join(' · ')}`
                      : ''}
                  </small>
                </td>
                <td className="num"><CountUp to={story.aceitos} /></td>
                <td className="num"><CountUp to={story.descartados} /></td>
                <td className="num"><CountUp to={story.pendentes} /></td>
                <td className="num"><CountUp to={story.medicao.passou} /></td>
                <td className="num"><CountUp to={story.medicao.voltou} /></td>
                <td>
                  {story.publicacao ? (
                    <div className="acoes">
                      <button className="btn-sec" type="button" disabled={Boolean(ocupado)} onClick={() => void votar(story.id, 'passou')}>
                        {ocupado === `${story.id}-passou` ? '…' : 'Passou'}
                      </button>
                      <button className="btn-sec" type="button" disabled={Boolean(ocupado)} onClick={() => void votar(story.id, 'voltou')}>
                        {ocupado === `${story.id}-voltou` ? '…' : 'Voltou'}
                      </button>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </>
  )
}
