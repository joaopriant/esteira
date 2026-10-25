import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BlocoFluxo, EstatisticaBloco, FonteRadar, SkillDisponivel } from '../../shared/tipos'
import { duplicarBloco, inserirBloco, moverBloco } from '../../core/fluxo-padrao'
import { chamar } from '../api'
import { DotGrid } from '../components/react-bits/DotGrid'
import { AcaoPrimaria } from '../components/react-bits/AcaoPrimaria'
import { BlurText } from '../components/react-bits/BlurText'
import { ShinyText } from '../components/react-bits/ShinyText'
import { SpotlightCard } from '../components/react-bits/SpotlightCard'
import { StarBorder } from '../components/react-bits/StarBorder'
import { Erro, mensagemDe } from '../ui'

interface Preset {
  id: string
  nome: string
  blocos: BlocoFluxo[]
}

interface Caixa {
  x: number
  y: number
  w: number
  h: number
}

interface Fio {
  id: string
  d: string
  pausa: boolean
}

function curva(a: Caixa, b: Caixa): string {
  const x1 = a.x + a.w
  const y1 = a.y + a.h / 2
  const x2 = b.x
  const y2 = b.y + b.h / 2
  const folga = Math.max(18, Math.abs(x2 - x1) / 2)
  return `M ${x1} ${y1} C ${x1 + folga} ${y1}, ${x2 - folga} ${y2}, ${x2} ${y2}`
}

function resumoFonte(bloco: BlocoFluxo, skills: SkillDisponivel[]): string {
  const fonte = bloco.fonte
  let bruto = ''
  if (fonte.tipo === 'instrucao') bruto = fonte.texto.replace(/\s+/g, ' ').trim()
  else {
    const skillId = fonte.skillId
    bruto = rotuloSkill(skills.find((skill) => skill.id === skillId), skillId)
  }
  if (bruto.length <= 180) return bruto
  return `${bruto.slice(0, 176).trimEnd()}…`
}

function rotuloSkill(skill: SkillDisponivel | undefined, skillId: string): string {
  if (!skill) return skillId
  return `${skill.nome} · ${skill.origem === 'embutida' ? 'da Esteira' : 'sua'}`
}

