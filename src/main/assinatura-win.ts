// shortcut: o workflow publica no GitHub Release; a máquina lê um feed HTTPS à parte.
// Revisar quando houver um destino de upload só dos binários, sem token do repositório.

export type ModoAssinatura = 'desligada' | 'pfx' | 'azure'

export interface OpcoesAzure {
  publisherName: string
  endpoint: string
  certificateProfileName: string
  codeSigningAccountName: string
}

export interface BuildComWin {
  win?: Record<string, unknown>
}

export class AssinaturaWin {
  static readonly feedFechado = 'https://feed.esteira.invalid/updates/'

  static readonly chavesAzure = [
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET',
    'AZURE_TRUSTED_SIGNING_ENDPOINT',
    'AZURE_TRUSTED_SIGNING_ACCOUNT',
    'AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE',
    'AZURE_TRUSTED_SIGNING_PUBLISHER',
  ] as const

  static preenchido(valor: string | undefined): boolean {
    return typeof valor === 'string' && valor.trim().length > 0
  }

  static modo(env: NodeJS.ProcessEnv): ModoAssinatura {
    if (this.chavesAzure.every((chave) => this.preenchido(env[chave]))) return 'azure'
    const link = env.WIN_CSC_LINK ?? env.CSC_LINK
    const senha = env.WIN_CSC_KEY_PASSWORD ?? env.CSC_KEY_PASSWORD
    if (this.preenchido(link) && this.preenchido(senha)) return 'pfx'
    return 'desligada'
  }

  static configurar<T extends BuildComWin>(build: T, env: NodeJS.ProcessEnv): T & {
    win: Record<string, unknown> & { signAndEditExecutable: boolean; azureSignOptions?: OpcoesAzure }
    publish: [{ provider: 'generic'; url: string }]
  } {
    const win: Record<string, unknown> = { ...(build.win ?? {}) }
    delete win.azureSignOptions
    const modo = this.modo(env)
    if (modo === 'azure') {
      win.signAndEditExecutable = true
      win.azureSignOptions = {
        publisherName: env.AZURE_TRUSTED_SIGNING_PUBLISHER!.trim(),
        endpoint: env.AZURE_TRUSTED_SIGNING_ENDPOINT!.trim(),
        certificateProfileName: env.AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE!.trim(),
        codeSigningAccountName: env.AZURE_TRUSTED_SIGNING_ACCOUNT!.trim(),
      }
    } else if (modo === 'pfx') {
      win.signAndEditExecutable = true
    } else {
      win.signAndEditExecutable = false
    }
    return {
      ...build,
      win: win as Record<string, unknown> & { signAndEditExecutable: boolean; azureSignOptions?: OpcoesAzure },
      publish: [{ provider: 'generic', url: this.feedFechado }],
    }
  }
}
