import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BlurText } from '../src/renderer/components/react-bits/BlurText'
import { CountUp } from '../src/renderer/components/react-bits/CountUp'
import { SpotlightCard } from '../src/renderer/components/react-bits/SpotlightCard'
import { ConexoesView } from '../src/renderer/telas/Conexoes'
import { FalhaAoAbrir, FluxoView } from '../src/renderer/telas/Fluxo'
import type { EstadoApp } from '../src/shared/tipos'

describe('react bits', () => {
  it('entrega o texto final dentro do componente', () => {
    expect(renderToStaticMarkup(createElement(CountUp, { to: 12 }))).toContain('>12<')
    expect(renderToStaticMarkup(createElement(BlurText, { text: 'Fluxo' }))).toContain('Fluxo')
    expect(renderToStaticMarkup(createElement(SpotlightCard, null, 'confrontar-backlog · da Esteira'))).toContain('confrontar-backlog · da Esteira')
    expect(renderToStaticMarkup(createElement(FluxoView, {}))).toContain('Abrindo o fluxo.')
    const css = readFileSync(new URL('../src/renderer/estilos.css', import.meta.url), 'utf8')
    const auto = css.match(/\.fio-auto \{[^}]+\}/)?.[0] ?? ''
    const pausa = css.match(/\.fio-pausa \{[^}]+\}/)?.[0] ?? ''
    expect(auto).not.toMatch(/dash/)
    expect(pausa).toMatch(/dashed/)
    expect(css).not.toContain('stroke-dasharray')
    expect(renderToStaticMarkup(createElement(ConexoesView, { estado: { conexoesAtivas: 0, produtos: [] } as EstadoApp, recarregar: async () => {} }))).toContain('Abrindo as conexões.')
  })
})

describe('fluxo sem leitura', () => {
  it('mostra só o erro e tentar de novo, sem editor nem salvar', () => {
    const html = renderToStaticMarkup(createElement(FalhaAoAbrir, { texto: 'Não consegui ler o fluxo.', aoTentar: () => {} }))
    expect(html).toContain('Não consegui ler o fluxo.')
    expect(html).toContain('Tentar de novo')
    expect(html).not.toContain('Salvar fluxo')
    expect(html).not.toContain('fluxo-blocos')
  })
})
