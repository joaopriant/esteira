# Esteira v1: design

Data: 23/10/2026. Status: aguardando aprovação do fundador.
Substitui o produto descrito no founder pack v7 (agora em `founder/historico/v7-plataforma-pm-qa/`).

## 1. Intenção e o porquê

A Esteira é um app de desktop (Windows) que ajuda a pessoa de produto (PM, PO, analista de requisitos) a escrever user stories melhores em menos tempo, confrontando cada story com o código real, com uma wiki viva do sistema e com o backlog.

O porquê: os prazos de produto encurtaram porque a IA acelerou o desenvolvimento. Hoje o fundador (PM de uma fintech) já faz isso à mão no Claude: pede "escreva a story", espera, pede "confronte com o código", espera, pede "veja se já existe no board", espera. Os confrontos funcionam; o que dói é ter que encadear cada passo manualmente. E a maioria dos PMs nem chega aí, porque não usa IA no VS Code nem clona repositório.

**O valor é a esteira:** os passos encadeados rodando sozinhos, com o resultado pronto para o PM revisar.

**Fase atual:** validação pessoal. O único usuário da v1 é o fundador, no trabalho dele. Modelo de negócio, preço e quem paga ficam para depois de a validação mostrar valor.

## 2. Objetivos, não objetivos e anti-objetivos

**Objetivos da v1**
- O PM escreve a ideia central e recebe uma story no modelo da empresa, já confrontada com a wiki, com o código e com o backlog, sem pedir cada passo.
- O PM navega numa wiki viva do sistema, gerada a partir do código, e pergunta coisas como "como funciona o estorno hoje?".
- O PM ajusta o fluxo da esteira (adiciona, remove e reordena blocos) sem programar.
- Medir se funciona: confrontos aceitos e descartados, e quantas vezes cada card voltou.

**Sucesso da validação:** o fundador escreve menos no dia a dia e as stories ganham qualidade (menos voltas do dev, menos confrontos descartados por serem barulho).

**Fora da v1 (não objetivos)**
- Dev (mapa do código) e QA (testes Playwright). Fora porque, para esses papéis, seria só centralização, sem valor novo.
- Jira, GitHub, GitLab, Bitbucket. Só Azure DevOps.
- Codex/ChatGPT. Só o Claude.
- Canvas de fluxo com ramificações e condições.
- Ler uma wiki existente (Confluence, Azure Wiki, Notion).
- Multiusuário, servidor, cobrança, instalação na infraestrutura da empresa.
- Camada regulatória.

**Anti-objetivos** (seria um fracasso mesmo funcionando)
- Afirmações sem prova apresentadas como fato.
- O código do cliente passar por servidor nosso.
- Escrever no board sem uma ação explícita do usuário.
- O PM precisar montar o fluxo para ter valor: o fluxo padrão tem que entregar a experiência completa.

## 3. Restrições

- **Roda na máquina do usuário.** Não existe servidor da Esteira. O código só sai da máquina para a IA do usuário.
- **A IA é a assinatura do usuário.** O app comanda o Claude Code CLI instalado na máquina (modo não interativo, `claude -p`), logado com a assinatura do usuário: a empresarial que a empresa fornece ou a pessoal. Não usa o Claude Agent SDK com chave de API, porque isso não aceita o login da assinatura.
  - *Risco conhecido:* oferecer o login da assinatura num produto vendido a terceiros esbarra nos termos da Anthropic. Para a validação pessoal, tudo certo. Rever antes de ter outros usuários.
- **Azure DevOps** (Boards + Repos), acessado com um token pessoal (PAT) do usuário. Escopos: leitura de código; leitura e escrita de work items.
- **Escrita no board só por ação explícita** (clique) e se o token tiver permissão. Leitura no resto. *Isso muda a regra "integrações somente leitura" do `CLAUDE.md`, que precisa ser atualizada.*
- **Toda afirmação tem prova:** arquivo e trecho (ou o card do board). Sem prova, o achado aparece marcado como "sem prova". Nunca vira fato.
- **Código fechado.** Sem repositório público nem licença open source.
- Telemetria: nenhuma na v1.

## 4. Abordagens consideradas

**Onde roda**
| Opção | Troca | Decisão |
|---|---|---|
| App desktop local (Windows, estilo Maestri) | Única que aceita a assinatura pessoal ou empresarial e não tem servidor; não escala para vários PMs sem rever a IA | **Escolhida** |
| Container na infraestrutura da empresa | Serve vários PMs; exige chave de API e aprovação da empresa | Depois da validação |
| Fluxo dentro do Claude Code (skills, sem interface) | O mais rápido; não resolve o encadeamento nem serve o PM que não usa VS Code | Descartada. O fundador já sabe que os confrontos funcionam; o problema é o encadeamento |

**Forma do fluxo**
| Opção | Troca | Decisão |
|---|---|---|
| Lista de blocos em sequência, com entrada e saída fixas | Cobre o caso real e se constrói em dias | **Escolhida** |
| Canvas com ramificações (estilo n8n) | Poderoso, mas é um produto inteiro só para o editor | Evolução, se fizer falta |
| Fluxo fixo com encaixes | Seguro, mas limita o que o fundador quer | Descartada |

## 5. O que foi decidido

### 5.1 Produtos e repositórios
- O usuário conecta o Azure DevOps uma vez (PAT), escolhe os repositórios numa lista, e **o app clona e atualiza sozinho**. O PM não precisa saber o que é git. *(decisão do fundador)*
- O PAT pede só dois escopos: **Code (Read)**, para clonar e ler, e **Work Items (Read & Write)**. Nada além disso.
- Um **produto** é um grupo de repositórios (ex.: PIX = back-end + front + antifraude). Um produto pode ser **ligado** a outros (PIX depende de Contas). *(decisão do fundador)*
- Por padrão, a esteira procura no produto da story e nos produtos ligados a ele. No texto, o PM aponta um lugar com `@repositório` ou `@produto` ("busque em @pagamentos-api como é feito hoje").

