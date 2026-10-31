import { describe, expect, it } from 'vitest'
import { aplicarContrato } from '../src/core/contrato'
import { prefiltrarBacklog } from '../src/core/prefiltro-backlog'
import { definirModulos, modulosParaRegenerar } from '../src/core/wiki-plano'
import { extrairMencoes, resolverEscopo } from '../src/core/mentoes'
import { montarComentario } from '../src/core/publicacao'
import { itensExemplo } from '../src/app/exemplo'
import type { Produto, Repositorio, StoryTexto } from '../src/shared/tipos'
import { STORY_VAZIA } from '../src/shared/tipos'
import { caminhoSeguro, redigirSegredo, validarBranch, validarOrgUrl, validarRemoto } from '../src/adapters/seguro'

const AGORA = new Date('2026-10-24T12:00:00.000Z')

describe('prova e contrato', () => {
  const story: StoryTexto = { titulo: 'Estorno', corpo: 'corpo', descricao: 'd', criteriosDeAceite: 'c' }
  const arquivos = [{ caminho: 'src/estorno/regra.ts', conteudo: '/** Estorno parcial só é aceito quando o valor não passa do valor original. */\n', repositorio: 'pagamentos-api' }]

  it('marca sem prova quando o trecho não está no arquivo', () => {
    const resultado = aplicarContrato({
      papel: 'confrontar',
      blocoId: 'b',
      blocoNome: 'Código',
      story,
      achados: [],
      saidaStory: { titulo: 'não pode' },
      saidaAchados: [{ texto: 'Inventei uma regra.', tipo: 'existe', evidencia: { tipo: 'arquivo', caminho: 'src/estorno/regra.ts', trecho: 'isto não está no arquivo' } }],
      arquivos,
      cards: [],
      novoId: () => 'a1',
    })
    expect(resultado.story.titulo).toBe('Estorno')
    expect(resultado.achados[0]?.semProva).toBe(true)
  })

  it('aceita trecho literal e não deixa achado aceito voltar', () => {
    const primeiro = aplicarContrato({
      papel: 'confrontar',
      blocoId: 'b',
      blocoNome: 'Código',
      story,
      achados: [],
      saidaAchados: [{ texto: 'O código limita o valor.', tipo: 'existe', evidencia: { tipo: 'arquivo', caminho: 'src/estorno/regra.ts', trecho: 'Estorno parcial só é aceito quando o valor não passa do valor original.' } }],
      arquivos,
      cards: [],
      novoId: () => 'a1',
    })
    expect(primeiro.achados[0]?.semProva).toBe(false)
    primeiro.achados[0]!.estado = 'aceito'
    const segundo = aplicarContrato({
      papel: 'confrontar',
      blocoId: 'b',
      blocoNome: 'Código',
      story,
      achados: primeiro.achados,
      saidaAchados: [{ texto: 'O código limita o valor.', tipo: 'existe', evidencia: { tipo: 'arquivo', caminho: 'src/estorno/regra.ts', trecho: 'Estorno parcial só é aceito quando o valor não passa do valor original.' } }],
      arquivos,
      cards: [],
      novoId: () => 'a2',
    })
    expect(segundo.achados).toHaveLength(1)
  })

  it('não encontrei não vira sem prova', () => {
    const resultado = aplicarContrato({
      papel: 'confrontar',
      blocoId: 'b',
      blocoNome: 'Wiki',
      story,
      achados: [],
      saidaAchados: [{ texto: 'Não encontrei essa regra.', tipo: 'nao-encontrei', evidencia: { tipo: 'ausencia' } }],
      arquivos,
      cards: [],
      novoId: () => 'a1',
    })
    expect(resultado.achados[0]?.semProva).toBe(false)
    expect(resultado.achados[0]?.evidencia.tipo).toBe('ausencia')
  })
})

describe('pré-filtro do backlog', () => {
  const itens = itensExemplo(AGORA)
  const filtro = {
    agora: AGORA,
    projetos: ['Pagamentos'],
    areas: ['Empresa\\Pagamentos'],
    mesesFechados: 12,
    nomesProduto: ['PIX'],
    limite: 12,
  }

  it('traz estorno fechado recente e o card aberto, e deixa de fora o antigo e o limite', () => {
    const candidatos = prefiltrarBacklog(itens, 'Permitir estorno parcial de um PIX já liquidado, sem passar do valor original.', filtro)
    const ids = candidatos.map((item) => item.id)
    expect(ids).toContain(1042)
    expect(ids).toContain(1300)
    expect(ids).not.toContain(880)
    expect(ids).not.toContain(1108)
    expect(ids).not.toContain(1201)
  })

  it('o nome do produto sozinho não puxa o board inteiro', () => {
    expect(prefiltrarBacklog(itens, 'PIX', filtro)).toHaveLength(0)
  })
})

describe('wiki incremental', () => {
  const base = [
    { repositorioId: 'r1', repositorioNome: 'pagamentos-api', caminho: 'src/estorno/regra.ts', hash: 'a' },
    { repositorioId: 'r1', repositorioNome: 'pagamentos-api', caminho: 'src/liquidacao/service.ts', hash: 'b' },
  ]

  it('regenera só o módulo do arquivo que mudou', () => {
    const antes = definirModulos(base)
    const depois = definirModulos(base.map((arquivo) => (arquivo.caminho.includes('estorno') ? { ...arquivo, hash: 'z' } : arquivo)))
    expect(modulosParaRegenerar(antes, depois)).toEqual(['pagamentos-api/estorno'])
  })
})

