import fs from 'node:fs'
import { spawn } from 'node:child_process'
import type { Processo } from '../ports'
import { Executavel, type BuscaNoDisco } from './executavel'

const TETO_SAIDA = 2_000_000
const TETO_ATALHO = 64_000

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

export function criarProcesso(busca?: BuscaNoDisco): Processo {
  return {
    executar({ comando, args, cwd, env, entrada, timeoutMs }) {
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
