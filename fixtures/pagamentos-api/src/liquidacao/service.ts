/** Um PIX liquidado não volta para pendente. O estorno nasce como lançamento novo. */
export function pixLiquidado(estado: string): boolean {
  return estado === 'liquidado'
}
