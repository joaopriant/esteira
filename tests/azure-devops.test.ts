import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { azurePeloSdk, sdkOficial, type AzureSdk, type ClientesOficiais } from '../src/adapters/azure-devops'
import { criarAplicacao } from '../src/app/criar'
import type { AzurePort, GitPort } from '../src/ports'

const pastas: string[] = []

afterEach(async () => {
  await Promise.all(pastas.splice(0).map((pasta) => fs.rm(pasta, { recursive: true, force: true })))
})

function witBase(parcial: Partial<ClientesOficiais['wit']> = {}): ClientesOficiais['wit'] {
  return {
    async queryByWiql() {
      return { workItems: [] }
    },
    async getWorkItems() {
      return []
    },
    async getWorkItem(id) {
      return { id, fields: {} }
    },
    async createWorkItem() {
      return { id: 1, fields: {} }
    },
    async addComment() {
      return undefined
    },
    ...parcial,
  }
}

function gitBase(repos: Awaited<ReturnType<ClientesOficiais['git']['getRepositories']>> = []): ClientesOficiais['git'] {
  return {
    async getRepositories() {
      return repos
    },
  }
}

async function sdkCom(git: ClientesOficiais['git'], wit: ClientesOficiais['wit'], org = 'https://dev.azure.com/fintech') {
  const abertos: { org: string; pat: string }[] = []
  const sdk = await sdkOficial(org, 'pat-de-teste', async (orgAberta, pat) => {
    abertos.push({ org: orgAberta, pat })
    return { git, wit }
  })
  return { sdk, abertos }
}

describe('sdk oficial com dublê', () => {
  it('fatiar getWorkItems em lotes de 200', async () => {
    const chamadas: { ids: number[]; campos?: string[] }[] = []
    const wit = witBase({
      async getWorkItems(ids, campos) {
        chamadas.push({ ids: [...ids], campos })
        return ids.map((id) => ({ id, fields: { 'System.Title': `card ${id}` } }))
      },
    })
    const { sdk, abertos } = await sdkCom(gitBase(), wit, 'https://dev.azure.com/fintech/')
    expect(abertos).toEqual([{ org: 'https://dev.azure.com/fintech', pat: 'pat-de-teste' }])

    await sdk.obterVarios([])
    expect(chamadas).toHaveLength(0)

    const ids = Array.from({ length: 500 }, (_, i) => i + 1)
    const lidos = await sdk.obterVarios(ids)
    expect(chamadas.map((chamada) => chamada.ids.length)).toEqual([200, 200, 100])
    expect(chamadas.every((chamada) => chamada.ids.length <= 200)).toBe(true)
    expect(chamadas[0]?.campos).toContain('System.Title')
    expect(chamadas[0]?.campos).toContain('Microsoft.VSTS.Common.ClosedDate')
    expect(lidos.map((item) => item.id)).toEqual(ids)

    chamadas.length = 0
    await sdk.obterVarios(Array.from({ length: 200 }, (_, i) => i + 1))
    expect(chamadas).toHaveLength(1)
  })

  it('pede no máximo 500 itens na consulta, senão o Azure recusa acima de 20 mil', async () => {
    const chamadas: unknown[][] = []
    const wit = witBase({
      async queryByWiql(...args) {
        chamadas.push(args)
        return { workItems: [{ id: 7 }, null, {}] }
      },
    })
    const { sdk } = await sdkCom(gitBase(), wit)
    await expect(sdk.consultar('Pagamentos', 'SELECT [System.Id] FROM WorkItems')).resolves.toEqual([7])
    expect(chamadas[0]?.[0]).toEqual({ query: 'SELECT [System.Id] FROM WorkItems' })
    expect(chamadas[0]?.[1]).toEqual({ project: 'Pagamentos' })
    expect(chamadas[0]?.[3]).toBe(500)
  })

  it('ignora repositório desabilitado', async () => {
    const { sdk } = await sdkCom(
      gitBase([
        { id: '1', name: 'ativo', project: { name: 'Pagamentos' }, remoteUrl: 'https://dev.azure.com/fintech/Pagamentos/_git/ativo', defaultBranch: 'refs/heads/develop' },
        { id: '2', name: 'off', project: { name: 'Pagamentos' }, remoteUrl: 'https://dev.azure.com/fintech/Pagamentos/_git/off', isDisabled: true },
      ]),
      witBase(),
    )
    await expect(sdk.listarRepos()).resolves.toEqual([
      {
        id: '1',
        nome: 'ativo',
        projeto: 'Pagamentos',
        remoteUrl: 'https://dev.azure.com/fintech/Pagamentos/_git/ativo',
        branchPadrao: 'develop',
      },
    ])
  })

  it('diz qual campo obrigatório a criação recusou', async () => {
    const regra = new Error('TF401320: Rule Error for field Activity. Error code: Required, HasValues, InvalidEmpty.')
    ;(regra as Error & { result: unknown }).result = {
      message: regra.message,
      customProperties: {
        RuleValidationErrors: [
          {
            fieldReferenceName: 'Microsoft.VSTS.Common.Activity',
            fieldStatusFlags: 'required, hasValues, invalidEmpty',
            errorMessage: regra.message,
          },
          {
            fieldReferenceName: 'Custom.Prioridade',
            fieldStatusFlags: 'required, invalidEmpty',
            errorMessage: 'TF401320: Rule Error for field Prioridade. Error code: Required, InvalidEmpty.',
          },
        ],
      },
    }
    const wit = witBase({
      async createWorkItem() {
        throw regra
      },
    })
    const { sdk } = await sdkCom(gitBase(), wit)
    await expect(sdk.criar('Pagamentos', 'User Story', [])).rejects.toThrow(
      'Não criei o card. O processo da empresa exige os campos "Activity" (Microsoft.VSTS.Common.Activity) e "Prioridade" (Custom.Prioridade).',
    )
  })

  it('lê o campo obrigatório da mensagem quando o corpo não traz a lista', async () => {
    const wit = witBase({
      async createWorkItem() {
        throw new Error('TF401320: Rule Error for field Área regulatória. Error code: Required, InvalidEmpty.')
      },
    })
    const { sdk } = await sdkCom(gitBase(), wit)
    await expect(sdk.criar('Pagamentos', 'User Story', [])).rejects.toThrow(/"Área regulatória"/)
  })

  it('não troca um erro que não é campo obrigatório', async () => {
    const wit = witBase({
      async createWorkItem() {
        throw new Error('TF401320: Rule Error for field Activity. Error code: InvalidListValue.')
      },
    })
    const { sdk } = await sdkCom(gitBase(), wit)
    await expect(sdk.criar('Pagamentos', 'User Story', [])).rejects.toThrow('TF401320: Rule Error for field Activity. Error code: InvalidListValue.')
  })

  it('recusa a URL da organização antes de abrir o cliente', async () => {
    const abrir = async () => {
      throw new Error('não deveria abrir')
    }
    await expect(sdkOficial('https://evil.example/org', 'pat-de-teste', abrir)).rejects.toThrow(/dev\.azure\.com/)
    await expect(sdkOficial('https://fintech@dev.azure.com/fintech', 'pat-de-teste', abrir)).rejects.toThrow(/token/)
  })
})

