import { describe, expect, it } from 'vitest'
import { aplicarContrato } from '../src/core/contrato'
import { prefiltrarBacklog } from '../src/core/prefiltro-backlog'
import { definirModulos, fatiarPorContexto, modulosParaRegenerar } from '../src/core/wiki-plano'
import { extrairMencoes, resolverEscopo } from '../src/core/mentoes'
import { acaoInicialDoBoard, descricaoDoCard, frasePublicacao, idDoCardAberto, montarComentario, urlDoCard } from '../src/core/publicacao'
import { comMarcaDoAchado } from '../src/core/diff-story'
import type { Achado } from '../src/shared/tipos'
import { itensExemplo } from '../src/app/exemplo'
import type { Produto, Repositorio, StoryTexto } from '../src/shared/tipos'
import { STORY_VAZIA } from '../src/shared/tipos'
import { abrirNoAzure, caminhoSeguro, redigirSegredo, validarBranch, validarOrgUrl, validarRemoto } from '../src/adapters/seguro'

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

  it('refaz erro, pendente e gerando mesmo com o mesmo hash', () => {
    const planejados = definirModulos(base)
    const erro = planejados.map((modulo) => ({ ...modulo, estado: modulo.id.endsWith('estorno') ? 'erro' : 'pronto' }))
    expect(modulosParaRegenerar(erro, planejados)).toEqual(['pagamentos-api/estorno'])
    const pendente = planejados.map((modulo) => ({ ...modulo, estado: 'pendente' }))
    expect(modulosParaRegenerar(pendente, planejados).sort()).toEqual(['pagamentos-api/estorno', 'pagamentos-api/liquidacao'])
    const gerando = planejados.map((modulo) => ({ ...modulo, estado: 'gerando' }))
    expect(modulosParaRegenerar(gerando, planejados)).toHaveLength(planejados.length)
    expect(modulosParaRegenerar(planejados.map((modulo) => ({ ...modulo, estado: 'pronto' })), planejados)).toEqual([])
  })

  it('parte o contexto para caber numa chamada e não descarta o arquivo grande', () => {
    const arquivos = [
      { caminho: 'a', conteudo: 'x'.repeat(50) },
      { caminho: 'b', conteudo: 'y'.repeat(40) },
      { caminho: 'c', conteudo: 'z'.repeat(30) },
    ]
    expect(fatiarPorContexto(arquivos, 80).map((lote) => lote.map((item) => item.caminho))).toEqual([['a'], ['b', 'c']])
    const grande = [{ caminho: 'grande', conteudo: 'x'.repeat(100) }, { caminho: 'b', conteudo: 'y' }]
    expect(fatiarPorContexto(grande, 80).map((lote) => lote.map((item) => item.caminho))).toEqual([['grande'], ['b']])
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

describe('achado sem prova e publicação', () => {
  const base = { titulo: 'Estorno', corpo: 'Eu quero estornar uma parte.', descricao: 'Descrição editada pelo PM', criteriosDeAceite: '- A regra está explícita.' }

  it('sem prova entra marcado e não encontrei vira pergunta', () => {
    const sem = comMarcaDoAchado({ tipo: 'divergencia', texto: 'Isto é um palpite.', semProva: true }, base)
    expect(sem.criteriosDeAceite).toContain('- Ajuste: Isto é um palpite. [sem prova]')
    const deNovo = comMarcaDoAchado({ tipo: 'divergencia', texto: 'Isto é um palpite.', semProva: true }, sem)
    expect(deNovo.criteriosDeAceite.split('[sem prova]')).toHaveLength(2)
    const pergunta = comMarcaDoAchado({ tipo: 'nao-encontrei', texto: 'Não achei a regra.', semProva: false }, base)
    expect(pergunta.criteriosDeAceite).toContain('- Pergunta em aberto: Não achei a regra.')
    expect(pergunta.criteriosDeAceite).not.toContain('[sem prova]')
    expect(comMarcaDoAchado({ tipo: 'existe', texto: 'Com prova.', semProva: false }, base)).toEqual(base)
  })

  it('dois achados ganham cada um a sua linha e a mesma linha não duplica', () => {
    const um = comMarcaDoAchado({ tipo: 'divergencia', texto: 'Palpite um.', semProva: true }, base)
    const dois = comMarcaDoAchado({ tipo: 'divergencia', texto: 'Palpite dois.', semProva: true }, um)
    expect(dois.criteriosDeAceite).toContain('- Ajuste: Palpite um. [sem prova]')
    expect(dois.criteriosDeAceite).toContain('- Ajuste: Palpite dois. [sem prova]')
    const repetido = comMarcaDoAchado({ tipo: 'divergencia', texto: 'Palpite dois.', semProva: true }, dois)
    expect(repetido.criteriosDeAceite.split('- Ajuste: Palpite dois. [sem prova]')).toHaveLength(2)

    const primeira = comMarcaDoAchado({ tipo: 'nao-encontrei', texto: 'Não achei o limite.', semProva: false }, base)
    const segunda = comMarcaDoAchado({ tipo: 'nao-encontrei', texto: 'Não achei o prazo.', semProva: false }, primeira)
    expect(segunda.criteriosDeAceite).toContain('- Pergunta em aberto: Não achei o limite.')
    expect(segunda.criteriosDeAceite).toContain('- Pergunta em aberto: Não achei o prazo.')
    expect(comMarcaDoAchado({ tipo: 'nao-encontrei', texto: 'Não achei o prazo.', semProva: false }, segunda)).toEqual(segunda)
  })

  it('criar card usa a descrição editada e a story', () => {
    expect(descricaoDoCard(base).startsWith('Descrição editada pelo PM')).toBe(true)
    expect(descricaoDoCard(base)).toContain('Eu quero estornar uma parte.')
    expect(descricaoDoCard({ ...base, descricao: '   ' })).toBe(base.corpo)
    expect(descricaoDoCard({ ...base, corpo: base.descricao })).toBe(base.descricao)
  })

  it('a frase depois de criar não diz que a descrição ficou intacta', () => {
    expect(frasePublicacao({ acao: 'criar', workItemId: 8001, projeto: 'Pagamentos' })).toContain('foram gravados')
    expect(frasePublicacao({ acao: 'criar', workItemId: 8001, projeto: 'Pagamentos' })).not.toContain('não foi alterada')
    expect(frasePublicacao({ acao: 'comentar', workItemId: 1300, projeto: 'Pagamentos' })).toContain('não foi alterada')
    expect(urlDoCard('https://dev.azure.com/fintech', 'Pagamentos', 1300)).toBe('https://dev.azure.com/fintech/Pagamentos/_workitems/edit/1300')
  })

  it('story nova começa em criar; card aberto aceito preenche o comentário', () => {
    const aberto: Achado = {
      id: 'c',
      blocoId: 'backlog',
      blocoNome: 'Backlog',
      texto: 'Dá para ajustar o card aberto #1300.',
      tipo: 'ajustar-aberta',
      evidencia: { tipo: 'work-item', id: 1300, titulo: 'Estorno', projeto: 'Pagamentos' },
      semProva: false,
      estado: 'pendente',
    }
    expect(acaoInicialDoBoard([aberto])).toEqual({ acao: 'criar', cardId: '' })
    expect(idDoCardAberto([aberto])).toBe(1300)
    expect(acaoInicialDoBoard([{ ...aberto, estado: 'aceito' }])).toEqual({ acao: 'comentar', cardId: '1300' })
    expect(idDoCardAberto([{ ...aberto, semProva: true }])).toBeNull()
    expect(idDoCardAberto([{ ...aberto, estado: 'descartado' }])).toBeNull()
  })
})

describe('limites de caminho e host', () => {
  it('abre no browser só https do Azure DevOps', async () => {
    const abertos: string[] = []
    const abrir = async (url: string) => {
      abertos.push(url)
    }
    await abrirNoAzure(abrir, 'https://dev.azure.com/fintech/Pagamentos/_workitems/edit/1300')
    await abrirNoAzure(abrir, 'https://fintech.visualstudio.com/Pagamentos/_workitems/edit/7')
    expect(abertos).toEqual([
      'https://dev.azure.com/fintech/Pagamentos/_workitems/edit/1300',
      'https://fintech.visualstudio.com/Pagamentos/_workitems/edit/7',
    ])
    await expect(abrirNoAzure(abrir, 'http://dev.azure.com/fintech/x')).rejects.toThrow(/https/)
    await expect(abrirNoAzure(abrir, 'https://evil.example/org')).rejects.toThrow(/dev\.azure\.com/)
    const comCredencial = ['https://usuario', 'segredo@dev.azure.com/fintech/x'].join(':')
    await expect(abrirNoAzure(abrir, comCredencial)).rejects.toThrow(/token/)
    expect(abertos).toHaveLength(2)
  })

  it('recusa host fora do Azure e branch com comando', () => {
    expect(() => validarOrgUrl('https://evil.example/org')).toThrow(/dev\.azure\.com/)
    expect(() => validarOrgUrl('https://fintech@dev.azure.com/fintech')).toThrow(/token/)
    expect(() => validarBranch('main;rm')).toThrow(/Branch/)
    expect(() => validarBranch('-main')).toThrow(/Branch/)
    expect(() => validarBranch('--upload-pack=x')).toThrow(/Branch/)
    expect(validarBranch('feature/estorno-parcial')).toBe('feature/estorno-parcial')
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
    expect(redigirSegredo('fatal: proxy http://ana:segredo-proxy@proxy:8080')).not.toContain('segredo-proxy')
  })
})
