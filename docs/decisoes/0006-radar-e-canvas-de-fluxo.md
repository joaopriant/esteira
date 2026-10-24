# ADR 0006 — Radar de demandas e canvas linear de fluxo

Data: 24/10/2026. Status: aceita. Autor: CTO.

## Contexto

A demanda do PM não nasce no formulário da Esteira. Chega em canal de Teams com cliente interno, em Slack, em grupo de WhatsApp, em nota do Granola e em transcrição do Plaud. A tela de Fluxo da v1 era uma lista com o formulário do bloco embaixo. O fundador não usou.

O app continua sem servidor nosso. Quem lê é a máquina do PM. Quem tria é o `claude -p` da assinatura dele.

## Opções

1. **Conector que posta de volta no canal e um canvas com ramo e condição.** Entrega um produto de mensageria e um orquestrador. Foge do que a Esteira é e aumenta a superfície de escrita.
2. **Leitura local ou API somente leitura, sugestão com citação literal, e um canvas linear das estações que já existem.** O PM aprova com um clique e a esteira que já está pronta escreve e confronta.

## Decisão

Opção 2.

- Cinco leitores, um por provedor: Teams, Slack, WhatsApp, Granola, Plaud. O modo falso devolve conversas de PIX. O modo real lê pasta de exportação (`radar-import/<provedor>`). Teams e Slack, se houver token no cofre, fazem um GET no host fechado (`graph.microsoft.com`, `slack.com`). Não existe método de enviar mensagem.
- A fonte monitorada aponta para um produto. Sincronizar e importar transcrição passam pelo mesmo núcleo: sanitizar, tirar ruído e ordem embutida, agrupar pelo fio, pedir triagem ao Claude com o texto marcado como dado.
- A sugestão só entra na fila se a citação for um trecho literal do texto sanitizado. Tipos: nova user story, melhoria, bug/ajuste. Descartar é local. "Mandar para a Esteira" preenche a ideia, o produto e a prova e roda os blocos. Não publica.
- Dados em `%APPDATA%\Esteira` (ou `$XDG_DATA_HOME/esteira`): `fontes-radar.json` e `radar-sugestoes.json`. Token não vai nesses arquivos.
- O canvas mostra três zonas ligadas por curva: fontes ativas mais a entrada manual, os blocos na ordem salva, a saída (story, achados, publicação por clique, medição). O modo automático ou por clique é o modo que o bloco já tinha. Inserir, duplicar e reordenar editam a lista e só valem depois de salvar. Não há ramo.

## Consequências

- Um teste cobre as cinco fontes, a citação, o envio para a story, a ausência do token no disco, a injeção que não vira sugestão e o GET sem escrita.
- A story que já estava aberta não muda de fluxo no meio. O fluxo salvo vale para a próxima.
- WhatsApp, Granola e Plaud dependem de exportação ou de colar o texto. Não há API de envio e não vamos inventar uma.
