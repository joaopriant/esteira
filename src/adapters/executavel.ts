import path from 'node:path'

export interface BuscaNoDisco {
  plataforma: NodeJS.Platform
  pathEnv: string
  existe(caminho: string): boolean
  ler(caminho: string): string | null
}

const EXTENSOES = ['.exe', '.cmd', '.bat']

// O Node recusa .cmd/.bat sem shell (CVE-2024-27980). Shell com argumento do usuário
// reabre a injeção. No Windows o nome `claude` vira o .exe do PATH ou, se só houver
// o atalho do npm, o node e o script que o .cmd citava — nunca cmd.exe.
export class Executavel {
  private constructor() {}

  static preparar(comando: string, args: string[], busca: BuscaNoDisco): { comando: string; args: string[] } {
    if (busca.plataforma !== 'win32' || !Executavel.ehClaude(comando)) return { comando, args }
    const achado = Executavel.achar(comando, busca)
    if (!achado || !Executavel.absoluto(achado)) {
      if (Executavel.absoluto(comando)) throw new Error(`Não encontrei o executável em ${comando}.`)
      throw new Error('Não encontrei o claude no PATH. Aponte o caminho do claude.exe.')
    }
    const ext = path.win32.extname(achado).toLowerCase()
    if (ext !== '.cmd' && ext !== '.bat') return { comando: achado, args }
    const texto = busca.ler(achado)
    if (texto == null) throw new Error(`Não consegui ler o atalho ${achado}.`)
    // shortcut: só o .cmd do npm (aspas e %dp0%). Outro formato pede o claude.exe. Revisar se o instalador mudar o atalho.
    const aberto = Executavel.abrirAtalho(texto, path.win32.dirname(achado), busca.existe)
    if (!aberto) {
      throw new Error(`O atalho ${achado} não abre sem o prompt de comando. Aponte o caminho do claude.exe.`)
    }
    const comandoAberto = Executavel.semNomeNu(aberto.comando, busca)
    if (!busca.existe(comandoAberto)) {
      throw new Error(`O atalho aponta para ${comandoAberto}, e esse arquivo não está lá.`)
    }
    for (const prefixo of aberto.prefixo) {
      if (prefixo.toLowerCase().endsWith('.js') && !busca.existe(prefixo)) {
        throw new Error(`O atalho aponta para ${prefixo}, e esse arquivo não está lá.`)
      }
    }
    return { comando: comandoAberto, args: [...aberto.prefixo, ...args] }
  }

  private static semNomeNu(comando: string, busca: BuscaNoDisco): string {
    if (comando !== 'node' && comando.toLowerCase() !== 'node.exe') return comando
    const achado = Executavel.achar('node', busca)
    if (!achado || !Executavel.absoluto(achado)) {
      throw new Error('Não encontrei o node.exe no PATH. Aponte o caminho do claude.exe.')
    }
    return achado
  }

  static ehClaude(comando: string): boolean {
    const base = path.win32.basename(comando).toLowerCase()
    return base === 'claude' || base === 'claude.exe' || base === 'claude.cmd' || base === 'claude.bat'
  }

  static achar(comando: string, busca: BuscaNoDisco): string | null {
    if (Executavel.absoluto(comando)) {
      if (busca.existe(comando)) return comando
      if (!path.win32.extname(comando)) {
        for (const ext of EXTENSOES) {
          if (busca.existe(comando + ext)) return comando + ext
        }
      }
      return null
    }
    const dirs = busca.pathEnv.split(';').map((parte) => parte.trim()).filter(Boolean)
    const exts = path.win32.extname(comando) ? [''] : EXTENSOES
    for (const ext of exts) {
      for (const dir of dirs) {
        const candidato = path.win32.join(dir, comando + ext)
        if (busca.existe(candidato)) return candidato
      }
    }
    return null
  }

  static abrirAtalho(
    conteudo: string,
    diretorio: string,
    existe: (caminho: string) => boolean,
  ): { comando: string; prefixo: string[] } | null {
    const limpo = conteudo.replace(/^\uFEFF/, '')
    const linha = limpo.split(/\r?\n/).find((item) => item.includes('%*'))
    if (!linha) return null
    const dir = diretorio.replace(/[\\/]+$/, '')
    const comBarra = `${dir}\\`
    const expandido = linha.replace(/%~dp0/gi, comBarra).replace(/%dp0%/gi, comBarra)
    const aspas = [...expandido.matchAll(/"([^"\r\n]*)"/g)]
      .map((item) => item[1])
      .filter((item) => item.toLowerCase() !== '%_prog%')
    if (aspas.some((item) => !Executavel.tokenSeguro(item) || !path.win32.isAbsolute(item))) return null
    if (expandido.toLowerCase().includes('%_prog%')) {
      const prog = Executavel.prog(limpo, dir, existe)
      if (!prog || aspas.length === 0) return null
      return { comando: prog, prefixo: aspas.map((item) => path.win32.normalize(item)) }
    }
    const programa = aspas[0]
    if (!programa) return null
    const normalizado = path.win32.normalize(programa)
    const ext = path.win32.extname(normalizado).toLowerCase()
    if (ext !== '.exe' && ext !== '.com') return null
    return { comando: normalizado, prefixo: aspas.slice(1).map((item) => path.win32.normalize(item)) }
  }

  private static absoluto(texto: string): boolean {
    return path.win32.isAbsolute(texto) || path.posix.isAbsolute(texto)
  }

  private static prog(conteudo: string, dir: string, existe: (caminho: string) => boolean): string | null {
    const junto = path.win32.normalize(path.win32.join(dir, 'node.exe'))
    if (existe(junto) && /_prog=%dp0%\\node\.exe/i.test(conteudo)) return junto
    if (/SET\s+"_prog=node"/i.test(conteudo)) return 'node'
    return null
  }

  private static tokenSeguro(token: string): boolean {
    return Boolean(token) && !/[\0\r\n"'`&|;<>^%!$]/.test(token)
  }
}
