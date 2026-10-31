import { spawn, type ChildProcess } from 'node:child_process'
import type { Processo } from '../ports'

const TETO_SAIDA = 2_000_000

export class ExecucaoParada extends Error {
  constructor() {
    super('Parado.')
    this.name = 'AbortError'
  }
}

export function ehParada(erro: unknown): boolean {
  return erro instanceof Error && erro.name === 'AbortError'
}

// shortcut: neto que chamar setsid escapa do grupo, revisar se o claude -p passar a soltar o processo.
function matarArvore(filho: ChildProcess): void {
  const pid = filho.pid
  if (!pid) return
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(pid), '/t', '/f'], { windowsHide: true, stdio: 'ignore' })
    return
  }
  try {
    process.kill(-pid, 'SIGKILL')
  } catch {
    try {
      filho.kill('SIGKILL')
    } catch {
      /* já saiu */
    }
  }
}

export function criarProcesso(): Processo {
  return {
    executar({ comando, args, cwd, env, entrada, timeoutMs, sinal }) {
      return new Promise((resolve, reject) => {
        const filho = spawn(comando, args, {
          cwd,
          env,
          shell: false,
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: process.platform !== 'win32',
        })
        let stdout = ''
        let stderr = ''
        let estourou = false
        let cancelado = false
        let terminou = false
        const fechar = () => {
          sinal?.removeEventListener('abort', aoAbortar)
          clearTimeout(timer)
        }
        const falhar = (erro: Error) => {
          if (terminou) return
          terminou = true
          fechar()
          reject(erro)
        }
        const concluir = (valor: { codigo: number; stdout: string; stderr: string }) => {
          if (terminou) return
          terminou = true
          fechar()
          resolve(valor)
        }
        const aoAbortar = () => {
          cancelado = true
          matarArvore(filho)
        }
        const timer = setTimeout(() => {
          estourou = true
          matarArvore(filho)
        }, timeoutMs)
        filho.stdout.setEncoding('utf8')
        filho.stderr.setEncoding('utf8')
        filho.stdout.on('data', (parte: string) => {
          if (stdout.length < TETO_SAIDA) stdout += parte.slice(0, TETO_SAIDA - stdout.length)
        })
        filho.stderr.on('data', (parte: string) => {
          if (stderr.length < TETO_SAIDA) stderr += parte.slice(0, TETO_SAIDA - stderr.length)
        })
        filho.on('error', (erro) => {
          falhar(erro)
        })
        filho.on('close', (codigo) => {
          if (cancelado || sinal?.aborted) {
            falhar(new ExecucaoParada())
            return
          }
          if (estourou) {
            falhar(new Error(`O processo ${comando} passou de ${timeoutMs} ms.`))
            return
          }
          concluir({ codigo: codigo ?? 1, stdout, stderr })
        })
        if (entrada) filho.stdin.end(entrada)
        else filho.stdin.end()
        if (sinal?.aborted) aoAbortar()
        else sinal?.addEventListener('abort', aoAbortar, { once: true })
      })
    },
  }
}