describe('menções e comentário', () => {
  const produtos: Produto[] = [
    { id: 'pix', nome: 'PIX', repositorioIds: ['repo-pagamentos'], dependeDe: ['contas'], projetosBacklog: [], areasBacklog: [] },
    { id: 'contas', nome: 'Contas', repositorioIds: ['repo-contas'], dependeDe: [], projetosBacklog: [], areasBacklog: [] },
  ]
  const repos: Repositorio[] = [
    { id: 'repo-pagamentos', nome: 'pagamentos-api', projeto: 'P', remoteUrl: 'https://dev.azure.com/o/P/_git/pagamentos-api', branchPadrao: 'main', branchAcompanhada: 'main', estado: 'pronto', selecionado: true },
    { id: 'repo-contas', nome: 'contas-api', projeto: 'C', remoteUrl: 'https://dev.azure.com/o/C/_git/contas-api', branchPadrao: 'main', branchAcompanhada: 'main', estado: 'pronto', selecionado: true },
  ]

  it('sem menção inclui o produto ligado', () => {
    expect(resolverEscopo([], produtos[0]!, produtos, repos).repositorioIds.sort()).toEqual(['repo-contas', 'repo-pagamentos'])
  })

  it('menção estreita o recorte', () => {
    expect(extrairMencoes('busque em @pagamentos-api como é feito')).toEqual(['pagamentos-api'])
    expect(resolverEscopo(['pagamentos-api'], produtos[0]!, produtos, repos).repositorioIds).toEqual(['repo-pagamentos'])
  })

  it('comentário menciona o responsável e não é uma descrição nova', () => {
    const texto = montarComentario({
      story: { ...STORY_VAZIA, corpo: 'Sugestão', criteriosDeAceite: '- um' },
      achadosAceitos: [],
      responsavel: { nome: 'Ana Lima', id: 'ana-lima' },
    })
    expect(texto).toContain('data-vss-mention="version:2.0,ana-lima"')
    expect(texto).toContain('@Ana Lima')
    expect(texto).toContain('não foi alterada')
    expect(texto).not.toContain('System.Description')
    expect(texto).not.toContain('data-vss-mention="user:')
  })

  it('comentário em HTML preserva quebra e escapa o texto', () => {
    const texto = montarComentario({
      story: { ...STORY_VAZIA, corpo: 'linha 1\r\nlinha 2', criteriosDeAceite: 'a < b & c' },
      achadosAceitos: [
        {
          id: 'a1',
          blocoId: 'codigo',
          blocoNome: 'Código',
          texto: 'cuidado <script>',
          tipo: 'divergencia',
          evidencia: { tipo: 'ausencia' },
          semProva: true,
          estado: 'aceito',
        },
      ],
      responsavel: { nome: 'Ana <Lima>', id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
    })
    expect(texto).toContain('data-vss-mention="version:2.0,aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"')
    expect(texto).toContain('@Ana &lt;Lima&gt;')
    expect(texto).toContain('<div>linha 1</div><div>linha 2</div>')
    expect(texto).toContain('a &lt; b &amp; c')
    expect(texto).toContain('cuidado &lt;script&gt;')
    expect(texto).not.toContain('<script>')
    const sujo = montarComentario({
      story: { ...STORY_VAZIA, corpo: 'texto' },
      achadosAceitos: [],
      responsavel: { nome: 'Ana', id: '"><img' },
    })
    expect(sujo).not.toContain('data-vss-mention')
    expect(sujo).toContain('@Ana')
    expect(sujo).not.toContain('<img')
  })
})

describe('limites de caminho e host', () => {
  it('recusa host fora do Azure e branch com comando', () => {
    expect(() => validarOrgUrl('https://evil.example/org')).toThrow(/dev\.azure\.com/)
    expect(() => validarOrgUrl('https://fintech@dev.azure.com/fintech')).toThrow(/token/)
    expect(() => validarBranch('main;rm')).toThrow(/Branch/)
    expect(() => caminhoSeguro('/dados/repos', '../segredo')).toThrow(/fora/)
  })

  it('tira o usuário da URL do repositório', () => {
    expect(validarRemoto('https://fintech@dev.azure.com/fintech/P/_git/app').toString()).toBe('https://dev.azure.com/fintech/P/_git/app')
    expect(validarRemoto('https://org@org.visualstudio.com/P/_git/app').toString()).toBe('https://org.visualstudio.com/P/_git/app')
    const comSenha = ['https://', 'alguem:', 'segredo@', 'dev.azure.com/fintech/P/_git/app'].join('')
    const limpa = validarRemoto(comSenha).toString()
    expect(limpa).toBe('https://dev.azure.com/fintech/P/_git/app')
    expect(limpa).not.toContain('segredo')
    expect(() => validarRemoto('')).toThrow(/não é válida/)
    expect(() => validarRemoto('http://dev.azure.com/fintech/P/_git/app')).toThrow(/https/)
  })

  it('tira token de mensagem de erro', () => {
    const texto = redigirSegredo('fatal: Authorization: Basic dXNlcjpwYXQtc2VncmVkby extra')
    expect(texto).not.toContain('dXNlcjpwYXQ')
    expect(texto).toContain('[redigido]')
    expect(redigirSegredo('https://usuario:segredo@example.com/org')).not.toContain('segredo')
  })
})
