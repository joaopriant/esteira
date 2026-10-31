import { createRequire } from 'node:module'
import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

// O serviço tem de ser o mesmo de SERVICO_COFRE em src/adapters/segredos.ts.
const SERVICO = 'Esteira'
const raiz = path.resolve('release/win-unpacked/resources/app.asar.unpacked')

function acharNode(dir) {
  const achados = []
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const cheio = path.join(dir, entrada.name)
    if (entrada.isDirectory()) achados.push(...acharNode(cheio))
    else if (entrada.name.endsWith('.node') && cheio.includes(`${path.sep}@napi-rs${path.sep}keyring`)) achados.push(cheio)
  }
  return achados
}

if (!existsSync(raiz)) {
  console.error('Não achei app.asar.unpacked. O módulo nativo do cofre não saiu do asar.')
  process.exit(1)
}

const nodes = acharNode(raiz).filter((arquivo) => statSync(arquivo).size > 1000)
if (nodes.length === 0) {
  console.error('Nenhum .node do @napi-rs/keyring em app.asar.unpacked.')
  process.exit(1)
}

const arquivo = nodes[0]
const exigir = createRequire(arquivo)
const { Entry } = exigir(arquivo)
if (typeof Entry !== 'function') {
  console.error('O módulo desempacotado não exporta Entry.')
  process.exit(1)
}

const conta = `ci-asar-${process.env.GITHUB_RUN_ID ?? Date.now()}`
const segredo = `prova-${conta}`
const item = new Entry(SERVICO, conta)
try {
  item.setPassword(segredo)
  if (item.getPassword() !== segredo) {
    console.error('A leitura do cofre empacotado não devolveu o que foi gravado.')
    process.exit(1)
  }
} finally {
  try {
    item.deletePassword()
  } catch {
    /* a conferência abaixo vê se sobrou */
  }
}
let restante = null
try {
  restante = item.getPassword()
} catch {
  restante = null
}
if (restante) {
  console.error('A credencial de prova continuou no Gerenciador de Credenciais.')
  process.exit(1)
}
console.log(`cofre fora do asar: ${nodes.length} módulo(s) nativo(s)`)
