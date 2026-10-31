import { EventEmitter } from 'node:events'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { spawn as TipoSpawn } from 'node:child_process'
import { Executavel, type BuscaNoDisco } from '../src/adapters/executavel'
import { criarProcesso, GRACA_MS, matarArvore } from '../src/adapters/processo'

const spawnMock = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', async () => {
  const real = await vi.importActual<typeof import('node:child_process')>('node:child_process')
  spawnMock.mockImplementation(real.spawn)
  return { ...real, spawn: spawnMock }
})

let spawnReal: typeof TipoSpawn

beforeEach(async () => {
  const real = await vi.importActual<typeof import('node:child_process')>('node:child_process')
  spawnReal = real.spawn
  spawnMock.mockReset()
  spawnMock.mockImplementation(spawnReal)
})

afterEach(() => {
  spawnMock.mockImplementation(spawnReal)
})

function disco(arquivos: Record<string, string>, pathEnv = '', plataforma: NodeJS.Platform = 'win32'): BuscaNoDisco {
  const mapa = new Map(Object.entries(arquivos).map(([chave, valor]) => [path.win32.normalize(chave), valor]))
  return {
    plataforma,
    pathEnv,
    existe: (caminho) => mapa.has(path.win32.normalize(caminho)),
    ler: (caminho) => mapa.get(path.win32.normalize(caminho)) ?? null,
  }
}

function shimNode(): string {
  return [
    '@ECHO off',
    'GOTO start',
    ':find_dp0',
    'SET dp0=%~dp0',
    'EXIT /b',
    ':start',
    'SETLOCAL',
    'CALL :find_dp0',
    'IF EXIST "%dp0%\\node.exe" (',
    '  SET "_prog=%dp0%\\node.exe"',
    ') ELSE (',
    '  SET "_prog=node"',
    ')',
    'endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & set PATHEXT=%PATHEXT:;.JS;=;% & "%_prog%"  "%dp0%\\node_modules\\@anthropic-ai\\claude-code\\cli.js" %*',
  ].join('\r\n')
}

function filhoFalso() {
  const stdout = new EventEmitter()
  const stderr = new EventEmitter()
  const filho = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter & { setEncoding: () => void }
    stderr: EventEmitter & { setEncoding: () => void }
    stdin: { end: () => void }
    kill: () => void
    pid: number
  }
  filho.stdout = Object.assign(stdout, { setEncoding() {} })
  filho.stderr = Object.assign(stderr, { setEncoding() {} })
  filho.stdin = { end() {} }
  filho.kill = () => {}
  filho.pid = 4242
  queueMicrotask(() => {
    stdout.emit('data', 'ok')
    filho.emit('close', 0)
  })
  return filho
}

