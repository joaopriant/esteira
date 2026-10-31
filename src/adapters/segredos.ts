import type { SecretStore } from '../ports'

export const SERVICO_COFRE = 'Esteira'

export function cofreMemoria(): SecretStore {
  const mapa = new Map<string, string>()
  return {
    async ler(conta) {
      return mapa.get(conta) ?? null
    },
    async gravar(conta, segredo) {
      mapa.set(conta, segredo)
    },
    async apagar(conta) {
      mapa.delete(conta)
    },
  }
}

export interface EntradaCofre {
  getPassword(): string | null
  setPassword(segredo: string): void
  deletePassword(): boolean | void
}

export type CarregarCofre = () => Promise<{ Entry: new (servico: string, conta: string) => EntradaCofre }>

async function carregarKeyring(): Promise<{ Entry: new (servico: string, conta: string) => EntradaCofre }> {
  const { Entry } = await import('@napi-rs/keyring')
  return { Entry }
}

export function cofreSistema(carregar: CarregarCofre = carregarKeyring): SecretStore {
  return {
    async ler(conta) {
      const { Entry } = await carregar()
      try {
        return new Entry(SERVICO_COFRE, conta).getPassword() || null
      } catch {
        return null
      }
    },
    async gravar(conta, segredo) {
      const { Entry } = await carregar()
      new Entry(SERVICO_COFRE, conta).setPassword(segredo)
    },
    async apagar(conta) {
      const { Entry } = await carregar()
      try {
        new Entry(SERVICO_COFRE, conta).deletePassword()
      } catch {
        /* já não estava lá */
      }
    },
  }
}
