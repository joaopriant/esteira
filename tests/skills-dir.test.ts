import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { criarAplicacao, pastaDeSkills } from '../src/app/criar'

const pastas: string[] = []

afterEach(async () => {
  await Promise.all(pastas.splice(0).map((pasta) => fs.rm(pasta, { recursive: true, force: true })))
})

describe('pasta de skills', () => {
  it('no desenvolvimento lê a pasta skills do repositório', () => {
    expect(pastaDeSkills({
      cwd: '/repo',
      resourcesPath: '/repo/node_modules/electron/dist/resources',
      empacotado: false,
    })).toBe(path.join('/repo', 'skills'))
  })

  it('fora do pacote lê a pasta do processo', () => {
    expect(pastaDeSkills({ cwd: '/repo', resourcesPath: '/opt/Esteira/resources' })).toBe(path.join('/repo', 'skills'))
  })

  it('empacotado lê resources/skills e ignora o diretório de trabalho', () => {
    expect(pastaDeSkills({
      cwd: '/tmp/outro',
      resourcesPath: path.join('/opt', 'Esteira', 'resources'),
      empacotado: true,
    })).toBe(path.join('/opt', 'Esteira', 'resources', 'skills'))
  })

  it('empacotado sem resources falha em vez de cair na pasta do processo', () => {
    expect(() => pastaDeSkills({ cwd: '/tmp/outro', empacotado: true })).toThrow(/resources/)
  })

  it('a aplicação criada daqui acha a skill embutida do repositório', async () => {
    const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esteira-skills-'))
    pastas.push(dataDir)
    const app = await criarAplicacao({ dataDir, modo: 'falso', semear: false })
    const skills = await app.listarSkills()
    expect(skills.some((skill) => skill.id === 'escrever-story' && skill.origem === 'embutida')).toBe(true)
  })
})
