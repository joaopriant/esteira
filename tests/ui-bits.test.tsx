import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BlurText } from '../src/renderer/components/react-bits/BlurText'
import { CountUp } from '../src/renderer/components/react-bits/CountUp'
import { SpotlightCard } from '../src/renderer/components/react-bits/SpotlightCard'
import { ConexoesView } from '../src/renderer/telas/Conexoes'
import { FluxoView } from '../src/renderer/telas/Fluxo'
import type { EstadoApp } from '../src/shared/tipos'

describe('react bits', () => {
  it('entrega o texto final dentro do componente', () => {
    expect(renderToStaticMarkup(createElement(CountUp, { to: 12 }))).toContain('>12<')
    expect(renderToStaticMarkup(createElement(BlurText, { text: 'Fluxo' }))).toContain('Fluxo')
    expect(renderToStaticMarkup(createElement(SpotlightCard, null, 'confrontar-backlog · da Esteira'))).toContain('confrontar-backlog · da Esteira')
    expect(renderToStaticMarkup(createElement(FluxoView, {}))).toContain('Abrindo o fluxo.')
    expect(renderToStaticMarkup(createElement(ConexoesView, { estado: { conexoesAtivas: 0, produtos: [] } as EstadoApp, recarregar: async () => {} }))).toContain('Abrindo as conexões.')
  })
})
