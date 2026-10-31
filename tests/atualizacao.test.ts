import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Atualizacao, type AtualizadorControlavel } from '../src/main/atualizacao'
import { AssinaturaWin } from '../src/main/assinatura-win'
import pacote from '../package.json'
import config from '../electron-builder.config'

const azure = {
  AZURE_TENANT_ID: 'tenant',
  AZURE_CLIENT_ID: 'client',
  AZURE_CLIENT_SECRET: 'segredo-do-cliente',
  AZURE_TRUSTED_SIGNING_ENDPOINT: 'https://eus.codesigning.azure.net',
  AZURE_TRUSTED_SIGNING_ACCOUNT: 'conta-esteira',
  AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE: 'perfil',
  AZURE_TRUSTED_SIGNING_PUBLISHER: 'CN=Esteira',
}

function controle() {
  let baixou = false
  let instalou = false
  let automatico = true
  const disponivel: ((versao: string) => void)[] = []
  const baixado: (() => void)[] = []
  const erros: ((erro: unknown) => void)[] = []
  const atualizador: AtualizadorControlavel = {
    desligarInstalacaoAutomatica() {
      automatico = false
    },
    aoDisponivel(ouvinte) {
      disponivel.push(ouvinte)
    },
    aoBaixado(ouvinte) {
      baixado.push(ouvinte)
    },
    aoErro(ouvinte) {
      erros.push(ouvinte)
    },
    baixar() {
      baixou = true
    },
    instalar() {
      instalou = true
    },
  }
  return {
    atualizador,
    disponivel,
    baixado,
    erros,
    estado: () => ({ baixou, instalou, automatico }),
  }
}

describe('feed de atualização', () => {
  it('aceita https, completa a barra e preserva o query string', () => {
    const url = Atualizacao.urlDoFeed({ env: 'https://blob.exemplo.com/esteira?sig=abc+def%2Fghi%3D' })
    expect(url).toBe('https://blob.exemplo.com/esteira/?sig=abc+def%2Fghi%3D')
  })

  it('recusa http, usuário na URL, GitHub e texto inválido', () => {
    expect(Atualizacao.urlDoFeed({ env: 'http://blob.exemplo.com/esteira' })).toBeNull()
    expect(Atualizacao.urlDoFeed({ env: 'https://token:segredo@blob.exemplo.com/esteira' })).toBeNull()
    expect(Atualizacao.urlDoFeed({ env: 'https://github.com/joaopriant/esteira/releases/latest' })).toBeNull()
    expect(Atualizacao.urlDoFeed({ env: 'https://objects.githubusercontent.com/esteira/' })).toBeNull()
    expect(Atualizacao.urlDoFeed({ env: 'não é url' })).toBeNull()
  })

  it('com a variável inválida, ignora o arquivo', () => {
    const arquivo = JSON.stringify({ url: 'https://blob.exemplo.com/esteira' })
    expect(Atualizacao.urlDoFeed({ env: 'http://ruim.exemplo', arquivo })).toBeNull()
  })

  it('sem variável, lê a url do arquivo', () => {
    const arquivo = JSON.stringify({ url: 'https://blob.exemplo.com/esteira', outra: 'x' })
    expect(Atualizacao.urlDoFeed({ env: '  ', arquivo })).toBe('https://blob.exemplo.com/esteira/')
  })

  it('ignora json quebrado, url que não é texto e arquivo grande', () => {
    expect(Atualizacao.urlDoFeed({ arquivo: '{' })).toBeNull()
    expect(Atualizacao.urlDoFeed({ arquivo: JSON.stringify({ url: 12 }) })).toBeNull()
    expect(Atualizacao.urlDoFeed({ arquivo: 'x'.repeat(Atualizacao.limiteArquivo + 1) })).toBeNull()
  })

  it('só procura atualização no app empacotado, no modo real, com feed', () => {
    expect(Atualizacao.deveChecar({ empacotado: true, modo: 'real', url: 'https://blob.exemplo.com/' })).toBe(true)
    expect(Atualizacao.deveChecar({ empacotado: false, modo: 'real', url: 'https://blob.exemplo.com/' })).toBe(false)
    expect(Atualizacao.deveChecar({ empacotado: true, modo: 'falso', url: 'https://blob.exemplo.com/' })).toBe(false)
    expect(Atualizacao.deveChecar({ empacotado: true, modo: 'real', url: null })).toBe(false)
  })
})

