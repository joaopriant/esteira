import { createHash, randomBytes } from 'node:crypto'
import http from 'node:http'
import type { SecretStore } from '../ports'
import type { ProvedorRadar } from '../shared/tipos'
import { contaExpiraRadar, contaRadar, contaRefreshRadar, redigirSegredo } from './seguro'

export interface CredencialOAuth {
  accessToken: string
  refreshToken: string
  expiraEm: number
}

const ESCOPO_TEAMS = 'https://graph.microsoft.com/ChannelMessage.Read.All offline_access'
const ESCOPO_SLACK = 'channels:history,groups:history'
const FOLGA_MS = 60_000
// shortcut: o blob do Windows é ~2560 bytes e a string vai em UTF-16, então ~1280 caracteres por entrada; revisar com um token real do Graph
export const COFRE_ENTRADA_MAX = 1200
const PARTES_MAX = 4

export class OauthRadar {
  static readonly PORTA_SLACK = 43821

  static redirectLoopback(porta: number): string {
    if (!Number.isInteger(porta) || porta < 1 || porta > 65535) throw new Error('Porta de retorno inválida.')
    return `http://127.0.0.1:${porta}/callback`
  }

  static clientIdTeams(valor: string): string {
    const texto = valor.trim()
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(texto)) {
      throw new Error('O client id do Entra é um GUID.')
    }
    return texto.toLowerCase()
  }

  static clientIdSlack(valor: string): string {
    const texto = valor.trim()
    if (!/^\d{3,20}\.\d{3,20}$/.test(texto)) throw new Error('O client id do Slack não tem o formato esperado.')
    return texto
  }

  static tenant(valor: string | undefined): string {
    const texto = (valor ?? '').trim() || 'organizations'
    if (texto === 'organizations' || texto === 'common') return texto
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(texto)) return texto.toLowerCase()
    throw new Error('O diretório precisa ser organizations, common ou o id do tenant.')
  }

  static desafio(verifier: string): string {
    return createHash('sha256').update(verifier).digest('base64url')
  }

  static pkce(): { verifier: string; challenge: string } {
    const verifier = randomBytes(32).toString('base64url')
    return { verifier, challenge: this.desafio(verifier) }
  }

  static urlSlack(opcoes: { clientId: string; challenge: string; redirectUri: string; state: string }): string {
    const redirectUri = this.redirectConfiavel(opcoes.redirectUri)
    const url = new URL('https://slack.com/oauth/v2/authorize')
    url.searchParams.set('client_id', opcoes.clientId)
    url.searchParams.set('user_scope', ESCOPO_SLACK)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('code_challenge', opcoes.challenge)
    url.searchParams.set('code_challenge_method', 'S256')
    url.searchParams.set('state', opcoes.state)
    return url.toString()
  }

  static async pedirDispositivo(opcoes: {
    clientId: string
    tenant: string
    buscar: typeof fetch
  }): Promise<{
    deviceCode: string
    userCode: string
    verificacao: string
    mensagem: string
    intervaloMs: number
    expiraEm: number
  }> {
    const tenant = this.tenant(opcoes.tenant)
    const corpo = await this.postForm(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/devicecode`,
      new URLSearchParams({ client_id: opcoes.clientId, scope: ESCOPO_TEAMS }),
      opcoes.buscar,
    )
    if (typeof corpo.device_code !== 'string' || typeof corpo.user_code !== 'string') {
      throw new Error(this.mensagemErro(corpo, 'A Microsoft não devolveu o código de entrada.'))
    }
    const verificacao = typeof corpo.verification_uri === 'string' ? corpo.verification_uri : 'https://microsoft.com/devicelogin'
    if (!this.paginaMicrosoft(verificacao)) throw new Error('O endereço de verificação não é da Microsoft.')
    const intervalo = Number(corpo.interval ?? 5)
    const expires = Number(corpo.expires_in ?? 900)
    const intervaloMs = Math.max(1000, Number.isFinite(intervalo) ? Math.round(intervalo * 1000) : 5000)
    return {
      deviceCode: corpo.device_code,
      userCode: corpo.user_code,
      verificacao,
      mensagem: `Abra ${verificacao} e digite ${corpo.user_code}.`,
      intervaloMs,
      expiraEm: Date.now() + (Number.isFinite(expires) && expires > 0 ? expires : 900) * 1000,
    }
  }

  static async concluirDispositivo(opcoes: {
    clientId: string
    tenant: string
    deviceCode: string
    intervaloMs: number
    expiraEm: number
    buscar: typeof fetch
    esperar: (ms: number) => Promise<void>
    agora?: () => number
  }): Promise<CredencialOAuth> {
    if (!opcoes.deviceCode) throw new Error('Peça o login de novo.')
    const tenant = this.tenant(opcoes.tenant)
    const agora = opcoes.agora ?? Date.now
    let intervalo = Math.max(1000, opcoes.intervaloMs)
    while (agora() < opcoes.expiraEm) {
      await opcoes.esperar(intervalo)
      if (agora() >= opcoes.expiraEm) break
      const corpo = await this.postForm(
        `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
        new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          client_id: opcoes.clientId,
          device_code: opcoes.deviceCode,
        }),
        opcoes.buscar,
      )
      if (typeof corpo.access_token === 'string' && corpo.access_token) return this.credencialMicrosoft(corpo, agora())
      const erro = String(corpo.error ?? '')
      if (erro === 'authorization_pending') continue
      if (erro === 'slow_down') {
        intervalo += 5000
        continue
      }
      throw new Error(this.mensagemErro(corpo))
    }
    throw new Error('O código expirou. Peça outro.')
  }

  // Troca e refresh sem client_secret: https://docs.slack.dev/authentication/using-pkce
  // (app público com PKCE; o refresh leva client_id e refresh_token, sem code_verifier).
  static async trocarSlack(opcoes: {
    clientId: string
    code: string
    redirectUri: string
    verifier: string
    buscar: typeof fetch
    agora?: number
  }): Promise<CredencialOAuth> {
    const redirectUri = this.redirectConfiavel(opcoes.redirectUri)
    const corpo = await this.postForm(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        client_id: opcoes.clientId,
        code: opcoes.code,
        redirect_uri: redirectUri,
        code_verifier: opcoes.verifier,
      }),
      opcoes.buscar,
    )
    return this.credencialSlack(corpo, opcoes.agora ?? Date.now())
  }

  static async renovar(opcoes: {
    provedor: 'teams' | 'slack'
    clientId: string
    tenant: string
    refreshToken: string
    buscar: typeof fetch
    agora?: number
  }): Promise<CredencialOAuth | null> {
    try {
      const agora = opcoes.agora ?? Date.now()
      if (opcoes.provedor === 'teams') {
        const tenant = this.tenant(opcoes.tenant)
        const corpo = await this.postForm(
          `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
          new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: opcoes.clientId,
            refresh_token: opcoes.refreshToken,
            scope: ESCOPO_TEAMS,
          }),
          opcoes.buscar,
        )
        if (typeof corpo.access_token !== 'string') return null
        return this.credencialMicrosoft(corpo, agora)
      }
      const corpo = await this.postForm(
        'https://slack.com/api/oauth.v2.access',
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: opcoes.clientId,
          refresh_token: opcoes.refreshToken,
        }),
        opcoes.buscar,
      )
      if (corpo.ok === false) return null
      return this.credencialSlack(corpo, agora)
    } catch {
      return null
    }
  }

  static escutar(opcoes: { porta: number; state: string; timeoutMs: number }): Promise<{
    porta: number
    codigo: Promise<string>
    fechar: () => void
  }> {
    return new Promise((resolve, reject) => {
      let settled = false
      let resolveCodigo: (codigo: string) => void = () => undefined
      let rejectCodigo: (erro: Error) => void = () => undefined
      const codigo = new Promise<string>((res, rej) => {
        resolveCodigo = res
        rejectCodigo = rej
      })
      const servidor = http.createServer((req, res) => {
        let url: URL
        try {
          url = new URL(req.url ?? '/', 'http://127.0.0.1')
        } catch {
          res.statusCode = 400
          res.end('Pedido inválido.')
          return
        }
        if (req.method !== 'GET' || url.pathname !== '/callback') {
          res.statusCode = 404
          res.end('Não encontrado.')
          return
        }
        const erro = url.searchParams.get('error')
        const state = url.searchParams.get('state')
        const code = url.searchParams.get('code') ?? ''
        res.setHeader('content-type', 'text/html; charset=utf-8')
        const codigoOk = /^[A-Za-z0-9._-]{1,512}$/.test(code)
        if (state !== opcoes.state) {
          res.statusCode = 400
          res.end('<!doctype html><meta charset="utf-8"><title>Esteira</title><p>Não deu para concluir o login. Volte para a Esteira e tente de novo.</p>')
          return
        }
        if (erro || !codigoOk) {
          res.statusCode = 400
          res.end('<!doctype html><meta charset="utf-8"><title>Esteira</title><p>Não deu para concluir o login. Volte para a Esteira e tente de novo.</p>')
          if (!settled) {
            settled = true
            rejectCodigo(new Error(erro ? 'O Slack recusou o login.' : 'A resposta do navegador não confere.'))
          }
          return
        }
        res.statusCode = 200
        res.end('<!doctype html><meta charset="utf-8"><title>Esteira</title><p>Pode fechar esta aba e voltar para a Esteira. Nenhuma mensagem foi enviada.</p>')
        if (!settled) {
          settled = true
          resolveCodigo(code)
        }
      })
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true
          rejectCodigo(new Error('O login expirou. Peça outro.'))
        }
        servidor.close()
      }, opcoes.timeoutMs)
      timer.unref()
      servidor.on('error', (erro: NodeJS.ErrnoException) => {
        clearTimeout(timer)
        if (erro.code === 'EADDRINUSE') reject(new Error(`A porta ${opcoes.porta} está ocupada. Feche o que a usa e tente de novo.`))
        else reject(erro)
      })
      servidor.listen(opcoes.porta, '127.0.0.1', () => {
        const endereco = servidor.address()
        const porta = typeof endereco === 'object' && endereco ? endereco.port : opcoes.porta
        servidor.unref()
        resolve({
          porta,
          codigo,
          fechar: () => {
            clearTimeout(timer)
            servidor.close()
          },
        })
      })
    })
  }

  private static redirectConfiavel(valor: string): string {
    const url = new URL(valor)
    if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.pathname !== '/callback') {
      throw new Error('O retorno do login tem de ser 127.0.0.1.')
    }
    if (url.username || url.password || url.search || url.hash) throw new Error('O retorno do login tem de ser 127.0.0.1.')
    return `${url.origin}${url.pathname}`
  }

  private static paginaMicrosoft(valor: string): boolean {
    try {
      const url = new URL(valor)
      return url.protocol === 'https:' && (url.hostname === 'microsoft.com' || url.hostname === 'login.microsoft.com' || url.hostname === 'login.microsoftonline.com')
    } catch {
      return false
    }
  }

  private static async postForm(url: string, corpo: URLSearchParams, buscar: typeof fetch): Promise<Record<string, unknown>> {
    this.afirmarHostLogin(url)
    const resposta = await buscar(url, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
      body: corpo.toString(),
    })
    if (resposta.status >= 300 && resposta.status < 400) {
      await resposta.arrayBuffer().catch(() => undefined)
      throw new Error('O login não pode redirecionar.')
    }
    const json: unknown = await resposta.json().catch(() => null)
    if (!json || typeof json !== 'object') throw new Error('O login não devolveu JSON.')
    return json as Record<string, unknown>
  }

  private static afirmarHostLogin(url: string): void {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Host de login não permitido.')
    const teams = parsed.hostname === 'login.microsoftonline.com'
      && /^\/(?:organizations|common|[0-9a-f-]{36})\/oauth2\/v2\.0\/(?:devicecode|token)$/i.test(parsed.pathname)
    const slack = parsed.hostname === 'slack.com' && parsed.pathname === '/api/oauth.v2.access'
    if (!teams && !slack) throw new Error('Host de login não permitido.')
  }

  private static credencialMicrosoft(corpo: Record<string, unknown>, agora: number): CredencialOAuth {
    const accessToken = String(corpo.access_token ?? '')
    const refreshToken = String(corpo.refresh_token ?? '')
    const expiresIn = Number(corpo.expires_in ?? 0)
    if (!accessToken) throw new Error('A Microsoft não devolveu token de leitura.')
    return {
      accessToken,
      refreshToken,
      expiraEm: expiresIn > 0 ? agora + expiresIn * 1000 - FOLGA_MS : 0,
    }
  }

  private static credencialSlack(corpo: Record<string, unknown>, agora: number): CredencialOAuth {
    if (corpo.ok === false) throw new Error(this.mensagemErro(corpo, 'O Slack recusou o login.'))
    const usuario = corpo.authed_user && typeof corpo.authed_user === 'object' ? corpo.authed_user as Record<string, unknown> : {}
    const doUsuario = String(usuario.access_token ?? '')
    const topo = String(corpo.access_token ?? '')
    if (!doUsuario && topo.startsWith('xoxb-')) {
      throw new Error('O Slack devolveu token de bot. O app precisa de token de usuário, sem escopo de bot.')
    }
    const accessToken = doUsuario || (topo.startsWith('xoxp-') ? topo : '')
    if (!accessToken) throw new Error('O Slack não devolveu token de usuário.')
    const escopo = String(usuario.scope ?? corpo.scope ?? '')
    if (escopo && !escopo.split(/[,\s]+/).some((item) => item === 'channels:history' || item === 'groups:history')) {
      throw new Error('O token não tem channels:history nem groups:history.')
    }
    const refreshToken = String(usuario.refresh_token ?? corpo.refresh_token ?? '')
    const expiresIn = Number(usuario.expires_in ?? corpo.expires_in ?? 0)
    return {
      accessToken,
      refreshToken,
      expiraEm: expiresIn > 0 ? agora + expiresIn * 1000 - FOLGA_MS : 0,
    }
  }

  private static mensagemErro(corpo: Record<string, unknown>, fallback = 'Não consegui entrar.'): string {
    const texto = String(corpo.error_description ?? corpo.error ?? fallback)
    const limpo = redigirSegredo(texto).replace(/\s+/g, ' ').trim()
    return limpo.slice(0, 240) || fallback
  }
}

export class CofreRadar {
  static partir(valor: string): string[] {
    if (!valor) return []
    const partes: string[] = []
    for (let i = 0; i < valor.length; i += COFRE_ENTRADA_MAX) partes.push(valor.slice(i, i + COFRE_ENTRADA_MAX))
    if (partes.length > PARTES_MAX) {
      throw new Error('O token não cabe no cofre do Windows: cada entrada cabe cerca de 1280 caracteres em UTF-16. Vale validar com um token real do Graph.')
    }
    return partes
  }

  static async gravarColado(segredos: SecretStore, provedor: 'teams' | 'slack', token: string): Promise<void> {
    const limpo = token.trim()
    if (!limpo || /[\r\n\0]/.test(limpo)) throw new Error('Token de leitura inválido.')
    await this.limparNovo(segredos, provedor)
    await this.escreverPartes(segredos, contaRadar(provedor), this.partir(limpo), false)
    await this.escreverPartes(segredos, contaRefreshRadar(provedor), [], false)
    await segredos.apagar(contaExpiraRadar(provedor))
  }

  static async gravar(segredos: SecretStore, provedor: 'teams' | 'slack', credencial: CredencialOAuth): Promise<void> {
    const accessToken = credencial.accessToken.trim()
    const refreshToken = credencial.refreshToken.trim()
    if (!accessToken || /[\r\n\0]/.test(accessToken) || /[\r\n\0]/.test(refreshToken)) {
      throw new Error('Token de leitura inválido.')
    }
    const accessPartes = this.partir(accessToken)
    const refreshPartes = this.partir(refreshToken)
    await this.recuperar(segredos, provedor)
    await this.escreverPartes(segredos, contaRadar(provedor), accessPartes, true)
    await this.escreverPartes(segredos, contaRefreshRadar(provedor), refreshPartes, true)
    if (credencial.expiraEm > 0) await segredos.gravar(`${contaExpiraRadar(provedor)}:novo`, String(credencial.expiraEm))
    else await segredos.apagar(`${contaExpiraRadar(provedor)}:novo`)
    await segredos.gravar(this.marcaNova(provedor), '1')
    await this.recuperar(segredos, provedor)
  }

  static async apagar(segredos: SecretStore, provedor: 'teams' | 'slack' | 'whatsapp'): Promise<void> {
    if (provedor === 'whatsapp') {
      await segredos.apagar(contaRadar(provedor))
      return
    }
    await this.limparNovo(segredos, provedor)
    await this.escreverPartes(segredos, contaRadar(provedor), [], false)
    await this.escreverPartes(segredos, contaRefreshRadar(provedor), [], false)
    await segredos.apagar(contaExpiraRadar(provedor))
  }

  static async lerAccess(segredos: SecretStore, provedor: 'teams' | 'slack'): Promise<string | null> {
    await this.recuperar(segredos, provedor)
    const texto = (await this.juntar(segredos, contaRadar(provedor), false)).trim()
    return texto || null
  }

  static async bearer(opcoes: {
    segredos: SecretStore
    provedor: 'teams' | 'slack'
    clientId: string
    tenant: string
    buscar: typeof fetch
    forcar?: boolean
    agora?: number
  }): Promise<string | null> {
    await this.recuperar(opcoes.segredos, opcoes.provedor)
    const access = (await this.juntar(opcoes.segredos, contaRadar(opcoes.provedor), false)).trim()
    const refresh = (await this.juntar(opcoes.segredos, contaRefreshRadar(opcoes.provedor), false)).trim()
    const expira = Number((await opcoes.segredos.ler(contaExpiraRadar(opcoes.provedor))) ?? '0')
    const agora = opcoes.agora ?? Date.now()
    const vencido = expira > 0 && agora >= expira
    if (access && !opcoes.forcar && !vencido) return access
    if (!refresh || !opcoes.clientId) return opcoes.forcar ? null : access || null
    const novo = await OauthRadar.renovar({
      provedor: opcoes.provedor,
      clientId: opcoes.clientId,
      tenant: opcoes.tenant,
      refreshToken: refresh,
      buscar: opcoes.buscar,
      agora,
    })
    if (!novo) return opcoes.forcar ? null : access || null
    await this.gravar(opcoes.segredos, opcoes.provedor, novo)
    return novo.accessToken
  }

  private static marcaNova(provedor: 'teams' | 'slack'): string {
    return `radar:${provedor}:novo:ok`
  }

  private static contaParte(prefixo: string, indice: number, novo: boolean): string {
    const base = novo ? `${prefixo}:novo` : prefixo
    return indice === 1 ? base : `${base}:p${indice}`
  }

  private static async escreverPartes(segredos: SecretStore, prefixo: string, partes: string[], novo: boolean): Promise<void> {
    if (partes.length === 0) await segredos.apagar(this.contaParte(prefixo, 1, novo))
    else await segredos.gravar(this.contaParte(prefixo, 1, novo), partes[0]!)
    for (let i = 2; i <= PARTES_MAX; i++) {
      const parte = partes[i - 1]
      const conta = this.contaParte(prefixo, i, novo)
      if (parte) await segredos.gravar(conta, parte)
      else await segredos.apagar(conta)
    }
  }

  private static async juntar(segredos: SecretStore, prefixo: string, novo: boolean): Promise<string> {
    const primeiro = await segredos.ler(this.contaParte(prefixo, 1, novo))
    if (!primeiro) return ''
    let texto = primeiro
    for (let i = 2; i <= PARTES_MAX; i++) {
      const parte = await segredos.ler(this.contaParte(prefixo, i, novo))
      if (!parte) break
      texto += parte
    }
    return texto
  }

  private static async recuperar(segredos: SecretStore, provedor: 'teams' | 'slack'): Promise<void> {
    if (!(await segredos.ler(this.marcaNova(provedor)))) return
    const access = await this.juntar(segredos, contaRadar(provedor), true)
    const refresh = await this.juntar(segredos, contaRefreshRadar(provedor), true)
    const expira = await segredos.ler(`${contaExpiraRadar(provedor)}:novo`)
    await this.escreverPartes(segredos, contaRefreshRadar(provedor), refresh ? this.partir(refresh) : [], false)
    if (expira) await segredos.gravar(contaExpiraRadar(provedor), expira)
    else await segredos.apagar(contaExpiraRadar(provedor))
    await this.escreverPartes(segredos, contaRadar(provedor), access ? this.partir(access) : [], false)
    await this.limparNovo(segredos, provedor)
  }

  private static async limparNovo(segredos: SecretStore, provedor: 'teams' | 'slack'): Promise<void> {
    await this.escreverPartes(segredos, contaRadar(provedor), [], true)
    await this.escreverPartes(segredos, contaRefreshRadar(provedor), [], true)
    await segredos.apagar(`${contaExpiraRadar(provedor)}:novo`)
    await segredos.apagar(this.marcaNova(provedor))
  }
}

export class TextoRadar {
  static explicacao(provedor: ProvedorRadar, oauthPronto: boolean): string {
    const redirect = OauthRadar.redirectLoopback(OauthRadar.PORTA_SLACK)
    if (provedor === 'whatsapp') {
      return 'Não existe API para conversas pessoais. A leitura é o .txt exportado: no iOS, [dd/mm/aa, hh:mm]; no Android, dd/mm/aaaa, hh:mm - Nome. Não há token.'
    }
    if (provedor === 'granola') {
      return 'O Granola tem API pública (chave do plano Business, em public-api.granola.ai). Esta instalação não tem essa chave, então a leitura continua pela pasta.'
    }
    if (provedor === 'plaud') {
      return 'O Plaud não oferece API pública da conta pessoal. A leitura continua pela pasta.'
    }
    if (provedor === 'teams') {
      return oauthPronto
        ? 'O login é o código de dispositivo da Microsoft, escopo ChannelMessage.Read.All, só leitura. O token fica no cofre. Apague o client id para voltar ao token colado.'
        : 'Sem o client id do app no Entra, a conexão continua pelo token colado. O token do Graph expira em cerca de uma hora. Para entrar pela conta, registre o app com ChannelMessage.Read.All e o consentimento do admin, e guarde o client id aqui. O token fica no cofre, não no config.json.'
    }
    return oauthPronto
      ? `O login abre o navegador e volta para ${redirect}. Escopos channels:history e groups:history, só leitura. O token fica no cofre. Apague o client id para voltar ao token colado.`
      : `Sem o client id do app Slack, a conexão continua pelo token colado. Para entrar pela conta, registre o app com PKCE, escopos de usuário channels:history e groups:history, redirect ${redirect}, e guarde o client id aqui. O token fica no cofre, não no config.json.`
  }
}
