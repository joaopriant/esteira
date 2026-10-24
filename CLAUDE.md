# Esteira: instruções para agentes de desenvolvimento

Leia este arquivo inteiro antes de escrever código neste projeto.

## O produto em 5 linhas

A Esteira v1 é um app de desktop (Windows) para a pessoa de produto escrever uma user story e confrontá-la, em sequência, com o código, com uma wiki viva gerada desse código e com o backlog do Azure Boards. O único usuário da v1 é o fundador. O spec aprovado está em [docs/superpowers/specs/2026-10-23-esteira-v1-design.md](docs/superpowers/specs/2026-10-23-esteira-v1-design.md). A ideia anterior (dev, QA, Jira, outros repositórios) ficou para depois da validação.

Regras do produto que o código não pode quebrar:

- **Roda na máquina do usuário.** Não existe servidor da Esteira. O código do cliente nunca passa por servidor nosso. Não envie código, trechos ou embeddings para fora, nem em logs ou telemetria. A única saída de código é para a IA do próprio usuário.
- **A IA é a assinatura do usuário.** O app comanda o Claude Code CLI já instalado (`claude -p`), logado com a assinatura empresarial ou pessoal. Não use o Agent SDK com chave de API.
- **Azure DevOps com o menor escopo.** O PAT pede só Code (Read) e Work Items (Read & Write). O resto do app é leitura. **Escrever no Azure Boards só acontece quando o usuário clica em publicar ou comentar.** Atualizar um card existente adiciona um comentário e menciona o responsável; nunca sobrescreve a descrição. Esta regra substitui a antiga "integrações somente leitura".
- **Toda afirmação tem prova.** A análise cita arquivo e trecho, ou o card do board. Sem evidência, o achado aparece marcado como "sem prova". Quando a busca não acha nada, a resposta é "não encontrei", nunca um palpite apresentado como fato.
- **Código fechado.** Não publique o código, não crie repositório público e não adicione licença open source.
- **Sem telemetria.**

A pasta [founder/](founder/) é o histórico de negócio. Não a edite durante o desenvolvimento.

## Skills obrigatórias e quando usar

O fluxo abaixo vale para toda tarefa de código. Cada passo diz qual skill chamar.

### 1. Entender antes de mexer: Understand Anything

| Quando | Skill |
|---|---|
| Primeira sessão no projeto, ou o mapa está desatualizado | `/understand` (gera o mapa do código em `.understand-anything/`) |
| Para ver o mapa | `/understand-dashboard` |
| Dúvida sobre como algo funciona ou onde está | `/understand-chat` ou `/understand-explain` |
| Agente novo no projeto | `/understand-onboard` |
| Regras de negócio e domínio | `/understand-domain` |
| Antes de um commit, para ver o impacto da mudança | `/understand-diff` |

Enquanto não houver código, pule este passo. Depois do primeiro commit, rode `/understand` e mantenha o mapa atualizado.

### 1a. Descobrir o que construir: `brainstorming`

Funcionalidade nova ou mudança de comportamento em que falta algo importante no pedido: use a skill `brainstorming`. Ela conversa com o usuário até entender o que ele quer e por quê, apresenta 2 ou 3 abordagens para ele escolher e escreve um design doc em `docs/superpowers/specs/AAAA-MM-DD-<tema>-design.md`. Nada é construído antes de o usuário aprovar o doc.

A skill manda chamar `superpowers:writing-plans` depois da aprovação. Essa skill **não** está instalada: depois do doc aprovado, siga para o passo 1b.

### 1b. Fechar o plano com o usuário: `grilling`

Com o design doc aprovado, ou antes de uma decisão de arquitetura (por exemplo, a arquitetura do MVP em [founder/launch.md](founder/launch.md)), use a skill `grilling` para testar o plano: entreviste o usuário em rodadas, com perguntas numeradas e a sua resposta recomendada em cada uma, até não sobrar decisão assumida em silêncio. Fatos você mesmo levanta no código; só as decisões vão para o usuário. Não comece a construir antes de ele confirmar que o plano está fechado.

A divisão: `brainstorming` descobre **o que** construir; `grilling` testa **o plano** de como construir.

Tarefa pequena e clara pula 1a e 1b. O usuário também pode chamar `/grill-me` a qualquer momento para ser questionado sobre um plano.