async function esperar() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('confirmação antes de instalar', () => {
  it('mostra a versão e trata o botão Instalar como o sim', () => {
    const texto = Atualizacao.confirmacao('0.2.0')
    expect(texto.mensagem).toBe('Há a versão 0.2.0.')
    expect(texto.instalar).toBe('Instalar')
    expect(texto.agoraNao).toBe('Agora não')
    expect(Atualizacao.querInstalar(0)).toBe(true)
    expect(Atualizacao.querInstalar(1)).toBe(false)
  })

  it('esconde versão estranha e tira a URL da mensagem de erro', () => {
    expect(Atualizacao.versaoExibivel('0.2.0\nhttps://evil.exemplo')).toBe('nova')
    const falha = Atualizacao.falhaAoInstalar(new Error('falhou em https://blob.exemplo.com/esteira/?sig=segredo'))
    expect(falha.detalhe).toContain('[endereço]')
    expect(falha.detalhe).not.toContain('sig=')
    expect(Atualizacao.hostParaLog('https://blob.exemplo.com/esteira/?sig=segredo')).toBe('blob.exemplo.com')
  })

  it('não baixa sem o sim, e instala só depois do download aceito', async () => {
    const recusa = controle()
    const erros: string[] = []
    Atualizacao.ligar({
      atualizador: recusa.atualizador,
      perguntar: async () => 1,
      avisarErro(falha) {
        erros.push(falha.detalhe)
      },
    })
    expect(recusa.estado().automatico).toBe(false)
    recusa.disponivel[0]!('0.2.0')
    await esperar()
    recusa.erros[0]!(new Error('rede caiu https://blob.exemplo.com/?sig=segredo'))
    recusa.baixado[0]!()
    expect(recusa.estado()).toMatchObject({ baixou: false, instalou: false })
    expect(erros).toEqual([])

    const aceita = controle()
    Atualizacao.ligar({
      atualizador: aceita.atualizador,
      perguntar: async () => 0,
      avisarErro(falha) {
        erros.push(falha.detalhe)
      },
    })
    aceita.disponivel[0]!('0.2.0')
    await esperar()
    expect(aceita.estado().baixou).toBe(true)
    expect(aceita.estado().instalou).toBe(false)
    aceita.baixado[0]!()
    expect(aceita.estado().instalou).toBe(true)
    aceita.erros[0]!(new Error('instalador https://blob.exemplo.com/?sig=segredo'))
    expect(erros).toEqual(['instalador [endereço]'])
  })
})