describe('consulta e criação pelo adaptador', () => {
  function sdkCaptura(consultar: (wiql: string) => Promise<number[]>, criar?: AzureSdk['criar']): AzureSdk {
    return {
      async listarRepos() {
        return []
      },
      async consultar(_projeto, wiql) {
        return consultar(wiql)
      },
      async obterVarios(ids) {
        return ids.map((id) => ({ id, fields: { 'System.Title': 't', 'System.TeamProject': 'Pagamentos' } }))
      },
      async obter(id) {
        return { id, fields: {} }
      },
      async criar(_projeto, _tipo, documento) {
        return (criar ?? (async () => ({ id: 1, fields: { 'System.TeamProject': 'Pagamentos' } })))(_projeto, _tipo, documento)
      },
      async adicionarComentario() {},
    }
  }

  it('trata como fechado o estado concluído de Agile, Scrum e CMMI', async () => {
    let consulta = ''
    const azure = azurePeloSdk(sdkCaptura(async (wiql) => {
      consulta = wiql
      return []
    }))
    await azure.listarWorkItems({ projetos: ['Pagamentos'], areas: [], fechadosDesde: '2025-10-31T00:00:00.000Z' })
    expect(consulta).toContain("[System.State] NOT IN ('Closed', 'Done', 'Completed', 'Inactive')")
    expect(consulta).toContain("[System.State] <> 'Removed'")
    expect(consulta).not.toContain('Resolved')
    expect(consulta).toContain('2025-10-31')
  })

  it('grava descrição e critérios em HTML e deixa o título como texto', async () => {
    let documento: { op: string; path: string; value: string }[] = []
    const azure = azurePeloSdk(
      sdkCaptura(async () => [], async (_projeto, _tipo, doc) => {
        documento = doc
        return { id: 9, fields: { 'System.TeamProject': 'Pagamentos' } }
      }),
    )
    await azure.criarWorkItem({
      projeto: 'Pagamentos',
      tipo: 'User Story',
      titulo: 'Título <ok>',
      descricao: '<script>alert(1)</script>\r\nsegunda',
      criterios: '',
      campoDescricao: 'System.Description',
      campoCriterios: 'Microsoft.VSTS.Common.AcceptanceCriteria',
    })
    expect(documento.find((item) => item.path === '/fields/System.Title')?.value).toBe('Título <ok>')
    expect(documento.find((item) => item.path === '/fields/System.Description')?.value).toBe('<div>&lt;script&gt;alert(1)&lt;/script&gt;</div><div>segunda</div>')
    expect(documento.find((item) => item.path.endsWith('AcceptanceCriteria'))?.value).toBe('')
  })
})

