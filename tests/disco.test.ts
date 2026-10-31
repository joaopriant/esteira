import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { criarDisco } from '../src/adapters/disco'

const pastas: string[] = []

afterEach(async () => {
  await Promise.all(pastas.splice(0).map((pasta) => fs.rm(pasta, { recursive: true, force: true })))
})

function erroCodigo(codigo: string): NodeJS.ErrnoException {
  const erro = new Error(codigo) as NodeJS.ErrnoException
  erro.code = codigo
  return erro
}

async function raiz(): Promise<string> {
  const pasta = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-disco-'))
  pastas.push(pasta)
  return pasta
}

describe('gravação atômica no disco', () => {
  it('grava o json e lê de volta', async () => {
    const disco = criarDisco(await raiz())
    await disco.gravarJson('config.json', { ok: true })
    expect(await disco.lerJson('config.json')).toEqual({ ok: true })
  })

  it('tenta de novo quando o rename devolve EPERM ou EBUSY', async () => {
    const pasta = await raiz()
    let tentativas = 0
    let esperas = 0
    const disco = criarDisco(pasta, {
      esperar: async () => {
        esperas += 1
      },
      renomear: async (de, para) => {
        tentativas += 1
        if (tentativas < 3) throw erroCodigo(tentativas === 1 ? 'EPERM' : 'EBUSY')
        await fs.rename(de, para)
      },
    })
    await disco.gravarJson('pasta/config.json', { v: 1 })
    expect(tentativas).toBe(3)
    expect(esperas).toBe(2)
    expect(await disco.lerJson('pasta/config.json')).toEqual({ v: 1 })
    expect((await fs.readdir(path.join(pasta, 'pasta'))).some((nome) => nome.endsWith('.tmp'))).toBe(false)
  })

  it('desiste depois das tentativas e não deixa o temporário', async () => {
    const pasta = await raiz()
    let tentativas = 0
    const disco = criarDisco(pasta, {
      esperar: async () => {},
      renomear: async () => {
        tentativas += 1
        throw erroCodigo('EPERM')
      },
    })
    await expect(disco.gravarJson('config.json', { v: 1 })).rejects.toThrow(/EPERM/)
    expect(tentativas).toBe(4)
    expect(await disco.lerJson('config.json')).toBeNull()
    expect((await fs.readdir(pasta)).some((nome) => nome.endsWith('.tmp'))).toBe(false)
  })

  it('não repete um erro que não é de arquivo ocupado', async () => {
    const pasta = await raiz()
    let tentativas = 0
    let esperas = 0
    const disco = criarDisco(pasta, {
      esperar: async () => {
        esperas += 1
      },
      renomear: async () => {
        tentativas += 1
        throw erroCodigo('ENOENT')
      },
    })
    await expect(disco.gravarJson('config.json', { v: 1 })).rejects.toThrow(/ENOENT/)
    expect(tentativas).toBe(1)
    expect(esperas).toBe(0)
    expect((await fs.readdir(pasta)).some((nome) => nome.endsWith('.tmp'))).toBe(false)
  })
})
