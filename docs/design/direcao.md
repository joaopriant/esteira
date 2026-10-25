# Direção das telas

Data: 24/10/2026.

Sorteio do modo de app (`design-taste-frontend`, kind `builder`): estilo **framed sheet**, semente **1617297726**. Tema claro. O PM usa a tela por horas, de dia, no notebook. O objeto da tela é a story, não um gráfico.

**Face escolhida:** o quadro (sidebar e barra) num azul-acinzentado baixo, um passo da cor do produto `#1b6c80`, no lugar do cinza genérico `#f9fbfc`. A folha continua branca. A cor entra no trilho (estação atual) e no trecho citado, não nos botões. O botão principal é quase preto.

**Tipo:** IBM Plex Sans, como a folha sorteou. IBM Plex Mono só em id de card e caminho de arquivo. Os arquivos da fonte vêm no pacote (`@fontsource`), sem pedido ao Google em runtime. Motivo do desvio: a folha pedia o CSS do Google Fonts, e o produto não abre rede fora do Azure DevOps e do Claude do usuário.

**Elemento próprio:** o trilho. Estações em sequência, com o nome do bloco, o modo (automático ou por clique) e o estado. Não é uma fileira de cartões com ícone.

**Pergunta de cada tela:**

- Esteira: o que esta story ainda precisa mudar antes do board? O maior bloco é a story e, ao lado, os achados com prova. A ação mais comum é rodar a esteira; quando ela termina, a ação principal passa a ser publicar.
- Wiki: como isto funciona hoje, e onde está a prova?
- Produtos: quais repositórios entram juntos, e a wiki já pode ser lida?
- Fluxo: em que ordem os blocos rodam, e quais esperam um clique?
- Medição: o que foi aceito, o que foi descartado, e quantas vezes o card voltou?
- Ajustes: a organização está conectada, qual é o modelo da story e para onde o card vai?

Nada de painel de KPI ou ícone em quadrado colorido. Contagem de achados fica na lista, em número tabular. A Medição continua tabela: o número anima (`CountUp`) e um único cartão repete a frase de totais, sem virar fileira de indicador.

**React Bits, 25/10/2026.** Os efeitos (brilho no status, revelação do título, borda no botão principal, spotlight no card, grade de pontos no canvas) estão em CSS próprio, sem dependência nova. A cor do gradiente é a tinta do produto, não um arco-íris. `prefers-reduced-motion` desliga a animação e deixa o texto final. O canvas não usa texto em SVG: o card cresce com o conteúdo e a curva é medida depois. Detalhe no ADR 0007.

**Conexões.** A pergunta da tela é: o que esta máquina já consegue ler, e o que ainda falta ligar? Token e PAT ficam no cofre. Ajustes guarda só o modelo da story e o mapa de campos do card.
