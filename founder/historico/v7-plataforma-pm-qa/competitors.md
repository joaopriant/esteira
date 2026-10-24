# Concorrentes: Esteira

Pesquisa feita em 10/10/2026, só com fontes públicas. Os preços estão em dólar, como os fornecedores publicam. Sempre que um dado não foi encontrado, está marcado assim. Os dados completos estão em `competitors.csv`.

## 1. Quem já está lá (ordenado por proximidade)

| # | Concorrente | Tipo | O que faz que se sobrepõe à Esteira | Preço comparável |
|---|---|---|---|---|
| 1 | **Allstacks Product Studio** | Direto | Workspace de spec para PM que puxa contexto arquitetural do código e faz revisão adversarial antes do dev ver ([fonte](https://www.allstacks.com/blog/what-a-context-aware-spec-workflow-actually-looks-like)) | **Grátis por tempo limitado**, por uso "em breve" ([preços](https://www.allstacks.com/pricing)) |
| 2 | **Bito AI Architect** | Direto | Analisa story/epic do Jira contra o código vivo e comenta viabilidade e impacto no ticket ([fonte](https://bito.ai/ai-tools/best-ai-tools-for-jira/)) | Sob consulta, por uso ([preços](https://bito.ai/pricing/)) |
| 3 | **Atlassian Rovo / Rovo Dev** | Direto | Lê critérios do Jira + Confluence, planeja e executa código, revisa PR contra critérios de aceite | US$ 20/dev/mês; **standalone em fim de vida, indo para dentro do Jira** ([preços](https://www.atlassian.com/software/rovo-dev/pricing)) |
| 4 | **GitHub Copilot** (Spaces, coding agent + Azure Boards) | Indireto | Work item do Azure Boards vira PR; Spaces dá contexto do código para perguntas. **Não suporta Azure Repos** ([docs](https://learn.microsoft.com/en-us/azure/devops/boards/github/work-item-integration-github-copilot)) | US$ 19-39/usuário/mês + créditos ([fonte](https://getdx.com/blog/ai-coding-assistant-pricing/)) |
| 5 | **Devin: Ask Devin / DeepWiki** | Indireto | Perguntas em linguagem natural sobre qualquer repositório; privado exige plano pago ([fonte](https://www.cognition.ai/blog/new-self-serve-plans-for-devin)) | Por uso; valores não encontrados |
| 6 | **StackSpot AI** (Zup, Brasil) | Indireto | Agentes contextualizados com o código da empresa, incluindo geração de user stories ([docs](https://ai.stackspot.com/docs/stackspot-ai/concepts)) | Não encontrado |
| 7 | **Swimm** | Indireto | Extrai regras de negócio do código (foco em legado) ([G2](https://ai.g2.com/marketplace/tools/swimm)) | Por linhas de código; terceiros citam US$ 11/usuário ([fonte](https://toolradar.com/tools/swimm)) |
| 8 | **Copilot4DevOps** | Indireto | Gera/refina stories no Azure DevOps, **sem confrontar com o código** | A partir de US$ 30/usuário/mês ([Capterra](https://www.capterra.co.nz/software/1066066/copilot4devops)) |
| 9 | **TestStory.ai** | Indireto (QA) | Casos de teste a partir de story + código ([fonte](https://testquality.com/ai-test-case-generators-jira-free-vs-enterprise-agents/)) | Não encontrado |
| 10 | **QA Wolf** | Indireto (QA) | Serviço gerenciado de testes Playwright | ~US$ 4-10 mil/mês, segundo um concorrente ([fonte](https://getautonoma.com/blog/opensource-alternative-qa-wolf)) |
| 11 | **Autify Nexus** | Indireto (QA) | Testes Playwright a partir de Jira/PRD ([fonte](https://autify.com/blog/playwright-ai)) | Não encontrado |

**Substitutos**
- **O PM pergunta ao dev ou ao tech lead** em reunião de refinamento ou no Slack. Custa horas de engenharia e é o "concorrente" mais comum.
- **O PM técnico usa Claude Code, Cursor ou ChatGPT** em modo leitura no repositório ([exemplo](https://dev.to/stravukarl/feature-understanding-for-pms-with-claude-code-28pl), [exemplo](https://www.builder.io/blog/cursor-for-product-managers)). Exige clonar o repositório e alguma maturidade técnica, exatamente o que o PM-alvo da Esteira não tem.
- **O Playwright tem agentes de planejamento próprios** que leem o ticket via MCP do Jira ([fonte](https://www.tothenew.com/blog/playwright-ai-agents-autonomous-planning-scripting-and-self-healing-tests/)). Isso reduz o valor da parte de QA.

## 2. Faixa de preço (por usuário/mês, onde há preço publicado)

O modelo de cobrança varia muito entre os players, então a comparação é aproximada.

- **Menor:** grátis (Allstacks Product Studio, temporariamente)
- **Mediana** dos preços por assento publicados (Rovo Dev 20, Copilot Business 19, Copilot Enterprise 39, Copilot4DevOps 30, Allstacks Growth ≈ 33/mês): **≈ US$ 30/usuário/mês**
- **Maior:** serviço gerenciado de QA (QA Wolf, milhares de dólares por mês)
- **Tendência:** a cobrança por **créditos/uso** está substituindo o preço fixo por assento (Copilot desde jun/2026, Rovo, Devin, Bito). Isso ajuda a Esteira a repassar custo de LLM, mas confunde o comprador (ver reclamações).

## 3. Mapa de posicionamento

Eixos: **quem é o usuário** (dev ← → PM não técnico) × **profundidade no código real** (rasa/só texto ← → lê o código).

```
                    LÊ O CÓDIGO REAL
                          |
   Copilot, Devin,        |   Allstacks Product Studio
   Rovo Dev, Swimm,       |   Bito AI Architect
   StackSpot              |        [ESTEIRA quer estar aqui,
                          |         mais à direita: PM sem
   DEV -------------------+-------------- PM NÃO TÉCNICO
                          |         nenhuma maturidade técnica]
   QA Wolf, Autify,       |
   TestStory (QA)         |   Copilot4DevOps, StoryPilot,
                          |   Atlassian Intelligence (só texto)
                    SÓ TEXTO DA STORY
```

O quadrante superior direito (lê o código e serve o PM) **não está vazio**: Allstacks e Bito já estão lá, e a Atlassian está levando o Rovo Dev para dentro do Jira.

## 4. Reclamações dos clientes (ranqueadas)

Há poucas reviews públicas sobre essas ferramentas. **Todos os temas abaixo são fracos (menos de 3 reviews independentes cada, ou fontes de fórum).** Mesmo assim, apontam na mesma direção que o board.

1. **Contexto errado / alucinação com confiança** (fraco, ~4 posts de fórum). Usuários do Rovo relatam que o chat cita um ticket não relacionado, com chave de issue inventada, mesmo com o ticket certo no contexto ([Atlassian Community](https://community.atlassian.com/forums/Rovo-questions/Rovo-does-not-recognize-the-context-of-the-currently-opened-Jira/qaq-p/3269783)). Outro relato descreve o Rovo inventando releases e sprints em vez de admitir que não tinha dados ([Seibert Group](https://us.seibert.group/blog/rovo-agent-pitfalls)).
2. **Preço por créditos confuso / caro para times menores** (fraco). Diz-se que "one of the biggest complaints from the Atlassian community is Rovo's confusing, credit-based pricing" ([eesel](https://www.eesel.ai/blog/rovo-search-filters)). O resumo do G2 sobre a Bito diz que "pricing may be a barrier for smaller teams" ([G2](https://g2.com/products/bito/reviews)).
3. **Saída exige revisão humana** (fraco). Sobre o Copilot4DevOps: o resultado "nem sempre é perfeito" ([G2](https://www.g2.com/pt/products/copilot4devops-plus/reviews/copilot4devops-plus-review-12564295)). Sobre a Bito: "occasional incorrect or redundant suggestions" ([rfp.wiki](https://www.rfp.wiki/artificial-intelligence/bito)).
4. **Só é bom quanto os dados por baixo / preso ao ecossistema** (fraco). O Rovo "is entirely dependent on the Atlassian ecosystem" ([AI Agent Index](https://theaiagentindex.com/agents/atlassian-rovo)); outro review diz que a utilidade depende de dados atualizados ([Slite](https://slite.com/learn/atlassian-rovo-ai-review)).

O lado da dor, que também é fraco: specs "are almost always wrong by the time the code ships" ([Changebot](https://www.changebot.ai/blog/product-manager-fiction)).

## 5. O gap

**Existe um gap, mas é estreito, e não é "ninguém faz isso".** O que a evidência sustenta:

1. **Confiança verificável para quem não sabe verificar.** A reclamação nº 1 é contexto errado dito com confiança. Nenhum player encontrado se posiciona em "toda afirmação com arquivo/trecho clicável + 'não sei' explícito" para um PM não técnico. É a mesma condição que o board pediu.
2. **Stack Microsoft (Azure Boards + Azure Repos).** A integração do Copilot com o Azure Boards **não suporta Azure Repos**, e o Rovo é preso ao ecossistema Atlassian. Empresas em Azure DevOps puro ficam sem uma opção nativa de "story contra código" para o PM. Não encontrei dado que diga quantas scale-ups brasileiras usam esse stack: pergunta aberta para `/founder-consumer`.
3. **Brasil, em português, para PMs com baixa maturidade técnica.** Allstacks, Bito e Rovo são americanos/australianos, vendidos em dólar, em inglês, e tendem a mirar organizações maiores. O StackSpot é brasileiro, mas é uma plataforma de agentes para dev, não um revisor de spec para PM. Ressalva: idioma e moeda são uma vantagem fraca, fácil de copiar.
4. **Preço simples.** Contra a confusão de créditos, um preço previsível por time pode diferenciar (testar em `/founder-pricing`).

**O que não é gap:** geração de testes Playwright (QA Wolf, Autify, TestStory e os agentes nativos do próprio Playwright) e mapa de código para dev (Copilot, Devin/DeepWiki, Swimm). Isso confirma o corte de escopo pedido pelo board.

## 6. A ameaça: quem copia mais rápido

1. **Atlassian.** O Rovo Dev já lê critérios de aceite do Jira, revisa PR contra eles e está sendo **incorporado às assinaturas do Jira**. "Confrontar a story com o código" pode virar um botão incluso para todo cliente Jira + Bitbucket/GitHub. É o maior risco, e é exatamente o que o lens de Monopólio temia.
2. **Microsoft/GitHub.** Já tem Azure Boards → Copilot → PR. Basta adicionar suporte a Azure Repos e um modo "explicar ao PM".
3. **Allstacks.** Já tem o produto de spec para PM e está **grátis** agora. Se entrar no Brasil ou baixar o preço, compete de frente.

**Perguntas abertas:** tamanho do mercado BR de scale-ups com 20–200 devs e a divisão Jira vs. Azure DevOps nesse mercado (não encontrado; validar em entrevistas reais / `/founder-consumer`); preço real de Allstacks, Bito e StackSpot (pedir demo).
