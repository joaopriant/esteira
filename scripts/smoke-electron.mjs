import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import net from 'node:net'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const exigir = createRequire(import.meta.url)

function portaLivre() {
  return new Promise((resolve, reject) => {
    const servidor = net.createServer()
    servidor.once('error', reject)
    servidor.listen(0, '127.0.0.1', () => {
      const endereco = servidor.address()
      const porta = typeof endereco === 'object' && endereco ? endereco.port : 0
      servidor.close(() => resolve(porta))
    })
  })
}

async function existe(arquivo) {
  try {
    await stat(arquivo)
    return true
  } catch {
    return false
  }
}

async function conferirPreloadDoBuild() {
  const cjs = path.join(raiz, 'out', 'preload', 'index.cjs')
  const texto = await readFile(cjs, 'utf8')
  if (!texto.includes('require(')) throw new Error(`O preload em ${cjs} não está em CommonJS.`)
  if (/^\s*import\s/m.test(texto)) throw new Error(`O preload em ${cjs} ainda é ESM.`)
  if (await existe(path.join(raiz, 'out', 'preload', 'index.mjs'))) {
    throw new Error('O build ainda gera out/preload/index.mjs.')
  }
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function falha(mensagem) {
  const erro = new Error(mensagem)
  erro.definitiva = true
  return erro
}

async function ate(prazoMs, passo) {
  const limite = Date.now() + prazoMs
  let ultimo
  while (Date.now() < limite) {
    try {
      return await passo()
    } catch (erro) {
      if (erro && erro.definitiva) throw erro
      ultimo = erro
      await esperar(200)
    }
  }
  throw ultimo instanceof Error ? ultimo : new Error('A fumaça passou do tempo.')
}

async function paginaDo(porta) {
  const resposta = await fetch(`http://127.0.0.1:${porta}/json/list`)
  if (!resposta.ok) throw new Error(`Depuração remota respondeu ${resposta.status}.`)
  const lista = await resposta.json()
  const pagina = lista.find((item) => item.type === 'page' && item.webSocketDebuggerUrl && !String(item.url).startsWith('devtools://'))
  if (!pagina) throw new Error('A janela ainda não apareceu na depuração remota.')
  return pagina.webSocketDebuggerUrl
}

function conectar(url) {
  const ws = new WebSocket(url)
  let seq = 0
  const pendentes = new Map()
  const aberto = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve)
    ws.addEventListener('error', () => reject(new Error('Não conectei na depuração remota.')))
  })
  ws.addEventListener('message', (evento) => {
    const mensagem = JSON.parse(String(evento.data))
    if (!mensagem.id || !pendentes.has(mensagem.id)) return
    const pendente = pendentes.get(mensagem.id)
    pendentes.delete(mensagem.id)
    if (mensagem.error) pendente.reject(new Error(mensagem.error.message || 'Falha na depuração remota.'))
    else pendente.resolve(mensagem.result)
  })
  return {
    ws,
    aberto,
    enviar(method, params = {}) {
      const id = ++seq
      return new Promise((resolve, reject) => {
        const prazo = setTimeout(() => {
          pendentes.delete(id)
          reject(new Error(`Depuração remota não respondeu a ${method}.`))
        }, 10_000)
        pendentes.set(id, {
          resolve(valor) {
            clearTimeout(prazo)
            resolve(valor)
          },
          reject(erro) {
            clearTimeout(prazo)
            reject(erro)
          },
        })
        ws.send(JSON.stringify({ id, method, params }))
      })
    },
  }
}

async function estadoDaTela(cdp) {
  const resultado = await cdp.enviar('Runtime.evaluate', {
    expression: `({
      ponte: typeof window.esteira,
      chamar: typeof window.esteira?.chamar,
      texto: document.body ? document.body.innerText : ''
    })`,
    returnByValue: true,
  })
  if (resultado.exceptionDetails) throw new Error('Não consegui ler a janela.')
  return resultado.result.value
}

