# Esteira

App de desktop para escrever uma user story e confrontá-la com o código, com a wiki desse código e com o backlog do Azure Boards. Roda na sua máquina. Não há servidor nosso e não há telemetria.

O código da empresa só sai da máquina quando você publica no seu Azure DevOps, ou quando o Claude Code que você já instalou lê o recorte para responder. O PAT fica no cofre de credenciais do Windows.

## O que precisa estar no notebook

- Windows 10 ou 11, na sua conta, sem administrador.
- [Git](https://git-scm.com/download/win) no PATH.
- [Claude Code](https://code.claude.com/docs/en/overview) instalado e já logado na sua assinatura (`claude` abre e você está autenticado). A Esteira não pede chave de API.
- Node.js 22, só se for rodar a partir do código ou gerar o instalador.
- Um PAT do Azure DevOps com dois escopos: **Code (Read)** e **Work Items (Read & Write)**. Crie em `https://dev.azure.com/{sua-org}/_usersSettings/tokens`. Não marque mais nada.

## Gerar o instalador

No PowerShell, na pasta do repositório:

```powershell
npm ci
npm run dist:win
```

O instalador sai em `release/`. Ele instala para o seu usuário, sem pedir elevação. O atalho se chama Esteira.

O mesmo comando roda no GitHub Actions, no job `instalador-windows`. O repositório é privado. Não publique o `.exe` fora da empresa: ele não é assinado.

## Rodar sem instalar

```powershell
npm ci
npm run dev
```

Isso abre a janela Electron e fala com o Azure e com o `claude` de verdade.

Para ver as telas com dados de exemplo, sem PAT e sem Claude:

```powershell
$env:ESTEIRA_FAKE = "1"
npm run dev
```

No Linux ou no Mac a mesma variável vale. `npm run dev:ui` sobe só as telas no navegador, em `http://127.0.0.1:43123`, também com o exemplo.

## Primeiro uso

1. Abra **Ajustes**. Cole a URL `https://dev.azure.com/sua-org` e o PAT. Conectar. O campo do PAT esvazia: o token não volta para a tela.
2. Abra **Produtos**. Marque os repositórios, confira a branch e clique em **Trazer os escolhidos**. O app clona para `%APPDATA%\Esteira\repos`.
3. Dê um nome ao produto, marque os repositórios clonados e, se fizer sentido, ligue a outro produto. Salvar dispara a wiki, módulo por módulo.
4. Em **Ajustes**, troque o modelo da story pelo modelo da empresa. O texto que vem de fábrica é só para a primeira vez.
5. Em **Esteira**, escreva a ideia central. `@nome-do-repo` ou `@Nome do produto` estreita o que entra. Sem `@`, entra o produto e o que ele declara depender.
6. **Rodar a esteira.** O trilho mostra cada bloco: escrever a story, confrontar com a wiki, com o código e com o backlog. Bloco automático segue. Bloco por clique espera **Continuar**.
7. Cada achado traz arquivo e trecho, número de card, **não encontrei** ou **sem prova**. Aceitar mostra o diff. A story só muda em **Aplicar ajuste**. Descartar tira o achado da fila.
8. **Publicar no board** cria um card novo ou comenta num card existente. O comentário menciona o responsável e não altera a descrição. Nada disso acontece sem esse clique.
9. Quando o card voltar do time, **Medição** (ou a própria story) tem **Passou** e **Voltou**. É uma conta local, sem rede.

**Fluxo** reordena, tira ou acrescenta blocos. Um bloco pode ser uma skill da Esteira, uma skill em `%USERPROFILE%\.claude\skills`, ou uma instrução que você escreveu. Skill achada dentro de repositório clonado não entra sozinha.

## Onde ficam os dados

`%APPDATA%\Esteira`: configuração, produtos, stories e clones. O PAT não está nessa pasta. No Linux, o equivalente é `$XDG_DATA_HOME/esteira` ou `~/.local/share/esteira`.

Apagar essa pasta zera a Esteira. Não apaga nada no Azure.

## O que a v1 não faz

Não abre Jira, o fluxo é um canvas linear (sem ramificação) e não atende outro PM na mesma instalação. Não atualiza sozinha. Fechar o app no meio de um bloco deixa a story no último passo gravado. O Radar lê Teams, Slack, WhatsApp, Granola e Plaud; não envia mensagem em nome de ninguém.

## Testes

```powershell
npm test
npm run typecheck
npm run scan-secrets
```
