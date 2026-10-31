import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SERVICO_COFRE, cofreSistema, type EntradaCofre } from '../src/adapters/segredos'

class EntradaFalsa implements EntradaCofre {
  static mapa = new Map<string, string>()

  constructor(
    readonly servico: string,
    readonly conta: string,
  ) {}

  private chave() {
    return `${this.servico}\0${this.conta}`
  }

  getPassword() {
    if (!EntradaFalsa.mapa.has(this.chave())) throw new Error('NoEntry')
    return EntradaFalsa.mapa.get(this.chave()) ?? null
  }

  setPassword(segredo: string) {
    EntradaFalsa.mapa.set(this.chave(), segredo)
  }

  deletePassword() {
    if (!EntradaFalsa.mapa.delete(this.chave())) throw new Error('NoEntry')
  }
}

describe('cofre com dublê', () => {
  it('grava, lê e apaga no serviço Esteira', async () => {
    EntradaFalsa.mapa.clear()
    const cofre = cofreSistema(async () => ({ Entry: EntradaFalsa }))
    await cofre.gravar('azure-devops:https://dev.azure.com/fintech', 'segredo-de-prova')
    expect(await cofre.ler('azure-devops:https://dev.azure.com/fintech')).toBe('segredo-de-prova')
    expect(EntradaFalsa.mapa.keys().next().value).toContain(SERVICO_COFRE)
    await cofre.apagar('azure-devops:https://dev.azure.com/fintech')
    expect(await cofre.ler('azure-devops:https://dev.azure.com/fintech')).toBeNull()
  })

  it('ler devolve null e apagar ignora conta ausente', async () => {
    EntradaFalsa.mapa.clear()
    const cofre = cofreSistema(async () => ({ Entry: EntradaFalsa }))
    expect(await cofre.ler('nao-existe')).toBeNull()
    await expect(cofre.apagar('nao-existe')).resolves.toBeUndefined()
  })

  it('o build Windows tira o módulo nativo do asar', () => {
    const pacote = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
      build: { asarUnpack: string[]; files: string[] }
    }
    expect(pacote.build.asarUnpack.join('\n')).toMatch(/@napi-rs\/keyring/)
    expect(pacote.build.files.join('\n')).toMatch(/@napi-rs\/keyring/)
  })
})
