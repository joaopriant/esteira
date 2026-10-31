import { readFileSync } from 'node:fs'
import { AssinaturaWin } from '../src/main/assinatura-win.ts'

const caminho = process.argv[2]
if (!caminho) {
  console.error('Informe o caminho do app-update.yml.')
  process.exit(1)
}
const nome = AssinaturaWin.publisherNameDe(readFileSync(caminho, 'utf8'))
if (!nome) {
  console.error(`${caminho} saiu sem publisherName. A atualização não conferiria o editor do instalador.`)
  process.exit(1)
}
console.log(`publisherName: ${nome}`)
