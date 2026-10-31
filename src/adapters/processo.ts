import fs from 'node:fs'
import { spawn, type ChildProcess } from 'node:child_process'
import type { Processo } from '../ports'
import { Executavel, type BuscaNoDisco } from './executavel'

const TETO_SAIDA = 2_000_000
const TETO_ATALHO = 64_000
// Depois do kill, netos (ripgrep, MCP) podem segurar o pipe e o close não chega.
export const GRACA_MS = 2_000

export class ExecucaoParada extends Error {
  constructor() {
    super('Parado.')
    this.name = 'AbortError'
  }
}

export function ehParada(erro: unknown): boolean {
  return erro instanceof Error && erro.name === 'AbortError'
}

const vivos = new Set<ChildProcess>()

export function planoDeMorte(pid: number, plataforma: NodeJS.Platform = process.platform): { comando: 'taskkill'; args: string[] } | { grupo: true } {
  if (plataforma === 'win32') return { comando: 'taskkill', args: ['/pid', String(pid), '/t', '/f'] }
  return { grupo: true }
}

function matarSo(filho: Pick<ChildProcess, 'kill'>): void {
  try {
    filho.kill('SIGKILL')
  } catch {
    /* já saiu */
  }
}

// shortcut: neto que chamar setsid escapa do grupo, revisar se o claude -p passar a soltar o processo.
export function matarArvore(filho: Pick<ChildProcess, 'pid' | 'kill'>, plataforma: NodeJS.Platform = process.platform): void {
  const pid = filho.pid
  if (!pid) {
    matarSo(filho)
    return
  }
  const plano = planoDeMorte(pid, plataforma)
  if ('comando' in plano) {
    spawn(plano.comando, plano.args, { windowsHide: true, stdio: 'ignore', shell: false }).on('error', () => matarSo(filho))
    return
  }
  try {
    process.kill(-pid, 'SIGKILL')
  } catch {
    matarSo(filho)
  }
}

export function encerrarProcessos(): void {
  for (const filho of [...vivos]) matarArvore(filho)
}

export function ligarEncerramento(alvo: { on(evento: string, ouvinte: () => void): void }): void {
  const matar = () => encerrarProcessos()
  alvo.on('before-quit', matar)
  alvo.on('will-quit', matar)
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
    executar({ comando, args, cwd, env, entrada, timeoutMs, sinal, aoSaida }) {
      return new Promise((resolve, reject) => {
        if (sinal?.aborted) {
          reject(new ExecucaoParada())
          return
        }
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
          // Fora do Windows o filho lidera o próprio grupo, e matarArvore mata o grupo inteiro.
          detached: plataforma !== 'win32',
        })
        let stdout = ''
        let stderr = ''
        let terminou = false
        let motivo: Error | undefined
        let graca: ReturnType<typeof setTimeout> | undefined
        const fechar = () => {
          sinal?.removeEventListener('abort', aoAbortar)
          clearTimeout(timer)
          clearTimeout(graca)
          vivos.delete(filho)
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
        // Timeout e Parar seguem o mesmo caminho: mata a árvore e, se o close
        // não chegar na graça, rejeita assim mesmo e solta os pipes.
        const encerrar = (erro: Error) => {
          if (terminou || motivo) return
          motivo = erro
          matarArvore(filho, plataforma)
          graca = setTimeout(() => {
            falhar(erro)
            soltar(filho)
          }, GRACA_MS)
        }
        const aoAbortar = () => encerrar(new ExecucaoParada())
        const timer = setTimeout(() => encerrar(new Error(`O processo ${comando} passou de ${timeoutMs} ms.`)), timeoutMs)
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
        vivos.add(filho)
        filho.on('error', (erro) => falhar(motivo ?? erro))
        filho.on('close', (codigo) => {
          if (motivo) {
            falhar(motivo)
            return
          }
          concluir({ codigo: codigo ?? 1, stdout, stderr })
        })
        if (entrada) filho.stdin.end(entrada)
        else filho.stdin.end()
        sinal?.addEventListener('abort', aoAbortar, { once: true })
      })
    },
  }
}
