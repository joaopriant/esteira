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
    if (this.pfxCompleto(env)) return 'pfx'
    return 'desligada'
  }

  /** A release falha aqui. O job de pull request não chama este método e segue sem certificado. */
  static exigir(env: NodeJS.ProcessEnv): Exclude<ModoAssinatura, 'desligada'> {
    const lacunas = this.lacunas(env)
    if (lacunas.length > 0) throw new Error(lacunas.join(' '))
    const modo = this.modo(env)
    if (modo === 'desligada') {
      throw new Error('A release exige certificado completo (PFX ou Azure Trusted Signing). Sem ele o instalador sairia sem assinatura e a atualização não conferiria o editor.')
    }
    return modo
  }

  static lacunas(env: NodeJS.ProcessEnv): string[] {
    const mensagens: string[] = []
    const azureCheias = this.chavesAzure.filter((chave) => this.preenchido(env[chave]))
    if (azureCheias.length > 0 && azureCheias.length < this.chavesAzure.length) {
      const faltam = this.chavesAzure.filter((chave) => !this.preenchido(env[chave]))
      mensagens.push(`Azure Trusted Signing incompleto. Faltam: ${faltam.join(', ')}.`)
    }
    const link = this.temLinkPfx(env)
    const senha = this.temSenhaPfx(env)
    if (link !== senha) {
      mensagens.push(link
        ? 'PFX sem senha (WIN_CSC_KEY_PASSWORD ou CSC_KEY_PASSWORD).'
        : 'Senha de PFX sem o certificado (WIN_CSC_LINK ou CSC_LINK).')
    }
    return mensagens
  }

  /** Lê o publisherName que o electron-builder grava em resources/app-update.yml. */
  static publisherNameDe(yaml: string): string | null {
    const linhas = yaml.split(/\r?\n/)
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i] ?? ''
      if (!linha || linha.startsWith(' ') || linha.startsWith('\t') || linha.startsWith('#')) continue
      const cabeca = linha.match(/^publisherName:\s*(.*)$/)
      if (!cabeca) continue
      const resto = cabeca[1].trim()
      if (resto === '' || resto === '|' || resto === '>') {
        for (let j = i + 1; j < linhas.length; j++) {
          const item = (linhas[j] ?? '').match(/^\s+-\s+(.*)$/)
          if (!item) break
          const nome = this.escalarYaml(item[1] ?? '')
          if (nome) return nome
        }
        return null
      }
      if (resto.startsWith('[')) {
        const interno = resto.slice(1, resto.lastIndexOf(']'))
        return this.escalarYaml(interno.split(',')[0] ?? '')
      }
      return this.escalarYaml(resto)
    }
    return null
  }

  static configurar<T extends BuildComWin>(build: T, env: NodeJS.ProcessEnv): T & {
    win: Record<string, unknown> & { signAndEditExecutable: boolean; azureSignOptions?: OpcoesAzure }
    publish: [{ provider: 'generic'; url: string; publisherName?: string[] }]
  } {
    const win: Record<string, unknown> = { ...(build.win ?? {}) }
    delete win.azureSignOptions
    const modo = this.modo(env)
    const publish: { provider: 'generic'; url: string; publisherName?: string[] } = {
      provider: 'generic',
      url: this.feedFechado,
    }
    if (modo === 'azure') {
      const editor = env.AZURE_TRUSTED_SIGNING_PUBLISHER!.trim()
      win.signAndEditExecutable = true
      win.azureSignOptions = {
        publisherName: editor,
        endpoint: env.AZURE_TRUSTED_SIGNING_ENDPOINT!.trim(),
        certificateProfileName: env.AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE!.trim(),
        codeSigningAccountName: env.AZURE_TRUSTED_SIGNING_ACCOUNT!.trim(),
      }
      // O electron-builder copia este campo para resources/app-update.yml. Sem ele a atualização não confere o editor.
      publish.publisherName = [editor]
    } else if (modo === 'pfx') {
      win.signAndEditExecutable = true
    } else {
      win.signAndEditExecutable = false
    }
    return {
      ...build,
      win: win as Record<string, unknown> & { signAndEditExecutable: boolean; azureSignOptions?: OpcoesAzure },
      publish: [publish],
    }
  }

  private static temLinkPfx(env: NodeJS.ProcessEnv): boolean {
    return this.preenchido(env.WIN_CSC_LINK) || this.preenchido(env.CSC_LINK)
  }

  private static temSenhaPfx(env: NodeJS.ProcessEnv): boolean {
    return this.preenchido(env.WIN_CSC_KEY_PASSWORD) || this.preenchido(env.CSC_KEY_PASSWORD)
  }

  private static pfxCompleto(env: NodeJS.ProcessEnv): boolean {
    return this.temLinkPfx(env) && this.temSenhaPfx(env)
  }

  private static escalarYaml(bruto: string): string | null {
    let valor = bruto.trim()
    if (!valor || valor === '~' || valor === 'null' || valor === '[]' || valor === "''" || valor === '""') return null
    if ((valor.startsWith("'") && valor.endsWith("'")) || (valor.startsWith('"') && valor.endsWith('"'))) {
      valor = valor.slice(1, -1).trim()
    }
    return valor || null
  }
}
