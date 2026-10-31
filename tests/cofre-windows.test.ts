import { describe, expect, it } from 'vitest'
import { cofreSistema } from '../src/adapters/segredos'

describe.skipIf(process.platform !== 'win32')('cofre no Windows', () => {
  it('grava, lê e apaga uma credencial de verdade', async () => {
    const cofre = cofreSistema()
    const conta = `ci-prova-${Date.now()}`
    const segredo = `prova-${conta}`
    try {
      await cofre.apagar(conta)
      await cofre.gravar(conta, segredo)
      expect(await cofre.ler(conta)).toBe(segredo)
    } finally {
      await cofre.apagar(conta)
    }
    expect(await cofre.ler(conta)).toBeNull()
  })
})