function MarcaPapel({ papel }: { papel: BlocoFluxo['papel'] }) {
  if (papel === 'escrever') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 13l2.1-.4L12.2 5.5 10.5 3.8 3.4 10.9 3 13z" fill="none" stroke="#1b6c80" strokeWidth="1.4" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7" fill="none" stroke="#142026" strokeWidth="1.4" />
    </svg>
  )
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
  const [vista, setVista] = useState({ x: 12, y: 8, z: 1 })
  const [fios, setFios] = useState<Fio[]>([])
  const viewport = useRef<HTMLDivElement>(null)
  const palco = useRef<HTMLDivElement>(null)
  const pan = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

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
  const sujo = JSON.stringify(blocos) !== gravado
  const ativas = fontes.filter((fonte) => fonte.ativa)
  const chaveCena = `${ativas.map((fonte) => fonte.id).join(',')}|${blocos.map((bloco) => `${bloco.id}:${bloco.modo}`).join(',')}|${vista.z}|${selecao ?? ''}`

  useLayoutEffect(() => {
    const raiz = palco.current
    if (!raiz || !pronto) return
    const medir = () => {
      const base = raiz.getBoundingClientRect()
      const z = vista.z || 1
      const caixaDe = (ancora: string): Caixa | null => {
        const el = raiz.querySelector<HTMLElement>(`[data-ancora="${ancora}"]`)
        if (!el) return null
        const rect = el.getBoundingClientRect()
        return {
          x: (rect.left - base.left) / z,
          y: (rect.top - base.top) / z,
          w: rect.width / z,
          h: rect.height / z,
        }
      }
      const entrada = caixaDe('entrada')
      const saida = caixaDe('saida')
      if (!entrada || !saida) return
      const proximos: Fio[] = []
      const fontesCaixas = (ativas.length > 0 ? ativas : [{ id: 'sem-fonte' }]).map((fonte) => caixaDe(`fonte-${fonte.id}`)).filter((caixa): caixa is Caixa => Boolean(caixa))
      fontesCaixas.forEach((caixa, indice) => {
        proximos.push({ id: `fonte-${indice}`, d: curva(caixa, entrada), pausa: false })
      })
      const blocosCaixas = blocos.map((bloco) => caixaDe(`bloco-${bloco.id}`))
      if (blocos.length === 0) {
        proximos.push({ id: 'entrada-saida', d: curva(entrada, saida), pausa: true })
      } else if (blocosCaixas[0]) {
        proximos.push({ id: 'entrada-bloco', d: curva(entrada, blocosCaixas[0]), pausa: blocos[0]?.modo === 'por-clique' })
        blocosCaixas.forEach((caixa, indice) => {
          if (indice === 0 || !caixa || !blocosCaixas[indice - 1]) return
          proximos.push({
            id: `bloco-${indice}`,
            d: curva(blocosCaixas[indice - 1]!, caixa),
            pausa: blocos[indice]?.modo === 'por-clique',
          })
        })
        const ultimo = blocosCaixas[blocosCaixas.length - 1]
        if (ultimo) proximos.push({ id: 'saida', d: curva(ultimo, saida), pausa: true })
      }
      setFios((atual) => {
        if (atual.length === proximos.length && atual.every((fio, indice) => fio.id === proximos[indice]?.id && fio.d === proximos[indice]?.d && fio.pausa === proximos[indice]?.pausa)) return atual
        return proximos
      })
    }
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(raiz)
    return () => obs.disconnect()
  }, [pronto, chaveCena])

  useEffect(() => {
    if (!selecionado || selecionado.fonte.tipo !== 'skill') {
      setPreview('')
      return
    }
    let vivo = true
    chamar<{ texto: string }>('lerSkillTexto', { id: selecionado.fonte.skillId })
      .then((resposta) => {
        if (vivo) setPreview(resposta.texto)
      })
      .catch(() => {
        if (vivo) setPreview('')
      })
    return () => {
      vivo = false
    }
  }, [selecionado])

  function mudar(id: string, bloco: BlocoFluxo) {
    setBlocos((atual) => atual.map((item) => (item.id === id ? bloco : item)))
    setOk('')
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
    setBlocos((atual) => inserirBloco(atual, indice, bloco))
    setSelecao(bloco.id)
    setOk('')
  }

  if (!pronto && !erro) return <p>Abrindo o fluxo.</p>

  const numeros = selecionado ? stats.find((item) => item.blocoId === selecionado.id) ?? stats.find((item) => item.blocoNome === selecionado.nome) : undefined
  const taxa = numeros && numeros.gerados > 0 ? Math.round((numeros.aceitos / numeros.gerados) * 100) : null
  const listaFontes = ativas.length > 0 ? ativas : [null]

  return (
    <div className="fluxo-estudio">
      <div className="titulo">
        <h1><BlurText text="Fluxo" /></h1>
        <AcaoPrimaria
          type="button"
          disabled={ocupado || blocos.length === 0}
          onClick={() => {
            setOcupado(true)
            setErro('')
            setOk('')
            void chamar('salvarFluxo', { blocos })
              .then(() => {
                setGravado(JSON.stringify(blocos))
                setOk('Fluxo salvo. A próxima story usa esta ordem.')
              })
              .catch((falha: unknown) => setErro(mensagemDe(falha)))
              .finally(() => setOcupado(false))
          }}
        >
          {ocupado ? <ShinyText text="Salvando" /> : sujo ? 'Salvar fluxo' : 'Fluxo salvo'}
        </AcaoPrimaria>
      </div>
      <div className="fluxo-barra">
        <div className="escolha" role="group" aria-label="Modelos de fluxo">
          {presets.map((preset) => (
            <button key={preset.id} type="button" className="btn-sec" onClick={() => { setBlocos(preset.blocos); setSelecao(preset.blocos[0]?.id ?? null); setOk('') }}>
              {preset.nome}
            </button>
          ))}
        </div>
        <div className="acoes">
          <button className="btn-sec" type="button" onClick={() => setVista((atual) => ({ ...atual, z: Math.max(0.7, Number((atual.z - 0.1).toFixed(2))) }))} aria-label="Diminuir">−</button>
          <button className="btn-sec" type="button" onClick={() => setVista({ x: 12, y: 8, z: 1 })}>Ajustar</button>
          <button className="btn-sec" type="button" onClick={() => setVista((atual) => ({ ...atual, z: Math.min(1.4, Number((atual.z + 0.1).toFixed(2))) }))} aria-label="Aumentar">+</button>
        </div>
      </div>
      <p className="sub">A linha cheia segue sozinha. A tracejada espera um clique. O mais entra exatamente entre dois blocos.</p>
      <Erro texto={erro} />
      {ok && <p className="sub status ok" role="status">{ok}</p>}
      <div className="fluxo-corpo">
        <div
          className="fluxo-viewport"
          ref={viewport}
          onPointerDown={(evento) => {
            const alvo = evento.target as HTMLElement
            if (alvo.closest('button, article, input, select, textarea, a')) return
            pan.current = { x: evento.clientX, y: evento.clientY, px: vista.x, py: vista.y }
            evento.currentTarget.setPointerCapture(evento.pointerId)
          }}
          onPointerMove={(evento) => {
            if (!pan.current) return
            setVista((atual) => ({ ...atual, x: pan.current!.px + evento.clientX - pan.current!.x, y: pan.current!.py + evento.clientY - pan.current!.y }))
          }}
          onPointerUp={() => { pan.current = null }}
          onWheel={(evento) => {
            const fator = evento.deltaY > 0 ? 0.92 : 1.08
            setVista((atual) => ({ ...atual, z: Math.min(1.4, Math.max(0.7, Number((atual.z * fator).toFixed(3)))) }))
          }}
        >
          <DotGrid />
          <div className="fluxo-mundo" style={{ transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.z})` }}>
            <div className="fluxo-palco" ref={palco}>
              <svg className="fluxo-fios" aria-hidden="true">
                {fios.map((fio) => (
                  <path key={fio.id} d={fio.d} className={fio.pausa ? 'fio-pausa' : 'fio-auto'} />
                ))}
              </svg>
              <section className="fluxo-col">
                <span className="zona">Fontes</span>
                {aoConexoes && (
                  <button className="btn-sec atalho-conexoes" type="button" onClick={aoConexoes}>Gerenciar conexões</button>
                )}
                {listaFontes.map((fonte) => (
                  <SpotlightCard as="article" key={fonte?.id ?? 'sem-fonte'} className="no-fonte" data-ancora={`fonte-${fonte?.id ?? 'sem-fonte'}`}>
                    <span>{fonte ? nomeProvedor(fonte.provedor) : 'Radar'}</span>
                    <strong>{fonte ? fonte.nome : 'Nenhuma fonte ligada'}</strong>
                    <small>{fonte ? `${nomeProvedor(fonte.provedor)} · ${fonte.referencia}` : 'ative em Conexões'}</small>
                  </SpotlightCard>
                ))}
              </section>
              <section className="fluxo-col">
                <span className="zona">Entrada</span>
                <SpotlightCard as="article" className="no-entrada" data-ancora="entrada">
                  <span>Entrada</span>
                  <strong>Ideia manual</strong>
                  <small>o texto que o PM escreve</small>
                </SpotlightCard>
              </section>
              {blocos.map((bloco, indice) => (
                <div className="fluxo-trecho" key={bloco.id}>
                  <div className="fluxo-entre">
                    <button className="mais-fluxo" type="button" aria-label={`Inserir bloco antes de ${bloco.nome}`} onClick={() => inserir(indice)}>+</button>
                  </div>
                  <section className="fluxo-col">
                    {indice === 0 && <span className="zona">Esteira</span>}
                    {indice > 0 && <span className="zona zona-vazia" aria-hidden="true">Esteira</span>}
                    <div className="fluxo-no" data-ancora={`bloco-${bloco.id}`}>
                      <StarBorder className="rb-star-bloco" ativo={selecao === bloco.id}>
                        <SpotlightCard
                          as="article"
                          className={`no-bloco papel-${bloco.papel} ${selecao === bloco.id ? 'selecionado' : ''}`}
                          draggable
                          onDragStart={(evento) => evento.dataTransfer.setData('text/plain', String(indice))}
                          onDragOver={(evento) => evento.preventDefault()}
                          onDrop={(evento) => {
                            evento.preventDefault()
                            const de = Number(evento.dataTransfer.getData('text/plain'))
                            if (Number.isNaN(de)) return
                            setBlocos((atual) => moverBloco(atual, de, indice))
                            setOk('')
                          }}
                          onClick={() => setSelecao(bloco.id)}
                        >
                          <header>
                            <span className="indice">{indice + 1}</span>
                            <MarcaPapel papel={bloco.papel} />
                            <strong>{bloco.nome}</strong>
                          </header>
                          <p>{bloco.papel === 'escrever' ? 'Escrever' : 'Confrontar'}</p>
                          <small>{resumoFonte(bloco, skills)}</small>
                          <span className={bloco.modo === 'por-clique' ? 'badge-modo pausa' : 'badge-modo auto'}>
                            {bloco.modo === 'por-clique' ? 'aguarda clique' : 'automático'}
                          </span>
                          <div className="escolha">
                            <button type="button" className="btn-sec" aria-pressed={bloco.modo === 'automatico'} onClick={(evento) => { evento.stopPropagation(); mudar(bloco.id, { ...bloco, modo: 'automatico' }) }}>Automático</button>
                            <button type="button" className="btn-sec" aria-pressed={bloco.modo === 'por-clique'} onClick={(evento) => { evento.stopPropagation(); mudar(bloco.id, { ...bloco, modo: 'por-clique' }) }}>Por clique</button>
                          </div>
                        </SpotlightCard>
                      </StarBorder>
                    </div>
                  </section>
                </div>
              ))}
              <div className="fluxo-trecho">
                <div className="fluxo-entre">
                  <button className="mais-fluxo" type="button" aria-label={blocos.length === 0 ? 'Inserir o primeiro bloco' : 'Inserir bloco antes da saída'} onClick={() => inserir(blocos.length)}>+</button>
                </div>
                <section className="fluxo-col">
                  <span className="zona">Saída</span>
                  <SpotlightCard as="article" className="no-saida" data-ancora="saida">
                    <span>Saída</span>
                    <strong>Story e achados</strong>
                    <small>Publicar no Azure Boards só com clique. Depois, passou ou voltou.</small>
                  </SpotlightCard>
                </section>
              </div>
            </div>
          </div>
        </div>
        {selecionado && (
          <aside className="inspetor" aria-label="Inspetor do bloco">
            <div className="titulo">
              <h2>Bloco</h2>
              <button className="btn-texto" type="button" onClick={() => setSelecao(null)}>Fechar</button>
            </div>
            <label className="campo">
              <span>Nome</span>
              <input value={selecionado.nome} onChange={(evento) => mudar(selecionado.id, { ...selecionado, nome: evento.target.value })} />
            </label>
            <label className="campo">
              <span>Papel</span>
              <select value={selecionado.papel} onChange={(evento) => mudar(selecionado.id, { ...selecionado, papel: evento.target.value as BlocoFluxo['papel'] })}>
                <option value="escrever">Escrever a story</option>
                <option value="confrontar">Confrontar</option>
              </select>
            </label>
            <label className="campo">
              <span>Quando roda</span>
              <select value={selecionado.modo} onChange={(evento) => mudar(selecionado.id, { ...selecionado, modo: evento.target.value as BlocoFluxo['modo'] })}>
                <option value="automatico">Automático · segue sozinho</option>
                <option value="por-clique">Por clique · pausa para revisão</option>
              </select>
            </label>
            <div className="escolha">
              <button type="button" className="btn-sec" aria-pressed={selecionado.fonte.tipo === 'skill'} onClick={() => mudar(selecionado.id, { ...selecionado, fonte: { tipo: 'skill', skillId: selecionado.fonte.tipo === 'skill' ? selecionado.fonte.skillId : skills[0]?.id ?? selecionado.id } })}>Skill</button>
              <button type="button" className="btn-sec" aria-pressed={selecionado.fonte.tipo === 'instrucao'} onClick={() => mudar(selecionado.id, { ...selecionado, fonte: { tipo: 'instrucao', texto: selecionado.fonte.tipo === 'instrucao' ? selecionado.fonte.texto : '' } })}>Instrução</button>
            </div>
            {selecionado.fonte.tipo === 'skill' ? (
              <label className="campo">
                <span>Skill</span>
                <select value={selecionado.fonte.skillId} onChange={(evento) => mudar(selecionado.id, { ...selecionado, fonte: { tipo: 'skill', skillId: evento.target.value } })}>
                  <OpcaoSkillAusente skills={skills} skillId={selecionado.fonte.skillId} />
                  {skills.map((skill) => (
                    <option key={skill.id} value={skill.id}>{rotuloSkill(skill, skill.id)}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="campo">
                <span>Instrução</span>
                <textarea value={selecionado.fonte.tipo === 'instrucao' ? selecionado.fonte.texto : ''} onChange={(evento) => mudar(selecionado.id, { ...selecionado, fonte: { tipo: 'instrucao', texto: evento.target.value } })} />
              </label>
            )}
            <p className="rotulo">Contrato</p>
            <pre className="prova">{selecionado.fonte.tipo === 'instrucao' ? selecionado.fonte.texto : preview || 'Sem texto de skill.'}</pre>
            <p className="rotulo">Medição deste bloco</p>
            {numeros && numeros.gerados > 0 ? (
              <p className="sub">{numeros.gerados} achados · {numeros.aceitos} aceitos · {numeros.descartados} descartados{taxa !== null ? ` · ${taxa}% aceitos` : ''}</p>
            ) : (
              <p className="sub">Este bloco ainda não gerou achado nas stories desta máquina.</p>
            )}
            <div className="acoes">
              <button className="btn-sec" type="button" onClick={() => {
                const indice = blocos.findIndex((item) => item.id === selecionado.id)
                const copiaId = `c-${crypto.randomUUID().slice(0, 8)}`
                setBlocos((atual) => duplicarBloco(atual, indice, copiaId))
                setSelecao(copiaId)
                setOk('')
              }}>Duplicar</button>
              <button className="btn-texto btn-perigo" type="button" onClick={() => { setBlocos((atual) => atual.filter((item) => item.id !== selecionado.id)); setSelecao(null); setOk('') }}>Remover</button>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function OpcaoSkillAusente({ skills, skillId }: { skills: SkillDisponivel[]; skillId: string }) {
  if (skills.some((skill) => skill.id === skillId)) return null
  return <option value={skillId}>{skillId}</option>
}

function nomeProvedor(provedor: FonteRadar['provedor']): string {
  if (provedor === 'teams') return 'Teams'
  if (provedor === 'slack') return 'Slack'
  if (provedor === 'whatsapp') return 'WhatsApp'
  if (provedor === 'granola') return 'Granola'
  return 'Plaud'
}
