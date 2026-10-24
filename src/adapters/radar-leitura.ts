import fs from 'node:fs/promises'
import path from 'node:path'
import type { LeitorRadar } from '../ports'
import type { ProvedorRadar, SinalBruto } from '../shared/tipos'
import { caminhoSeguro } from './seguro'

export interface PedidoLeitura {
  method: 'GET'
  url: string
  provedor: 'teams' | 'slack'
}

const HOSTS: Record<'teams' | 'slack', string> = {
  teams: 'graph.microsoft.com',
  slack: 'slack.com',
}

export function pedidoLeitura(provedor: ProvedorRadar, referencia: string, _token?: string | null): PedidoLeitura | null {
  if (provedor === 'whatsapp' || provedor === 'granola' || provedor === 'plaud') return null
  if (provedor === 'teams') {
    const partes = referencia.split('/')
    if (partes.length !== 2 || partes.some((parte) => !/^[A-Za-z0-9-]{1,80}$/.test(parte))) return null
    const [time, canal] = partes
    return {
      method: 'GET',
      url: `https://${HOSTS.teams}/v1.0/teams/${time}/channels/${canal}/messages`,
      provedor: 'teams',
    }
  }
  if (!/^[A-Z0-9]{2,32}$/.test(referencia)) return null
  return {
    method: 'GET',
    url: `https://${HOSTS.slack}/api/conversations.history?channel=${encodeURIComponent(referencia)}`,
    provedor: 'slack',
  }
}

function sinaisDeJson(provedor: ProvedorRadar, fonteRef: string, fonteNome: string, corpo: unknown): SinalBruto[] {
  const lista = Array.isArray(corpo) ? corpo : [corpo]
  const sinais: SinalBruto[] = []
  for (const item of lista) {
    if (!item || typeof item !== 'object') continue
    const registro = item as Record<string, unknown>
    const texto = String(registro.texto ?? registro.text ?? '').trim()
    if (!texto) continue
    sinais.push({
      id: String(registro.id ?? `${provedor}-${sinais.length}-${fonteRef}`),
      provedor,
      fonteRef,
      fonteNome: String(registro.local ?? fonteNome),
      autor: String(registro.autor ?? registro.author ?? 'sem nome'),
      local: String(registro.local ?? fonteNome),
      em: String(registro.em ?? new Date(0).toISOString()),
      texto,
      fio: String(registro.fio ?? registro.id ?? fonteRef),
    })
  }
  return sinais
}

export function parseWhatsApp(fonteRef: string, fonteNome: string, texto: string): SinalBruto[] {
  const sinais: SinalBruto[] = []
  const linhas = texto.split(/\r?\n/)
  let atual: SinalBruto | null = null
  for (const linha of linhas) {
    const casa = linha.match(/^\[(\d{1,2}\/\d{1,2}\/\d{2,4})[, ]\s*(\d{1,2}:\d{2}(?::\d{2})?)\]\s([^:]+):\s([\s\S]*)$/)
    if (!casa) {
      if (atual && linha.trim()) atual.texto = `${atual.texto}\n${linha.trim()}`
      continue
    }
    if (atual) sinais.push(atual)
    atual = {
      id: `${fonteRef}-${sinais.length + 1}`,
      provedor: 'whatsapp',
      fonteRef,
      fonteNome,
      autor: casa[3]!.trim(),
      local: fonteNome,
      em: casa[1]! + ' ' + casa[2]!,
      texto: casa[4]!.trim(),
      fio: fonteRef,
    }
  }
  if (atual) sinais.push(atual)
  return sinais.filter((sinal) => sinal.texto.trim())
}

async function lerArquivo(provedor: ProvedorRadar, pastaProvedor: string, relativo: string): Promise<SinalBruto[]> {
  const cheio = caminhoSeguro(pastaProvedor, relativo)
  const nome = path.basename(relativo)
  const texto = await fs.readFile(cheio, 'utf8')
  if (provedor === 'whatsapp' || nome.endsWith('.txt')) {
    if (provedor === 'whatsapp') return parseWhatsApp(relativo, nome, texto)
    return [{
      id: `${provedor}-${nome}`,
      provedor,
      fonteRef: relativo,
      fonteNome: nome,
      autor: provedor === 'plaud' ? 'nota de voz' : 'nota',
      local: nome,
      em: new Date(0).toISOString(),
      texto,
      fio: relativo,
    }]
  }
  if (nome.endsWith('.json')) return sinaisDeJson(provedor, relativo, nome, JSON.parse(texto) as unknown)
  if (nome.endsWith('.md')) {
    return [{
      id: `${provedor}-${nome}`,
      provedor,
      fonteRef: relativo,
      fonteNome: nome,
      autor: 'nota',
      local: nome,
      em: new Date(0).toISOString(),
      texto,
      fio: relativo,
    }]
  }
  return []
}

