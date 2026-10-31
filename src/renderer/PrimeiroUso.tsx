import { passoAtual, type PassoPrimeiroUso } from '../core/primeiro-uso'

export function PrimeiroUso({
  passos,
  onIr,
  onAdiar,
}: {
  passos: PassoPrimeiroUso[]
  onIr: (passo: PassoPrimeiroUso) => void
  onAdiar: () => void
}) {
  const atual = passoAtual(passos)
  return (
    <section className="primeiro-uso">
      <div className="titulo">
        <p className="pergunta">O que falta nesta máquina antes da primeira story?</p>
        <button className="btn-texto" type="button" onClick={onAdiar}>
          Agora não
        </button>
      </div>
      <ol className="trilho trilho-passos" aria-label="Primeiro uso">
        {passos.map((passo, indice) => {
          const corrente = passo.id === atual.id
          return (
            <li key={passo.id} className={passo.feito ? 'concluido' : corrente ? 'rodando' : undefined}>
              <button type="button" aria-current={corrente ? 'step' : undefined} onClick={() => onIr(passo)}>
                <strong>
                  <span className="indice">{indice + 1}</span>
                  {passo.nome}
                </strong>
                <small>{passo.feito ? passo.pronto : passo.falta}</small>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
