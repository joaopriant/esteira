import os from 'node:os'
import path from 'node:path'
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { criarAplicacao } from '../app/criar'
import { despachar } from '../app/api'
import type { EsteiraApp } from '../app/esteira-app'

let pendente: Promise<EsteiraApp> | undefined

function aplicacao(): Promise<EsteiraApp> {
  // shortcut: ESTEIRA_SEMEAR=0 só no preview vazio, revisar se o app empacotado precisar abrir sem o exemplo.
  pendente ??= criarAplicacao({
    modo: 'falso',
    semear: process.env.ESTEIRA_SEMEAR !== '0',
    dataDir: process.env.ESTEIRA_DATA ?? path.join(os.tmpdir(), 'esteira-ui-preview'),
    agora: () => new Date('2026-10-24T12:00:00.000Z'),
  })
  return pendente
}

async function lerCorpo(req: IncomingMessage): Promise<unknown> {
  const pedacos: Buffer[] = []
  for await (const pedaco of req) pedacos.push(Buffer.isBuffer(pedaco) ? pedaco : Buffer.from(pedaco))
  const texto = Buffer.concat(pedacos).toString('utf8')
  if (!texto) return {}
  return JSON.parse(texto) as unknown
}

export function pluginApi(): Plugin {
  return {
    name: 'esteira-api-local',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/api/')) {
          next()
          return
        }
        void responder(req, res, url.slice('/api/'.length))
      })
    },
  }
}

async function responder(req: IncomingMessage, res: ServerResponse, canal: string) {
  try {
    const corpo = req.method === 'POST' ? await lerCorpo(req) : {}
    const dados = await despachar(await aplicacao(), canal, corpo)
    res.statusCode = 200
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ dados }))
  } catch (erro) {
    res.statusCode = 400
    res.setHeader('content-type', 'application/json; charset=utf-8')
    const mensagem = erro instanceof Error ? erro.message : 'Falha'
    res.end(JSON.stringify({ erro: mensagem.replace(/pat-de-exemplo[^\s"]*/gi, '[pat]') }))
  }
}