### 5.2 Wiki viva
- É gerada pela IA a partir do código de cada produto: módulos, regras de negócio, fluxos. Cada afirmação traz arquivo e trecho.
- Primeira geração completa ao cadastrar o produto. Depois de cada atualização dos repositórios, regenera só o que depende dos arquivos que mudaram. *(proposta do Claude)*
- O PM navega na wiki e faz perguntas sobre ela (respostas com prova).
- Os blocos de confronto usam a wiki como fonte.

### 5.3 A esteira (fluxo)
Lista de blocos em sequência. A saída de um bloco é a entrada do próximo.

| Parte | Conteúdo | Editável |
|---|---|---|
| **Entrada** (fixa) | Ideia central do PM, produto da story, menções `@` | não |
| **Meio** (padrão) | 1. Escrever a story no modelo cadastrado → 2. Confrontar com a wiki → 3. Confrontar com o código → 4. Confrontar com o backlog | sim |
| **Saída** (fixa) | Story editável + lista de confrontos + botão publicar/atualizar card | não |

- Cada bloco é **uma skill do Claude instalada** ou **uma instrução escrita pelo usuário**. Cada skill instalada aparece como um bloco disponível para adicionar.
- Cada bloco tem a configuração "roda automático" ou "roda por clique" (decide quando reconfrontar depois que o PM edita).
- Escrever a story é um bloco do meio, não parte da entrada: quem já tem a story pronta remove esse bloco e usa só os confrontos. *(decisão do Claude)*
- O fluxo padrão vem pronto. Editar é opcional.

### 5.4 O que cada confronto procura
- **Wiki e código:** o que já existe, onde está, quais regras de negócio rodam de verdade, onde a story diverge, o que não foi encontrado ("não encontrei").
- **Backlog (Azure Boards):** uma story que já existe sobre o assunto; uma story aberta ou em desenvolvimento em que basta ajustar a regra (e avisar o responsável) em vez de escrever outra; um conflito direto com um requisito de outra story.

### 5.5 Modelo de story
O usuário cadastra o modelo de story da empresa no app (texto livre ou exemplo), e a IA segue esse modelo ao escrever.

### 5.6 Saída e escrita no board
- Na saída, o PM edita a story, aceita ou descarta cada confronto e, com um clique, cria um card novo ou atualiza/comenta um card existente (o caso "basta ajustar a story aberta e avisar").
- Nada é escrito no board sem esse clique.

### 5.7 Medição
- Para cada story: os confrontos gerados, quais foram aceitos e quais foram descartados como incongruentes, e de qual bloco vieram.
- **Voltas do card:** o próprio PM registra, sem leitura do histórico do board. Cada story publicada tem dois botões, 👍 (passou) e 👎 (voltou: incompatibilidade ou incongruência), e um clique a mais a cada volta. Tem que levar menos de 2 segundos, senão ninguém registra. *(decisão do fundador)*
- Sem painel na v1: uma lista por story basta.

### 5.8 Decisões tomadas pelo Claude depois da revisão de um construtor (vetáveis)
- **Volume e cota da assinatura:** a wiki é gerada em segundo plano, módulo a módulo, e fica utilizável conforme cada módulo fica pronto. O usuário não espera a wiki inteira para escrever a primeira story. O backlog passa por um filtro local antes da IA (busca por palavras da story no projeto) e só os candidatos vão para o confronto.
- **Blocos em cadeia:** cada bloco recebe a story atual mais a lista de achados acumulada e devolve os dois. Blocos de confronto só **acrescentam achados**: não reescrevem a story.
- **Aceitar um confronto:** a IA aplica o ajuste na story e mostra a diferença, que o PM aprova ou edita à mão. Descartar registra o achado como incongruente. Ao reconfrontar, os achados já aceitos ou descartados não voltam a aparecer.
- **Publicar no Azure Boards:** cria um work item do tipo configurado (padrão: User Story), com a descrição e os critérios de aceite nos campos configurados, na área e na iteração escolhidas nas configurações. **Atualizar um card existente nunca sobrescreve a descrição:** adiciona um comentário com a mudança sugerida e menciona o responsável.
- **Código que vale:** a branch padrão de cada repositório, configurável por repositório.
- **Recorte do backlog:** os projetos e as áreas configurados no produto, incluindo os itens fechados dos últimos 12 meses (para achar "isso já foi feito").
- **Instalação:** por usuário, sem precisar de administrador. Na v1, sem assinatura digital do instalador.
- **Premissas a confirmar no primeiro uso:** o PAT permite leitura de código e escrita de work items; o notebook da empresa permite clonar e instalar o app; o Claude Code está logado com a assinatura empresarial.

## 6. Fica para quem constrói
- Stack do desktop (ex.: Tauri ou Electron), empacotamento e instalador para Windows.
- Como guardar dados localmente (stories, confrontos, wiki, configurações) e onde guardar o PAT com segurança (cofre de credenciais do Windows).
- Formato da wiki em disco e como cada bloco recebe e devolve dados (contrato entre blocos).
- Como passar ao Claude Code o contexto de cada bloco (diretório de trabalho com os repositórios do produto, skills, limites de tempo).
- Visual das telas: passa por `/design-taste-frontend` e `/impeccable`, conforme o `CLAUDE.md`.

## 7. Para depois da validação
Quem paga e quanto; vários PMs na mesma empresa (container + chave de API); Jira e outros provedores; Codex; canvas de fluxo; ler wiki existente; dev e QA; refazer o founder pack (oferta, painel, preço, CFO) sobre este produto.
