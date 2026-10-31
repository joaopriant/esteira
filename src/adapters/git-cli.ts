import path from 'node:path'
import type { GitPort, Processo } from '../ports'
import { caminhoSeguro, redigirSegredo, validarBranch, validarRemoto } from './seguro'

function ambienteGit(pat: string, base: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const header = `AUTHORIZATION: Basic ${Buffer.from(`:${pat}`).toString('base64')}`
  const env: NodeJS.ProcessEnv = { ...base }
  delete env.ANTHROPIC_API_KEY
  delete env.ANTHROPIC_AUTH_TOKEN
  env.GIT_TERMINAL_PROMPT = '0'
  env.GIT_CONFIG_COUNT = '1'
  env.GIT_CONFIG_KEY_0 = 'http.extraheader'
  env.GIT_CONFIG_VALUE_0 = header
  env.GIT_CONFIG_NOSYSTEM = '1'
  return env
}

async function garantir(processo: Processo, pedido: Parameters<Processo['executar']>[0], oQue: string) {
  const resultado = await processo.executar(pedido)
  if (resultado.codigo !== 0) {
    const detalhe = redigirSegredo(resultado.stderr.trim()) || 'git falhou'
    throw new Error(`${oQue}: ${detalhe}`)
  }
  return resultado
}

export function criarGit(processo: Processo, raizRepos: string): GitPort {
  function destino(dest: string) {
    return caminhoSeguro(raizRepos, path.relative(raizRepos, path.resolve(dest)) || '.')
  }
  return {
    async clone({ url, dest, branch, pat }) {
      const remoto = validarRemoto(url).toString()
      const branchOk = validarBranch(branch)
      const pasta = destino(dest)
      await garantir(
        processo,
        {
          comando: 'git',
          args: ['clone', '--branch', branchOk, '--single-branch', remoto, pasta],
          env: ambienteGit(pat, process.env),
          timeoutMs: 180_000,
        },
        'Não consegui clonar',
      )
    },
    async atualizar({ dest, branch, pat }) {
      const pasta = destino(dest)
      const branchOk = validarBranch(branch)
      const env = ambienteGit(pat, process.env)
      const antes = await garantir(processo, { comando: 'git', args: ['rev-parse', 'HEAD'], cwd: pasta, env, timeoutMs: 30_000 }, 'Não li o commit')
      await garantir(
        processo,
        { comando: 'git', args: ['pull', '--ff-only', 'origin', branchOk], cwd: pasta, env, timeoutMs: 180_000 },
        'Não consegui atualizar',
      )
      const diff = await garantir(
        processo,
        { comando: 'git', args: ['diff', '--name-only', antes.stdout.trim(), 'HEAD'], cwd: pasta, env, timeoutMs: 30_000 },
        'Não li os arquivos alterados',
      )
      return { arquivosAlterados: diff.stdout.split('\n').map((linha) => linha.trim()).filter(Boolean) }
    },
    async listarArquivos(dest) {
      const pasta = destino(dest)
      const resultado = await garantir(
        processo,
        { comando: 'git', args: ['ls-files'], cwd: pasta, env: process.env, timeoutMs: 30_000 },
        'Não listei os arquivos',
      )
      return resultado.stdout.split('\n').map((linha) => linha.trim()).filter(Boolean)
    },
    async lerArquivo(dest, relativo) {
      const pasta = destino(dest)
      const arquivo = caminhoSeguro(pasta, relativo)
      const fs = await import('node:fs/promises')
      return fs.readFile(arquivo, 'utf8')
    },
    async head(dest) {
      const pasta = destino(dest)
      const resultado = await garantir(
        processo,
        { comando: 'git', args: ['rev-parse', 'HEAD'], cwd: pasta, env: process.env, timeoutMs: 30_000 },
        'Não li o commit',
      )
      return resultado.stdout.trim()
    },
  }
}
