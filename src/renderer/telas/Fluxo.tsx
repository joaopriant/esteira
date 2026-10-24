import { useEffect, useState } from 'react'
import type { BlocoFluxo, SkillDisponivel } from '../../shared/tipos'
import { chamar } from '../api'
import { Erro, mensagemDe } from '../ui'

function SeletorSkill({ skillId, skills, aoMudar }: { skillId: string; skills: SkillDisponivel[]; aoMudar: (skillId: string) => void }) {
  return (
    <label className="campo estreito">
      <span>Skill</span>
      <select value={skillId} onChange={(evento) => aoMudar(evento.target.value)}>
        {!skills.some((skill) => skill.id === skillId) && <option value={skillId}>{skillId}</option>}
        {skills.map((skill) => (
          <option key={skill.id} value={skill.id}>
            {skill.nome} · {skill.origem === 'usuario' ? 'sua' : 'da Esteira'}
          </option>
        ))}
      </select>
    </label>
  )
}

export function FluxoView() {
  const [blocos, setBlocos] = useState<BlocoFluxo[]>([])
  const [skills, setSkills] = useState<SkillDisponivel[]>([])
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    let vivo = true
    Promise.all([chamar<BlocoFluxo[]>('fluxo'), chamar<SkillDisponivel[]>('listarSkills')])
      .then(([fluxo, lista]) => {
        if (!vivo) return
        setBlocos(fluxo)
        setSkills(lista)
        setPronto(true)
      })
      .catch((falha: unknown) => {
        if (vivo) setErro(mensagemDe(falha))
      })
    return () => {
      vivo = false
    }
  }, [])

  function mudar(indice: number, bloco: BlocoFluxo) {
    setBlocos((atual) => atual.map((item, i) => (i === indice ? bloco : item)))
    setOk('')
  }

  function mover(indice: number, delta: number) {
    setBlocos((atual) => {
      const copia = [...atual]
      const destino = indice + delta
      const [item] = copia.splice(indice, 1)
      if (!item || destino < 0 || destino >= atual.length) return atual
      copia.splice(destino, 0, item)
      return copia
    })
    setOk('')
  }

  if (!pronto && !erro) return <p>Abrindo o fluxo.</p>

  return (
    <>
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
              .then(() => setOk('Fluxo salvo. A próxima story usa esta ordem.'))
              .catch((falha: unknown) => setErro(mensagemDe(falha)))
              .finally(() => setOcupado(false))
          }}
        >
          {ocupado ? 'Salvando' : 'Salvar fluxo'}
        </button>
      </div>
      <p className="sub">A ordem da esquerda para a direita na esteira é a ordem desta lista. Automático segue sozinho. Por clique espera você.</p>
      <Erro texto={erro} />
      {ok && (
        <p className="sub status ok" role="status">
          {ok}
        </p>
      )}
      {blocos.map((bloco, indice) => (
        <article className="bloco" key={bloco.id}>
          <header>
            <strong>
              {indice + 1}. {bloco.nome}
            </strong>
            <div className="acoes">
              <button className="btn-texto" type="button" disabled={indice === 0} onClick={() => mover(indice, -1)}>
                Subir
              </button>
              <button className="btn-texto" type="button" disabled={indice === blocos.length - 1} onClick={() => mover(indice, 1)}>
                Descer
              </button>
              <button className="btn-texto btn-perigo" type="button" onClick={() => setBlocos((atual) => atual.filter((_, i) => i !== indice))}>
                Tirar
              </button>
            </div>
          </header>
          <div className="linha">
            <label className="campo">
              <span>Nome</span>
              <input value={bloco.nome} onChange={(evento) => mudar(indice, { ...bloco, nome: evento.target.value })} />
            </label>
            <label className="campo">
              <span>Papel</span>
              <select value={bloco.papel} onChange={(evento) => mudar(indice, { ...bloco, papel: evento.target.value as BlocoFluxo['papel'] })}>
                <option value="escrever">Escrever a story</option>
                <option value="confrontar">Confrontar</option>
              </select>
            </label>
            <label className="campo">
              <span>Quando roda</span>
              <select value={bloco.modo} onChange={(evento) => mudar(indice, { ...bloco, modo: evento.target.value as BlocoFluxo['modo'] })}>
                <option value="automatico">Automático</option>
                <option value="por-clique">Por clique</option>
              </select>
            </label>
          </div>
          <div className="escolha">
            <button
              type="button"
              className="btn-sec"
              aria-pressed={bloco.fonte.tipo === 'skill'}
              onClick={() => mudar(indice, { ...bloco, fonte: { tipo: 'skill', skillId: bloco.fonte.tipo === 'skill' ? bloco.fonte.skillId : skills[0]?.id ?? bloco.id } })}
            >
              Skill instalada
            </button>
            <button
              type="button"
              className="btn-sec"
              aria-pressed={bloco.fonte.tipo === 'instrucao'}
              onClick={() => mudar(indice, { ...bloco, fonte: { tipo: 'instrucao', texto: bloco.fonte.tipo === 'instrucao' ? bloco.fonte.texto : '' } })}
            >
              Instrução escrita
            </button>
          </div>
          {bloco.fonte.tipo === 'skill' ? (
            <SeletorSkill skillId={bloco.fonte.skillId} skills={skills} aoMudar={(skillId) => mudar(indice, { ...bloco, fonte: { tipo: 'skill', skillId } })} />
          ) : (
            <label className="campo">
              <span>Instrução</span>
              <textarea value={bloco.fonte.texto} onChange={(evento) => mudar(indice, { ...bloco, fonte: { tipo: 'instrucao', texto: evento.target.value } })} />
            </label>
          )}
        </article>
      ))}
      <button
        className="btn-sec"
        type="button"
        onClick={() =>
          setBlocos((atual) => [
            ...atual,
            {
              id: `bloco-${atual.length + 1}`,
              nome: 'Novo bloco',
              papel: 'confrontar',
              modo: 'por-clique',
              fonte: { tipo: 'instrucao', texto: 'Diga o que confrontar. Cite arquivo e trecho, ou diga que não encontrou.' },
            },
          ])
        }
      >
        Acrescentar bloco
      </button>
    </>
  )
}
