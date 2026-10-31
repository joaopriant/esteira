import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { Disco } from '../ports'
import { caminhoSeguro } from './seguro'

const ESPERA_RENAME_MS = [40, 120, 360]

type DiscoIo = {
  renomear: (de: string, para: string) => Promise<void>
  esperar: (ms: number) => Promise<void>
}

export function criarDisco(raiz: string, io?: Partial<DiscoIo>): Disco {
  const renomear = io?.renomear ?? ((de: string, para: string) => fs.rename(de, para))
  const esperar = io?.esperar ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)))
  return {
    caminho(relativo: string) {
      return caminhoSeguro(raiz, relativo || '.')
    },
    async lerJson<T>(relativo: string): Promise<T | null> {
      try {
        const texto = await fs.readFile(caminhoSeguro(raiz, relativo), 'utf8')
        return JSON.parse(texto) as T
      } catch (erro) {
        if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return null
        throw erro
      }
    },
    async gravarJson(relativo: string, valor: unknown) {
      const destino = caminhoSeguro(raiz, relativo)
      await fs.mkdir(path.dirname(destino), { recursive: true })
      const temp = `${destino}.${process.pid}.${randomUUID()}.tmp`
      await fs.writeFile(temp, JSON.stringify(valor, null, 2), 'utf8')
      try {
        await renomearSubstituindo(temp, destino, renomear, esperar)
      } catch (erro) {
        await fs.rm(temp, { force: true })
        throw erro
      }
    },
    async listar(relativo: string) {
      try {
        return await fs.readdir(caminhoSeguro(raiz, relativo || '.'))
      } catch (erro) {
        if ((erro as NodeJS.ErrnoException).code === 'ENOENT') return []
        throw erro
      }
    },
  }
}

async function renomearSubstituindo(
  de: string,
  para: string,
  renomear: (de: string, para: string) => Promise<void>,
  esperar: (ms: number) => Promise<void>,
): Promise<void> {
  let ultimo: unknown
  for (let tentativa = 0; tentativa < ESPERA_RENAME_MS.length + 1; tentativa++) {
    if (tentativa > 0) await esperar(ESPERA_RENAME_MS[tentativa - 1] ?? ESPERA_RENAME_MS[ESPERA_RENAME_MS.length - 1]!)
    try {
      await renomear(de, para)
      return
    } catch (erro) {
      const codigo = (erro as NodeJS.ErrnoException).code
      if (codigo !== 'EPERM' && codigo !== 'EBUSY') throw erro
      ultimo = erro
    }
  }
  throw ultimo
}
