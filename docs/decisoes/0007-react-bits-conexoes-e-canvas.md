# ADR 0007 — React Bits, canvas contido e tela de Conexões

Data: 25/10/2026. Status: aceita.

## Contexto

A interface pedia presença visual sem virar painel de KPI. Ao mesmo tempo, o canvas de fluxo desenhava cards com altura fixa e badge solto, e o texto saía da caixa. As credenciais do Azure, do Claude e do Radar estavam em Ajustes, misturadas com o modelo da story.

## Decisão

- Componentes em `src/renderer/components/react-bits/`, em TypeScript e CSS. Sem `framer-motion` e sem pacote novo. O brilho, a contagem e a borda usam CSS e `requestAnimationFrame`. Com `prefers-reduced-motion` ou sem `window` (teste), o texto e o número finais aparecem na hora.
- A cor do gradiente é a tinta do produto (`#142026` para `#1b6c80`). A medição continua numa tabela. O único cartão de resumo repete os totais que já estavam na frase, com `CountUp`.
- O canvas deixa de posicionar card com `height` em pixel. Fontes, estações e saída são HTML (`SpotlightCard`), com `height: auto`, `overflow-wrap: anywhere` e o badge dentro do card. O SVG só desenha a curva, medida no DOM. O `+` fica no vão entre colunas. Se não couber na largura, a área rola; o card não encolhe até cortar o texto.
- Conexões é a tela das integrações. Teams, Slack e WhatsApp: token só no cofre (`radar:teams`, `radar:slack`, `radar:whatsapp`). Granola, Plaud e a pasta do WhatsApp: caminho relativo a `radar-import/<provedor>`. `config.json` não recebe token. WhatsApp não tem host de envio; o token não sai da máquina e a leitura continua pela pasta. Testar Teams ou Slack, no modo real, é GET em `graph.microsoft.com` ou `slack.com`. Testar o Claude no modo real roda `claude -p` e não devolve o stdout para a tela.

## Consequências

- Ajustes fica com o modelo da story e o mapa de campos do work item. O atalho leva a Conexões.
- Radar e o canvas leem as mesmas fontes. O vínculo novo é feito em Conexões.
- CSP segue `style-src 'self' 'unsafe-inline'`. Nenhum domínio novo.