describe('assinatura condicional', () => {
  it('fica desligada sem segredo e o feed genérico não aponta para o GitHub', () => {
    const build = AssinaturaWin.configurar(pacote.build, {})
    expect(AssinaturaWin.modo({})).toBe('desligada')
    expect(build.win.signAndEditExecutable).toBe(false)
    expect(build.win.azureSignOptions).toBeUndefined()
    expect(build.publish).toEqual([{ provider: 'generic', url: AssinaturaWin.feedFechado }])
    expect(build.nsis).toMatchObject({ artifactName: 'Esteira-Setup-${version}.${ext}', perMachine: false })
  })

  it('liga o pfx só com link e senha, sem copiar a senha para o config', () => {
    expect(AssinaturaWin.modo({ WIN_CSC_LINK: 'Y2VydA==' })).toBe('desligada')
    expect(() => AssinaturaWin.exigir({ WIN_CSC_LINK: 'Y2VydA==' })).toThrow(/WIN_CSC_KEY_PASSWORD/)
    const env = { WIN_CSC_LINK: 'Y2VydA==', WIN_CSC_KEY_PASSWORD: 'senha-do-pfx' }
    const build = AssinaturaWin.configurar(pacote.build, env)
    expect(AssinaturaWin.exigir(env)).toBe('pfx')
    expect(build.win.signAndEditExecutable).toBe(true)
    expect(build.win.azureSignOptions).toBeUndefined()
    expect(build.publish[0].publisherName).toBeUndefined()
    expect(JSON.stringify(build)).not.toContain('senha-do-pfx')
    expect(AssinaturaWin.modo({ CSC_LINK: 'Y2VydA==', CSC_KEY_PASSWORD: 'outra' })).toBe('pfx')
  })

  it('liga o Azure quando o conjunto está completo e esconde o segredo do cliente', () => {
    const incompleto = { ...azure, AZURE_CLIENT_SECRET: '   ' }
    expect(AssinaturaWin.modo(incompleto)).toBe('desligada')
    expect(() => AssinaturaWin.exigir(incompleto)).toThrow(/AZURE_CLIENT_SECRET/)
    expect(() => AssinaturaWin.exigir({})).toThrow(/certificado completo/)
    const build = AssinaturaWin.configurar(pacote.build, { ...azure, WIN_CSC_LINK: 'Y2VydA==', WIN_CSC_KEY_PASSWORD: 'senha-do-pfx' })
    expect(AssinaturaWin.exigir(azure)).toBe('azure')
    expect(build.win.signAndEditExecutable).toBe(true)
    expect(build.publish[0].publisherName).toEqual(['CN=Esteira'])
    expect(build.win.azureSignOptions).toEqual({
      publisherName: 'CN=Esteira',
      endpoint: 'https://eus.codesigning.azure.net',
      certificateProfileName: 'perfil',
      codeSigningAccountName: 'conta-esteira',
    })
    expect(JSON.stringify(build)).not.toContain('segredo-do-cliente')
    expect(JSON.stringify(build)).not.toContain('senha-do-pfx')
    expect(() => AssinaturaWin.exigir({ ...azure, WIN_CSC_LINK: 'Y2VydA==' })).toThrow(/PFX sem senha/)
  })

  it('o workflow de release declara cada segredo que liga a assinatura', () => {
    const texto = readFileSync('.github/workflows/release.yml', 'utf8')
    for (const chave of [...AssinaturaWin.chavesAzure, 'WIN_CSC_LINK', 'WIN_CSC_KEY_PASSWORD']) {
      expect(texto).toContain(chave)
    }
    expect(texto).not.toContain('pull_request')
    expect(texto).not.toContain('--clobber')
    expect(texto).toContain('--draft')
    expect(texto).toContain('environment: esteira-release')
    expect(texto).toContain('merge-base --is-ancestor')
    expect(texto).toContain('persist-credentials: false')
    expect(texto).toContain('exigir-assinatura.ts')
    expect(texto).toContain('conferir-app-update.ts')
    expect(texto.split('jobs:')[0]).not.toContain('contents: write')
    expect(texto).toContain('contents: write')
  })

  it('lê o publisherName do app-update.yml e recusa arquivo sem editor', () => {
    const comEditor = `provider: generic
url: https://feed.esteira.invalid/updates/
publisherName:
  - CN=Esteira
`
    expect(AssinaturaWin.publisherNameDe(comEditor)).toBe('CN=Esteira')
    expect(AssinaturaWin.publisherNameDe('publisherName:\n  - "CN=Esteira, Ltda"\n')).toBe('CN=Esteira, Ltda')
    expect(AssinaturaWin.publisherNameDe('publisherName: null\n')).toBeNull()
    expect(AssinaturaWin.publisherNameDe('publisherName: []\n')).toBeNull()
    expect(AssinaturaWin.publisherNameDe('provider: generic\n')).toBeNull()
  })

  it('o config carregado pelo electron-builder segue o ambiente', () => {
    const esperado = AssinaturaWin.configurar(pacote.build, process.env)
    expect(config.win.signAndEditExecutable).toBe(esperado.win.signAndEditExecutable)
    expect(config.publish).toEqual(esperado.publish)
  })
})

describe('tag da release', () => {
  function rodar(args: string[]) {
    return execFileSync(process.execPath, ['scripts/conferir-tag.mjs', ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, GITHUB_REF_NAME: '' },
    })
  }

  it('aceita v mais a version estável e recusa o resto', () => {
    const versao = JSON.parse(readFileSync('package.json', 'utf8')).version as string
    expect(rodar([`v${versao}`])).toBe('')
    expect(() => rodar(['v9.9.9'])).toThrow()
    expect(() => rodar([])).toThrow()
    expect(() => rodar(['v0.2.0-beta.1', '0.2.0-beta.1'])).toThrow()
    expect(rodar(['v0.2.0', '0.2.0'])).toBe('')
  })
})
