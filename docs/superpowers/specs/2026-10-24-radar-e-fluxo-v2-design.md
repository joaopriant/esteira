# Radar de demandas e Fluxo v2

Data: 24/10/2026. Status: aceita com o ADR 0006. Autor: o desenho saiu do uso do fundador como PM (Teams com cliente interno, WhatsApp em startup, Slack, notas do Granola e do Plaud).

A v1 continua valendo: `docs/superpowers/specs/2026-10-23-esteira-v1-design.md`. Este texto só acrescenta de onde a ideia chega e como o fluxo é editado.

## Por quê

A dor e o pedido nascem fora do formulário. O PM lê canal e reunião, separa ruído de oportunidade e só então abre a Esteira. A tela de Fluxo anterior (lista e formulário embaixo) não mostrava a esteira inteira e não serviu.

## Radar

O PM, por produto, liga o que quer ler:

- canal do Teams
- canal do Slack
- conversa ou grupo exportado do WhatsApp
- nota ou reunião do Granola
- transcrição ou nota de voz do Plaud

Pode colar uma transcrição do Granola ou do Plaud e pode pedir a leitura de uma fonte com um clique. Tudo é leitura. O token do Teams ou do Slack, quando existe, fica no cofre do Windows. Nada é respondido no canal.

Cada sugestão na fila tem:

- tipo: Nova User Story, Melhoria ou Bug/Ajuste
- título e resumo da ideia
- produto
- prova: fonte, canal ou nota, autor, horário e trecho literal

Sem trecho que exista na mensagem, a sugestão não aparece. Ruído curto (`ok`, `bom dia`) não aparece. Linha que tenta dar ordem ao modelo é cortada antes do Claude.

Na navegação, Radar mostra quantas sugestões estão novas. Dá para filtrar por fonte e por produto. Descartar tira da fila. **Mandar para a Esteira** abre a story com a ideia, o produto e a prova, e os blocos do fluxo salvo rodam.

No exemplo local (`ESTEIRA_FAKE=1`) o produto PIX já vem com as cinco fontes: limite noturno e estorno que passou do valor no Teams, melhoria de conciliação no Slack, estorno parcial no WhatsApp, reunião no Granola e nota de UX no Plaud.

## Fluxo

A tela é um canvas dentro da folha, não um formulário empilhado.

1. **Fontes.** Entrada manual e cada fonte ativa do Radar, com curva até a entrada.
2. **Esteira.** Um nó por bloco, com o número da estação, marca de escrever ou confrontar, o começo da skill ou da instrução, e o modo no próprio cartão. Arrastar ou a ordem dos presets reordena. O `+` na curva insere um bloco naquele ponto. Linha contínua anima quando o bloco segue sozinho. Linha tracejada, com o aviso "aguarda clique", quando o bloco espera.
3. **Saída.** Story, achados e a publicação, que continua sendo um clique no Azure Boards, mais a medição passou/voltou.

Presets no topo: Esteira completa (padrão), Só confrontos (story já escrita), Radar rápido (escrever + backlog).

Clicar no bloco abre o inspetor ao lado, dentro do quadro: nome, papel, modo, skill ou instrução com o texto do contrato, quantos achados aquele bloco já gerou nas stories desta máquina, duplicar e remover. Salvar grava a ordem. A story que já existe não troca de trilho no meio.

Não há ramificação nem condição. O zoom e o arrastar do fundo só servem para ver o caminho inteiro.

## O que não entra

Enviar mensagem. Escrever no board a partir do Radar. Canvas com ramo. Servidor nosso para receber webhook. Telemetria.
