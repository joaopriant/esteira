import { AssinaturaWin } from '../src/main/assinatura-win.ts'

try {
  const modo = AssinaturaWin.exigir(process.env)
  console.log(`Assinatura: ${modo}.`)
} catch (erro) {
  console.error(erro instanceof Error ? erro.message : erro)
  process.exit(1)
}
