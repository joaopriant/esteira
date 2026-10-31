export interface FonteFeed {
  env?: string
  arquivo?: string
}

export interface ConfirmacaoAtualizacao {
  mensagem: string
  detalhe: string
  instalar: string
  agoraNao: string
}

export interface FalhaAtualizacao {
  mensagem: string
  detalhe: string
}

export interface AtualizadorControlavel {
  desligarInstalacaoAutomatica(): void
  aoDisponivel(ouvinte: (versao: string) => void): void
  aoBaixado(ouvinte: () => void): void
  aoErro(ouvinte: (erro: unknown) => void): void
  baixar(): void
  instalar(): void
}

export class Atualizacao {
  static readonly limiteUrl = 4_000
  static readonly limiteArquivo = 8_000

  static deveChecar(entrada: { empacotado: boolean; modo: 'real' | 'falso'; url: string | null }): boolean {
    return entrada.empacotado && entrada.modo === 'real' && entrada.url != null
  }

  static urlDoFeed(fonte: FonteFeed): string | null {
    const env = fonte.env?.trim() ?? ''
    if (env) return this.normalizar(env)
    if (!fonte.arquivo) return null
    const lida = this.lerUrlDoArquivo(fonte.arquivo)
    if (!lida) return null
    return this.normalizar(lida)
  }

  static lerUrlDoArquivo(texto: string): string | null {
    const corpo = texto.replace(/^\uFEFF/, '')
    if (corpo.length > this.limiteArquivo) return null
    let dados: unknown
    try {
      dados = JSON.parse(corpo)
    } catch {
      return null
    }
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return null
    const url = (dados as { url?: unknown }).url
    return typeof url === 'string' ? url : null
  }

  static confirmacao(versao: string): ConfirmacaoAtualizacao {
    return {
      mensagem: `Há a versão ${this.versaoExibivel(versao)}.`,
      detalhe: 'A Esteira baixa o instalador e instala em seguida. Sem este sim, nada muda.',
      instalar: 'Instalar',
      agoraNao: 'Agora não',
    }
  }

  static querInstalar(resposta: number): boolean {
    return resposta === 0
  }

  static versaoExibivel(versao: string): string {
    const limpa = versao.trim().slice(0, 40)
    if (!/^[0-9A-Za-z][0-9A-Za-z.+-]*$/.test(limpa)) return 'nova'
    return limpa
  }

  static redigir(texto: string): string {
    return texto.replace(/https?:\/\/\S+/gi, '[endereço]').slice(0, 300)
  }

  static hostParaLog(url: string): string {
    try {
      return new URL(url).host
    } catch {
      return 'feed'
    }
  }

  static falhaAoInstalar(erro: unknown): FalhaAtualizacao {
    const bruto = erro instanceof Error ? erro.message : 'Falha ao instalar.'
    const detalhe = this.redigir(bruto).trim() || 'Falha ao instalar.'
    return { mensagem: 'Não consegui instalar a atualização.', detalhe }
  }

  static ligar(opcoes: {
    atualizador: AtualizadorControlavel
    perguntar: (confirmacao: ConfirmacaoAtualizacao) => Promise<number>
    avisarErro: (falha: FalhaAtualizacao) => void
  }): void {
    let aceitou = false
    opcoes.atualizador.desligarInstalacaoAutomatica()
    opcoes.atualizador.aoDisponivel((versao) => {
      void Promise.resolve(opcoes.perguntar(this.confirmacao(versao)))
        .then((resposta) => {
          if (!this.querInstalar(resposta) || aceitou) return
          aceitou = true
          opcoes.atualizador.baixar()
        })
        .catch((erro: unknown) => {
          opcoes.avisarErro(this.falhaAoInstalar(erro))
        })
    })
    opcoes.atualizador.aoBaixado(() => {
      if (aceitou) opcoes.atualizador.instalar()
    })
    opcoes.atualizador.aoErro((erro) => {
      if (!aceitou) return
      opcoes.avisarErro(this.falhaAoInstalar(erro))
    })
  }

  private static normalizar(bruta: string): string | null {
    if (bruta.length > this.limiteUrl) return null
    let url: URL
    try {
      url = new URL(bruta)
    } catch {
      return null
    }
    if (url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    if (!url.hostname || this.hostRecusado(url.hostname)) return null
    url.hash = ''
    if (!url.pathname.endsWith('/')) url.pathname += '/'
    return url.toString()
  }

  private static hostRecusado(hostname: string): boolean {
    const host = hostname.toLowerCase().replace(/\.$/, '')
    if (host === 'github.com' || host.endsWith('.github.com')) return true
    if (host === 'githubusercontent.com' || host.endsWith('.githubusercontent.com')) return true
    return false
  }
}
