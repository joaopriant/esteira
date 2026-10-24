import type { SecretStore } from '../ports'

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

export function cofreSistema(): SecretStore {
  return {
    async ler(conta) {
      const { Entry } = await import('@napi-rs/keyring')
      try {
        return new Entry('Esteira', conta).getPassword()
      } catch {
        return null
      }
    },
    async gravar(conta, segredo) {
      const { Entry } = await import('@napi-rs/keyring')
      new Entry('Esteira', conta).setPassword(segredo)
    },
    async apagar(conta) {
      const { Entry } = await import('@napi-rs/keyring')
      try {
        new Entry('Esteira', conta).deletePassword()
      } catch {
        /* já não estava lá */
      }
    },
  }
}