### 2. Procurar antes de construir: `/search-first`

Antes de qualquer funcionalidade nova, integração, dependência ou utilitário, rode `/search-first`. Procure nesta ordem: no próprio repositório, no npm/PyPI, nos servidores MCP, nas skills e no GitHub. As integrações com Jira, Azure DevOps, GitHub e GitLab já têm SDKs oficiais; use-os antes de escrever cliente HTTP próprio.

Não instale pacote nem mude configuração do projeto sem aprovação do usuário. Apresente a recomendação e espere.

### 3. Escrever o mínimo que resolve: `/ponytail`

Todo código é escrito em modo `/ponytail` (nível `full`). A menor mudança que resolve a tarefa por completo, reaproveitando o que já existe, sem abstração, opção ou configuração que ninguém pediu.

- Atalho com limite conhecido leva um comentário `shortcut: <o limite>, <quando revisar>`.
- O ponytail reduz o tamanho da solução, **não** os testes nem a segurança. Os requisitos de teste das regras globais do usuário continuam valendo.
- Nunca corte: validação de entrada, tratamento de erro que evita perda de dados, segurança, e as regras do produto acima.

### 3a. Interface e páginas: `/design-taste-frontend` e `/impeccable`

Toda tela ou página passa pelas duas skills: a interface de entrada e saída que o PM, o dev e o QA usam, as telas de configuração e a landing page.

| Quando | Skill |
|---|---|
| Uma vez, antes da primeira tela | `/impeccable init` (registra o contexto de design do projeto, que as outras chamadas reutilizam) |
| Tela ou página nova | `/design-taste-frontend` para a direção visual (tem um modo para telas de app e outro para páginas públicas); rode o ciclo de screenshot e correção até a tela não ter mais cara de template |
| Ajustar uma tela existente | `/impeccable` com o comando que couber (`layout`, `typeset`, `clarify`, `harden` etc.) |
| Antes de entregar qualquer tela | `/impeccable audit` e corrija o que ele apontar |

Os hooks do impeccable rodam sozinhos: checam a interface depois de cada edição e fazem uma verificação completa no fim da resposta. Trate os avisos deles como findings de revisão. Se existir também uma skill `impeccable` global (`anthropic-skills:impeccable`), use a do projeto.

O ponytail continua valendo aqui: a skill decide como a tela fica, não aumenta o escopo. O script de imagens dela baixa fotos de domínio público da internet; isso é só para páginas de marketing, nunca para telas que mostram código ou dados do cliente.

### 4. Revisar antes de entregar: `/ponytail-review`

Depois de escrever ou alterar código, e antes de qualquer commit, rode `/ponytail-review` sobre a mudança e corrija tudo o que vier como **Must fix**. Junto com isso, use `/understand-diff` para conferir o que a mudança afeta.

### 5. Manutenção periódica

| Quando | Skill |
|---|---|
| A cada marco do MVP (ver datas em [founder/launch.md](founder/launch.md)) e antes do pentest | `/ponytail-audit` no repositório inteiro |
| No fim de cada marco | `/ponytail-debt`, para listar os atalhos adiados e decidir quais resolver |

`/ponytail-help` e `/ponytail-gain` são só consulta; não fazem parte do fluxo.

## Se uma skill não estiver disponível

`design-taste-frontend`, `impeccable`, `grill-me`, `grilling` e `brainstorming` vêm com o projeto, em [.claude/skills/](.claude/skills/). Para atualizar: `npx skills update -p` (taste, grill e brainstorming, versões em [skills-lock.json](skills-lock.json)) e `npx impeccable update` (impeccable). Os hooks do impeccable ficam em `.claude/settings.local.json`, que é local: numa máquina nova, rode `npx impeccable install --project --providers=claude -y` para recriá-los.

As demais são instaladas por usuário, não vêm com o projeto. Para instalar:

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
/plugin marketplace add Egonex-AI/Understand-Anything
/plugin install understand-anything@understand-anything
```

`search-first` é uma skill avulsa: copie `~/.claude/skills/search-first/` da máquina do fundador. Se não der para instalar alguma, siga o passo correspondente à mão e avise o usuário.

## Antes do primeiro código

O projeto ainda não é um repositório git. Rode `git init` antes do primeiro commit. Sem git, `/understand-diff` e a atualização incremental do mapa não funcionam.
