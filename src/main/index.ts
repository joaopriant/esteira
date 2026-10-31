import { app, BrowserWindow, ipcMain, session, shell } from 'electron'
import path from 'node:path'
import { abrirNoAzure } from '../adapters/seguro'
import { criarAplicacao } from '../app/criar'
import { despachar } from '../app/api'
import type { EsteiraApp } from '../app/esteira-app'

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join('; ')

let aplicacao: EsteiraApp | undefined

function urlDoCorpo(corpo: unknown): string {
  if (!corpo || typeof corpo !== 'object' || !('url' in corpo)) throw new Error('Link do card inválido.')
  const url = (corpo as { url: unknown }).url
  if (typeof url !== 'string' || !url.trim()) throw new Error('Link do card inválido.')
  return url
}

function modo(): 'real' | 'falso' {
  return process.env.ESTEIRA_FAKE === '1' ? 'falso' : 'real'
}

async function obterApp(): Promise<EsteiraApp> {
  aplicacao ??= await criarAplicacao({ modo: modo(), semear: modo() === 'falso' })
  return aplicacao
}

function criarJanela(): BrowserWindow {
  const janela = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: 'Esteira',
    backgroundColor: '#e7eef0',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  })

  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  janela.webContents.on('will-navigate', (evento, url) => {
    const dev = process.env.ELECTRON_RENDERER_URL
    if (url.startsWith('file:')) return
    if (dev && url.startsWith(dev)) return
    evento.preventDefault()
  })
  janela.webContents.on('will-attach-webview', (evento) => {
    evento.preventDefault()
  })

  janela.once('ready-to-show', () => janela.show())
  if (process.env.ELECTRON_RENDERER_URL) void janela.loadURL(process.env.ELECTRON_RENDERER_URL)
  else void janela.loadFile(path.join(__dirname, '../renderer/index.html'))
  return janela
}

app.setAppUserModelId('com.esteira.desktop')

app.whenReady().then(() => {
  if (app.isPackaged) {
    session.defaultSession.webRequest.onHeadersReceived((detalhes, callback) => {
      callback({
        responseHeaders: {
          ...detalhes.responseHeaders,
          'Content-Security-Policy': [CSP],
        },
      })
    })
  }
  ipcMain.handle('esteira', async (_evento, canal: unknown, corpo: unknown) => {
    if (typeof canal !== 'string' || canal.length > 40) throw new Error('Canal desconhecido.')
    if (canal === 'abrirNoBrowser') {
      await abrirNoAzure((endereco) => shell.openExternal(endereco), urlDoCorpo(corpo))
      return null
    }
    return despachar(await obterApp(), canal, corpo ?? {})
  })
  criarJanela()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
