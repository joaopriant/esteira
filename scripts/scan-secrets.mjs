import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const raiz = process.cwd()
const ignorar = new Set(['node_modules', 'out', 'release', 'dist', 'coverage', '.git', 'uploads'])
const extensoes = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.yml', '.yaml', '.html', '.css', '.env'])
const regras = [
  { nome: 'github', re: /ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/ },
  { nome: 'anthropic', re: /sk-ant-[A-Za-z0-9_-]{10,}/ },
  { nome: 'aws', re: /AKIA[0-9A-Z]{16}/ },
  { nome: 'slack', re: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { nome: 'chave-privada', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { nome: 'pat-na-url', re: /https:\/\/[^:\s]+:[^@\s]+@dev\.azure\.com/ },
]

const achados = []

async function andar(dir) {
  const entradas = await readdir(dir, { withFileTypes: true })
  for (const entrada of entradas) {
    if (ignorar.has(entrada.name)) continue
    const cheio = path.join(dir, entrada.name)
    if (entrada.isDirectory()) {
      await andar(cheio)
      continue
    }
    if (!extensoes.has(path.extname(entrada.name))) continue
    const texto = await readFile(cheio, 'utf8')
    for (const regra of regras) {
      if (regra.re.test(texto)) achados.push(`${path.relative(raiz, cheio)}: ${regra.nome}`)
    }
  }
}

await andar(raiz)
if (achados.length > 0) {
  console.error(achados.join('\n'))
  process.exit(1)
}
console.log('Nenhum segredo óbvio no código.')