describe('executável do Claude no Windows', () => {
  const script = path.win32.normalize('C:\\Program Files\\npm\\node_modules\\@anthropic-ai\\claude-code\\cli.js')
  const atalho = path.win32.normalize('C:\\Program Files\\npm\\claude.cmd')

  it('prefere claude.exe e aceita caminho com espaço', () => {
    const busca = disco(
      {
        [atalho]: shimNode(),
        'C:\\Claude\\claude.exe': '',
        [script]: '',
      },
      'C:\\Program Files\\npm;C:\\Claude',
    )
    expect(Executavel.preparar('claude', ['--version'], busca).comando).toBe(path.win32.normalize('C:\\Claude\\claude.exe'))

    const direto = path.win32.normalize('C:\\Program Files\\Claude Code\\claude.exe')
    const comEspaco = disco({ [direto]: '' })
    expect(Executavel.preparar(direto, ['--version'], comEspaco)).toEqual({ comando: direto, args: ['--version'] })
  })

  it('prefere o node.exe ao lado do atalho, como o IF EXIST do npm', () => {
    const nodeExe = path.win32.normalize('C:\\Program Files\\npm\\node.exe')
    const busca = disco({ [atalho]: shimNode(), [script]: '', [nodeExe]: '' }, 'C:\\Program Files\\npm')
    const alvo = Executavel.preparar('claude', ['--version'], busca)
    expect(alvo.comando).toBe(nodeExe)
    expect(alvo.args).toEqual([script, '--version'])
  })

  it('abre o .cmd do npm pelo node.exe do PATH, sem cmd.exe e sem partir o argumento', () => {
    const nodeExe = path.win32.normalize('C:\\Program Files\\nodejs\\node.exe')
    const busca = disco(
      { [atalho]: shimNode(), [script]: '', [nodeExe]: '' },
      'C:\\Program Files\\npm;C:\\Program Files\\nodejs',
    )
    const alvo = Executavel.preparar('claude', ['-p', 'linha\n& whoami'], busca)
    expect(alvo.comando).toBe(nodeExe)
    expect(alvo.args).toEqual([script, '-p', 'linha\n& whoami'])
    expect(alvo.args).not.toContain('/c')
  })

  it('não lança o nome nu quando o executável não está no PATH', () => {
    expect(() => Executavel.preparar('claude', ['--version'], disco({}))).toThrow(/PATH/)
    expect(() =>
      Executavel.preparar('claude', ['-p', 'oi'], disco({ [atalho]: shimNode(), [script]: '' }, 'C:\\Program Files\\npm')),
    ).toThrow(/node\.exe/)
  })

  it('usa o claude.exe citado pelo atalho e ignora comando fora das aspas', () => {
    const exe = path.win32.normalize('C:\\npm\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe')
    const cmd = path.win32.normalize('C:\\npm\\claude.cmd')
    const texto = ['@ECHO off', 'SET dp0=%~dp0', '"%dp0%\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe" %* & calc.exe'].join('\r\n')
    const alvo = Executavel.preparar('claude.cmd', ['--version'], disco({ [cmd]: texto, [exe]: '' }, 'C:\\npm'))
    expect(alvo).toEqual({ comando: exe, args: ['--version'] })
  })

  it('recusa atalho que esconde comando dentro das aspas', () => {
    const cmd = path.win32.normalize('C:\\npm\\claude.cmd')
    const texto = '"%dp0%\\claude.exe & calc.exe" %*'
    expect(() => Executavel.preparar(cmd, [], disco({ [cmd]: texto }))).toThrow(/claude\.exe/)
  })

  it('não mexe no git nem no Claude fora do Windows', () => {
    const cmd = path.win32.normalize('C:\\npm\\claude.cmd')
    const busca = disco({ [cmd]: shimNode(), 'C:\\npm\\git.cmd': shimNode() }, 'C:\\npm')
    expect(Executavel.preparar('git', ['status'], busca)).toEqual({ comando: 'git', args: ['status'] })
    expect(Executavel.preparar('claude', ['--version'], disco({ [cmd]: shimNode() }, 'C:\\npm', 'linux'))).toEqual({
      comando: 'claude',
      args: ['--version'],
    })
  })

  it('entrega o .exe com espaço ao spawn sem shell', async () => {
    const direto = path.win32.normalize('C:\\Program Files\\Claude Code\\claude.exe')
    spawnMock.mockImplementation(() => filhoFalso())
    const resultado = await criarProcesso(disco({ [direto]: '' })).executar({
      comando: direto,
      args: ['--version', 'x & calc'],
      timeoutMs: 1_000,
    })
    expect(resultado.stdout).toBe('ok')
    expect(spawnMock).toHaveBeenCalledWith(
      direto,
      ['--version', 'x & calc'],
      expect.objectContaining({ shell: false, windowsHide: true }),
    )
  })

  it('não chama o spawn quando o claude não está no PATH', async () => {
    spawnMock.mockImplementation(() => {
      throw new Error('não devia spawnar')
    })
    await expect(
      criarProcesso(disco({})).executar({ comando: 'claude', args: ['--version'], timeoutMs: 1_000 }),
    ).rejects.toThrow(/PATH/)
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('não chama o spawn quando o caminho absoluto não existe', async () => {
    spawnMock.mockImplementation(() => {
      throw new Error('não devia spawnar')
    })
    await expect(
      criarProcesso(disco({})).executar({
        comando: 'C:\\Program Files\\Claude\\claude.exe',
        args: [],
        timeoutMs: 1_000,
      }),
    ).rejects.toThrow(/Não encontrei/)
    expect(spawnMock).not.toHaveBeenCalled()
  })
})

describe('criarProcesso', () => {
  it('no Windows mata a árvore com taskkill, sem shell', () => {
    spawnMock.mockImplementation(() => filhoFalso())
    const kill = vi.fn(() => true)
    matarArvore({ pid: 99, kill }, 'win32')
    expect(kill).not.toHaveBeenCalled()
    expect(spawnMock).toHaveBeenCalledWith(
      'taskkill',
      ['/pid', '99', '/t', '/f'],
      expect.objectContaining({ shell: false, windowsHide: true, stdio: 'ignore' }),
    )
  })

  it('se o taskkill não abre, cai no kill do filho', () => {
    const taskkill = new EventEmitter()
    spawnMock.mockImplementation(() => taskkill)
    const kill = vi.fn(() => true)
    matarArvore({ pid: 99, kill }, 'win32')
    expect(() => taskkill.emit('error', Object.assign(new Error('spawn taskkill ENOENT'), { code: 'ENOENT' }))).not.toThrow()
    expect(kill).toHaveBeenCalledWith('SIGKILL')
  })

  it.each(['linux', 'win32'] as const)('rejeita o estouro mesmo sem o close (%s)', async (plataforma) => {
    vi.useFakeTimers()
    try {
      const stdout = new EventEmitter()
      const stderr = new EventEmitter()
      const preso = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter & { setEncoding: () => void; destroy: () => void }
        stderr: EventEmitter & { setEncoding: () => void; destroy: () => void }
        stdin: { end: () => void; destroy: () => void }
        kill: ReturnType<typeof vi.fn>
        pid: number
        unref: () => void
      }
      preso.stdout = Object.assign(stdout, { setEncoding() {}, destroy() {} })
      preso.stderr = Object.assign(stderr, { setEncoding() {}, destroy() {} })
      preso.stdin = { end() {}, destroy() {} }
      preso.kill = vi.fn(() => true)
      preso.pid = 4242
      preso.unref = () => {}
      const taskkill = new EventEmitter()
      spawnMock.mockImplementation((comando: string) => (comando === 'taskkill' ? taskkill : preso))
      // Fora do Windows o kill vai para o grupo (-pid). O dublê recusa, como faria com um pid que não existe.
      const grupo = vi.spyOn(process, 'kill').mockImplementation(() => {
        throw Object.assign(new Error('kill ESRCH'), { code: 'ESRCH' })
      })
      const promessa = criarProcesso(disco({}, '', plataforma), plataforma).executar({
        comando: process.execPath,
        args: ['-e', '0'],
        timeoutMs: 400,
      })
      const assertiva = expect(promessa).rejects.toThrow(/passou de 400 ms/)
      await vi.advanceTimersByTimeAsync(400)
      if (plataforma === 'win32') {
        expect(preso.kill).not.toHaveBeenCalled()
        expect(spawnMock).toHaveBeenCalledWith(
          'taskkill',
          ['/pid', '4242', '/t', '/f'],
          expect.objectContaining({ shell: false, windowsHide: true, stdio: 'ignore' }),
        )
      } else {
        expect(grupo).toHaveBeenCalledWith(-4242, 'SIGKILL')
        expect(preso.kill).toHaveBeenCalledWith('SIGKILL')
      }
      await vi.advanceTimersByTimeAsync(GRACA_MS)
      await assertiva
    } finally {
      vi.restoreAllMocks()
      vi.useRealTimers()
    }
  })

  it('devolve stdout, stderr e o código', async () => {
    const saida = await criarProcesso().executar({
      comando: process.execPath,
      args: ['-e', 'process.stdout.write("ok"); process.stderr.write("aviso"); process.exit(3)'],
      timeoutMs: 5_000,
    })
    expect(saida).toMatchObject({ codigo: 3, stdout: 'ok', stderr: 'aviso' })
  })

  it('estoura o tempo e mata o processo', async () => {
    await expect(
      criarProcesso().executar({
        comando: process.execPath,
        args: ['-e', 'setTimeout(() => {}, 30000)'],
        timeoutMs: 300,
      }),
    ).rejects.toThrow(/passou de 300 ms/)
  })
})
