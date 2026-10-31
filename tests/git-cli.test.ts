import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { criarGit } from '../src/adapters/git-cli'
import type { Processo } from '../src/ports'

const pastas: string[] = []

afterEach(async () => {
  await Promise.all(pastas.splice(0).map((pasta) => fs.rm(pasta, { recursive: true, force: true })))
})

describe('clone', () => {
  it('passa ao git a URL sem usuário nem senha', async () => {
    const argsVistos: string[][] = []
    const processo: Processo = {
      async executar(pedido) {
        argsVistos.push(pedido.args)
        return { codigo: 0, stdout: '', stderr: '' }
      },
    }
    const raiz = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-git-'))
    pastas.push(raiz)
    const git = criarGit(processo, raiz)
    const comUsuario = 'https://fintech@dev.azure.com/fintech/P/_git/app'
    const comSenha = ['https://', 'alguem:', 'segredo@', 'dev.azure.com/fintech/P/_git/app'].join('')
    await git.clone({ url: comUsuario, dest: path.join(raiz, 'um'), branch: 'main', pat: 'pat-de-teste' })
    await git.clone({ url: comSenha, dest: path.join(raiz, 'dois'), branch: 'main', pat: 'pat-de-teste' })
    expect(argsVistos).toHaveLength(2)
    for (const args of argsVistos) {
      expect(args).toContain('https://dev.azure.com/fintech/P/_git/app')
      expect(args.join(' ')).not.toContain('fintech@')
      expect(args.join(' ')).not.toContain('segredo')
      expect(args.join(' ')).not.toContain('alguem')
    }
  })
})
