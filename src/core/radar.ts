import type { ProvaRadar, SinalBruto, SugestaoRadar, TipoSugestao } from '../shared/tipos'

const RUIDO = /^(ok|okay|blz|beleza|show|perfeito|valeu|obrigad[oa]|bom dia|boa tarde|boa noite|isso|sim|não|nao|kkk+|haha+|rs+)[.!?\s]*$/i
const INJECAO = /ignore (as |all )?(instru|previous|anteriores)|voc[eê] agora [eé]|you are now|system prompt|<\s*\/?\s*system\s*>|publique no board|desconsidere (as |todas )|reveal the|pat\s*[:=]/i

export function sanitizarTextoExterno(texto: string): string {
  const semControle = texto.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  const semQuebra = semControle.replace(/<<<|>>>/g, '')
  const linhas = semQuebra
    .split('\n')
    .map((linha) => linha.replace(/\s+/g, ' ').trim())
    .filter((linha) => linha && !INJECAO.test(linha))
  return linhas.join('\n').trim().slice(0, 8_000)
}

export function eRuido(texto: string): boolean {
  const limpo = texto.trim()
  if (limpo.length < 25) return true
  return RUIDO.test(limpo)
}

export interface SinalLimpo {
  id: string
  provedor: SinalBruto['provedor']
  fonteRef: string
  fonteNome: string
  autor: string
  local: string
  em: string
  texto: string
  fio: string
}

export function prepararSinais(brutos: SinalBruto[]): SinalLimpo[] {
  const limpos: SinalLimpo[] = []
  for (const bruto of brutos) {
    const texto = sanitizarTextoExterno(bruto.texto)
    if (!texto || eRuido(texto)) continue
    limpos.push({
      id: bruto.id,
      provedor: bruto.provedor,
      fonteRef: bruto.fonteRef,
      fonteNome: bruto.fonteNome,
      autor: bruto.autor.trim().slice(0, 120) || 'sem nome',
      local: bruto.local.trim().slice(0, 160) || bruto.fonteNome,
      em: bruto.em,
      texto,
      fio: bruto.fio.trim() || bruto.id,
    })
  }
  return limpos
}

export function agruparSinais(sinais: SinalLimpo[]): SinalLimpo[][] {
  const grupos = new Map<string, SinalLimpo[]>()
  for (const sinal of sinais) {
    const chave = `${sinal.provedor}:${sinal.fio}`
    const lista = grupos.get(chave) ?? []
    lista.push(sinal)
    grupos.set(chave, lista)
  }
  return [...grupos.values()]
}

export function classificarTipo(texto: string): TipoSugestao {
  const t = texto.toLowerCase()
  if (/bug|erro|falha|quebr|chamado|passou do valor|não bate|nao bate/.test(t)) return 'bug'
  if (/melhor|ux|tela|concilia/.test(t)) return 'melhoria'
  return 'nova-story'
}

export function melhorCitacao(texto: string): string | null {
  const frases = texto
    .split(/(?<=[.!?])\s+/)
    .map((frase) => frase.trim())
    .filter((frase) => frase.length >= 12 && texto.includes(frase))
  frases.sort((a, b) => b.length - a.length)
  if (frases[0]) return frases[0]
  const inteiro = texto.trim()
  return inteiro.length >= 12 ? inteiro : null
}

export function recortarCitacao(texto: string, pedido: string): string | null {
  const alvo = pedido.trim()
  if (alvo.length < 12) return null
  if (!texto.includes(alvo)) return null
  return alvo
}

export function resumoSeguro(resumo: string, fontes: string[]): string {
  const limpo = sanitizarTextoExterno(resumo).slice(0, 600)
  if (!limpo) return ''
  const base = fontes.join('\n').toLowerCase()
  if (INJECAO.test(limpo) && !base.includes(limpo.toLowerCase())) return ''
  return limpo
}

export function ideiaDaSugestao(sugestao: Pick<SugestaoRadar, 'titulo' | 'resumo' | 'provas'>): string {
  const provas = sugestao.provas
    .map((prova) => `Prova (${prova.provedor}, ${prova.local}, ${prova.autor}, ${prova.em}): "${prova.citacao}"`)
    .join('\n')
  return [sugestao.titulo.trim(), '', sugestao.resumo.trim(), '', provas].filter((parte) => parte !== undefined).join('\n').trim()
}

export function provaDe(sinal: SinalLimpo, citacao: string): ProvaRadar {
  return {
    provedor: sinal.provedor,
    fonteNome: sinal.fonteNome,
    autor: sinal.autor,
    local: sinal.local,
    em: sinal.em,
    citacao,
  }
}

export function montarFallback(grupo: SinalLimpo[]): { tipo: TipoSugestao; titulo: string; resumo: string; citacao: string; sinal: SinalLimpo } | null {
  const ordenados = [...grupo].sort((a, b) => b.texto.length - a.texto.length)
  for (const sinal of ordenados) {
    const citacao = melhorCitacao(sinal.texto)
    if (!citacao) continue
    const tipo = classificarTipo(grupo.map((item) => item.texto).join('\n'))
    const titulo = citacao.length > 90 ? `${citacao.slice(0, 87).trim()}…` : citacao
    const rotulo = tipo === 'bug' ? 'Ajuste a partir do relato' : tipo === 'melhoria' ? 'Melhoria a partir do relato' : 'Nova capacidade a partir do relato'
    return { tipo, titulo, resumo: `${rotulo}: ${citacao}`, citacao, sinal }
  }
  return null
}

export function normalizarTipo(valor: string | undefined, texto: string): TipoSugestao {
  if (valor === 'nova-story' || valor === 'melhoria' || valor === 'bug') return valor
  return classificarTipo(texto)
}
