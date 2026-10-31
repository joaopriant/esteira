import { useEffect, useRef, useState } from 'react'
import type { BlocoFluxo, EstatisticaBloco, FonteRadar, SkillDisponivel } from '../../shared/tipos'
import { duplicarBloco, fraseContrato, inserirBloco, moverBloco } from '../../core/fluxo-padrao'
import { chamar } from '../api'
import { AcaoPrimaria } from '../components/react-bits/AcaoPrimaria'
import { BlurText } from '../components/react-bits/BlurText'
import { ShinyText } from '../components/react-bits/ShinyText'
import { Erro, mensagemDe } from '../ui'

interface Preset {
  id: string
  nome: string
  blocos: BlocoFluxo[]
}

interface Marco {
  blocos: BlocoFluxo[]
  selecao: string | null
}

export function FluxoView({ aoConexoes }: { aoConexoes?: () => void }) {
  const [blocos, setBlocos] = useState<BlocoFluxo[]>([])
  const [gravado, setGravado] = useState('[]')
  const [skills, setSkills] = useState<SkillDisponivel[]>([])
  const [fontes, setFontes] = useState<FonteRadar[]>([])
  const [presets, setPresets] = useState<Preset[]>([])
  const [stats, setStats] = useState<EstatisticaBloco[]>([])
  const [selecao, setSelecao] = useState<string | null>(null)
  const [preview, setPreview] = useState('')
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [pronto, setPronto] = useState(false)
  const [pilha, setPilha] = useState<Marco[]>([])
  const [pendente, setPendente] = useState<Preset | null>(null)
  const [soltar, setSoltar] = useState<number | null>(null)
  const marcoTexto = useRef(false)

  useEffect(() => {
    let vivo = true
    Promise.all([
      chamar<BlocoFluxo[]>('fluxo'),
      chamar<SkillDisponivel[]>('listarSkills'),
      chamar<FonteRadar[]>('fontesRadar'),
      chamar<Preset[]>('presetsFluxo'),
      chamar<EstatisticaBloco[]>('estatisticasBlocos'),
    ])
      .then(([fluxo, lista, fontesRadar, modelos, numeros]) => {
        if (!vivo) return
        setBlocos(fluxo)
        setGravado(JSON.stringify(fluxo))
        setSkills(lista)
        setFontes(fontesRadar)
        setPresets(modelos)
        setStats(numeros)
        setSelecao(fluxo[0]?.id ?? null)
        setPronto(true)
      })
      .catch((falha: unknown) => {
        if (vivo) setErro(mensagemDe(falha))
      })
    return () => {
      vivo = false
    }
  }, [])

  const selecionado = blocos.find((bloco) => bloco.id === selecao) ?? null
  const indiceSelecionado = selecionado ? blocos.findIndex((bloco) => bloco.id === selecionado.id) : -1
  const sujo = JSON.stringify(blocos) !== gravado
  const ativo = presets.find((preset) => JSON.stringify(preset.blocos) === JSON.stringify(blocos))?.id ?? ''
  const skillId = selecionado?.fonte.tipo === 'skill' ? selecionado.fonte.skillId : ''
  const ativas = fontes.filter((fonte) => fonte.ativa)

  useEffect(() => {
    if (!skillId) {
      setPreview('')
      return
    }
    let vivo = true
    chamar<{ texto: string }>('lerSkillTexto', { id: skillId })
      .then((resposta) => {
        if (vivo) setPreview(resposta.texto)
      })
      .catch(() => {
        if (vivo) setPreview('')
      })
    return () => {
      vivo = false
    }
  }, [skillId])

  function limparRetorno() {
    setOk('')
    setErro('')
  }

  function lembrar() {
    // shortcut: 30 passos, revisar se o desfazer precisar atravessar uma sessão
    setPilha((atual) => [...atual, { blocos, selecao }].slice(-30))
  }

  function aplicar(proximos: BlocoFluxo[], selecaoNova?: string | null) {
    const mesmaLista = JSON.stringify(proximos) === JSON.stringify(blocos)
    const mesmaSelecao = selecaoNova === undefined || selecaoNova === selecao
    if (mesmaLista && mesmaSelecao) return
    if (!mesmaLista) lembrar()
    setBlocos(proximos)
    if (selecaoNova !== undefined) setSelecao(selecaoNova)
    setPendente(null)
    limparRetorno()
  }

  function substituir(id: string, bloco: BlocoFluxo, selecaoNova?: string) {
    aplicar(blocos.map((item) => (item.id === id ? bloco : item)), selecaoNova ?? selecao)
  }

  function desfazer() {
    const anterior = pilha[pilha.length - 1]
    if (!anterior) return
    setPilha((atual) => atual.slice(0, -1))
    setBlocos(anterior.blocos)
    setSelecao(anterior.selecao)
    setPendente(null)
    marcoTexto.current = false
    limparRetorno()
  }

  function novoBloco(): BlocoFluxo {
    return {
      id: `b-${crypto.randomUUID().slice(0, 8)}`,
      nome: 'Novo bloco',
      papel: 'confrontar',
      modo: 'por-clique',
      fonte: { tipo: 'instrucao', texto: 'Diga o que confrontar. Cite arquivo e trecho, ou diga que não encontrou.' },
    }
  }

  function inserir(indice: number) {
    const bloco = novoBloco()
    aplicar(inserirBloco(blocos, indice, bloco), bloco.id)
  }

  function mover(de: number, para: number) {
    const proximos = moverBloco(blocos, de, para)
    if (proximos === blocos) return
    aplicar(proximos)
  }

  function escolherModelo(id: string) {
    if (id === 'personalizado') return
    const preset = presets.find((item) => item.id === id)
    if (!preset) return
    if (JSON.stringify(preset.blocos) === JSON.stringify(blocos)) {
      setPendente(null)
      return
    }
    setPendente(preset)
  }

  function aplicarModelo() {
    if (!pendente) return
    aplicar(pendente.blocos, pendente.blocos[0]?.id ?? null)
  }

  if (!pronto && !erro) return <p>Abrindo o fluxo.</p>

  const numeros = selecionado ? stats.find((item) => item.blocoId === selecionado.id) ?? stats.find((item) => item.blocoNome === selecionado.nome) : undefined
  const taxa = numeros && numeros.gerados > 0 ? Math.round((numeros.aceitos / numeros.gerados) * 100) : null
  const nomesFonte = nomesProvedores(ativas)
  const fontesVisiveis = nomesFonte.slice(0, 2)
  const fontesOcultas = nomesFonte.slice(2)

  return (
    <div className="fluxo-estudio">
      <div className="titulo">
        <h1><BlurText text="Fluxo" /></h1>
        <div className="fluxo-topo">
          <label className="fluxo-modelo">
            Modelo
            <select
              value={pendente?.id ?? (ativo || 'personalizado')}
              onChange={(evento) => escolherModelo(evento.target.value)}
            >
              {!ativo && !pendente && <option value="personalizado">Personalizado</option>}
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>{nomeModelo(preset)}</option>
              ))}
            </select>
          </label>
          <div className="fluxo-estado">
            {pilha.length > 0 && <span className="num">{rotuloMudancas(pilha.length)}</span>}
            <button className="btn-texto" type="button" onClick={desfazer} disabled={pilha.length === 0}>Desfazer</button>
            {sujo ? (
              <AcaoPrimaria
                type="button"
                disabled={ocupado || blocos.length === 0}
                onClick={() => {
                  setOcupado(true)
                  limparRetorno()
                  void chamar('salvarFluxo', { blocos })
                    .then(() => {
                      setGravado(JSON.stringify(blocos))
                      setPilha([])
                      setOk('Fluxo salvo. A próxima story usa esta ordem.')
                    })
                    .catch((falha: unknown) => setErro(mensagemDe(falha)))
                    .finally(() => setOcupado(false))
                }}
              >
                {ocupado ? <ShinyText text="Salvando" /> : 'Salvar fluxo'}
              </AcaoPrimaria>
            ) : (
              <button className="btn-sec" type="button" disabled>Salvo</button>
            )}
          </div>
        </div>
      </div>
      <p className="fluxo-legenda">
        <span className="amostra amostra-cheia" aria-hidden="true" />
        Linha cheia: segue sozinho.
        <span className="amostra amostra-traco" aria-hidden="true" />
        Portão: a esteira para e espera você.
      </p>
      {pendente && (
        <div className="confirma-modelo" role="group" aria-label="Confirmar troca de modelo" onKeyDown={(evento) => { if (evento.key === 'Escape') setPendente(null) }}>
          <p>Troca {blocos.length} {blocos.length === 1 ? 'bloco' : 'blocos'} por {pendente.blocos.length}.</p>
          <button className="btn-sec" type="button" onClick={aplicarModelo}>Aplicar modelo</button>
          <button className="btn-texto" type="button" onClick={() => setPendente(null)}>Cancelar</button>
        </div>
      )}
      <Erro texto={erro} />
      {ok && <p className="status ok" role="status">{ok}</p>}
      <div className="fluxo-corpo">
        <div className="fluxo-espinha">
          <article className="no-fixo">
            <p className="fixo-rotulo">
              <strong>Entrada</strong>
              <span><MarcaFixa /> fixa</span>
              <span className="fixo-frase">Ideia do PM ou sugestão do Radar</span>
            </p>
            <div className="fixo-chips">
              <span className="chip-fonte">Manual</span>
              {fontesVisiveis.map((nome) => (
                <ChipFonte key={nome} nome={nome} aoClicar={aoConexoes} />
              ))}
              {fontesOcultas.length > 0 && (
                <ChipFonte
                  nome={`+${fontesOcultas.length}`}
                  aoClicar={aoConexoes}
                  rotulo={`Mais ${fontesOcultas.length} fontes: ${fontesOcultas.join(', ')}. Abre Conexões.`}
                />
              )}
            </div>
          </article>
          <ol className="fluxo-blocos">
            {blocos.map((bloco, indice) => (
              <li key={bloco.id}>
                <Ligacao
                  pausa={bloco.modo === 'por-clique'}
                  rotuloMais={`Inserir bloco antes de ${bloco.nome}`}
                  aoInserir={() => inserir(indice)}
                />
                <article
                  className={`no-bloco${selecao === bloco.id ? ' selecionado' : ''}${soltar === indice ? ' soltando' : ''}`}
                  aria-current={selecao === bloco.id ? 'true' : undefined}
                  onDragOver={(evento) => {
                    evento.preventDefault()
                    if (soltar !== indice) setSoltar(indice)
                  }}
                  onDrop={(evento) => {
                    evento.preventDefault()
                    const de = Number(evento.dataTransfer.getData('text/plain'))
                    setSoltar(null)
                    if (Number.isNaN(de)) return
                    mover(de, indice)
                  }}
                >
                  <button
                    className="no-abrir"
                    type="button"
                    aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                    onClick={() => setSelecao(bloco.id)}
                    onKeyDown={(evento) => {
                      if (!evento.altKey) return
                      if (evento.key === 'ArrowUp') {
                        evento.preventDefault()
                        mover(indice, indice - 1)
                      }
                      if (evento.key === 'ArrowDown') {
                        evento.preventDefault()
                        mover(indice, indice + 1)
                      }
                    }}
                  >
                    <span className="indice">{indice + 1}</span>
                    <MarcaPapel papel={bloco.papel} />
                    <strong>{bloco.nome}</strong>
                  </button>
                  <button
                    className="chip-modo"
                    type="button"
                    aria-label={bloco.modo === 'por-clique' ? 'Modo: pausa para revisar. Alternar para automático.' : 'Modo: automático. Alternar para pausa para revisar.'}
                    onClick={() => substituir(bloco.id, { ...bloco, modo: bloco.modo === 'automatico' ? 'por-clique' : 'automatico' }, bloco.id)}
                  >
                    {bloco.modo === 'por-clique' ? 'Pausa p/ revisar' : 'Automático'}
                  </button>
                  <span
                    className="alca"
                    draggable
                    title="Arrastar para reordenar"
                    onDragStart={(evento) => {
                      evento.dataTransfer.setData('text/plain', String(indice))
                      evento.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragEnd={() => setSoltar(null)}
                  >
                    <Alca />
                  </span>
                </article>
              </li>
            ))}
          </ol>
          <Ligacao
            pausa={false}
            rotuloMais={blocos.length === 0 ? 'Inserir o primeiro bloco' : 'Inserir bloco antes da saída'}
            aoInserir={() => inserir(blocos.length)}
          />
          <article className="no-fixo">
            <p className="fixo-rotulo">
              <strong>Saída</strong>
              <span><MarcaFixa /> fixa</span>
            </p>
            <p className="fixo-linha">Story e achados → publicar no Boards só com clique</p>
          </article>
          <button className="adicionar-bloco" type="button" onClick={() => inserir(blocos.length)}>+ Adicionar bloco</button>
        </div>
        <aside className="inspetor" aria-label="Inspetor do bloco">
          {selecionado ? (
            <>
              <div className="titulo">
                <h2>{indiceSelecionado + 1} · {selecionado.nome}</h2>
                <div className="acoes">
                  <button className="btn-sec btn-icone" type="button" aria-label="Mover para cima" disabled={indiceSelecionado <= 0} onClick={() => mover(indiceSelecionado, indiceSelecionado - 1)}>
                    <Seta para="cima" />
                  </button>
                  <button className="btn-sec btn-icone" type="button" aria-label="Mover para baixo" disabled={indiceSelecionado < 0 || indiceSelecionado >= blocos.length - 1} onClick={() => mover(indiceSelecionado, indiceSelecionado + 1)}>
                    <Seta para="baixo" />
                  </button>
                  <button className="btn-sec" type="button" onClick={() => {
                    const copiaId = `c-${crypto.randomUUID().slice(0, 8)}`
                    aplicar(duplicarBloco(blocos, indiceSelecionado, copiaId), copiaId)
                  }}>Duplicar</button>
                  <button className="btn-texto btn-perigo" type="button" onClick={() => {
                    const proximos = blocos.filter((item) => item.id !== selecionado.id)
                    const vizinho = proximos[indiceSelecionado] ?? proximos[indiceSelecionado - 1] ?? null
                    aplicar(proximos, vizinho?.id ?? null)
                  }}>Remover</button>
                </div>
              </div>
              <label className="campo">
                <span>Nome</span>
                <input
                  value={selecionado.nome}
                  onFocus={() => { marcoTexto.current = false }}
                  onChange={(evento) => {
                    const nome = evento.target.value
                    if (!marcoTexto.current) {
                      lembrar()
                      marcoTexto.current = true
                    }
                    setBlocos((atual) => atual.map((item) => (item.id === selecionado.id ? { ...selecionado, nome } : item)))
                    setPendente(null)
                    limparRetorno()
                  }}
                />
              </label>
              <div className="inspetor-par">
                <div>
                  <p className="rotulo">Papel</p>
                  <div className="escolha" role="group" aria-label="Papel">
                    <button type="button" className="btn-sec" aria-pressed={selecionado.papel === 'escrever'} onClick={() => substituir(selecionado.id, { ...selecionado, papel: 'escrever' })}>Escrever</button>
                    <button type="button" className="btn-sec" aria-pressed={selecionado.papel === 'confrontar'} onClick={() => substituir(selecionado.id, { ...selecionado, papel: 'confrontar' })}>Confrontar</button>
                  </div>
                </div>
                <div>
                  <p className="rotulo">Quando roda</p>
                  <div className="escolha" role="group" aria-label="Quando roda">
                    <button type="button" className="btn-sec" aria-pressed={selecionado.modo === 'automatico'} onClick={() => substituir(selecionado.id, { ...selecionado, modo: 'automatico' })}>Automático</button>
                    <button type="button" className="btn-sec" aria-pressed={selecionado.modo === 'por-clique'} onClick={() => substituir(selecionado.id, { ...selecionado, modo: 'por-clique' })}>Pausa p/ revisar</button>
                  </div>
                </div>
              </div>
              <p className="rotulo">Recebe → devolve</p>
              <p>{fraseContrato(blocos, indiceSelecionado)}</p>
              <p className="rotulo">Fonte</p>
              <div className="escolha" role="group" aria-label="Fonte">
                <button type="button" className="btn-sec" aria-pressed={selecionado.fonte.tipo === 'skill'} onClick={() => substituir(selecionado.id, { ...selecionado, fonte: { tipo: 'skill', skillId: selecionado.fonte.tipo === 'skill' ? selecionado.fonte.skillId : skills[0]?.id ?? selecionado.id } })}>Skill</button>
                <button type="button" className="btn-sec" aria-pressed={selecionado.fonte.tipo === 'instrucao'} onClick={() => substituir(selecionado.id, { ...selecionado, fonte: { tipo: 'instrucao', texto: selecionado.fonte.tipo === 'instrucao' ? selecionado.fonte.texto : '' } })}>Instrução</button>
              </div>
              {selecionado.fonte.tipo === 'skill' ? (
                <label className="campo">
                  <span>Skill</span>
                  <select value={selecionado.fonte.skillId} onChange={(evento) => substituir(selecionado.id, { ...selecionado, fonte: { tipo: 'skill', skillId: evento.target.value } })}>
                    <OpcaoSkillAusente skills={skills} skillId={selecionado.fonte.skillId} />
                    {skills.map((skill) => (
                      <option key={skill.id} value={skill.id}>{rotuloSkill(skill, skill.id)}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="campo">
                  <span>Instrução</span>
                  <textarea
                    value={selecionado.fonte.tipo === 'instrucao' ? selecionado.fonte.texto : ''}
                    onFocus={() => { marcoTexto.current = false }}
                    onChange={(evento) => {
                      const texto = evento.target.value
                      if (!marcoTexto.current) {
                        lembrar()
                        marcoTexto.current = true
                      }
                      setBlocos((atual) => atual.map((item) => (item.id === selecionado.id ? { ...selecionado, fonte: { tipo: 'instrucao', texto } } : item)))
                      setPendente(null)
                      limparRetorno()
                    }}
                  />
                </label>
              )}
              {selecionado.fonte.tipo === 'skill' && (
                <details className="contrato">
                  <summary>Contrato</summary>
                  <pre className="prova">{preview || 'Sem texto de skill.'}</pre>
                </details>
              )}
              <p className="rotulo">Nesta máquina</p>
              {numeros && numeros.gerados > 0 ? (
                <p className="sub">{numeros.gerados} achados · {numeros.aceitos} aceitos · <span className="num">{taxa}%</span></p>
              ) : (
                <p className="sub">Este bloco ainda não gerou achado nas stories desta máquina.</p>
              )}
            </>
          ) : (
            <>
              <h2>Bloco</h2>
              <p className="sub">Nenhum bloco na esteira. O + entre a entrada e a saída insere o primeiro.</p>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

function Ligacao({ pausa, rotuloMais, aoInserir }: { pausa: boolean; rotuloMais: string; aoInserir: () => void }) {
  return (
    <div className="fluxo-ligacao">
      <button className="mais-fluxo" type="button" aria-label={rotuloMais} onClick={aoInserir}>+</button>
      <span className={pausa ? 'fio fio-pausa' : 'fio fio-auto'} aria-hidden="true" />
      {pausa && (
        <span className="portao">
          <MarcaPausa />
          você revisa aqui
        </span>
      )}
    </div>
  )
}

function ChipFonte({ nome, aoClicar, rotulo }: { nome: string; aoClicar?: () => void; rotulo?: string }) {
  if (!aoClicar) return <span className="chip-fonte">{nome}</span>
  return <button className="chip-fonte" type="button" onClick={aoClicar} aria-label={rotulo ?? `${nome}. Abre Conexões.`}>{nome}</button>
}

function OpcaoSkillAusente({ skills, skillId }: { skills: SkillDisponivel[]; skillId: string }) {
  if (skills.some((skill) => skill.id === skillId)) return null
  return <option value={skillId}>{skillId}</option>
}

function rotuloSkill(skill: SkillDisponivel | undefined, skillId: string): string {
  if (!skill) return skillId
  return `${skill.nome} · ${skill.origem === 'embutida' ? 'da Esteira' : 'sua'}`
}

function nomeModelo(preset: Preset): string {
  if (preset.id === 'completa') return 'Esteira completa'
  if (preset.id === 'confrontos') return 'Só confrontos'
  if (preset.id === 'radar') return 'Radar rápido'
  return preset.nome
}

function rotuloMudancas(total: number): string {
  return total === 1 ? '1 mudança' : `${total} mudanças`
}

function nomesProvedores(fontes: FonteRadar[]): string[] {
  const vistos = new Set<string>()
  const nomes: string[] = []
  for (const fonte of fontes) {
    const nome = nomeProvedor(fonte.provedor)
    if (vistos.has(nome)) continue
    vistos.add(nome)
    nomes.push(nome)
  }
  return nomes
}

function nomeProvedor(provedor: FonteRadar['provedor']): string {
  if (provedor === 'teams') return 'Teams'
  if (provedor === 'slack') return 'Slack'
  if (provedor === 'whatsapp') return 'WhatsApp'
  if (provedor === 'granola') return 'Granola'
  return 'Plaud'
}

function MarcaPapel({ papel }: { papel: BlocoFluxo['papel'] }) {
  if (papel === 'escrever') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 13l2.1-.4L12.2 5.5 10.5 3.8 3.4 10.9 3 13z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function MarcaFixa() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <rect x="2.5" y="5.5" width="7" height="5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function MarcaPausa() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3.5 2.5v7M8.5 2.5v7" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function Alca() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
      <circle cx="3.5" cy="3" r="1.15" fill="currentColor" />
      <circle cx="8.5" cy="3" r="1.15" fill="currentColor" />
      <circle cx="3.5" cy="8" r="1.15" fill="currentColor" />
      <circle cx="8.5" cy="8" r="1.15" fill="currentColor" />
      <circle cx="3.5" cy="13" r="1.15" fill="currentColor" />
      <circle cx="8.5" cy="13" r="1.15" fill="currentColor" />
    </svg>
  )
}

function Seta({ para }: { para: 'cima' | 'baixo' }) {
  const d = para === 'cima' ? 'M2.5 7.5 6 4 9.5 7.5' : 'M2.5 4.5 6 8 9.5 4.5'
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
