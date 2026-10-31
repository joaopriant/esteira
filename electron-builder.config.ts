import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AssinaturaWin, type BuildComWin } from './src/main/assinatura-win'

const raiz = path.dirname(fileURLToPath(import.meta.url))
const pacote = JSON.parse(readFileSync(path.join(raiz, 'package.json'), 'utf8')) as { build: BuildComWin }

export default AssinaturaWin.configurar(pacote.build, process.env)
