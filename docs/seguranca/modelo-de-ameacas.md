# Modelo de ameaças — Esteira v1

Data: 24/10/2026. Autor: Segurança. Feito antes do código. A revisão da implementação está em `revisao-v1.md` (escrita depois).

O app roda na máquina do fundador, com o PAT dele e o código da empresa dele. Não há servidor nosso. O atacante que importa é: um repositório ou um card malicioso, um site aberto pela janela, uma dependência, ou o próprio app vazando dado sem querer.

## Ativos

- PAT do Azure DevOps (Code Read, Work Items Read & Write).
- Código clonado e a wiki gerada dele.
- Texto das stories.
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

### 8. O que aceitamos de risco na v1

- O CLI do Claude, fora do `--bare`, pode ler a configuração global do usuário. É a máquina dele.
- Não há assinatura de código no instalador (o spec manda assim). O fundador precisa saber de onde veio o instalador.
- O pré-filtro não é um controle de segurança. Um card hostil ainda pode chegar ao modelo, dentro dos 12 candidatos. A publicação continua manual e a prova continua local.
