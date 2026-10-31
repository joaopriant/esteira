import fs from 'node:fs'
import { spawn, type ChildProcess } from 'node:child_process'
import type { Processo } from '../ports'
import { Executavel, type BuscaNoDisco } from './executavel'

const TETO_SAIDA = 2_000_000
const TETO_ATALHO = 64_000
// Depois do kill, netos (ripgrep, MCP) podem segurar o pipe e o close não chega.
export const GRACA_MS = 2_000

export function matarFilho(filho: Pick<ChildProcess, 'pid' | 'kill'>, plataforma: NodeJS.Platform = process.platform): void {
  if (plataforma === 'win32' && filho.pid) {
    spawn('taskkill', ['/pid', String(filho.pid), '/t', '/f'], {
      windowsHide: true,
      stdio: 'ignore',
      shell: false,
    }).on('error', () => {
      try {
        filho.kill('SIGKILL')
      } catch {
        /* já saiu */
      }
    })
    return
  }
  try {
    filho.kill('SIGKILL')
  } catch {
    /* já saiu */
  }
}

function avisar(
  ouvir: ((canal: 'stdout' | 'stderr', texto: string) => void) | undefined,
  canal: 'stdout' | 'stderr',
  texto: string,
) {
  if (!ouvir) return
  try {
    ouvir(canal, texto)
  } catch {
    // progresso não pode derrubar o processo
  }
}

function soltar(filho: ChildProcess): void {
  filho.stdout?.destroy()
  filho.stderr?.destroy()
  filho.stdin?.destroy()
  try {
    filho.unref()
  } catch {
    /* o dublê de teste não tem unref */
  }
}

function buscaReal(env: NodeJS.ProcessEnv | undefined): BuscaNoDisco {
  const fonte = env ?? process.env
  let pathEnv = ''
  for (const chave of Object.keys(fonte)) {
    if (chave.toLowerCase() === 'path') {
      pathEnv = fonte[chave] ?? ''
      break
    }
  }
  return {
    plataforma: process.platform,
    pathEnv,
    existe(caminho) {
      try {
        return fs.statSync(caminho).isFile()
      } catch {
        return false
      }
    },
    ler(caminho) {
      try {
        const stat = fs.statSync(caminho)
        if (!stat.isFile() || stat.size > TETO_ATALHO) return null
        return fs.readFileSync(caminho, 'utf8')
      } catch {
        return null
      }
    },
  }
}

export function criarProcesso(busca?: BuscaNoDisco, plataforma: NodeJS.Platform = process.platform): Processo {
  return {
    executar({ comando, args, cwd, env, entrada, timeoutMs, aoSaida }) {
      return new Promise((resolve, reject) => {
        let alvo: { comando: string; args: string[] }
        try {
          alvo = Executavel.preparar(comando, args, busca ?? buscaReal(env))
        } catch (erro) {
          reject(erro instanceof Error ? erro : new Error('Não consegui abrir o executável.'))
          return
        }
        const filho = spawn(alvo.comando, alvo.args, {
          cwd,
          env,
          shell: false,
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        let stdout = ''
        let stderr = ''
        let estourou = false
        let acabou = false
        let timer: ReturnType<typeof setTimeout>
        let graca: ReturnType<typeof setTimeout> | undefined
        const estouro = () => new Error(`O processo ${comando} passou de ${timeoutMs} ms.`)
        const terminar = (acao: () => void) => {
          if (acabou) return
          acabou = true
          clearTimeout(timer)
          clearTimeout(graca)
          acao()
        }
        timer = setTimeout(() => {
          estourou = true
          matarFilho(filho, plataforma)
          graca = setTimeout(() => {
            terminar(() => reject(estouro()))
            soltar(filho)
          }, GRACA_MS)
        }, timeoutMs)
        filho.stdout.setEncoding('utf8')
        filho.stderr.setEncoding('utf8')
        filho.stdout.on('data', (parte: string) => {
          avisar(aoSaida, 'stdout', parte)
          if (stdout.length < TETO_SAIDA) stdout += parte.slice(0, TETO_SAIDA - stdout.length)
        })
        filho.stderr.on('data', (parte: string) => {
          avisar(aoSaida, 'stderr', parte)
          if (stderr.length < TETO_SAIDA) stderr += parte.slice(0, TETO_SAIDA - stderr.length)
        })
        filho.on('error', (erro) => {
          terminar(() => reject(estourou ? estouro() : erro))
        })
        filho.on('close', (codigo) => {
          terminar(() => {
            if (estourou) {
              reject(estouro())
              return
            }
            resolve({ codigo: codigo ?? 1, stdout, stderr })
          })
        })
        if (entrada) filho.stdin.end(entrada)
        else filho.stdin.end()
      })
    },
  }
}
