# Modelo de ameaças — Esteira v1

Data: 24/10/2026. Autor: Segurança. Feito antes do código. A revisão da implementação está em `revisao-v1.md` (escrita depois).

O app roda na máquina do fundador, com o PAT dele e o código da empresa dele. Não há servidor nosso. O atacante que importa é: um repositório ou um card malicioso, um site aberto pela janela, uma dependência, ou o próprio app vazando dado sem querer.

## Ativos

- PAT do Azure DevOps (Code Read, Work Items Read & Write).
- Tokens de leitura do Teams (Microsoft Graph) e do Slack, se o PM colar.
- Código clonado e a wiki gerada dele.
- Texto das stories e o texto cru de chat, reunião e nota de voz que o Radar lê.
- Login da assinatura do Claude (não é nosso; não podemos lê-lo nem copiá-lo).

## O que não pode acontecer

- Código ou PAT saindo para um servidor nosso, para telemetria ou para um log.
- Escrita no board sem clique, ou comentário que substitua a descrição.
- Achado sem prova apresentado como fato.
- Comando de shell montado com texto do PM, do card ou do repositório.

## Ameaças e o que o código tem de fazer

### 1. PAT

- Guardar só no cofre do Windows (ADR 0002). Proibido em `config.json`, story, log, argumento de processo e resposta de IPC.
- A janela envia o PAT uma vez, no canal `conectar`. A resposta é "conectado" e a URL. O estado da tela não fica com o token.
- Clone e pull: PAT no header HTTP do processo filho, via ambiente, nunca na linha de comando. Ambiente não é logado.
- URL da organização e URL do remoto só em `https` e só em `dev.azure.com` ou `*.visualstudio.com`. Qualquer outro host é recusado, para o PAT não ir junto.

### 2. Injeção de prompt (código, card, wiki, skill de repositório)

- O diretório de trabalho do `claude` é uma pasta nossa, não a raiz do clone (ADR 0004).
- Código e card entram como dado, entre marcadores, com uma instrução fixa nossa para ignorar ordens dentro deles.
- `--bare` foi rejeitado: ele não usa a assinatura. No lugar: `dontAsk`, prompts desligados, allowlist `Read,Grep,Glob`, denylist de Bash, Edit, Write e rede.
- O processo filho não recebe `ANTHROPIC_API_KEY`.
- Skills de dentro do repositório clonado não viram bloco sozinhas.
- Controle de verdade, que não depende do modelo obedecer: o app confere o trecho no arquivo e o id do card na lista carregada. Sem isso, `sem prova`. Confronto não altera a story. Nada publica sozinho.

### 3. Injeção de comando (git e claude)

- `spawn` com lista de argumentos e `shell: false`.
- Branch só com letras, números, `.`, `_`, `/` e `-`.
- Nome de executável: `git` ou `claude` no PATH, ou caminho absoluto sem quebra de linha. Rejeitar se vier com argumento junto.
- Timeout e teto de saída.

### 4. Travessia de caminho

- Todo arquivo lido passa por junção segura: o caminho resolvido tem de continuar dentro do clone ou da pasta de dados.
- Nome de pasta do clone é saneado. `..` não entra.

### 5. Janela (Electron)

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, `webSecurity: true`.
- Sem módulo `remote`. Sem `crashReporter`.
- `will-navigate` só permite `file:` e, em desenvolvimento, o Vite local. `setWindowOpenHandler` nega janela nova.
- CSP de produção: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`.
- IPC: mapa fechado de canais. Payload validado. Canal desconhecido falha.
- O preload não entrega `ipcRenderer` cru.

### 6. Cadeia de dependências

- Travar versões com `package-lock.json`.
- `npm audit` no CI. Sem pacote de telemetria, crash report ou analytics.
- Fontes embutidas, sem CDN.

### 7. Escrita no board

- Um método, chamado por um canal IPC, chamado por um botão.
- O ramo "comentar" não tem campo de descrição e não chama atualização de work item.
- Aceitar achado e aprovar diff são locais.

### 8. Radar (Teams, Slack, WhatsApp, Granola, Plaud)

Atualizado em 24/10/2026, com o ADR 0006.

- Token de leitura só no cofre, contas `radar:teams`, `radar:slack` e `radar:whatsapp`. Não entra em `fontes-radar.json`, `radar-sugestoes.json`, `config.json`, story, log ou resposta de IPC. `conectarRadar` devolve `{ conectado: true }`. WhatsApp não tem host aprovado: o token não é enviado; a leitura é a pasta.
- WhatsApp, Granola e Plaud não têm token de envio. A leitura real é arquivo dentro de `radar-import/<provedor>`, com o mesmo `caminhoSeguro` do clone. `..` não sai da pasta.
- Teams e Slack, quando há token, fazem um GET. Hosts fechados: `graph.microsoft.com` e `slack.com`. Referência que não casa com o formato do canal não vira URL. Não há POST, resposta em thread nem envio em nome do PM.
- Texto de chat e transcrição é dado hostil. `sanitizarTextoExterno` tira caractere de controle, quebra de delimitador `<<<` `>>>` e linha que tenta dar ordem (`ignore as instruções`, `publique no board`, `PAT=`). O que sobra vai ao `claude -p` dentro de `<<<SINAL>>>`, com a frase fixa de que aquilo não é ordem e de que nada é enviado ao canal.
- A prova não depende do modelo obedecer: a citação tem de ser substring do texto já sanitizado. Senão a sugestão não entra na fila. O resumo que traz ordem ou segredo que não está na fonte é descartado.
- Mandar para a Esteira copia a prova para a story local e roda os blocos. Não publica no Azure e não escreve no canal.

### 9. Tela de Conexões

Atualizado em 25/10/2026, com o ADR 0007.

- `salvarPastaRadar` só aceita caminho relativo a `radar-import/<provedor>`. `..` e caminho absoluto fora dessa pasta são recusados. O valor vai para `config.json` porque não é segredo.
- `testarRadar` no modo real, para Teams e Slack, faz GET no host já fechado. O detalhe que volta para a tela não inclui o token nem o corpo. WhatsApp, Granola e Plaud não disparam rede nesse teste.
- `testarClaude` pode executar o binário configurado (`--version` e `claude -p`). O stdout não volta para a tela. Não há chave de API no argumento.
- `testarAzure` usa o PAT que já está no cofre e devolve só a contagem de repositórios. Erro passa por `redigirSegredo`.

## 10. O que aceitamos de risco na v1

- O CLI do Claude, fora do `--bare`, pode ler a configuração global do usuário. É a máquina dele.
- Não há assinatura de código no instalador (o spec manda assim). O fundador precisa saber de onde veio o instalador.
- O pré-filtro não é um controle de segurança. Um card hostil ainda pode chegar ao modelo, dentro dos 12 candidatos. A publicação continua manual e a prova continua local.