async function gravarTelas(pagina, destino) {
  await pagina.enviar('Page.enable')
  const tamanhos = [
    [1440, 900],
    [1280, 800],
  ]
  for (const [width, height] of tamanhos) {
    await pagina.enviar('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    })
    await esperar(400)
    const foto = await pagina.enviar('Page.captureScreenshot', { format: 'png' })
    await writeFile(path.join(destino, `electron-demo-${width}x${height}.png`), Buffer.from(foto.data, 'base64'))
  }
}

function encerrar(filho) {
  if (!filho.pid) return
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(filho.pid), '/t', '/f'], { stdio: 'ignore' })
    return
  }
  try {
    process.kill(-filho.pid, 'SIGKILL')
  } catch {
    filho.kill('SIGKILL')
  }
}

async function main() {
  const alvo = process.argv[2]
  const empacotado = Boolean(alvo)
  const binario = empacotado ? path.resolve(alvo) : exigir('electron')
  if (!(await existe(binario))) throw new Error(`Não encontrei o executável ${binario}.`)
  if (!empacotado) await conferirPreloadDoBuild()
  if (empacotado) {
    const skill = path.join(path.dirname(binario), 'resources', 'skills', 'escrever-story', 'SKILL.md')
    if (!(await existe(skill))) throw new Error(`O pacote não inclui ${skill}.`)
  }

  const porta = await portaLivre()
  const dataDir = await mkdtemp(path.join(tmpdir(), 'esteira-smoke-data-'))
  const cwd = empacotado ? await mkdtemp(path.join(tmpdir(), 'esteira-smoke-cwd-')) : raiz
  const args = [`--remote-debugging-port=${porta}`, '--disable-gpu', '--disable-dev-shm-usage']
  if (!empacotado) args.push('.')

  let registro = ''
  const filho = spawn(binario, args, {
    cwd,
    env: { ...process.env, ESTEIRA_FAKE: '1', ESTEIRA_DATA: dataDir },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  })
  const anexar = (fluxo) => {
    fluxo.on('data', (pedaço) => {
      registro += pedaço.toString()
      if (registro.length > 20_000) registro = registro.slice(-20_000)
    })
  }
  anexar(filho.stdout)
  anexar(filho.stderr)

  const sessoes = []
  try {
    const pagina = conectar(await ate(30_000, () => paginaDo(porta)))
    sessoes.push(pagina)
    await pagina.aberto
    const tela = await ate(40_000, async () => {
      const atual = await estadoDaTela(pagina)
      if (atual.chamar !== 'function') throw new Error('window.esteira.chamar ainda não existe.')
      if (atual.texto.includes('Failed to fetch')) throw falha('A tela mostrou Failed to fetch.')
      if (atual.texto.includes('Não encontrei a skill')) throw falha(atual.texto)
      if (!atual.texto.includes('Exemplo local')) throw new Error(`A tela ainda não carregou o modo demo.\n${atual.texto}`)
      return atual
    })
    if (tela.ponte !== 'object') throw new Error(`window.esteira é ${tela.ponte}.`)
    const destino = process.env.ESTEIRA_SMOKE_SHOT
    if (destino) await gravarTelas(pagina, destino)
    console.log(empacotado ? 'Fumaça do app empacotado ok.' : 'Fumaça do Electron ok.')
  } catch (erro) {
    const detalhe = erro instanceof Error ? erro.message : String(erro)
    const ruido = registro
      .split('\n')
      .filter((linha) => linha.trim() && !linha.includes('dbus/'))
      .slice(-30)
      .join('\n')
    throw new Error(`${detalhe}${ruido ? `\n${ruido}` : ''}`)
  } finally {
    for (const sessao of sessoes) sessao.ws.close()
    encerrar(filho)
    await esperar(400)
    await rm(dataDir, { recursive: true, force: true }).catch(() => {})
    if (empacotado) await rm(cwd, { recursive: true, force: true }).catch(() => {})
  }
}

main().catch((erro) => {
  console.error(erro instanceof Error ? erro.message : erro)
  process.exit(1)
})
