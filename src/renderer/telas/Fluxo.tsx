import { useEffect, useMemo, useRef, useState } from 'react'
import type { BlocoFluxo, EstatisticaBloco, FonteRadar, SkillDisponivel } from '../../shared/tipos'
import { duplicarBloco, inserirBloco, moverBloco } from '../../core/fluxo-padrao'
import { chamar } from '../api'
import { Erro, mensagemDe } from '../ui'

interface Caixa {
  id: string
  x: number
  y: number
  w: number
  h: number
}

interface Preset {
  id: string
  nome: string
  blocos: BlocoFluxo[]
}

const W_FONTE = 186
const H_FONTE = 64
const W_ENTRADA = 156
const H_ENTRADA = 84
const W_BLOCO = 206
const H_BLOCO = 158
const W_SAIDA = 196
const H_SAIDA = 124

function cena(fontes: FonteRadar[], blocos: BlocoFluxo[]) {
  const ativas = fontes.filter((fonte) => fonte.ativa)
  const linhas = Math.max(ativas.length, 1)
  const altura = linhas * H_FONTE + (linhas - 1) * 12
  const topo = 32
  const meio = topo + altura / 2
  const fontesCaixas: Caixa[] = (ativas.length > 0 ? ativas : [{ id: 'sem-fonte', nome: '', referencia: '', produtoId: '', provedor: 'teams', ativa: false }]).map((fonte, indice) => ({
    id: fonte.id,
    x: 8,
    y: topo + indice * (H_FONTE + 12),
    w: W_FONTE,
    h: H_FONTE,
  }))
  const entrada: Caixa = { id: 'entrada', x: 228, y: meio - H_ENTRADA / 2, w: W_ENTRADA, h: H_ENTRADA }
  const blocosCaixas: Caixa[] = blocos.map((bloco, indice) => ({
    id: bloco.id,
    x: 424 + indice * (W_BLOCO + 48),
    y: meio - H_BLOCO / 2,
    w: W_BLOCO,
    h: H_BLOCO,
  }))
  const depois = blocosCaixas.length > 0 ? blocosCaixas[blocosCaixas.length - 1]!.x + W_BLOCO + 56 : entrada.x + W_ENTRADA + 64
  const saida: Caixa = { id: 'saida', x: depois, y: meio - H_SAIDA / 2, w: W_SAIDA, h: H_SAIDA }
  return {
    ativas,
    fontesCaixas,
    entrada,
    blocosCaixas,
    saida,
    w: saida.x + W_SAIDA + 28,
    h: Math.max(altura + topo + 28, H_BLOCO + 120, 560),
  }
}

function curva(a: Caixa, b: Caixa): string {
  const x1 = a.x + a.w
  const y1 = a.y + a.h / 2
  const x2 = b.x
  const y2 = b.y + b.h / 2
  const folga = Math.max(40, (x2 - x1) / 2)
  return `M ${x1} ${y1} C ${x1 + folga} ${y1}, ${x2 - folga} ${y2}, ${x2} ${y2}`
}

function meio(a: Caixa, b: Caixa): { x: number; y: number } {
  return { x: (a.x + a.w + b.x) / 2, y: (a.y + a.h / 2 + b.y + b.h / 2) / 2 }
}

