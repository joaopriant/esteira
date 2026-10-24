/** Estorno parcial só é aceito quando o valor não passa do valor original. */
export function podeEstornarParcial(valorOriginalCentavos: number, valorEstornoCentavos: number): boolean {
  if (valorEstornoCentavos <= 0) return false
  if (valorEstornoCentavos > valorOriginalCentavos) return false
  return true
}