export async function lerPasta(raiz: string, provedor: ProvedorRadar, referencia: string): Promise<SinalBruto[]> {
  const pasta = caminhoSeguro(raiz, provedor)
  try {
    await fs.access(pasta)
  } catch {
    return []
  }
  if (referencia && referencia !== '.') {
    try {
      return await lerArquivo(provedor, pasta, referencia)
    } catch {
      return []
    }
  }
  const nomes = await fs.readdir(pasta)
  const sinais: SinalBruto[] = []
  for (const nome of nomes) {
    if (nome.startsWith('.')) continue
    try {
      sinais.push(...(await lerArquivo(provedor, pasta, nome)))
    } catch {
      /* arquivo ilegível não entra */
    }
  }
  return sinais
}

function sinaisDaApi(provedor: 'teams' | 'slack', referencia: string, json: unknown): SinalBruto[] {
  if (!json || typeof json !== 'object') return []
  if (provedor === 'teams') {
    const valor = (json as { value?: unknown[] }).value ?? []
    return valor.flatMap((item, indice) => {
      if (!item || typeof item !== 'object') return []
      const mensagem = item as { id?: string; createdDateTime?: string; from?: { user?: { displayName?: string } }; body?: { content?: string } }
      const texto = String(mensagem.body?.content ?? '').replace(/<[^>]+>/g, ' ').trim()
      if (!texto) return []
      return [{
        id: mensagem.id || `teams-api-${indice}`,
        provedor: 'teams' as const,
        fonteRef: referencia,
        fonteNome: referencia,
        autor: mensagem.from?.user?.displayName || 'sem nome',
        local: `Teams · ${referencia}`,
        em: mensagem.createdDateTime || new Date(0).toISOString(),
        texto,
        fio: mensagem.id || referencia,
      }]
    })
  }
  const mensagens = (json as { messages?: unknown[] }).messages ?? []
  return mensagens.flatMap((item, indice) => {
    if (!item || typeof item !== 'object') return []
    const mensagem = item as { user?: string; text?: string; ts?: string }
    const texto = String(mensagem.text ?? '').trim()
    if (!texto) return []
    return [{
      id: mensagem.ts || `slack-api-${indice}`,
      provedor: 'slack' as const,
      fonteRef: referencia,
      fonteNome: referencia,
      autor: mensagem.user || 'sem nome',
      local: `Slack · ${referencia}`,
      em: mensagem.ts ? new Date(Number(mensagem.ts) * 1000).toISOString() : new Date(0).toISOString(),
      texto,
      fio: mensagem.ts || referencia,
    }]
  })
}

export function criarLeitorReal(opcoes: {
  provedor: ProvedorRadar
  pasta: string
  token: () => Promise<string | null>
  buscar?: typeof fetch
}): LeitorRadar {
  const buscar = opcoes.buscar ?? fetch
  return {
    provedor: opcoes.provedor,
    async listarCanais() {
      const pasta = caminhoSeguro(opcoes.pasta, opcoes.provedor)
      try {
        const nomes = await fs.readdir(pasta)
        return nomes.filter((nome) => !nome.startsWith('.')).map((nome) => ({ referencia: nome, nome }))
      } catch {
        return []
      }
    },
    async ler(referencia) {
      const locais = await lerPasta(opcoes.pasta, opcoes.provedor, referencia)
      const pedido = pedidoLeitura(opcoes.provedor, referencia)
      if (!pedido) return locais
      const token = await opcoes.token()
      if (!token) return locais
      const resposta = await buscar(pedido.url, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      })
      if (!resposta.ok) return locais
      const json: unknown = await resposta.json()
      return [...locais, ...sinaisDaApi(pedido.provedor, referencia, json)]
    },
  }
}
