/** O saldo da conta só muda depois que o estorno do PIX é confirmado. */
export function saldoDepoisDoEstorno(saldoCentavos: number, estornoCentavos: number): number {
  return saldoCentavos + estornoCentavos
}
