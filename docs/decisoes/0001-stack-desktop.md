# ADR 0001 — Stack do desktop

Data: 24/10/2026. Status: aceita. Autor: CTO.

## Contexto

A v1 precisa ser um app de Windows, por usuário, sem administrador e sem assinatura digital do instalador. O código do cliente não pode passar por servidor nosso. A IA é o Claude Code CLI já logado na máquina (`claude -p`), não uma chave de API. O Azure DevOps entra com um PAT de escopo mínimo. O núcleo tem de ser testável nesta VM Linux, sem credencial real.

A seção 6 do spec deixa a stack em aberto (Tauri ou Electron, entre outras).

## Opções

1. **Tauri (Rust + WebView2).** Superfície menor no processo da janela. O cofre do Windows sai do crate `keyring`. O cliente oficial do Azure DevOps é o pacote Node `azure-devops-node-api`. Em Rust teríamos de escrever o cliente HTTP na mão, contra a regra de procurar o SDK oficial antes de inventar um. Dois runtimes (Rust e Node) se o Claude e o Azure ficassem num sidecar.
2. **Electron (Node + Chromium).** O processo principal fala com o SDK oficial, com o `git` e com o `claude` por `spawn` sem shell. O PAT fica no processo principal e no cofre (`@napi-rs/keyring`, que usa o Credential Manager no Windows). A janela não tem Node, se `contextIsolation`, `sandbox` e uma lista fechada de IPC estiverem ligados. O instalador NSIS do electron-builder instala por usuário (`perMachine: false`, `allowElevation: false`).
3. **Só um site local.** Não é o app de desktop que o spec escolheu, e um navegador solto guarda PAT pior.

## Visões

- **CTO:** a opção 2. Um processo Node segura o SDK oficial, o spawn e o cofre. A janela não recebe o PAT de volta e, no build de produção, não abre rede (CSP com `connect-src 'self'`). Isso protege o anti-objetivo "o código do cliente passar por servidor nosso" sem inventar um cliente HTTP.
- **Tech Lead:** concorda. Um só linguagem no núcleo deixa o fluxo padrão testável com falsos, sem compilar Rust nesta VM. A casca Electron não entra nos testes de domínio.
- **Segurança:** preferia Tauri pela superfície menor. Aceita Electron só com o endurecimento do [modelo de ameaças](../seguranca/modelo-de-ameacas.md): sem `nodeIntegration`, sandbox, IPC com lista fechada, navegação externa bloqueada, sem `crashReporter`, PAT fora do renderer.

O desacordo (Tauri contra Electron) foi resolvido pelo que melhor protege os anti-objetivos: não criar um canal nosso, não escrever no board sem clique, e não afirmar sem prova. Os dois stacks cumprem isso. Electron evita um cliente HTTP caseiro, que é onde um vazamento acidental de PAT ou de corpo de requisição costuma nascer. O endurecimento da janela fica como condição, não como enfeite.

## Decisão

Electron, React 18, TypeScript, Vite (electron-vite) e electron-builder (NSIS por usuário, sem assinatura de código na v1). A revisão de segurança subiu o Electron de 33 para 45 e o electron-builder para 26, para zerar advisory alta; a escolha continua Electron, não Tauri. O domínio fica em `src/core` e `src/app`, sem Electron. Azure DevOps, Claude CLI, git e cofre ficam atrás de portas, com implementação falsa para o teste de ponta a ponta.

## Consequências

- O build de Windows está no CI (`windows-latest`) e não foi executado nesta VM.
- A janela de desenvolvimento pode falar com o Vite local. O build de produção não inclui servidor HTTP.
- Há uma pré-visualização local (`npm run dev:ui`, só em 127.0.0.1) com dados falsos, para ver as telas sem o Azure. Ela não é o produto instalado.
