import { useEffect, useState } from 'react'
import type { PassoId } from '../../core/primeiro-uso'
import type { EstadoApp, Produto, Repositorio, WikiProduto } from '../../shared/tipos'
import { chamar } from '../api'
import { AcaoPrimaria } from '../components/react-bits/AcaoPrimaria'
import { AnimatedList } from '../components/react-bits/AnimatedList'
import { BlurText } from '../components/react-bits/BlurText'
import { CountUp } from '../components/react-bits/CountUp'
import { ShinyText } from '../components/react-bits/ShinyText'
import { SpotlightCard } from '../components/react-bits/SpotlightCard'
import { Erro, Vazio, mensagemDe } from '../ui'

type Remoto = { id: string; nome: string; projeto: string; remoteUrl: string; branchPadrao: string }

export function ProdutosView({
  estado,
  recarregar,
  foco = '',
}: {
  estado: EstadoApp
  recarregar: () => Promise<void>
  foco?: Extract<PassoId, 'repos' | 'produto'> | ''
}) {
  const [remotos, setRemotos] = useState<Remoto[]>([])
  const [marcados, setMarcados] = useState<string[]>(estado.repositorios.filter((repo) => repo.selecionado).map((repo) => repo.id))
  const [branches, setBranches] = useState<Record<string, string>>({})
  const [wikis, setWikis] = useState<Record<string, WikiProduto>>({})
  const [editando, setEditando] = useState<string>(estado.produtos[0]?.id ?? '')
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [ocupado, setOcupado] = useState('')
  const [andamento, setAndamento] = useState<Record<string, string>>({})

  useEffect(() => {
    let vivo = true
    if (!estado.ajustes.conectado) return
    chamar<Remoto[]>('listarRepositorios')
      .then((lista) => {
        if (vivo) setRemotos(lista)
      })
      .catch((falha: unknown) => {
        if (vivo) setErro(mensagemDe(falha))
      })
    return () => {
      vivo = false
    }
  }, [estado.ajustes.conectado])

  useEffect(() => {
    let vivo = true
    Promise.all(estado.produtos.map(async (produto) => [produto.id, await chamar<WikiProduto>('wiki', { produtoId: produto.id })] as const))
      .then((pares) => {
        if (!vivo) return
        setWikis(Object.fromEntries(pares))
      })
      .catch(() => {
        /* a lista de produtos continua visível sem o estado da wiki */
      })
    return () => {
      vivo = false
    }
  }, [estado.produtos])

  useEffect(() => {
    if (ocupado !== 'Clonando' && ocupado !== 'Atualizando') {
      setAndamento({})
      return
    }
    let vivo = true
    let emVoo = false
    const ler = () => {
      if (emVoo) return
      emVoo = true
      void chamar<{ id: string; progresso: string }[]>('andamentoClone')
        .then((listaAndamento) => {
          if (!vivo) return
          setAndamento(Object.fromEntries(listaAndamento.map((item) => [item.id, item.progresso])))
        })
        .catch(() => {
          /* o botão continua ocupado; a coluna mostra o último texto */
        })
        .finally(() => {
          emVoo = false
        })
    }
    ler()
    const timer = setInterval(ler, 1000)
    return () => {
      vivo = false
      clearInterval(timer)
    }
  }, [ocupado])

  useEffect(() => {
    if (foco !== 'repos' && foco !== 'produto') return
    document.getElementById(foco === 'repos' ? 'passo-repos' : 'passo-produto')?.scrollIntoView({ block: 'start' })
  }, [foco, estado.repositorios, estado.produtos])

  const lista = remotos.length > 0 ? remotos : estado.repositorios
  const local = new Map(estado.repositorios.map((repo) => [repo.id, repo]))

  async function agir(rotulo: string, trabalho: () => Promise<void>) {
    setOcupado(rotulo)
    setErro('')
    setAviso('')
    try {
      await trabalho()
      await recarregar()
    } catch (falha) {
      setErro(mensagemDe(falha))
    } finally {
      setOcupado('')
    }
  }

  function alternar(id: string) {
    setMarcados((atual) => (atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id]))
  }

  return (
    <>
      <div className="titulo">
        <h1><BlurText text="Produtos" /></h1>
        <AcaoPrimaria
          type="button"
          disabled={Boolean(ocupado) || !estado.ajustes.conectado}
          onClick={() =>
            void agir('Clonando', async () => {
              await chamar('salvarSelecao', { ids: marcados, branches })
            })
          }
        >
          {ocupado === 'Clonando' ? <ShinyText text="Trazendo" /> : 'Trazer os escolhidos'}
        </AcaoPrimaria>
      </div>
      <p className="sub">Um produto junta repositórios que o PM lê junto. A wiki dele só fica pronta depois do clone.</p>
      <Erro texto={erro} />
      {aviso && <p className="sub">{aviso}</p>}
      <div id="passo-repos" className={foco === 'repos' ? 'passo-atual' : undefined}>
      {!estado.ajustes.conectado && <Vazio>Conecte a organização em Conexões para listar os repositórios.</Vazio>}
      {estado.ajustes.conectado && lista.length === 0 && <Vazio>A organização não devolveu repositório.</Vazio>}
      {lista.length > 0 && (
        <div className="tabela">
        <table className="lista">
          <thead>
            <tr>
              <th>Trazer</th>
              <th>Repositório</th>
              <th>Projeto</th>
              <th>Branch</th>
              <th>Clone</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((repo) => {
              const daqui = local.get(repo.id)
              return (
                <tr key={repo.id}>
                  <td>
                    <input type="checkbox" checked={marcados.includes(repo.id)} onChange={() => alternar(repo.id)} aria-label={`Trazer ${repo.nome}`} />
                  </td>
                  <td>{repo.nome}</td>
                  <td>{repo.projeto}</td>
                  <td style={{ width: 240 }}>
                    <input
                      value={branches[repo.id] ?? daqui?.branchAcompanhada ?? repo.branchPadrao}
                      onChange={(evento) => setBranches({ ...branches, [repo.id]: evento.target.value })}
                      aria-label={`Branch de ${repo.nome}`}
                    />
                  </td>
                  <td>{rotuloClone(daqui, andamento[repo.id])}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      )}
      </div>
      <div className="acoes" style={{ marginTop: 12 }}>
        <button
          className="btn-sec"
          type="button"
          disabled={Boolean(ocupado)}
          onClick={() =>
            void agir('Atualizando', async () => {
              const resultado = await chamar<{ arquivosAlterados: string[] }>('atualizarRepositorios')
              setAviso(resultado.arquivosAlterados.length === 0 ? 'Nenhum arquivo mudou desde o último pull.' : `Mudou: ${resultado.arquivosAlterados.join(', ')}`)
            })
          }
        >
          {ocupado === 'Atualizando' ? 'Atualizando' : 'Atualizar clones'}
        </button>
      </div>

      <section className={foco === 'produto' ? 'bloco passo-atual' : 'bloco'} id="passo-produto">
        <div className="titulo">
          <h2>Conjuntos</h2>
          <button className="btn-texto" type="button" onClick={() => setEditando('')}>
            Novo produto
          </button>
        </div>
        {estado.produtos.length === 0 && <Vazio>Nenhum produto. Escolha repositórios já clonados e dê um nome.</Vazio>}
        {estado.produtos.length > 0 && (
          <AnimatedList className="conexoes-grade">
            {estado.produtos.map((produto) => {
              const wiki = wikis[produto.id]
              const prontos = wiki?.modulos.filter((modulo) => modulo.estado === 'pronto').length ?? 0
              const total = wiki?.modulos.length ?? 0
              return (
                <SpotlightCard as="article" className="conexao-card" key={produto.id}>
                  <h3>
                    <button className="link" type="button" aria-current={produto.id === editando ? 'true' : undefined} onClick={() => setEditando(produto.id)}>
                      {produto.nome}
                    </button>
                  </h3>
                  <p>{nomesRepos(produto, estado.repositorios)}</p>
                  <p className="sub">Depende de {produto.dependeDe.length === 0 ? 'ninguém' : produto.dependeDe.map((id) => estado.produtos.find((item) => item.id === id)?.nome ?? id).join(', ')}</p>
                  <p className="sub">Wiki {wiki ? <><CountUp to={prontos} />/<CountUp to={total} /></> : '—'}</p>
                </SpotlightCard>
              )
            })}
          </AnimatedList>
        )}
        <Editor
          produto={estado.produtos.find((item) => item.id === editando)}
          repos={estado.repositorios.filter((repo) => repo.selecionado && repo.estado === 'pronto')}
          produtos={estado.produtos}
          ocupado={ocupado}
          aoSalvar={(produto) =>
            void agir('Salvando', async () => {
              const salvo = await chamar<Produto>('salvarProduto', produto)
              setEditando(salvo.id)
            })
          }
          aoRemover={
            editando
              ? () => {
                  const nome = estado.produtos.find((item) => item.id === editando)?.nome ?? 'este produto'
                  if (!window.confirm(`Remover o produto ${nome}? Os clones continuam na máquina; o conjunto e a ligação com outros produtos saem.`)) return
                  void agir('Removendo', async () => {
                    await chamar('removerProduto', { id: editando })
                    setEditando('')
                  })
                }
              : undefined
          }
        />
      </section>
    </>
  )
}

function rotuloClone(repo: Repositorio | undefined, progresso?: string): string {
  if (progresso) return progresso
  if (!repo || !repo.selecionado) return 'fora'
  if (repo.estado === 'pronto') return repo.ultimoCommit ? `pronto · ${repo.ultimoCommit.slice(0, 7)}` : 'pronto'
  if (repo.estado === 'clonando') return 'clonando'
  if (repo.estado === 'erro') return repo.erro || 'erro'
  return 'não clonado'
}

function nomesRepos(produto: Produto, repos: Repositorio[]): string {
  return produto.repositorioIds.map((id) => repos.find((repo) => repo.id === id)?.nome ?? id).join(', ')
}

function Editor({
  produto,
  repos,
  produtos,
  ocupado,
  aoSalvar,
  aoRemover,
}: {
  produto?: Produto
  repos: Repositorio[]
  produtos: Produto[]
  ocupado: string
  aoSalvar: (produto: Produto) => void
  aoRemover?: () => void
}) {
  const [nome, setNome] = useState(produto?.nome ?? '')
  const [ids, setIds] = useState<string[]>(produto?.repositorioIds ?? [])
  const [depende, setDepende] = useState<string[]>(produto?.dependeDe ?? [])
  const [projetos, setProjetos] = useState((produto?.projetosBacklog ?? []).join(', '))
  const [areas, setAreas] = useState((produto?.areasBacklog ?? []).join(', '))
  const assinatura = `${produto?.id ?? ''}|${produto?.nome ?? ''}|${(produto?.repositorioIds ?? []).join(',')}|${(produto?.dependeDe ?? []).join(',')}|${(produto?.projetosBacklog ?? []).join(',')}|${(produto?.areasBacklog ?? []).join(',')}`

  useEffect(() => {
    setNome(produto?.nome ?? '')
    setIds(produto?.repositorioIds ?? [])
    setDepende(produto?.dependeDe ?? [])
    setProjetos((produto?.projetosBacklog ?? []).join(', '))
    setAreas((produto?.areasBacklog ?? []).join(', '))
  }, [assinatura])

  return (
    <form
      className="bloco"
      onSubmit={(evento) => {
        evento.preventDefault()
        aoSalvar({
          id: produto?.id ?? '',
          nome,
          repositorioIds: ids,
          dependeDe: depende,
          projetosBacklog: partir(projetos),
          areasBacklog: partir(areas),
        })
      }}
    >
      <h2>{produto ? produto.nome : 'Novo produto'}</h2>
      <label className="campo">
        <span>Nome</span>
        <input value={nome} onChange={(evento) => setNome(evento.target.value)} required />
      </label>
      <fieldset className="campo">
        <legend className="rotulo">Repositórios clonados</legend>
        {repos.length === 0 && <Vazio>Nenhum clone pronto. Traga um repositório antes de montar o produto.</Vazio>}
        <div className="checks">
          {repos.map((repo) => (
            <label key={repo.id}>
              <input
                type="checkbox"
                checked={ids.includes(repo.id)}
                onChange={() => setIds((atual) => (atual.includes(repo.id) ? atual.filter((item) => item !== repo.id) : [...atual, repo.id]))}
              />
              {repo.nome}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="campo">
        <legend className="rotulo">Liga com</legend>
        <div className="checks">
          {produtos
            .filter((item) => item.id !== produto?.id)
            .map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={depende.includes(item.id)}
                  onChange={() => setDepende((atual) => (atual.includes(item.id) ? atual.filter((id) => id !== item.id) : [...atual, item.id]))}
                />
                {item.nome}
              </label>
            ))}
        </div>
        {produtos.filter((item) => item.id !== produto?.id).length === 0 && <p className="sub">Não há outro produto para ligar.</p>}
      </fieldset>
      <div className="linha">
        <label className="campo">
          <span>Projetos do backlog</span>
          <input value={projetos} onChange={(evento) => setProjetos(evento.target.value)} placeholder="Pagamentos, Contas" />
        </label>
        <label className="campo">
          <span>Áreas</span>
          <input value={areas} onChange={(evento) => setAreas(evento.target.value)} placeholder="Empresa\Pagamentos" />
        </label>
      </div>
      <div className="acoes">
        <button className="btn" type="submit" disabled={Boolean(ocupado) || ids.length === 0}>
          {ocupado === 'Salvando' ? 'Salvando' : 'Salvar produto'}
        </button>
        {aoRemover && (
          <button className="btn-texto btn-perigo" type="button" disabled={Boolean(ocupado)} onClick={aoRemover}>
            Remover
          </button>
        )}
      </div>
    </form>
  )
}

function partir(texto: string): string[] {
  return texto
    .split(',')
    .map((parte) => parte.trim())
    .filter(Boolean)
}
