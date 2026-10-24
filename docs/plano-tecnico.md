# Plano técnico — Esteira v1

Data: 24/10/2026. Autor: Tech Lead. Spec: `docs/superpowers/specs/2026-10-23-esteira-v1-design.md`.

Este plano foi escrito antes do código da v1. As decisões de stack e de contrato estão nos ADRs em `docs/decisoes/`.

## O que a v1 entrega

Um PM abre o app, conecta o Azure DevOps, escolhe repositórios, agrupa em produtos, deixa a wiki nascer em segundo plano e escreve uma ideia. A esteira padrão produz a story no modelo da empresa, confronta com a wiki, com o código e com o backlog, e para. O PM aceita ou descarta achado, aprova o diff e, se quiser, publica com um clique.

O fluxo padrão já vem montado. Editar blocos é opcional.

## Fronteiras

| Módulo | Responsabilidade | Não faz |
|---|---|---|
| `src/core` | Funções puras: prova, menções, pré-filtro, plano da wiki, contrato do bloco, diff, texto do comentário | Rede, disco, processo |
| `src/ports.ts` | Tipos das portas (Azure, Claude, git, cofre, relógio) | Implementação |
| `src/adapters` | SDK oficial do Azure, `spawn` de git e claude, cofre, e os falsos | Decidir regra de produto |
| `src/app` | Uma story, a fila da wiki, gravar JSON, orquestrar | Falar com Electron |
| `src/main` + `src/preload` | Janela, IPC com lista fechada, CSP | Regra de negócio |
| `src/renderer` | Telas. Chama a API. Não vê o PAT | Azure, Claude, disco |
| `skills/` | Texto dos quatro blocos padrão | Código executável |

O teste de ponta a ponta instancia `criarAplicacao({ modo: 'falso' })` e não abre janela.

## Contrato do bloco

Ver ADR 0003. O tipo compartilhado vive em `src/shared/tipos.ts`, sem import de Node, para a janela e o processo principal usarem o mesmo formato.

Papéis: `escrever` e `confrontar`. Modos: `automatico` e `por-clique`.

Blocos padrão, nesta ordem:

1. Escrever a story no modelo cadastrado (`escrever`, automático).
2. Confrontar com a wiki (`confrontar`, automático).
3. Confrontar com o código (`confrontar`, automático).
4. Confrontar com o backlog (`confrontar`, automático).

Cada um é um `SKILL.md`. O PM pode trocar por uma instrução escrita, reordenar, tirar ou acrescentar. Uma skill instalada em `~/.claude/skills` aparece na lista. Skill achada dentro de repositório clonado não aparece sozinha.

## Fluxo de uma story

1. Validar ideia e produto.
2. Resolver `@`.
3. Montar o recorte: repos do produto e das dependências diretas, estreito se houver menção válida.
4. Ler a wiki pronta desse recorte.
5. Para o bloco de código, escolher arquivos cujo texto casa com as palavras da ideia (o mesmo tokenizador do backlog, teto de arquivos).
6. Para o backlog, WIQL no recorte e pré-filtro local.
7. Rodar os blocos em ordem. `por-clique` pausa.
8. Gravar a story a cada bloco, para um crash não levar o que já foi feito.
9. Na saída, a story é editável. Aceitar achado gera diff. Aprovar grava. Descartar marca incongruente.
10. Publicar é outro método, só chamado pelo clique.

Reconfrontar depois de editar: blocos automáticos rodam de novo; os por clique esperam. Achado já aceito ou descartado não reaparece.

## Wiki

Fila em processo, um módulo por vez. Estado visível por módulo. A primeira geração começa quando o produto ganha repositório clonado. Depois de `git pull`, o plano de regeneração olha os hashes. O PM pode perguntar à wiki: a pergunta vai ao Claude com as páginas prontas, e a resposta passa pelo mesmo classificador de prova.

## Medição

Na própria story: contagem de achados aceitos e descartados por bloco, mais dois contadores (`passou` e `voltou`). O clique grava o JSON local e volta. Meta: menos de 2 segundos, sem rede. Não há painel.

## Modelo de story

Vem um modelo inicial, editável em Ajustes, para a esteira padrão já escrever alguma coisa. O PM substitui pelo modelo da empresa. Isso evita o anti-objetivo de obrigar o PM a montar o fluxo antes de ter valor.

## Falsos

- Azure: repositórios e cards do exemplo PIX, incluindo fechados dentro e fora de 12 meses.
- Git: materializa os fixtures em disco e lista arquivos de verdade, para o classificador de prova ler trecho real.
- Claude: devolve JSON a partir do contexto, citando trecho que está no arquivo, card que está na lista, ou "não encontrei".
- Cofre: memória.

O adaptador real do Azure usa `azure-devops-node-api`. O adaptador real do Claude está escrito e não é o que o teste chama.

## Testes

Vitest, sem Electron:

- contrato do bloco (confronto não altera a story; aceito/descartado não volta)
- prova (`sem prova` e `não encontrei`)
- pré-filtro (palavra, área, 12 meses, nome do produto sozinho não entra)
- plano de regeneração da wiki
- publicar (comentário não mexe na descrição)
- esteira padrão de ponta a ponta com os falsos, incluindo diff, descarte, reconfronto, volta do card e ausência do PAT no disco

## Telas

Estilo decidido pelo sorteio do design de app: **framed sheet**, semente 1617297726. A face é o quadro azul-acinzentado (um passo da cor `#1b6c80`) e a folha branca. O elemento próprio é o **trilho**: as estações da esteira em cima da story, com estado e modo. Achados ficam ao lado, com caminho de arquivo em mono e o trecho. Detalhe em `docs/design/direcao.md`.

Telas: Esteira, Wiki, Produtos, Fluxo, Medição, Ajustes. Estados vazio, carregando e erro em cada uma. Largura de notebook e de telefone (a barra vira menu).

## Incremento — Radar e Fluxo v2

Data: 24/10/2026. Spec: `docs/superpowers/specs/2026-10-24-radar-e-fluxo-v2-design.md`. ADR 0006.

O PM liga fontes de leitura (Teams, Slack, WhatsApp, Granola, Plaud) a um produto. `sincronizarRadar` pede os sinais ao leitor, passa por `prepararSinais` (ruído e injeção saem antes do modelo) e chama `claude -p` com papel `radar`. A citação só entra se for substring do texto sanitizado. Sem isso, a sugestão não nasce.

`enviarParaEsteira` grava a prova na story e dispara os blocos do fluxo salvo. Descartar é local. Nenhum leitor tem método de envio.

O fluxo deixa de ser formulário empilhado. A tela monta três zonas (fontes, blocos, saída) com conectores. Presets, inserção entre índices e duplicação passam por `validarFluxo` no `salvarFluxo`. O inspetor edita o bloco selecionado e lê a contagem de achados já gravada nas stories. A ordem nova vale para a próxima story; a story aberta guarda o fluxo com que nasceu.

Testes novos: `tests/radar.test.ts` (cinco fontes, prova, envio, injeção, leitura local, presets). Os testes da v1 continuam iguais.

## Fora deste plano

Servidor, telemetria, Jira, canvas com ramificação ou condição, login de vários PMs, assinatura digital do instalador, escrever em Teams, Slack ou WhatsApp.

## Marcos

1. Domínio, portas, falsos e testes.
2. Casca Electron, IPC e instalador NSIS no CI.
3. Telas no estilo acima, com a pré-visualização local.
4. Revisão de segurança contra o modelo de ameaças, `npm audit` e varredura de segredo.

Notas de revisão em `docs/revisoes/`, assinadas Tech Lead, ao fechar os marcos.
