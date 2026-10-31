import { useCallback, useEffect, useState } from 'react'
import { passoAtual, passosPrimeiroUso, textoDoAviso, type PassoId, type PassoPrimeiroUso } from '../core/primeiro-uso'
import type { EstadoApp } from '../shared/tipos'
import { chamar } from './api'
import { PrimeiroUso } from './PrimeiroUso'
import { CountUp } from './components/react-bits/CountUp'
import { GradientText } from './components/react-bits/GradientText'
import { AjustesView } from './telas/Ajustes'
import { ConexoesView } from './telas/Conexoes'
import { EsteiraView } from './telas/Esteira'
import { FluxoView } from './telas/Fluxo'
import { MedicaoView } from './telas/Medicao'
import { ProdutosView } from './telas/Produtos'
import { RadarView } from './telas/Radar'
import { WikiView } from './telas/Wiki'
import { Erro, Marca, mensagemDe, nomeOrg } from './ui'

type Tela = 'esteira' | 'radar' | 'conexoes' | 'wiki' | 'produtos' | 'fluxo' | 'medicao' | 'ajustes'

const TELAS: { id: Tela; nome: string }[] = [
  { id: 'esteira', nome: 'Esteira' },
  { id: 'radar', nome: 'Radar' },
  { id: 'conexoes', nome: 'Conexões' },
  { id: 'wiki', nome: 'Wiki' },
  { id: 'produtos', nome: 'Produtos' },
  { id: 'fluxo', nome: 'Fluxo' },
  { id: 'medicao', nome: 'Medição' },
]

export function App() {
  const [tela, setTela] = useState<Tela>('esteira')
  const [menu, setMenu] = useState(false)
  const [estado, setEstado] = useState<EstadoApp | null>(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [abrirStory, setAbrirStory] = useState('')
  const [foco, setFoco] = useState<PassoId | ''>('')
  const [adiarPrimeiroUso, setAdiarPrimeiroUso] = useState(false)

  const recarregar = useCallback(async () => {
    try {
      setEstado(await chamar<EstadoApp>('estado'))
      setErro('')
    } catch (falha) {
      setErro(mensagemDe(falha))
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  function ir(proxima: Tela) {
    setFoco('')
    setTela(proxima)
    setMenu(false)
  }

  function irPasso(passo: PassoPrimeiroUso) {
    setFoco(passo.id)
    setTela(passo.tela)
    setMenu(false)
  }

  const org = estado?.ajustes.orgUrl ? nomeOrg(estado.ajustes.orgUrl) : 'Sem organização'
  const conexao = estado?.ajustes.conectado ? 'conectado' : 'desconectado'
  const nomeTela = tela === 'ajustes' ? 'Ajustes' : TELAS.find((item) => item.id === tela)?.nome
  const passos = estado && !adiarPrimeiroUso ? passosPrimeiroUso(estado) : null
  const atual = passos ? passoAtual(passos) : null
  const aviso = atual ? textoDoAviso(atual) : null

  return (
    <div className="app">
      <aside className={menu ? 'sidebar aberta' : 'sidebar'}>
        <div className="marca">
          <Marca />
          <div>
            <strong><GradientText text="Esteira" /></strong>
            <span>{org}</span>
          </div>
        </div>
        {menu && (
          <button className="fechar-menu btn-sec" type="button" onClick={() => setMenu(false)}>
            Fechar menu
          </button>
        )}
        <nav className="nav" aria-label="Seções">
          {TELAS.map((item) => (
            <button key={item.id} type="button" aria-current={tela === item.id ? 'page' : undefined} onClick={() => ir(item.id)}>
              {item.nome}
              {item.id === 'radar' && (estado?.radarPendentes ?? 0) > 0 && <span className="selo"><CountUp to={estado?.radarPendentes ?? 0} /></span>}
              {item.id === 'conexoes' && (estado?.conexoesAtivas ?? 0) > 0 && <span className="selo"><CountUp to={estado?.conexoesAtivas ?? 0} /></span>}
            </button>
          ))}
        </nav>
        <div className="nav-baixo">
          <button type="button" aria-current={tela === 'ajustes' ? 'page' : undefined} onClick={() => ir('ajustes')}>
            Ajustes
          </button>
        </div>
      </aside>
      <div className="miolo">
        <header className="topbar">
          <button className="menu btn-sec" type="button" onClick={() => setMenu((aberto) => !aberto)}>
            {menu ? 'Fechar' : 'Menu'}
          </button>
          <p>
            {org} · {nomeTela}
          </p>
          {aviso && atual && tela !== atual.tela ? (
            <p className="alerta-conexao">
              {aviso.texto}
              <button className="btn-texto" type="button" onClick={() => irPasso(atual)}>
                {aviso.acao}
              </button>
            </p>
          ) : !passos && estado && !estado.ajustes.conectado && tela !== 'ajustes' ? (
            // Sem organização nada roda; o aviso leva direto para onde se resolve.
            <p className="alerta-conexao">
              Nenhuma organização conectada.
              <button className="btn-texto" type="button" onClick={() => ir('conexoes')}>
                Conectar em Conexões
              </button>
            </p>
          ) : (
            <p>
              {estado?.ajustes.modo === 'falso' ? 'Exemplo local' : 'Nesta máquina'} · {conexao}
            </p>
          )}
        </header>
        <main className={tela === 'fluxo' ? 'sheet estudio' : 'sheet'}>
          {passos && <PrimeiroUso passos={passos} onIr={irPasso} onAdiar={() => setAdiarPrimeiroUso(true)} />}
          {carregando && <p>Carregando a Esteira.</p>}
          {!carregando && erro && !estado && (
            <>
              <Erro texto={erro} />
              <button className="btn" type="button" onClick={() => void recarregar()}>
                Tentar de novo
              </button>
            </>
          )}
          {estado && tela === 'esteira' && <EsteiraView estado={estado} recarregar={recarregar} abrirId={abrirStory} />}
          {estado && tela === 'radar' && (
            <RadarView
              estado={estado}
              recarregar={recarregar}
              aoConexoes={() => ir('conexoes')}
              aoEnviar={(id) => {
                setAbrirStory(id)
                setTela('esteira')
              }}
            />
          )}
          {estado && tela === 'conexoes' && (
            <ConexoesView estado={estado} recarregar={recarregar} foco={foco === 'pat' || foco === 'claude' ? foco : ''} />
          )}
          {estado && tela === 'wiki' && <WikiView estado={estado} />}
          {estado && tela === 'produtos' && (
            <ProdutosView estado={estado} recarregar={recarregar} foco={foco === 'repos' || foco === 'produto' ? foco : ''} />
          )}
          {estado && tela === 'fluxo' && <FluxoView aoConexoes={() => ir('conexoes')} />}
          {estado && tela === 'medicao' && <MedicaoView estado={estado} recarregar={recarregar} />}
          {estado && tela === 'ajustes' && (
            <AjustesView estado={estado} recarregar={recarregar} aoConexoes={() => ir('conexoes')} foco={foco === 'modelo' ? foco : ''} />
          )}
        </main>
      </div>
    </div>
  )
}
