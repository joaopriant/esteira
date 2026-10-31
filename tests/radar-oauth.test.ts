import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { criarAplicacao } from '../src/app/criar'
import { despachar } from '../src/app/api'
import { COFRE_ENTRADA_MAX, CofreRadar, OauthRadar } from '../src/adapters/radar-oauth'
import { cofreMemoria } from '../src/adapters/segredos'
import type { SecretStore } from '../src/ports'
import { contaExpiraRadar, contaRadar, contaRefreshRadar } from '../src/adapters/seguro'

const pastas: string[] = []
const CLIENT_TEAMS = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const CLIENT_SLACK = '1234567890.1234567890'
const ACESSO_TEAMS = 'acesso-oauth-teams-teste'
const REFRESH_TEAMS = 'refresh-oauth-teams-teste'
const DEVICE = 'device-segredo-nao-mostrar'
const ACESSO_SLACK = 'acesso-usuario-slack-teste'
const REFRESH_SLACK = 'refresh-slack-teste'

afterEach(async () => {
  await Promise.all(pastas.splice(0).map((pasta) => fs.rm(pasta, { recursive: true, force: true })))
})

describe('oauth do radar', () => {
  it('confere o PKCE do Slack e não pede escopo de bot', () => {
    expect(OauthRadar.desafio('secretpassword')).toBe('ldMBaaWcQYtSATMV_IG8mf3wp7A6EW80arYoSW80ntU')
    const url = new URL(OauthRadar.urlSlack({
      clientId: CLIENT_SLACK,
      challenge: 'ldMBaaWcQYtSATMV_IG8mf3wp7A6EW80ntU',
      redirectUri: 'http://127.0.0.1:43821/callback',
      state: 'estado',
    }))
    expect(url.searchParams.get('user_scope')).toBe('channels:history,groups:history')
    expect(url.searchParams.get('scope')).toBeNull()
    expect(url.searchParams.get('code_challenge_method')).toBe('S256')
    expect(url.toString()).not.toContain('client_secret')
    expect(() => OauthRadar.urlSlack({
      clientId: CLIENT_SLACK,
      challenge: 'x',
      redirectUri: 'https://evil.example/callback',
      state: 'estado',
    })).toThrow(/127\.0\.0\.1/)
  })

  it('entra no Teams por código de dispositivo e guarda o token só no cofre', async () => {
    const { app, dataDir, segredos, chamadas, abertas } = await appReal(buscarTeams)
    await expect(app.salvarClienteRadar('teams', 'nao-e-guid')).rejects.toThrow(/GUID/)
    await app.salvarClienteRadar('teams', CLIENT_TEAMS, 'organizations')
    const desafio = await app.iniciarOauthRadar('teams')
    expect(desafio.codigo).toBe('ABCD-EFGH')
    expect(desafio.verificacao).toBe('https://microsoft.com/devicelogin')
    expect(JSON.stringify(desafio)).not.toContain(DEVICE)
    expect(abertas).toEqual(['https://microsoft.com/devicelogin'])
    const esperas = chamadas.esperas
    await app.concluirOauthRadar('teams')
    expect(esperas).toEqual([1000, 1000, 6000])
    expect(await segredos.ler(contaRadar('teams'))).toBe(ACESSO_TEAMS)
    expect(await segredos.ler(contaRefreshRadar('teams'))).toBe(REFRESH_TEAMS)
    expect(chamadas.lista.some((item) => item.method !== 'POST')).toBe(false)
    expect(chamadas.lista.every((item) => item.url.startsWith('https://login.microsoftonline.com/organizations/'))).toBe(true)
    expect(chamadas.lista.some((item) => item.body.includes('client_secret'))).toBe(false)
    const arquivos = await lerTudo(dataDir)
    expect(arquivos).not.toContain(ACESSO_TEAMS)
    expect(arquivos).not.toContain(REFRESH_TEAMS)
    expect(arquivos).not.toContain(DEVICE)
    expect(arquivos).toContain(CLIENT_TEAMS)
    expect((await app.credenciaisRadar()).teams).toBe(true)
    const painel = (await app.painelConexoes()).radar.find((item) => item.provedor === 'teams')
    expect(painel?.oauthPronto).toBe(true)
    expect(painel?.explicacao).toContain('ChannelMessage.Read.All')
    expect(painel?.tokenNoCofre).toBe(true)
  })

  it('entra no Slack pelo loopback, sem client secret, e recusa token de bot', async () => {
    const { app, dataDir, segredos, chamadas, abertas } = await appReal(buscarSlack)
    await app.salvarClienteRadar('slack', CLIENT_SLACK)
    const desafio = await app.iniciarOauthRadar('slack')
    const concluir = app.concluirOauthRadar('slack')
    try {
      const autorizacao = new URL(desafio.verificacao)
      expect(autorizacao.hostname).toBe('slack.com')
      expect(autorizacao.searchParams.get('user_scope')).toBe('channels:history,groups:history')
      expect(abertas[0]).toBe(desafio.verificacao)
      const redirect = autorizacao.searchParams.get('redirect_uri') ?? ''
      const state = autorizacao.searchParams.get('state') ?? ''
      expect(redirect.startsWith('http://127.0.0.1:')).toBe(true)
      const volta = await fetch(`${redirect}?code=codigo-slack-teste&state=${encodeURIComponent(state)}`)
      expect(volta.status).toBe(200)
      expect(await volta.text()).toContain('Nenhuma mensagem')
      await concluir
    } catch (erro) {
      await concluir.catch(() => undefined)
      throw erro
    }
    expect(await segredos.ler(contaRadar('slack'))).toBe(ACESSO_SLACK)
    const troca = chamadas.lista.find((item) => item.url === 'https://slack.com/api/oauth.v2.access')
    expect(troca?.method).toBe('POST')
    expect(troca?.body).toContain('code_verifier=')
    expect(troca?.body).not.toContain('client_secret')
    const arquivos = await lerTudo(dataDir)
    expect(arquivos).not.toContain(ACESSO_SLACK)
    expect(arquivos).not.toContain(REFRESH_SLACK)
    expect(arquivos).toContain(CLIENT_SLACK)
    await expect(OauthRadar.trocarSlack({
      clientId: CLIENT_SLACK,
      code: 'codigo',
      redirectUri: 'http://127.0.0.1:43821/callback',
      verifier: 'verificador',
      buscar: async () => json({ ok: true, access_token: 'xoxb-curto' }),
    })).rejects.toThrow(/bot/)
  })

  it('renova o access token vencido e, sem client id, mantém o token colado', async () => {
    const segredos = cofreMemoria()
    await segredos.gravar(contaRadar('teams'), 'token-colado-antigo')
    await segredos.gravar(contaRefreshRadar('teams'), REFRESH_TEAMS)
    await segredos.gravar(contaExpiraRadar('teams'), '1')
    const corpos: string[] = []
    const renovado = await CofreRadar.bearer({
      segredos,
      provedor: 'teams',
      clientId: CLIENT_TEAMS,
      tenant: 'organizations',
      agora: 10_000,
      buscar: async (_url, init) => {
        corpos.push(String(init?.body ?? ''))
        return json({ access_token: 'acesso-renovado-teams', refresh_token: 'refresh-novo-teams', expires_in: 3600 })
      },
    })
    expect(renovado).toBe('acesso-renovado-teams')
    expect(corpos[0]).toContain('grant_type=refresh_token')
    expect(corpos[0]).not.toContain('client_secret')
    expect(await segredos.ler(contaRadar('teams'))).toBe('acesso-renovado-teams')
    await segredos.gravar(contaRadar('slack'), 'token-colado-slack')
    await segredos.gravar(contaExpiraRadar('slack'), '1')
    const colado = await CofreRadar.bearer({
      segredos,
      provedor: 'slack',
      clientId: '',
      tenant: '',
      agora: 10_000,
      buscar: async () => {
        throw new Error('não devia renovar')
      },
    })
    expect(colado).toBe('token-colado-slack')
  })

  it('no modo exemplo não sai da máquina e o WhatsApp não aceita token', async () => {
    const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-oauth-falso-'))
    pastas.push(dataDir)
    const segredos = cofreMemoria()
    await segredos.gravar('radar:whatsapp', 'token-velho-whatsapp')
    const app = await criarAplicacao({ dataDir, modo: 'falso', semear: false, segredos })
    await expect(app.iniciarOauthRadar('teams')).rejects.toThrow(/modo exemplo/)
    expect((await app.credenciaisRadar()).whatsapp).toBe(false)
    expect(await segredos.ler('radar:whatsapp')).toBeNull()
    await expect(despachar(app, 'conectarRadar', { provedor: 'whatsapp', token: '12345678' })).rejects.toThrow(/não servem/)
    const whats = (await app.painelConexoes()).radar.find((item) => item.provedor === 'whatsapp')
    expect(whats?.explicacao).toContain('Não existe API')
    const plaud = (await app.painelConexoes()).radar.find((item) => item.provedor === 'plaud')
    expect(plaud?.explicacao).toContain('não oferece API pública')
  })

  it('responde 400 no state errado e continua esperando o certo', async () => {
    const escuta = await OauthRadar.escutar({ porta: 0, state: 'estado-certo', timeoutMs: 3000 })
    try {
      const ruim = await fetch(`http://127.0.0.1:${escuta.porta}/callback?code=codigo-ruim&state=errado`)
      expect(ruim.status).toBe(400)
      let resolvido = false
      const espera = escuta.codigo.then((codigo) => {
        resolvido = true
        return codigo
      })
      await new Promise((resolve) => setTimeout(resolve, 40))
      expect(resolvido).toBe(false)
      const bom = await fetch(`http://127.0.0.1:${escuta.porta}/callback?code=codigo-ok&state=estado-certo`)
      expect(bom.status).toBe(200)
      expect(await espera).toBe('codigo-ok')
    } finally {
      escuta.fechar()
    }
  })

  it('parte o token no limite do cofre e recupera se a gravação quebrar', async () => {
    const segredos = cofreMemoria()
    const longo = `${'a'.repeat(COFRE_ENTRADA_MAX)}b`.repeat(2).slice(0, COFRE_ENTRADA_MAX + 80)
    await CofreRadar.gravar(segredos, 'teams', { accessToken: longo, refreshToken: 'r'.repeat(COFRE_ENTRADA_MAX + 10), expiraEm: 50 })
    expect(await CofreRadar.lerAccess(segredos, 'teams')).toBe(longo)
    expect(await segredos.ler(`${contaRadar('teams')}:p2`)).toBeTruthy()
    expect(longo.length).toBeGreaterThan(COFRE_ENTRADA_MAX)
    await expect(CofreRadar.gravar(segredos, 'teams', {
      accessToken: 'z'.repeat(COFRE_ENTRADA_MAX * 4 + 1),
      refreshToken: '',
      expiraEm: 0,
    })).rejects.toThrow(/1280|UTF-16|Windows/)

    const interno = cofreMemoria()
    await interno.gravar(contaRadar('slack'), 'token-antigo-slack')
    let falhou = false
    const instavel: SecretStore = {
      ler: (conta) => interno.ler(conta),
      apagar: (conta) => interno.apagar(conta),
      async gravar(conta, valor) {
        if (!falhou && conta === contaRadar('slack') && valor.startsWith('NOVO')) {
          falhou = true
          throw new Error('falha no cofre')
        }
        await interno.gravar(conta, valor)
      },
    }
    await expect(CofreRadar.gravar(instavel, 'slack', {
      accessToken: `NOVO${'c'.repeat(20)}`,
      refreshToken: 'refresh-novo',
      expiraEm: 80,
    })).rejects.toThrow(/falha no cofre/)
    expect(await interno.ler(contaRadar('slack'))).toBe('token-antigo-slack')
    expect(await CofreRadar.lerAccess(instavel, 'slack')).toBe(`NOVO${'c'.repeat(20)}`)
    expect(await instavel.ler(contaRefreshRadar('slack'))).toBe('refresh-novo')
    expect(await instavel.ler(contaExpiraRadar('slack'))).toBe('80')
  })

  it('recusa endereço de verificação que não é da Microsoft', async () => {
    await expect(OauthRadar.pedirDispositivo({
      clientId: CLIENT_TEAMS,
      tenant: 'organizations',
      buscar: async () => json({
        device_code: DEVICE,
        user_code: 'ABCD-EFGH',
        verification_uri: 'https://evil.example/login',
        expires_in: 60,
        interval: 5,
      }),
    })).rejects.toThrow(/Microsoft/)
  })
})

