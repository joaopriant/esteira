# Revisão de segurança — Esteira v1

Data: 24/10/2026. Autor: Segurança. Conferido contra `docs/seguranca/modelo-de-ameacas.md`.

Método: leitura do código que toca PAT, processo, caminho, IPC e board; testes que já cobrem prova, comentário e ausência do PAT no disco; `npm audit --audit-level=high`; `node scripts/scan-secrets.mjs`.

## O que está no lugar

| Ameaça | Onde | Estado |
|---|---|---|
| PAT fora de arquivo | `src/adapters/segredos.ts` grava no cofre (`Esteira` / conta da URL) no modo real. `config.json` guarda a URL e `conectado`, não o token. O teste de ponta a ponta varre o JSON e não acha o PAT de exemplo. | ok no código |
| PAT na resposta da tela | `estado` não tem campo de token. `despachar` passa toda mensagem de erro por `redigirSegredo` (Basic, Bearer, userinfo na URL). | corrigido nesta revisão |
| PAT na URL | `validarOrgUrl` recusa userinfo e host que não seja Azure. | ok, com teste |
| PAT na linha do git | `GIT_CONFIG_VALUE_0=http.extraheader`, `shell: false`. O stderr que volta para a tela é redigido. | ok no código |
| Comentário não altera descrição | `comentar` chama só `addComment`. Não há `updateWorkItem` em `src/`. O falso conta alteração de campo. O teste publica e confere que a descrição não mudou. | ok |
| Escrita só no clique | O canal `publicar` é o único que cria ou comenta. A tela chama esse canal no botão Publicar. Aceitar achado e aprovar diff ficam no disco. | ok |
| Prova | Classificador exige trecho no arquivo ou id de card carregado. Sem isso, `sem prova`. `não encontrei` é ausência declarada, não fato. | ok, com teste |
| Comando | `spawn` com `shell: false`. Branch, binário e caminho têm validador. | ok |
| Janela | `contextIsolation`, `sandbox`, `nodeIntegration: false`, navegação e `window.open` bloqueados, preload só expõe `chamar`. CSP aplicada quando o app está empacotado. | ok no código |
| Telemetria | Nenhuma dependência de analytics, crash report ou update automático. Fontes vêm no pacote. | ok |
| Cadeia | `package-lock.json` travado. CI roda `npm audit --audit-level=high` e a varredura de segredo. | ok |

## Achados

1. **Erro de git ou do Azure podia ecoar o header Basic.** O stderr era cortado e mostrado na tela. Corrigido: `redigirSegredo` no git, no Claude e em todo erro que o IPC devolve. Teste em `tests/dominio.test.ts`.

2. **CSP só no app empacotado.** Em `electron-vite dev` o Vite precisa servir o renderer. O binário instalado liga a CSP. Aceito.

3. **O CLI do Claude, sem `--bare`, lê a configuração global do usuário.** Já está no ADR 0004. Bash, escrita e rede estão na denylist; o diretório de trabalho é uma pasta nossa; o código vai em `contexto.md`, não na linha de comando. A publicação continua manual. Aceito.

4. **A instrução curta do `-p` aparece na lista de processos da própria máquina.** O código e os cards não vão nesse argumento. Aceito: é a máquina de quem usa.

5. **Cofre e instalador não foram exercitados nesta VM Linux.** `@napi-rs/keyring` no Windows e o NSIS per-user (`perMachine: false`, `allowElevation: false`, sem assinatura, como o spec pede) estão configurados. O CI `instalador-windows` gera o `.exe`. Estado: não verificado aqui.

6. **`npm audit` e a varredura.** Na revisão o audit apontou Electron 33, o `tar` do empacotador, Zod 3 e o `diff`. Subimos para Electron 45, electron-builder 26, Zod 4, diff 9 e Vitest 5. `npm audit --audit-level=high` ficou limpo, e a varredura de segredo também. Se uma advisory nova quebrar o CI, a correção é atualizar o lock, não ignorar o job.

Nada em aberto que permita publicar sozinho, gravar o PAT em JSON ou marcar palpite como prova.

## Incremento — Radar e canvas

Data: 24/10/2026. Conferido contra a seção 8 de `modelo-de-ameacas.md` e o ADR 0006.

| Ameaça | Onde | Estado |
|---|---|---|
| Token do Radar em arquivo | `conectarRadar` grava só no cofre (`radar:teams`, `radar:slack`). O teste varre o diretório de dados e não acha o token de exemplo. `credenciaisRadar` devolve booleano. | ok, com teste |
| Envio em canal | `pedidoLeitura` só devolve GET para `graph.microsoft.com` ou `slack.com`, ou `null` para WhatsApp, Granola e Plaud. Não há método de postar mensagem. Sem token, o leitor real não chama a rede. | ok, com teste |
| Caminho da importação | `lerPasta` usa `caminhoSeguro`. `../` volta lista vazia e não lê o arquivo de fora. | ok, com teste |
| Prompt injection | Linha de ordem sai em `sanitizarTextoExterno` antes do Claude. Citação que não é substring não vira prova. O teste de importação mista não deixa o segredo na sugestão; texto só de injeção não gera sugestão. O contexto do `claude -p` marca o sinal como dado e diz para não enviar mensagem. | ok, com teste |
| Publicar a partir do Radar | `enviarParaEsteira` chama `iniciarEsteira`. O único caminho de escrita no board continua sendo `publicar`. | ok |

Aceito: o nome de quem fala no Slack real pode ser o id da conta, porque não fazemos uma segunda chamada para resolver o perfil. A transcrição colada continua podendo trazer dado pessoal; ela fica no JSON local da máquina do PM, como a story.
