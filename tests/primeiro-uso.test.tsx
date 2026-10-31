import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { passosPrimeiroUso } from '../src/core/primeiro-uso'
import { PrimeiroUso } from '../src/renderer/PrimeiroUso'
import { AJUSTES_INICIAIS, type EstadoApp } from '../src/shared/tipos'

describe('trilho do primeiro uso', () => {
  it('desenha as cinco estações e marca a atual', () => {
    const estado = {
      ajustes: { ...AJUSTES_INICIAIS },
      produtos: [],
      repositorios: [],
      stories: [],
      filaWiki: { produtoId: '', pendentes: 0, gerando: false },
      radarPendentes: 0,
      conexoesAtivas: 0,
    } as EstadoApp
    const passos = passosPrimeiroUso(estado) ?? []
    const html = renderToStaticMarkup(createElement(PrimeiroUso, { passos, onIr: () => {}, onAdiar: () => {} }))
    expect(html).toContain('O que falta nesta máquina antes da primeira story?')
    expect(html).toContain('aria-current="step"')
    expect(html).toContain('>PAT<')
    expect(html).toContain('Claude')
    expect(html).toContain('Repositórios')
    expect(html).toContain('Produto')
    expect(html).toContain('Modelo')
    expect(html).toContain('Agora não')
  })
})