function json(corpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json' } })
}

function buscarTeams(chamadas: { lista: { url: string; method: string; body: string }[] }): typeof fetch {
  return async (url, init) => {
    const body = String(init?.body ?? '')
    chamadas.lista.push({ url: String(url), method: init?.method ?? 'GET', body })
    if (String(url).endsWith('/devicecode')) {
      return json({
        device_code: DEVICE,
        user_code: 'ABCD-EFGH',
        verification_uri: 'https://microsoft.com/devicelogin',
        expires_in: 900,
        interval: 1,
      })
    }
    const pedidos = chamadas.lista.filter((item) => item.url.endsWith('/token')).length
    if (pedidos === 1) return json({ error: 'authorization_pending' }, 400)
    if (pedidos === 2) return json({ error: 'slow_down' }, 400)
    return json({ access_token: ACESSO_TEAMS, refresh_token: REFRESH_TEAMS, expires_in: 3600 })
  }
}

function buscarSlack(chamadas: { lista: { url: string; method: string; body: string }[] }): typeof fetch {
  return async (url, init) => {
    chamadas.lista.push({ url: String(url), method: init?.method ?? 'GET', body: String(init?.body ?? '') })
    return json({
      ok: true,
      authed_user: {
        access_token: ACESSO_SLACK,
        scope: 'channels:history,groups:history',
        refresh_token: REFRESH_SLACK,
        expires_in: 3600,
      },
    })
  }
}

async function appReal(fabrica: (chamadas: { lista: { url: string; method: string; body: string }[]; esperas: number[] }) => typeof fetch) {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-oauth-'))
  pastas.push(dataDir)
  const segredos = cofreMemoria()
  const chamadas = { lista: [] as { url: string; method: string; body: string }[], esperas: [] as number[] }
  const abertas: string[] = []
  const app = await criarAplicacao({
    dataDir,
    modo: 'real',
    semear: false,
    segredos,
    buscar: fabrica(chamadas),
    esperar: async (ms) => { chamadas.esperas.push(ms) },
    abrirUrl: async (url) => { abertas.push(url) },
    portaOauth: 0,
    timeoutOauth: 3000,
  })
  return { app, dataDir, segredos, chamadas, abertas }
}

async function lerTudo(dir: string): Promise<string> {
  const pedacos: string[] = []
  async function andar(atual: string) {
    const entradas = await fs.readdir(atual, { withFileTypes: true })
    for (const entrada of entradas) {
      const cheio = path.join(atual, entrada.name)
      if (entrada.isDirectory()) await andar(cheio)
      else pedacos.push(await fs.readFile(cheio, 'utf8'))
    }
  }
  await andar(dir)
  return pedacos.join('\n')
}
