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

O instalador sai em `release/`, com o nome `Esteira-Setup-<versão>.exe`. Ele instala para o seu usuário, sem pedir elevação. O atalho se chama Esteira.

O mesmo comando roda no GitHub Actions, no job `instalador-windows`, sem certificado. Esse job só gera o `.exe` de verificação do pull request.

A tag `v` mais a `version` do `package.json` (por exemplo `v0.1.0`), num commit que já está na `main`, dispara o workflow `release`. Ele assina o instalador e abre um **rascunho** da GitHub Release. O rascunho não fica público sozinho: alguém com permissão publica quando quiser. Sem certificado completo, ou com segredo pela metade, esse job falha e não publica.

Antes da primeira tag, crie o environment **`esteira-release`** em Settings → Environments, com pelo menos um revisor obrigatório, e grave os segredos de assinatura nesse environment. O workflow espera a aprovação e só então lê esses segredos. Se o environment ainda não existir, o GitHub cria um vazio, sem aprovação. Num repositório privado, revisor obrigatório pede GitHub Pro, Team ou Enterprise.

Antes da primeira tag, confira também:

- **Repositório privado.** Enquanto ele for público, nunca publique o rascunho: o instalador ficaria aberto para qualquer um.
- **Environment `esteira-release`** com revisor obrigatório e, em "Deployment branches and tags", só tags `v*`.
- **Ruleset de tags `v*`** em Settings → Rules, limitando quem cria a tag.
- **Reexecutar uma tag:** apague antes o rascunho da Release dessa tag.

## Atualização

Com um feed configurado, a Esteira procura versão nova ao abrir e pergunta antes de instalar. Sem o sim, nada é baixado e nada é instalado.

O feed é um diretório HTTPS com três arquivos da Release: `latest.yml`, o `.exe` e o `.exe.blockmap`. Na máquina, uma destas formas:

- variável de usuário `ESTEIRA_UPDATE_URL`
- arquivo `%APPDATA%\Esteira\atualizacao.json` com `{ "url": "https://servidor/esteira/" }`

A variável ganha do arquivo. A URL é `https`, sem usuário e senha. Um query string (por exemplo o SAS de leitura de um container) fica só nessa máquina.

O app instalado fala com esse diretório. Num repositório privado, a permissão do GitHub que lê o anexo de uma Release também lê o código (`contents: read`). O token que publica o rascunho fica no GitHub Actions e não entra no binário. O endereço `https://feed.esteira.invalid/updates/` dentro do instalador não resolve: ele só segura o lugar para o empacotador gerar o `latest.yml`. Quem serve o feed é o endereço configurado na máquina, um blob da empresa ou um HTTPS interno. Depois de cada Release, copie os três arquivos para esse diretório, por cima dos anteriores.

## Assinatura do instalador

Sem as variáveis de certificado, o `npm run dist:win` local e o job `instalador-windows` seguem sem assinatura. Nesse estado o SmartScreen mostra editor desconhecido e pode bloquear o arquivo. O AppLocker da empresa também pode barrar. A TI libera o `.exe`, ou o certificado entra no environment `esteira-release`.

O workflow `release` exige um dos conjuntos abaixo, completo. Falta ou metade faz o job falhar, com o nome do segredo que ficou de fora. O `app-update.yml` do build assinado leva `publisherName`; sem esse nome a atualização não confere o editor do instalador, e o job também falha. No PFX, o electron-builder grava o CN lido do certificado. No Azure, o nome é o `AZURE_TRUSTED_SIGNING_PUBLISHER`.

Certificado Authenticode em `.pfx` exportável. O token físico de um certificado EV não entra no GitHub Actions. Segredos:

- `WIN_CSC_LINK`: o `.pfx` em base64
- `WIN_CSC_KEY_PASSWORD`: a senha do arquivo

`CSC_LINK` e `CSC_KEY_PASSWORD` valem no lugar desse par.

Azure Trusted Signing assina na nuvem da Microsoft, sem `.pfx` no repositório. Na conta: um perfil de certificado e um app registration no Entra com o papel **Trusted Signing Certificate Profile Signer**. Segredos:

- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_TRUSTED_SIGNING_ENDPOINT` (o endpoint da região, como `https://eus.codesigning.azure.net`)
- `AZURE_TRUSTED_SIGNING_ACCOUNT` (o nome da conta Trusted Signing)
- `AZURE_TRUSTED_SIGNING_CERTIFICATE_PROFILE` (o nome do perfil)
- `AZURE_TRUSTED_SIGNING_PUBLISHER` (o CN do certificado, o mesmo texto que o Windows deve mostrar)

Com os dois conjuntos presentes, vale o Azure Trusted Signing.

Com assinatura, o Windows mostra o nome do editor. Esse build grava o nome no app, e a atualização seguinte recusa um instalador de outro editor. Enquanto o build sai sem assinatura, a confiança do download é o HTTPS do feed. O aviso do SmartScreen pode continuar nos primeiros downloads: a reputação se acumula com o uso, e um certificado novo não apaga o aviso no primeiro dia. Desde 2024 a Microsoft também não dá reputação imediata a um EV. A assinatura faz o aviso falar de um editor conhecido. Sem ela, cada `.exe` novo é um arquivo sem dono.

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

Não abre Jira, o fluxo é um canvas linear (sem ramificação) e não atende outro PM na mesma instalação. A atualização pede um feed HTTPS configurado na máquina e um sim antes de instalar. Fechar o app no meio de um bloco deixa a story no último passo gravado. O Radar lê Teams, Slack, WhatsApp, Granola e Plaud; não envia mensagem em nome de ninguém.

## Testes

```powershell
npm test
npm run typecheck
npm run scan-secrets
```
