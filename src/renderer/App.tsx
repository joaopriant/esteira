import { useCallback, useEffect, useState } from 'react'
import type { EstadoApp } from '../shared/tipos'
import { chamar } from './api'
import { AjustesView } from './telas/Ajustes'
import { EsteiraView } from './telas/Esteira'
import { FluxoView } from './telas/Fluxo'
import { MedicaoView } from './telas/Medicao'
import { ProdutosView } from './telas/Produtos'
import { WikiView } from './telas/Wiki'
import { Erro, Marca, mensagemDe, nomeOrg } from './ui'

type Tela = 'esteira' | 'wiki' | 'produtos' | 'fluxo' | 'medicao' | 'ajustes'

const TELAS: { id: Tela; nome: string }[] = [
  { id: 'esteira', nome: 'Esteira' },
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
    setTela(proxima)
    setMenu(false)
  }

  const org = estado?.ajustes.orgUrl ? nomeOrg(estado.ajustes.orgUrl) : 'Sem organização'
  const conexao = estado?.ajustes.conectado ? 'conectado' : 'desconectado'
  const nomeTela = tela === 'ajustes' ? 'Ajustes' : TELAS.find((item) => item.id === tela)?.nome

  return (
    <div className="app">
      <aside className={menu ? 'sidebar aberta' : 'sidebar'}>
        <div className="marca">
          <Marca />
          <div>
            <strong>Esteira</strong>
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
          <p>
            {estado?.ajustes.modo === 'falso' ? 'Exemplo local' : 'Nesta máquina'} · {conexao}
          </p>
        </header>
        <main className="sheet">
          {carregando && <p>Carregando a Esteira.</p>}
          {!carregando && erro && !estado && (
            <>
              <Erro texto={erro} />
              <button className="btn" type="button" onClick={() => void recarregar()}>
                Tentar de novo
              </button>
            </>
          )}
          {estado && tela === 'esteira' && <EsteiraView estado={estado} recarregar={recarregar} />}
          {estado && tela === 'wiki' && <WikiView estado={estado} />}
          {estado && tela === 'produtos' && <ProdutosView estado={estado} recarregar={recarregar} />}
          {estado && tela === 'fluxo' && <FluxoView />}
          {estado && tela === 'medicao' && <MedicaoView estado={estado} recarregar={recarregar} />}
          {estado && tela === 'ajustes' && <AjustesView estado={estado} recarregar={recarregar} />}
        </main>
      </div>
    </div>
  )
}