function resumoFonte(bloco: BlocoFluxo, skills: SkillDisponivel[]): string {
  if (bloco.fonte.tipo === 'instrucao') return bloco.fonte.texto.replace(/\s+/g, ' ').slice(0, 110)
  const skillId = bloco.fonte.skillId
  return skills.find((skill) => skill.id === skillId)?.nome ?? skillId
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

export function FluxoView() {
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
  const [vista, setVista] = useState({ x: 20, y: 12, z: 1 })
  const viewport = useRef<HTMLDivElement>(null)
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

  const mapa = useMemo(() => cena(fontes, blocos), [fontes, blocos])
  const selecionado = blocos.find((bloco) => bloco.id === selecao) ?? null
  const sujo = JSON.stringify(blocos) !== gravado

  useEffect(() => {
    const el = viewport.current
    if (!el || !pronto) return
    const ajustar = () => {
      const z = Math.min(1, (el.clientWidth - 28) / mapa.w, (el.clientHeight - 28) / mapa.h)
      setVista({ x: 16, y: 10, z: Number.isFinite(z) && z > 0.35 ? z : 0.7 })
    }
    ajustar()
    const obs = new ResizeObserver(ajustar)
    obs.observe(el)
    return () => obs.disconnect()
  }, [pronto, mapa.w, mapa.h])

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

  return (
    <div className="fluxo-estudio">
      <div className="titulo">
        <h1>Fluxo</h1>
        <button
          className="btn"
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
          {ocupado ? 'Salvando' : sujo ? 'Salvar fluxo' : 'Fluxo salvo'}
        </button>
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
          <button className="btn-sec" type="button" onClick={() => setVista((atual) => ({ ...atual, z: Math.max(0.45, atual.z - 0.1) }))} aria-label="Diminuir">−</button>
          <button className="btn-sec" type="button" onClick={() => {
            const el = viewport.current
            if (!el) return
            const z = Math.min(1, (el.clientWidth - 28) / mapa.w, (el.clientHeight - 28) / mapa.h)
            setVista({ x: 16, y: 10, z: z > 0.35 ? z : 0.7 })
          }}>Ajustar</button>
          <button className="btn-sec" type="button" onClick={() => setVista((atual) => ({ ...atual, z: Math.min(1.5, atual.z + 0.1) }))} aria-label="Aumentar">+</button>
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
            if (alvo.closest('button, article, input, select, textarea')) return
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
            setVista((atual) => ({ ...atual, z: Math.min(1.5, Math.max(0.45, atual.z * fator)) }))
          }}
        >
          <div className="fluxo-mundo" style={{ width: mapa.w, height: mapa.h, transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.z})` }}>
            <svg className="fluxo-fios" width={mapa.w} height={mapa.h} aria-hidden="true">
              {mapa.fontesCaixas.map((caixa) => (
                <path key={caixa.id} d={curva(caixa, mapa.entrada)} className="fio-auto" />
              ))}
              {mapa.blocosCaixas.length === 0 ? (
                <path d={curva(mapa.entrada, mapa.saida)} className="fio-pausa" />
              ) : (
                <>
                  <path d={curva(mapa.entrada, mapa.blocosCaixas[0]!)} className={blocos[0]?.modo === 'por-clique' ? 'fio-pausa' : 'fio-auto'} />
                  {mapa.blocosCaixas.slice(1).map((caixa, indice) => (
                    <path key={caixa.id} d={curva(mapa.blocosCaixas[indice]!, caixa)} className={blocos[indice + 1]?.modo === 'por-clique' ? 'fio-pausa' : 'fio-auto'} />
                  ))}
                  <path d={curva(mapa.blocosCaixas[mapa.blocosCaixas.length - 1]!, mapa.saida)} className="fio-pausa" />
                </>
              )}
            </svg>
            <span className="zona" style={{ left: 8, top: 8 }}>Fontes</span>
            <span className="zona" style={{ left: 424, top: 8 }}>Esteira</span>
            <span className="zona" style={{ left: mapa.saida.x, top: 8 }}>Saída</span>
            {mapa.fontesCaixas.map((caixa) => {
              const fonte = mapa.ativas.find((item) => item.id === caixa.id)
              return (
                <article key={caixa.id} className="no-fonte" style={{ left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h }}>
                  <span>{fonte ? nomeProvedor(fonte.provedor) : 'Radar'}</span>
                  <strong>{fonte ? fonte.nome : 'Nenhuma fonte ligada'}</strong>
                  <small>{fonte ? 'leitura' : 'ative no Radar'}</small>
                </article>
              )
            })}
            <article className="no-entrada" style={{ left: mapa.entrada.x, top: mapa.entrada.y, width: mapa.entrada.w, height: mapa.entrada.h }}>
              <span>Entrada</span>
              <strong>Ideia manual</strong>
              <small>o texto que o PM escreve</small>
            </article>
            {blocos.map((bloco, indice) => {
              const caixa = mapa.blocosCaixas[indice]!
              const anterior = indice === 0 ? mapa.entrada : mapa.blocosCaixas[indice - 1]!
              const ponto = meio(anterior, caixa)
              return (
                <div key={bloco.id}>
                  <button className="mais-fluxo" style={{ left: ponto.x, top: ponto.y }} type="button" aria-label={`Inserir bloco antes de ${bloco.nome}`} onClick={() => inserir(indice)}>+</button>
                  {bloco.modo === 'por-clique' && (
                    <button className="badge-pausa" style={{ left: ponto.x, top: caixa.y - 6 }} type="button" onClick={() => mudar(bloco.id, { ...bloco, modo: 'automatico' })}>
                      aguarda clique
                    </button>
                  )}
                  <article
                    className={`no-bloco papel-${bloco.papel} ${selecao === bloco.id ? 'selecionado' : ''}`}
                    style={{ left: caixa.x, top: caixa.y, width: caixa.w, height: caixa.h }}
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
                    <div className="escolha">
                      <button type="button" className="btn-sec" aria-pressed={bloco.modo === 'automatico'} onClick={(evento) => { evento.stopPropagation(); mudar(bloco.id, { ...bloco, modo: 'automatico' }) }}>Automático</button>
                      <button type="button" className="btn-sec" aria-pressed={bloco.modo === 'por-clique'} onClick={(evento) => { evento.stopPropagation(); mudar(bloco.id, { ...bloco, modo: 'por-clique' }) }}>Por clique</button>
                    </div>
                  </article>
                </div>
              )
            })}
            {mapa.blocosCaixas.length > 0 && (
              <button
                className="mais-fluxo"
                style={{ left: meio(mapa.blocosCaixas[mapa.blocosCaixas.length - 1]!, mapa.saida).x, top: meio(mapa.blocosCaixas[mapa.blocosCaixas.length - 1]!, mapa.saida).y }}
                type="button"
                aria-label="Inserir bloco antes da saída"
                onClick={() => inserir(blocos.length)}
              >
                +
              </button>
            )}
            {mapa.blocosCaixas.length === 0 && (
              <button className="mais-fluxo" style={{ left: meio(mapa.entrada, mapa.saida).x, top: meio(mapa.entrada, mapa.saida).y }} type="button" aria-label="Inserir o primeiro bloco" onClick={() => inserir(0)}>+</button>
            )}
            <article className="no-saida" style={{ left: mapa.saida.x, top: mapa.saida.y, width: mapa.saida.w, height: mapa.saida.h }}>
              <span>Saída</span>
              <strong>Story e achados</strong>
              <small>Publicar no Azure Boards só com clique. Depois, passou ou voltou.</small>
            </article>
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
                    <option key={skill.id} value={skill.id}>{skill.nome}</option>
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
