import fs from 'node:fs/promises'
import path from 'node:path'
import type { Disco } from '../ports'
import { caminhoSeguro } from './seguro'

export function criarDisco(raiz: string): Disco {
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
      const temp = `${destino}.${process.pid}.tmp`
      await fs.writeFile(temp, JSON.stringify(valor, null, 2), 'utf8')
      await fs.rename(temp, destino)
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
