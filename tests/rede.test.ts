import fs from 'node:fs/promises'
import tls from 'node:tls'
import { describe, expect, it } from 'vitest'
import { RedeDoSistema } from '../src/adapters/rede'

describe('proxy e certificados do sistema', () => {
  it('lê o proxy no formato do Chromium', () => {
    expect(RedeDoSistema.proxyDeChromium('DIRECT')).toBeNull()
    expect(RedeDoSistema.proxyDeChromium('PROXY proxy.empresa:8080')).toBe('http://proxy.empresa:8080')
    expect(RedeDoSistema.proxyDeChromium('PROXY proxy.empresa:8080; DIRECT')).toBe('http://proxy.empresa:8080')
    expect(RedeDoSistema.proxyDeChromium('HTTPS proxy.empresa:8443')).toBe('https://proxy.empresa:8443')
    expect(RedeDoSistema.proxyDeChromium('SOCKS5 10.0.0.1:1080')).toBe('socks5://10.0.0.1:1080')
    expect(RedeDoSistema.proxyDeChromium('PROXY [::1]:8080')).toBe('http://[::1]:8080')
    expect(RedeDoSistema.proxyDeChromium('')).toBeNull()
    expect(RedeDoSistema.proxyDeChromium('FOO bar')).toBeNull()
  })

  it('usa HTTP_PROXY e HTTPS_PROXY, nos dois casos, e respeita NO_PROXY', () => {
    const url = 'https://dev.azure.com/fintech'
    expect(RedeDoSistema.proxyDoAmbiente(url, { https_proxy: 'http://proxy:8080' })).toBe('http://proxy:8080')
    expect(RedeDoSistema.proxyDoAmbiente(url, { HTTPS_PROXY: 'http://proxy:8080' })).toBe('http://proxy:8080')
    expect(RedeDoSistema.proxyDoAmbiente(url, { HTTPS_PROXY: 'http://proxy:8080', NO_PROXY: 'dev.azure.com' })).toBeNull()
    expect(RedeDoSistema.proxyDoAmbiente(url, { HTTPS_PROXY: 'http://proxy:8080', no_proxy: '.azure.com' })).toBeNull()
    expect(RedeDoSistema.proxyDoAmbiente(url, { HTTPS_PROXY: 'http://proxy:8080', NO_PROXY: 'localhost' })).toBe('http://proxy:8080')
    expect(RedeDoSistema.proxyDoAmbiente(url, { HTTPS_PROXY: 'nao-e-url' })).toBeNull()
  })

  it('fora do Electron a decisão vem do ambiente', async () => {
    expect(process.versions.electron).toBeUndefined()
    await expect(RedeDoSistema.decidir('https://dev.azure.com/fintech', { HTTPS_PROXY: 'http://proxy:8080' })).resolves.toEqual({
      proxy: 'http://proxy:8080',
      direto: false,
    })
    await expect(RedeDoSistema.decidir('https://dev.azure.com/fintech', {})).resolves.toEqual({ proxy: null, direto: false })
  })

  it('monta a conexão do Azure com proxy HTTP, usuário e CAs, sem desligar a verificação', () => {
    const comProxy = RedeDoSistema.opcoesHttps(
      { proxy: 'http://ana:p%40ss@proxy.empresa:8080', direto: false },
      '/tmp/ca.pem',
    )
    expect(comProxy?.proxy).toEqual({ proxyUrl: 'http://proxy.empresa:8080', proxyUsername: 'ana', proxyPassword: 'p@ss' })
    expect(comProxy?.cert).toEqual({ caFile: '/tmp/ca.pem' })
    expect(comProxy?.ignoreSslError).toBeUndefined()

    expect(RedeDoSistema.opcoesHttps({ proxy: null, direto: true }, undefined)?.proxy).toEqual({ proxyUrl: '' })
    expect(RedeDoSistema.opcoesHttps({ proxy: 'socks5://10.0.0.1:1080', direto: false }, '/tmp/ca.pem')).toEqual({
      cert: { caFile: '/tmp/ca.pem' },
    })
    expect(RedeDoSistema.opcoesHttps({ proxy: 'socks5://10.0.0.1:1080', direto: false })).toBeUndefined()
    expect(RedeDoSistema.opcoesHttps({ proxy: null, direto: false })).toBeUndefined()
  })

  it('só trata como direto a resposta literal DIRECT', () => {
    expect(RedeDoSistema.interpretarPac('DIRECT')).toEqual({ proxy: null, direto: true })
    expect(RedeDoSistema.interpretarPac('DIRECT; DIRECT')).toEqual({ proxy: null, direto: true })
    expect(RedeDoSistema.interpretarPac('PROXY proxy.empresa:8080; DIRECT')).toEqual({
      proxy: 'http://proxy.empresa:8080',
      direto: false,
    })
    expect(RedeDoSistema.interpretarPac('DIRECT; PROXY a:1')).toEqual({ proxy: null, direto: true })
    expect(RedeDoSistema.interpretarPac('PROXY a:1; DIRECT')).toEqual({ proxy: 'http://a:1', direto: false })
    expect(RedeDoSistema.interpretarPac('SOCKS4 x:1; PROXY a:1')).toEqual({ proxy: 'http://a:1', direto: false })
    expect(() => RedeDoSistema.interpretarPac('SOCKS4 x:1')).toThrow(/Não entendi o proxy/)
    expect(() => RedeDoSistema.interpretarPac('SOCKS4 10.0.0.1:1080')).toThrow(/SOCKS4/)
    expect(() => RedeDoSistema.interpretarPac('direct')).toThrow(/Não entendi o proxy/)
    expect(() => RedeDoSistema.interpretarPac('')).toThrow(/Não entendi o proxy/)
    expect(() => RedeDoSistema.interpretarPac('FOO bar')).toThrow(/Não entendi o proxy/)
  })

  it('junta o pacote do Node com o certificado de sistema, sem repetir', () => {
    const sistema = '-----BEGIN CERTIFICATE-----\nSIST\n-----END CERTIFICATE-----'
    const pacote = '-----BEGIN CERTIFICATE-----\nMOZ\n-----END CERTIFICATE-----'
    const texto = RedeDoSistema.juntarPems([pacote, sistema], [sistema, 'nao-e-certificado'])
    expect(texto.match(/BEGIN CERTIFICATE/g)).toHaveLength(2)
    expect(texto).toContain('SIST')
    expect(texto).toContain('MOZ')
  })

  it('inclui os certificados de NODE_EXTRA_CA_CERTS no arquivo que o Azure usa', () => {
    const extra = '-----BEGIN CERTIFICATE-----\nEXTRAUNIC\n-----END CERTIFICATE-----'
    const texto = RedeDoSistema.textoCa(
      ['-----BEGIN CERTIFICATE-----\nMOZ\n-----END CERTIFICATE-----'],
      ['-----BEGIN CERTIFICATE-----\nSIST\n-----END CERTIFICATE-----'],
      [extra],
    )
    expect(texto).toContain('EXTRAUNIC')
    expect(texto).toContain('MOZ')
    expect(texto).toContain('SIST')
    expect(RedeDoSistema.textoCa([], [], [])).toBe('')
    expect(RedeDoSistema.pemsExtra()).toEqual(tls.getCACertificates('extra').filter((pem) => pem.includes('BEGIN CERTIFICATE')))
  })

  it('grava um arquivo de CAs que o SDK consegue ler, com loja do sistema e pacote do Node', async () => {
    const sistema = RedeDoSistema.pemsDoSistema()
    expect(sistema.length).toBeGreaterThan(0)
    const arquivo = await RedeDoSistema.arquivoCa()
    expect(arquivo).toBeTruthy()
    expect(await RedeDoSistema.arquivoCa()).toBe(arquivo)
    const texto = await fs.readFile(arquivo ?? '', 'utf8')
    const linhaSistema = sistema[0]?.split('\n').find((linha) => linha.length > 40 && !linha.includes('CERTIFICATE'))
    const linhaPacote = tls.getCACertificates('bundled')[0]?.split('\n').find((linha) => linha.length > 40 && !linha.includes('CERTIFICATE'))
    expect(linhaSistema).toBeTruthy()
    expect(texto).toContain(linhaSistema)
    expect(texto).toContain(linhaPacote)
  })

  it('a conexão usada pelo SDK recebe o proxy decidido e o arquivo de CAs', async () => {
    const opcoes = await RedeDoSistema.opcoesPara('https://dev.azure.com/fintech', {
      decidir: async () => ({ proxy: 'http://proxy:8080', direto: false }),
      arquivoCa: async () => '/tmp/esteira-ca.pem',
    })
    expect(opcoes).toEqual({ proxy: { proxyUrl: 'http://proxy:8080' }, cert: { caFile: '/tmp/esteira-ca.pem' } })
  })
})
