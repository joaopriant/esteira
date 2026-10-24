import { spawn } from 'node:child_process'
import type { Processo } from '../ports'

const TETO_SAIDA = 2_000_000

export function criarProcesso(): Processo {
  return {
    executar({ comando, args, cwd, env, entrada, timeoutMs }) {
      return new Promise((resolve, reject) => {
        const filho = spawn(comando, args, {
          cwd,
          env,
          shell: false,
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        let stdout = ''
        let stderr = ''
        let estourou = false
        const timer = setTimeout(() => {
          estourou = true
          filho.kill()
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
          clearTimeout(timer)
          reject(erro)
        })
        filho.on('close', (codigo) => {
          clearTimeout(timer)
          if (estourou) {
            reject(new Error(`O processo ${comando} passou de ${timeoutMs} ms.`))
            return
          }
          resolve({ codigo: codigo ?? 1, stdout, stderr })
        })
        if (entrada) filho.stdin.end(entrada)
        else filho.stdin.end()
      })
    },
  }
}
