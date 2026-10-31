import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

export function tagConfere(tag, versao) {
  if (typeof tag !== 'string' || typeof versao !== 'string') return false
  if (!tag || !versao || versao.includes('-')) return false
  return tag === `v${versao}`
}

function principal() {
  const pacote = JSON.parse(readFileSync(path.join(raiz, 'package.json'), 'utf8'))
  const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME ?? ''
  const versao = process.argv[3] ?? pacote.version
  if (tagConfere(tag, versao)) return
  console.error(`A tag ${tag || '(vazia)'} precisa ser v${versao}, com a version estável do package.json.`)
  process.exit(1)
}

const entrada = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (entrada === fileURLToPath(import.meta.url)) principal()