describe('conexão e seleção', () => {
  function azureCom(
    repos: { id: string; nome: string; projeto: string; remoteUrl: string; branchPadrao: string }[],
    aoListar?: () => Promise<void> | void,
  ): AzurePort {
    return {
      async listarRepositorios() {
        await aoListar?.()
        return repos
      },
      async listarWorkItems() {
        return []
      },
      async obterWorkItem() {
        throw new Error('não usado')
      },
      async criarWorkItem() {
        throw new Error('não usado')
      },
      async comentar() {},
    }
  }

  function gitQueAnota(clonados: string[]): GitPort {
    return {
      async clone(pedido) {
        clonados.push(pedido.url)
      },
      async atualizar() {
        return { arquivosAlterados: [] }
      },
      async listarArquivos() {
        return []
      },
      async lerArquivo() {
        return ''
      },
      async head() {
        return 'abc'
      },
    }
  }

  async function appFalso(azure: AzurePort, git?: GitPort) {
    const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-azure-'))
    pastas.push(dataDir)
    const app = await criarAplicacao({ dataDir, modo: 'falso', azure, git, semear: false })
    return { app, dataDir }
  }

  it('só grava conectado depois que a lista responde', async () => {
    const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-azure-'))
    pastas.push(dataDir)
    let durante = 'ausente'
    const azure = azureCom([], async () => {
      try {
        const texto = await fs.readFile(path.join(dataDir, 'config.json'), 'utf8')
        durante = JSON.parse(texto).conectado === true ? 'true' : 'false'
      } catch {
        durante = 'ausente'
      }
    })
    const app = await criarAplicacao({ dataDir, modo: 'falso', azure, semear: false })
    await app.conectar('https://dev.azure.com/fintech', 'pat-de-teste')
    expect(durante).toBe('ausente')
    expect((await app.ajustes()).conectado).toBe(true)
    const disco = await fs.readFile(path.join(dataDir, 'config.json'), 'utf8')
    expect(disco).not.toContain('pat-de-teste')
  })

  it('não marca conectado quando o teste do PAT falha', async () => {
    const { app, dataDir } = await appFalso(
      azureCom([], () => {
        throw new Error('PAT recusado')
      }),
    )
    await expect(app.conectar('https://dev.azure.com/fintech', 'pat-ruim-de-teste')).rejects.toThrow(/PAT recusado/)
    expect((await app.ajustes()).conectado).toBe(false)
    await expect(app.listarRepositoriosRemotos()).rejects.toThrow(/Conecte/)
    const disco = await fs.readFile(path.join(dataDir, 'config.json'), 'utf8')
    expect(disco).not.toContain('pat-ruim-de-teste')
  })

  it('uma URL ruim não aborta a seleção dos outros repositórios', async () => {
    const comSenha = ['https://', 'alguem:', 'segredo@', 'dev.azure.com/fintech/P/_git/secreto'].join('')
    const repos = [
      { id: 'ruim', nome: 'ruim', projeto: 'P', remoteUrl: 'https://usuario:segredo@evil.example/x', branchPadrao: 'main' },
      { id: 'vazio', nome: 'vazio', projeto: 'P', remoteUrl: '', branchPadrao: 'main' },
      { id: 'secreto', nome: 'secreto', projeto: 'P', remoteUrl: comSenha, branchPadrao: 'main' },
      { id: 'user', nome: 'user', projeto: 'P', remoteUrl: 'https://fintech@dev.azure.com/fintech/P/_git/user', branchPadrao: 'main' },
      { id: 'ok', nome: 'ok', projeto: 'P', remoteUrl: 'https://dev.azure.com/fintech/P/_git/ok', branchPadrao: 'main' },
      { id: 'fora', nome: 'fora', projeto: 'P', remoteUrl: '', branchPadrao: 'main' },
    ]
    const clonados: string[] = []
    const { app, dataDir } = await appFalso(azureCom(repos), gitQueAnota(clonados))
    await app.conectar('https://dev.azure.com/fintech', 'pat-de-teste')
    const salvos = await app.salvarSelecao(['ruim', 'vazio', 'secreto', 'user', 'ok'])
    expect(salvos).toHaveLength(6)
    expect(salvos.find((repo) => repo.id === 'ruim')).toMatchObject({ estado: 'erro', remoteUrl: 'https://evil.example/x' })
    expect(salvos.find((repo) => repo.id === 'vazio')?.estado).toBe('erro')
    expect(salvos.find((repo) => repo.id === 'fora')).toMatchObject({ estado: 'nao-clonado', selecionado: false })
    expect(salvos.find((repo) => repo.id === 'fora')?.erro).toBeUndefined()
    expect(salvos.find((repo) => repo.id === 'user')?.remoteUrl).toBe('https://dev.azure.com/fintech/P/_git/user')
    expect(salvos.find((repo) => repo.id === 'secreto')?.remoteUrl).toBe('https://dev.azure.com/fintech/P/_git/secreto')
    expect(salvos.find((repo) => repo.id === 'ok')?.estado).toBe('pronto')
    expect(clonados).toEqual([
      'https://dev.azure.com/fintech/P/_git/secreto',
      'https://dev.azure.com/fintech/P/_git/user',
      'https://dev.azure.com/fintech/P/_git/ok',
    ])
    const disco = await fs.readFile(path.join(dataDir, 'repositorios.json'), 'utf8')
    expect(disco).not.toContain('segredo')
    expect(disco).not.toContain('fintech@')
  })
})
