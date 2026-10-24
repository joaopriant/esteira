# Esteira (nome provisório) · Business plan

**Verdict: Profitable**

- ✓ Each cliente-mês earns $2125.00 before fixed costs (85% contribution).
- ✓ Year 1 operating profit: $5,275.
- ✓ Break-even is 5 cliente-mêss a day against a capacity of 15.
- ✓ 7 of 20 simulated buyers buy (35%, the bar is 25%).

| key number | |
| --- | ---: |
| Price | $2500.00 a cliente-mês |
| Profit margin at plan | 48% per cliente-mês |
| Break-even | 5 cliente-mêss a day |
| Year 1 operating profit | $5,275 |
| Startup spend | $31,500 |
| Cash needed before it pays for itself | $66,050 |
| Startup money earned back | not in year 1 |
| Buyer panel | 7 buy · 13 pass |

## The idea

- **O que é:** uma plataforma SaaS de agentes de IA que conecta o sistema de tarefas (Azure Boards, Jira ou similar) aos repositórios de código (GitHub, GitLab, Bitbucket, Azure Repos) e confronta cada user story com o código real, servindo PM, dev e QA num mesmo fluxo.
- **Para quem:** scale-ups e empresas médias de software no Brasil, com cerca de 20 a 200 devs, times de produto com PMs de baixa maturidade técnica e QAs que escrevem testes. Quem assina e paga: liderança de produto/engenharia (Head de Produto, CTO, VP Eng).
- **O que vende, a que preço:**
  - Para o PM: esteira de refinamento. Cola a user story; o sistema mostra o que já existe no código, onde, quais regras de negócio existem de verdade, e critica a spec iterativamente até bater com a realidade, sem o PM abrir editor ou clonar repositório.
  - Para o dev: mapa da base de código ligada àquela tarefa (o que já está implementado e como).
  - Para o QA: gera casos de teste a partir da tarefa + código + story e escreve testes Playwright prontos para rodar.
  - Arquitetura: (1) motor que lê e analisa os repositórios; (2) biblioteca de agentes montáveis "como Lego" (explorador de repositório, confrontador de spec, crítico de regras); (3) interface simples de entrada/saída por papel.
  - **Preço: R$ 2.500/mês por empresa** (licença; a IA é do cliente). Clientes Fundadores: preço travado por 24 meses.
- **Modelo de IA (definido em 12/10/2026):** BYOK. A IA roda na assinatura (Claude, ChatGPT) ou na chave de API do próprio cliente, como no Maestri. A Esteira não revende IA nem paga token. Entrega como GitHub Action / tarefa de Azure Pipelines / container no ambiente do cliente; o código não passa pelos servidores da Esteira.
- **Cliente-alvo inicial (definido em 12/10/2026):** scale-ups e empresas médias **não reguladas**, em Azure DevOps ou Jira + GitHub/GitLab, fora do ecossistema Atlassian para IA. Reguladas e Atlassian-dependentes ficam para depois de pentest, referências e SOC 2.
- **Onde e como:** online, SaaS B2B, mercado brasileiro primeiro. Canal de aquisição ainda não definido. Entregue via web conectada por integrações (OAuth/apps) às ferramentas de tarefas e repositórios do cliente.
- **Orçamento e restrições:** fundador solo, bootstrap no início, com intenção de levantar pre-seed. Orçamento em dinheiro não informado. Fora do escopo da v1: camada de inteligência regulatória (subir a norma de um setor regulado e validar story/código contra ela), prevista como módulo opcional futuro para verticais como fintech e aviação.

## Summary

**Veredito: Profitable** (as 4 checagens da ferramenta passam), **com folga estreita**. Preço 10% menor ou 20% menos clientes levam o ano 1 de volta ao prejuízo (`cfo.md`). O que sustenta o veredito é chegar a **10 clientes pagantes até o mês 12**, e isso ainda não foi testado com clientes reais.

**O negócio:** a Esteira (nome sugerido: Gabarito) confronta cada user story do Jira/Azure Boards com o código real, com prova (arquivo e trecho) e "não encontrei" quando não há evidência. Para o PM refinar a spec e para o QA gerar testes Playwright. **Roda no ambiente do cliente, com a IA dele** (assinatura ou API, como no Maestri). O código nunca passa pela Esteira. Vende para Head de Produto/CTO de scale-ups brasileiras **não reguladas**, de 20 a 200 devs, em Azure DevOps ou Jira + GitHub, por **R$ 2.500/mês por empresa**.

**Os números:** contribuição de **R$ 2.125 (85%)** por cliente; break-even de **5 clientes**; margem de **48%** com 10; ano 1 **+R$ 5.275** sobre R$ 137.500.

**Como chegou aqui** (de Not yet a Profitable, mexendo só em decisões do fundador; `offer.md` §7):
1. **IA do cliente (BYOK):** zerou o custo de LLM (era R$ 440/cliente-mês) e a objeção "o código vai para uma startup".
2. **Roda no ambiente do cliente + garantia de continuidade (código em escrow):** taxa simulada de 15% → 20%. O software é **proprietário, de código fechado**; a confiança vem do tráfego restrito (verificável no firewall do cliente), de pentest independente e de SBOM.
3. **Cliente-alvo sem reguladas e sem dependentes do Atlassian** (0% em todas as versões): 20% → **40%** (v6); com código fechado (v7, atual): **35%**.
4. **Preço cheio também para os Fundadores** (com preço travado por 24 meses em vez de desconto): o ano 1 virou positivo.

**Board e painel:** concordam que confiança é o problema central e que o escopo precisa de foco. O board queria o PM como porta de entrada; o painel mostra compra pelas duas dores (PM e QA/Playwright). O teste real decide.

**Maior risco:** **velocidade de vendas**. Hoje quase todo comprador aceita o piloto grátis, mas paga só depois de ver o antes/depois. Se a conversão piloto → pagante for baixa, a rampa não chega a 10. Em segundo lugar: Atlassian/GitHub embutirem o recurso. **O que fazer:** medir a conversão dos pilotos desde o primeiro; cliente-alvo onde eles não chegam (Azure DevOps, PM não técnico); evidência + "não encontrei" com acerto medido.

**Para começar:** caixa de **R$ 66.050** (abertura de R$ 31.500 + prejuízo até o 6º cliente). Cortar o pró-labore para R$ 3.000 no ano 1 dá ~R$ 36.000 de folga.

**A única coisa a fazer esta semana:** montar a lista de 30 scale-ups **não reguladas, em Azure DevOps ou Jira + GitHub**, e marcar as 5 primeiras conversas, levando uma análise "Story vs. Código" num repositório open source.

*O painel é de compradores simulados (tendem a concordar; 35% é teto) e os números são projeções a partir de estimativas. Clientes e cotações reais confirmam. Não é aconselhamento financeiro, jurídico ou tributário.*

## What the board said

### Voto

**3 FUND IF, 0 FUND, 0 PASS.** Média: **4,7 / 10** (Ofertas 5, Monopólio 4, Produto 5).

Ninguém financia como está. Os três financiam a mesma versão menor.

### Riscos levantados por mais de um membro (os primeiros da fila)

1. **Escopo largo demais** (os três). PM + Dev + QA + biblioteca de agentes "Lego" + 4 provedores de repositório + módulo regulatório. Para Ofertas, isso dilui o resultado e vira comparação de funcionalidade. Para Monopólio, nenhuma frente chega a 10x. Para Produto, um fundador solo não faz cinco coisas brilhantemente, e a biblioteca Lego terceiriza para o cliente o design que o produto deveria fazer.
2. **Confiança/precisão** (Ofertas, Produto). O PM usa a ferramenta justamente porque não consegue verificar o código. Uma regra de negócio alucinada levada à planning mata o produto na reunião. Ainda não há piloto nem taxa de acerto medida.
3. **Acesso ao código como barreira de venda** (os três). Dar leitura a todos os repositórios e ao Jira/Azure Boards passa por segurança, jurídico e CTO. Isso alonga o ciclo, encarece o CAC e pode transformar os primeiros 5 minutos em "peça um token ao time de plataforma".
4. **Distribuição e CAC indefinidos** (Ofertas, Monopólio). Fundador solo, sem canal. Pergunta aberta: `/founder-consumer`, `/founder-cfo`.

### Onde o board discorda

- **A ameaça principal.** Para **Monopólio**, é virar um botão dentro das plataformas de repositório e de gestão de tarefas, que já têm os dois dados. Para **Ofertas**, é a falta de prova, não o concorrente. Para **Produto**, é a experiência quebrar nas costuras entre sistemas.
- **O que se constrói no longo prazo.** Monopólio quer um ativo acumulado por cliente (regras de negócio extraídas, histórico de specs) que gere custo de troca. Ofertas quer um stack de bônus (Dev e QA como bônus da oferta do PM). Produto quer cortar Dev e QA completamente até o refinamento ser excelente. *Ofertas mantém Dev/QA como bônus; Produto os tira da v1.* Fica para `/founder-offer` e o painel decidirem.
- **Regulação.** Monopólio vê a camada regulatória como a expansão certa depois do nicho. Os outros dois só pedem que ela fique fora da v1.

### Condições (checklist para o resto do pack)

- [ ] **V1 = um papel, uma promessa mensurável:** refinamento de spec para o PM, confrontado com o código, com um gerenciador de tarefas e um provedor de repositório. Biblioteca de agentes, regulação e (segundo Produto) Dev/QA ficam fora. *(os três; `/founder-offer`)*
- [ ] **Resultado em uma frase com um número** (ex.: redução de stories devolvidas pelo dev / de bugs de regra de negócio) e quem sente a dor mais forte vs. quem assina. *(Ofertas, Produto; `/founder-consumer`)*
- [ ] **Toda afirmação com evidência clicável** (arquivo, trecho) e sinal explícito de incerteza ("não sei"). *(Produto)*
- [ ] **3 a 5 pilotos reais** em empresas do perfil-alvo, com acesso aprovado por segurança, medindo taxa de acerto (devs concordam com o que a ferramenta afirmou) e impacto em retrabalho, virando caso de uso com números. Meta de acerto definida com dados. *(os três; `/founder-launch`)*
- [ ] **Barreira de segurança resolvida na oferta:** acesso só leitura, política de dados clara, instalação que o CTO aprove em uma reunião, feita uma vez por alguém técnico e invisível para o PM. *(Ofertas, Produto, Monopólio; `/founder-ops`)*
- [ ] **Primeiro resultado útil em minutos** após conectar. *(Produto, Ofertas)*
- [ ] **Custo de LLM por tarefa analisada** conhecido e compatível com preço e tempo de resposta. *(os três; `/founder-cfo`)*
- [ ] **Preço e garantia de piloto que caibam na conta.** *(Ofertas; `/founder-pricing`, `/founder-cfo`, `/founder-offer`)*
- [ ] **Mapa competitivo antes do pre-seed:** mostrar que nenhuma plataforma de repositório/tarefas já entrega isso ao PM e por que a Esteira segue na frente se uma lançar. *(Monopólio; `/founder-competitors`)*
- [ ] **Canal repetível para os 100 primeiros clientes** e CAC estimado. *(Monopólio, Ofertas; `/founder-marketing`, `/founder-cfo`)*
- [ ] **Ativo durável nomeado:** o que se acumula por cliente e vira custo de troca. *(Monopólio)*
- [ ] **Tamanho do mercado BR de 20–200 devs.** *(Ofertas; `/founder-competitors`)*

### A versão mais forte que o board enxerga

Não é a plataforma de agentes para três papéis que foi apresentada. É um **"revisor de spec contra o código" para PMs não técnicos**: o PM cola a story no Jira (ou Azure Boards), e em minutos recebe o que já existe, onde está (com link para o arquivo e o trecho), quais regras de negócio de fato rodam, onde a story diverge e o que a ferramenta não sabe afirmar, e a spec revisada volta para o card. Vendido ao Head de Produto/CTO com uma promessa medida em menos retrabalho por story divergente e provado em 3 a 5 pilotos com acesso só leitura. Com o tempo, as regras de negócio extraídas por cliente viram uma base viva do produto, o ativo que prende o cliente. O mapa para dev e os testes Playwright para QA viram expansão (ou bônus) depois que o refinamento for confiável, e a camada regulatória viria depois disso. É deliberadamente menor do que o pitch original.

## The competition

Pesquisa feita em 10/10/2026, só com fontes públicas. Os preços estão em dólar, como os fornecedores publicam. Sempre que um dado não foi encontrado, está marcado assim. Os dados completos estão em `competitors.csv`.

### 1. Quem já está lá (ordenado por proximidade)

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

### 2. Faixa de preço (por usuário/mês, onde há preço publicado)

O modelo de cobrança varia muito entre os players, então a comparação é aproximada.

- **Menor:** grátis (Allstacks Product Studio, temporariamente)
- **Mediana** dos preços por assento publicados (Rovo Dev 20, Copilot Business 19, Copilot Enterprise 39, Copilot4DevOps 30, Allstacks Growth ≈ 33/mês): **≈ US$ 30/usuário/mês**
- **Maior:** serviço gerenciado de QA (QA Wolf, milhares de dólares por mês)
- **Tendência:** a cobrança por **créditos/uso** está substituindo o preço fixo por assento (Copilot desde jun/2026, Rovo, Devin, Bito). Isso ajuda a Esteira a repassar custo de LLM, mas confunde o comprador (ver reclamações).

### 3. Mapa de posicionamento

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

### 4. Reclamações dos clientes (ranqueadas)

Há poucas reviews públicas sobre essas ferramentas. **Todos os temas abaixo são fracos (menos de 3 reviews independentes cada, ou fontes de fórum).** Mesmo assim, apontam na mesma direção que o board.

1. **Contexto errado / alucinação com confiança** (fraco, ~4 posts de fórum). Usuários do Rovo relatam que o chat cita um ticket não relacionado, com chave de issue inventada, mesmo com o ticket certo no contexto ([Atlassian Community](https://community.atlassian.com/forums/Rovo-questions/Rovo-does-not-recognize-the-context-of-the-currently-opened-Jira/qaq-p/3269783)). Outro relato descreve o Rovo inventando releases e sprints em vez de admitir que não tinha dados ([Seibert Group](https://us.seibert.group/blog/rovo-agent-pitfalls)).
2. **Preço por créditos confuso / caro para times menores** (fraco). Diz-se que "one of the biggest complaints from the Atlassian community is Rovo's confusing, credit-based pricing" ([eesel](https://www.eesel.ai/blog/rovo-search-filters)). O resumo do G2 sobre a Bito diz que "pricing may be a barrier for smaller teams" ([G2](https://g2.com/products/bito/reviews)).
3. **Saída exige revisão humana** (fraco). Sobre o Copilot4DevOps: o resultado "nem sempre é perfeito" ([G2](https://www.g2.com/pt/products/copilot4devops-plus/reviews/copilot4devops-plus-review-12564295)). Sobre a Bito: "occasional incorrect or redundant suggestions" ([rfp.wiki](https://www.rfp.wiki/artificial-intelligence/bito)).
4. **Só é bom quanto os dados por baixo / preso ao ecossistema** (fraco). O Rovo "is entirely dependent on the Atlassian ecosystem" ([AI Agent Index](https://theaiagentindex.com/agents/atlassian-rovo)); outro review diz que a utilidade depende de dados atualizados ([Slite](https://slite.com/learn/atlassian-rovo-ai-review)).

O lado da dor, que também é fraco: specs "are almost always wrong by the time the code ships" ([Changebot](https://www.changebot.ai/blog/product-manager-fiction)).

### 5. O gap

**Existe um gap, mas é estreito, e não é "ninguém faz isso".** O que a evidência sustenta:

1. **Confiança verificável para quem não sabe verificar.** A reclamação nº 1 é contexto errado dito com confiança. Nenhum player encontrado se posiciona em "toda afirmação com arquivo/trecho clicável + 'não sei' explícito" para um PM não técnico. É a mesma condição que o board pediu.
2. **Stack Microsoft (Azure Boards + Azure Repos).** A integração do Copilot com o Azure Boards **não suporta Azure Repos**, e o Rovo é preso ao ecossistema Atlassian. Empresas em Azure DevOps puro ficam sem uma opção nativa de "story contra código" para o PM. Não encontrei dado que diga quantas scale-ups brasileiras usam esse stack: pergunta aberta para `/founder-consumer`.
3. **Brasil, em português, para PMs com baixa maturidade técnica.** Allstacks, Bito e Rovo são americanos/australianos, vendidos em dólar, em inglês, e tendem a mirar organizações maiores. O StackSpot é brasileiro, mas é uma plataforma de agentes para dev, não um revisor de spec para PM. Ressalva: idioma e moeda são uma vantagem fraca, fácil de copiar.
4. **Preço simples.** Contra a confusão de créditos, um preço previsível por time pode diferenciar (testar em `/founder-pricing`).

**O que não é gap:** geração de testes Playwright (QA Wolf, Autify, TestStory e os agentes nativos do próprio Playwright) e mapa de código para dev (Copilot, Devin/DeepWiki, Swimm). Isso confirma o corte de escopo pedido pelo board.

### 6. A ameaça: quem copia mais rápido

1. **Atlassian.** O Rovo Dev já lê critérios de aceite do Jira, revisa PR contra eles e está sendo **incorporado às assinaturas do Jira**. "Confrontar a story com o código" pode virar um botão incluso para todo cliente Jira + Bitbucket/GitHub. É o maior risco, e é exatamente o que o lens de Monopólio temia.
2. **Microsoft/GitHub.** Já tem Azure Boards → Copilot → PR. Basta adicionar suporte a Azure Repos e um modo "explicar ao PM".
3. **Allstacks.** Já tem o produto de spec para PM e está **grátis** agora. Se entrar no Brasil ou baixar o preço, compete de frente.

**Perguntas abertas:** tamanho do mercado BR de scale-ups com 20–200 devs e a divisão Jira vs. Azure DevOps nesse mercado (não encontrado; validar em entrevistas reais / `/founder-consumer`); preço real de Allstacks, Bito e StackSpot (pedir demo).

## The buyer panel

**7 buy · 13 pass** (35% buy) out of 20 simulated buyers. Seed 677932, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

### By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Head/Diretor(a) de Produto em scale-up de 20 a 80 devs (salário anual em R$) | 8 | 50% |
| CTO ou VP de Engenharia em empresa de 50 a 200 devs (salário anual em R$) | 7 | 43%  (thin) |
| Engineering Manager ou Head de QA que influencia a compra, mas precisa de aprovação do CTO (salário anual em R$) | 5 | 0%  (thin) |

### By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Early adopter de ferramentas de IA | 4 | 75%  (thin) |
| Stack Microsoft (Azure DevOps) | 4 | 75%  (thin) |
| Cuidadoso com orçamento | 3 | 33%  (thin) |
| Já testou IA e se decepcionou | 5 | 0%  (thin) |
| Constrói internamente | 2 | 0%  (thin) |
| Segurança em primeiro lugar | 2 | 0%  (thin) |

### By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $518,000 and up | 7 | 43%  (thin) |
| $329,000 to $518,000 | 7 | 43%  (thin) |
| under $329,000 | 6 | 17%  (thin) |

### Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 8 | "Já paguei Copilot e ChatGPT Enterprise e vi alucinação em produção; não assino nada com uma startup em fase inicial antes de ver funcionar no meu repositório. No máximo libero o piloto grátis num time pequeno, e isso não é compra." (P001) · "Já paguei Copilot e ChatGPT Enterprise e vi alucinação; não assino nada nem levo ao CTO antes de ver isso rodando no nosso repositório. Topo o piloto grátis de 30 dias, mas pagar no primeiro mês, não." (P003) |
| habit | 3 | "O fato de rodar no nosso ambiente com a nossa IA tira meu medo do código sair de casa, mas pelo mesmo motivo eu penso: então é um prompt bem feito com Jira e repositório via MCP, e meu time monta isso em uma ou duas sprints com Claude. Não pago R$ 2.500 por mês, para sempre, por algo que dá para construir aqui dentro." (P006) · "R$ 2.500 é troco pro meu orçamento, mas isso é basicamente um agente com MCP lendo Jira e repo usando a nossa própria IA; meu time de plataforma monta uma versão disso em duas sprints. Acabei de fechar Jira e Copilot, não vou pôr mais um fornecedor pequeno e de código fechado na cadeia por algo que dá pra construir em casa." (P016) |
| quality | 1 | "Rodar no nosso ambiente com a nossa IA e escrow resolve boa parte do meu medo de dar o código para uma startup de um fundador só, então eu até toparia o piloto grátis. Mas pagar R$ 2.500/mês todo mês, num trimestre em que estou cortando SaaS, só depois de ver em número que isso economiza horas de dev, e hoje isso é promessa." (P004) |
| need | 1 | "Pelo menos suporta Azure Boards e Azure Pipelines, o que já é raro, e R$ 2.500 não pesa no meu orçamento. Mas meu tech lead já cruza a story com o código no refinamento, e acabei de fechar o Copilot, então não vou abrir outra ferramenta e outro fornecedor para uma dor que eu não sinto." (P020) |

### Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 7 | "Entro no piloto grátis porque a cobertura de Playwright está atrasada e R$ 2.500 é menos que um dia de dev por mês; só sigo pagando se o antes/depois mostrar menos stories reabertas e horas de dev economizadas de verdade." (P002) · "A cobertura de Playwright do meu QA está atrasada e R$ 2.500 por mês é troco perto do custo de um dev; piloto grátis, roda no meu ambiente com a minha chave de IA, então entro no piloto sem pensar muito. Mas só sigo pagando se o time usar de verdade no primeiro mês." (P008) |

### What would flip a no

- Um piloto no nosso repositório em que meus devs confirmem a maioria das afirmações e os PMs usem sem eu precisar cobrar, com queda medida de stories reabertas contra o baseline.
- O piloto no nosso código mostrar que os devs confirmam a grande maioria das afirmações (algo acima de 90%), quase nenhuma regra inventada, e uma queda medida em stories reabertas contra o baseline que eu consiga mostrar ao CTO.
- O piloto de 30 dias mostrar, nos nossos repositórios, queda clara de stories reabertas e uma estimativa de horas de dev economizadas que pague com folga os R$ 2.500 mais o custo de LLM, com a maioria das afirmações confirmada pelos devs.
- Um piloto no nosso próprio repositório maior, com o custo real de tokens medido, os devs confirmando a maior parte das afirmações e uma queda clara de stories reabertas, num formato que a segurança aprove rápido com o pentest e o SBOM já prontos.
- Ver no piloto, no nosso próprio repositório, uma queda medida nas stories que voltam do dev que meu time não consiga reproduzir com um protótipo interno em duas semanas.
- Um piloto no nosso repositório mais sujo em que os devs confirmem mais de 90% das afirmações e o baseline mostre queda real de stories reabertas; com esses números eu assino como Cliente Fundador.
- O piloto de 30 dias rodando no nosso repositório real, mostrando o custo de token por story com teto ligado e quantos testes Playwright gerados passaram sem retrabalho, convertido em horas de QA/dev economizadas que eu consiga levar pro CTO.
- O piloto de 30 dias no nosso repositório mostrando, com números contra o baseline, que as stories reabertas caíram de verdade e que os devs confirmaram a maioria das afirmações, junto com o pacote de segurança (pentest, SBOM, DPA) já pronto para o meu time de segurança aprovar sem rodadas extras.
- Fechar o piloto de 30 dias no nosso repositório com os devs confirmando a grande maioria das afirmações, queda mensurável de stories reabertas contra o baseline, e custo real de tokens perto do anunciado com o teto funcionando.
- Rodar o piloto em um repositório real nosso e ver o antes/depois de stories reabertas com uma queda clara (tipo 20%+), com os devs confirmando a maioria das afirmações, e segurança aprovando rápido por ser só uma Action no nosso pipeline.
- Um piloto em que o baseline de stories reabertas mostre queda real no nosso próprio repositório, e que fique claro que construir internamente com a mesma qualidade de evidência custaria mais do que a licença.
- Ao fim do piloto, ver no baseline que as stories reabertas caíram de verdade e que pelo menos metade dos PMs aceitou a spec revisada sem eu precisar cobrar. Com esse número eu consigo a aprovação do CTO.

Buyers say they would buy **1.0 times** in the first month on average.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

## Pricing

> **Atualização 12/10/2026:** a versão viável do plano mudou três decisões (ver `offer.md` §7 e `cfo.md`). (1) **IA do cliente (BYOK):** a análise roda na assinatura ou API do cliente, no ambiente dele, e a Esteira não paga token; tudo o que este arquivo diz sobre custo de LLM da Esteira e Modo Cofre como opção deixou de valer. (2) **Clientes Fundadores pagam R$ 2.500** com preço travado por 24 meses, não R$ 1.500. (3) **Cliente-alvo inicial:** não reguladas e fora do ecossistema Atlassian. CAC máximo atualizado: R$ 2.125 × 12 ÷ 3 ≈ **R$ 8.500**.


Todos os preços são em R$ por mês, por empresa. Base: 20 compradores simulados (`pricing-curve.md`), concorrentes (`competitors.md`) e, para a margem, o CFO (`/founder-cfo`, ainda pendente).

### O que os compradores disseram (Van Westendorp, 20 respostas simuladas)

| ponto | R$/mês |
|---|---:|
| PMC (abaixo disso parece barato demais) | 546 |
| IPP (tantos acham barganha quanto caro) | 1.531 |
| PME (acima disso a maioria não compra) | 6.998 |
| Medianas: barato demais / barganha / caro / caro demais | 500 / 1.500 / 5.000 / 9.000 |

**Faixa aceitável: R$ ~550 a ~7.000.** Os R$ 2.500 testados ficam **dentro** da faixa.

**Ressalvas honestas:**
- 18 dos 20 deram exatamente R$ 1.500 como "barganha" e 500 como "barato demais". Isso é ancoragem do modelo, não sinal de mercado. A faixa serve para escolher o que testar, não como prova.
- O OPP coincidiu com o PMC (546), um artefato de respostas muito parecidas no "barato demais". Não use como preço.
- **Nenhum comprador recusou por preço.** 13 de 17 recusaram por confiança/segurança. Mexer no preço não resolve o problema principal (isso fica para `/founder-offer`).
- O segmento regulado deu tetos bem mais altos (R$ 12–20 mil como "caro demais"), o que sustenta um degrau enterprise/self-hosted.

### O que a concorrência cobra (preços públicos, em dólar)

Ver `competitors.md`. Mesma tarefa, comparada em base equivalente:

- **Por assento:** Rovo Dev US$ 20/dev/mês ([fonte](https://www.atlassian.com/software/rovo-dev/pricing)), Copilot Business/Enterprise US$ 19/39 por usuário ([fonte](https://getdx.com/blog/ai-coding-assistant-pricing/)), Copilot4DevOps a partir de US$ 30/usuário ([fonte](https://www.capterra.co.nz/software/1066066/copilot4devops)). Em um time de 50 devs + 5 PMs, um assento de US$ 20–39 para todos dá **US$ 1.100–2.150/mês**. Nenhum deles entrega o fluxo do PM contra o código.
- **Por uso / sob consulta:** Bito AI Architect, Devin, Swimm.
- **De graça agora:** Allstacks Product Studio (temporário). É o risco de preço mais direto.
- **QA gerenciado:** QA Wolf, ~US$ 4–10 mil/mês, segundo um concorrente.

**Leitura:** cobrar **por empresa, com preço fixo e previsível** diferencia contra a confusão de créditos e escala com o número de devs sem cobrar assento de dev. O que pesa contra é o custo de LLM em monorepos grandes (objeção levantada por 4 compradores). O preço por empresa precisa de um limite justo de uso (ver ladder).

### O que o negócio precisa

**Pendente.** Ainda não há `founder/numbers.json`. A variável que decide a margem é **o custo de LLM + infra por análise de story × stories analisadas por cliente por mês**, que ninguém mediu. O `/founder-cfo` vai rodar a margem nos três preços candidatos (R$ 2.500, R$ 3.900 e R$ 6.500) e este arquivo é atualizado se algum não fechar.

### 1. O preço

**Plano Time: R$ 2.500/mês por empresa** (anual) ou **R$ 2.900 no mensal**.

- Fica perto do 1º terço da faixa aceitável (550–7.000), acima do IPP (1.531) e longe do PME, o que deixa espaço para subir depois de ter prova.
- Para um time de 50 devs, fica na mesma ordem de grandeza do que um assento de IA de dev custa para todos, mas entrega algo que nenhum deles entrega ao PM.
- Comparado com o custo da dor que os compradores citaram ("menos que uma semana de um QA"; "duas stories voltaram na última sprint"), o valor é fácil de justificar *se* o piloto medir o retrabalho evitado.
- **Margem: a confirmar no `/founder-cfo`.** Se o custo de LLM por cliente passar de ~30% do preço, subir o plano de entrada ou reduzir o limite de análises.

### 2. A escada (good / better / best)

| plano | R$/mês | para quem | motivo para subir |
|---|---:|---|---|
| **Piloto** | grátis por 30 dias | qualquer empresa do perfil | 1 board + 1 repositório não crítico, relatório de acerto validado pelos devs |
| **Time** | 2.500 (anual) / 2.900 (mensal) | scale-up de 20–80 devs | refinamento PM contra o código, 1 gerenciador de tarefas + 1 provedor, até 10 PMs, ~300 análises de story/mês (limite a validar no CFO) |
| **Business** | 5.500 | 80–200 devs, ou quem precisa de QA | + geração de Playwright para QA, mapa para dev, múltiplos provedores, SSO, DPA/LGPD padrão, análises ampliadas |
| **Enterprise / Self-hosted** | a partir de 9.000 (sob proposta) | reguladas, "segurança em primeiro lugar" | roda na nuvem do cliente (VPC/Azure do cliente) com o LLM do próprio cliente, questionário de segurança, suporte dedicado. **É o degrau que derruba a objeção nº 1 do painel.** |

O Business fica abaixo do PME (6.998). O Enterprise fica acima da faixa geral, mas dentro do que o segmento regulado declarou (tetos de 12–20 mil). Testar com cuidado.

### 3. Oferta de abertura

**Programa "Clientes Fundadores": 5 vagas.** O plano Time ou Business sai com **40% de desconto por 12 meses** (Time a R$ 1.500/mês) em troca de: (a) um piloto com métricas de acerto e retrabalho medidas junto com o time do cliente; (b) autorização para virar caso de uso com números; (c) uma call de feedback por mês.

- **Termina** quando as 5 vagas forem preenchidas ou em **31/03/2027**, o que vier primeiro. Depois volta ao preço cheio, que já é público desde o primeiro dia (não é âncora falsa).
- Não ensina o mercado a esperar desconto: o desconto é troca por prova, não liquidação.

### 4. O que testar com compradores reais

1. **R$ 2.500 vs. R$ 3.900** no plano Time. Duas versões de landing page/one-pager mandadas para listas diferentes de Heads de Produto/CTOs (outbound), medindo agendamento de piloto e, ao fim do piloto, conversão em contrato. Ver `/founder-launch`.
2. **Por empresa vs. por PM** (ex.: R$ 450/PM/mês). Perguntar nas 10–15 primeiras conversas de descoberta qual formato passa mais fácil no orçamento e no procurement.
3. **Disposição a pagar pelo self-hosted.** Nas conversas com reguladas, perguntar o preço com e sem self-hosted e se ele é condição para fechar.

### 5. As objeções de preço do painel (literais)

Há poucas objeções de preço; quase todas são de confiança. As três que tocam em preço:

1. *"Acabei de fechar Jira e Copilot e não tenho como provar para o CFO que isso reduz retrabalho, porque hoje nem meço retrabalho. [...] pagar R$ 2.500 por mês sem número na mão eu não assino."* (P018)
2. *"Acabei de passar semanas renegociando Jira e Copilot; não vou levar ao CTO mais uma linha de R$ 30 mil por ano sem conseguir mostrar retorno."* (P016)
3. O custo de tokens num monorepo grande sob preço fixo: o comprador teme "análise rasa, aumento de preço depois ou a empresa ficar sem caixa" (P010, resumo do moderador).

**Resposta para o marketing:** o piloto entrega o número de retrabalho que o comprador não tem hoje (antes/depois), o preço é fixo com um limite claro de análises, e não há cobrança por token.

## The offer

Método: lens de Ofertas (resumo do framework de *$100M Offers*; ver `founder-board/lenses.md`). Insumos: `panel/results.md` (v1), `board.md`, `competitors.md`, `pricing.md`. Os custos são estimativas qualitativas: ainda não há `numbers.json`, e o `/founder-cfo` valida.

### 1. Lista de problemas (nas palavras do comprador)

**Antes de comprar**
1. "Não vou dar acesso ao código para uma startup de um fundador só." (13 de 20 no painel v1)
2. "Onde o código é processado, qual LLM vê, por quanto tempo fica guardado?"
3. "Sem SOC 2 / ISO 27001, meu time de segurança nem abre o processo."
4. "Segurança levou 3 meses no último fornecedor; nem o piloto grátis começa este mês."
5. "E se o fundador sumir ou a empresa fechar?"
6. "Já paguei por IA que alucinou no nosso código."
7. "A Atlassian / o GitHub vai lançar isso de graça dentro do Jira."
8. "Meu dev monta isso com Claude + MCP em duas sprints."
9. "Não meço retrabalho hoje, não consigo provar ROI para o CFO."
10. "Acabei de renegociar Jira e Copilot, não tem orçamento novo."
11. "Quanto custa em tokens num monorepo grande?"

**Durante**
12. "Se a IA afirmar uma regra errada, o PM leva para a planning e eu perco a confiança do time."
13. "Meus PMs não vão adotar mais uma ferramenta."
14. "Quem conecta o repositório? O PM não tem token."
15. "O suporte a Azure DevOps vai ser pior que o de GitHub."
16. "Os testes Playwright gerados vão quebrar no meu CI."

**Depois**
17. "Se eu cancelar, perco o que foi gerado?"
18. "O preço fixo vai subir quando perceberem o custo de LLM."
19. "Ninguém usa depois do 1º mês."

### 2. Soluções, pontuadas e cortadas

Valor e custo vão de 1 a 5, onde custo 5 é o mais caro de entregar.

| # | solução | resolve | valor | custo | decisão |
|---|---|---|---:|---:|---|
| A | Evidência arquivo/trecho em toda afirmação + "não encontrei" explícito | 6, 12 | 5 | 2 | **núcleo** |
| B | **Modo Cofre:** chave de LLM do cliente + retenção zero + hospedagem BR | 1, 2, 11 | 5 | 2 | **bônus** |
| C | Container que roda na nuvem do cliente | 1, 2, 4 | 5 | 4 | **bônus só no Enterprise** (caro para fundador solo) |
| D | **Kit de Segurança** (DPA/LGPD, questionário respondido, diagrama de dados) | 3, 4 | 4 | 1 | **bônus** |
| E | **Baseline de retrabalho** antes/depois a partir do histórico do Jira/Azure Boards | 9, 10 | 4 | 2 | **bônus** |
| F | Tudo gerado fica no Jira/repo do cliente (sem lock-in) | 5, 17 | 3 | 1 | **bônus** |
| G | Garantia de acerto 85% nos 90 primeiros dias pagos | 6, 12, 19 | 4 | 2–3 (a modelar) | **garantia** |
| H | Preço fixo por empresa, sem cobrança por token | 11, 18 | 3 | 3 (risco de margem) | manter, com limite de análises |
| I | Comentário/integração dentro do card do Jira/Azure Boards | 13 | 4 | 3 | roadmap v1.1 |
| J | SOC 2 Type I | 3 | 5 | 5 (meses e dinheiro) | **cortado agora**; pentest independente como passo intermediário |
| K | Setup feito pelo fundador em call de 30 min | 14 | 3 | 2 | incluso no piloto |
| L | Comparação lado a lado com o Rovo no piloto | 7 | 3 | 2 | material de vendas, não promessa |

### 3. O stack

**Nome da oferta: "Piloto Spec à Prova de Código"**

- **Núcleo:** a story confrontada com o código real, com cada afirmação ligada ao arquivo e ao trecho, e "não encontrei" quando não há evidência. Para o dev, o mapa da tarefa; para o QA, testes Playwright.
- **Bônus 1, Modo Cofre** (mata "onde vai o meu código"): roda com a chave de LLM da empresa, sem armazenar código, hospedado no Brasil. Container na nuvem do cliente no plano Enterprise.
- **Bônus 2, Kit de Segurança no primeiro contato** (mata "segurança leva 3 meses"): DPA/LGPD assinável, questionário de fornecedor respondido, diagrama de dados. Diz com honestidade: "ainda não temos SOC 2".
- **Bônus 3, Baseline de Retrabalho** (mata "não consigo provar ROI"): antes do piloto, medimos as stories que voltaram ou foram reabertas nos últimos 3 meses; no fim, entregamos o antes/depois.
- **Bônus 4, Sem lock-in** (mata "e se a empresa fechar"): tudo que é gerado fica no Jira e no repositório do cliente.
- **Garantia:** nos primeiros 90 dias pagos, se os devs confirmarem menos de 85% das afirmações em uma amostra de 20 stories, devolvemos os 3 meses. **Custo a modelar no CFO.** Se 20% dos clientes acionarem a garantia, o custo é 3 meses de receita × 20% ≈ 0,6 mês de receita por cliente adquirido.
- **Urgência verdadeira:** Clientes Fundadores, 5 vagas a R$ 1.500/mês por 12 meses em troca de caso de uso. Termina com as 5 vagas preenchidas ou em 31/03/2027.

### 4. Equação de valor (antes → depois)

| elemento | v1 | v2 | o que moveu |
|---|---:|---:|---|
| Resultado dos sonhos (spec que bate com o código, menos retrabalho) | 7 | 8 | Baseline de Retrabalho torna o resultado mensurável |
| Probabilidade percebida | 3 | 5 | Evidência arquivo/trecho, garantia de 85%, baseline. **Continua baixa:** sem SOC 2, sem cliente de referência |
| Tempo até o resultado | 4 | 5 | Kit de Segurança encurta a aprovação; setup em call. A aprovação de segurança segue em semanas |
| Esforço e sacrifício | 3 | 5 | Modo Cofre e sem lock-in reduzem o risco percebido; o processo de fornecedor continua pesado |

### 5. Re-teste (mesma seed 677932, os mesmos 20 compradores)

| | v1 (pitch original, 3 papéis) | v2 (oferta) |
|---|---:|---:|
| Compram | **3 / 20 (15%)** | **3 / 20 (15%)** |
| Passam por confiança | 13 | 11 |
| Passam por hábito (Rovo / construir em casa) | 3 | 5 |
| Outros | 1 (necessidade) | 1 (timing) |

**A taxa de compra não se mexeu.** Os mesmos três compram (early adopters, dois deles pela dor de cobertura Playwright).

**O que mudou foi o tipo de objeção:**
- **Caiu:** "onde vai o meu código / qual LLM vê" quase sumiu. Vários compradores que antes recusavam até o piloto agora **aceitariam o piloto grátis e levariam o Kit de Segurança ao time** (P003, P004, P005, P007, P014, P015, P018), mas não pagam no mês 1.
- **Subiu para o topo:** **"startup em fase inicial, sem SOC 2, sem cliente de referência"**. É risco de fornecedor, não de produto. Nenhum bônus resolve isso; só tempo, um pentest, referências e (para os regulados) SOC 2.
- **Objeção nova criada pela oferta:** no Modo Cofre, o **custo de tokens vai para a conta do cliente**, e "sem cobrança por token" soa como meia-verdade (P005, P010, P013, P014). **Corrigir:** publicar uma estimativa de custo de tokens por story e por tamanho de repositório, medida no piloto.
- **Hábito subiu:** quem está no ecossistema Atlassian quer ver o Rovo primeiro e exige um **lado a lado com o Rovo** no piloto.

**Leitura:** o gargalo não é a oferta nem o preço. É **confiança no fornecedor** num mercado em que a compra passa por segurança. A oferta transformou um "não" em "piloto sim, pagar depois", e isso já é o funil certo para um fundador solo: o primeiro objetivo são **pilotos que virem referências**, não contratos no mês 1. Isso empurra o plano para: (1) começar por early adopters e empresas não reguladas; (2) usar os 5 Clientes Fundadores para gerar referências; (3) só então atacar os regulados com pentest e SOC 2 em andamento.

Lembrete: são compradores simulados. A taxa de 15% é um teto e serve só para comparar versões, não como previsão.

### 6. Teste "só PM" (11/10/2026, mesma seed 677932)

Pitch: `pitch-v3-pm.md`. A mesma oferta da v2 (evidência, Modo Cofre, Kit, baseline, garantia, Fundadores, R$ 2.500), **sem** mapa de dev nem testes Playwright. Resultados em `panel-v3-pm/`.

| | v1 (3 papéis) | v2 (3 papéis + oferta) | **v3 (só PM + oferta)** |
|---|---:|---:|---:|
| Compram | 3 (15%) | 3 (15%) | **2 (10%)** |
| Quem compra | P008, P009, P013 | P008, P009, P013 | **P010, P013** |
| Passam por confiança | 13 | 11 | 10 |
| Passam por hábito (Rovo / construir em casa) | 3 | 5 | 5 |
| Passam por "não é a minha dor" (need) | 1 | 0 | **2** |
| Mediana de "começa a ficar caro" / "caro demais" (R$) | 4.750 / 8.500 | 5.000 / 9.000 | **4.000 / 7.000** |
| Faixa aceitável (Van Westendorp) | 546–6.998 | — | **546–5.014** |

**O que mudou:**
- **Saíram os dois compradores de QA** (P008, P009). Os dois disseram literalmente que a dor deles é a cobertura Playwright e que o pitch diz que não gera testes.
- **Entrou um comprador novo: P010**, CTO em Azure DevOps. A mensagem focada (Azure Boards + Azure Repos, baseline para mostrar ao board) pesou mais para ele que a lista de 3 papéis.
- **P013 continua comprando**, sempre pela mesma dor do PM ("duas stories voltaram porque a regra já existia").
- **A disposição a pagar caiu ~15–20%.** Com R$ 2.500, três compradores (P004, P009, P020) já ficaram no ponto de "começa a ficar caro".
- **A barreira de confiança não mudou.** Cortar o escopo não resolve "startup sem SOC 2" nem "espero o Rovo".

**Leitura:** focar só no PM **não melhora a conversão simulada** (10% vs. 15%) e **reduz o preço aceitável**. Mas troca o perfil de quem compra: sai o comprador de QA (mercado lotado: QA Wolf, Autify, os agentes do Playwright) e entra o CTO em Azure DevOps (o gap competitivo mais claro de `competitors.md`). Com amostras de 20, **a diferença de 1 comprador é ruído**: 15% vs. 10% não separa as duas versões.

**Recomendação:** não decidir a porta de entrada pelo painel. Levar as duas versões ao teste real de `launch.md` (as 15–30 conversas até 18/12): metade das demos começa pelo refinamento do PM, metade pelos testes Playwright. Ver qual gera mais Clientes Fundadores pagos. O núcleo técnico é o mesmo (story × código com evidência), então isso não custa produto extra; muda só a demo e a mensagem.

### 7. Busca de viabilidade (11–12/10/2026)

O objetivo era mexer só em **decisões do fundador** (entrega, oferta, preço, cliente-alvo) até o plano passar, sem alterar premissas que não dependem dele (rampa, custo por token). Mesma seed 677932, 20 compradores por versão.

| versão | o que mudou | compram | quem compra |
|---|---|---:|---|
| v1 | pitch original, 3 papéis | 3 (15%) | P008, P009, P013 |
| v2 | + oferta (Cofre, Kit, baseline, garantia) | 3 (15%) | P008, P009, P013 |
| v3 | só PM | 2 (10%) | P010, P013 |
| v4 | **roda no ambiente do cliente com a IA dele + motor open source** | 4 (20%) | P002, P009, P010, P013 |
| v5 | código **auditável** (não livre) + garantia de continuidade | 4 (20%) | P008, P009, P010, P013 |
| v6 | cliente-alvo: não reguladas, fora do ecossistema Atlassian + IA na assinatura ou API do cliente + Fundadores com preço travado (sem desconto) | 8 (40%) | P004, P008, P010, P012, P013, P017, P018, P019 |
| **v7 (atual)** | **código fechado** (sem open source/auditável): tráfego restrito verificável no firewall, pentest, SBOM, código em escrow | **7 (35%)** | P002, P008, P010, P012, P013, P018, P019 |

**O que destravou:**
1. **Rodar no ambiente do cliente, com a IA dele (BYOK):** zerou a objeção "o código vai para uma startup" e o custo de LLM da Esteira.
2. **Código fechado (decisão do fundador, v7):** o open source da v4 gerou o "pego o motor e monto em casa". Na v7 a confiança vem de tráfego restrito verificável, pentest, SBOM e escrow, e a taxa ficou em 35% (vs. 40% na v6, diferença de 1 comprador, dentro do ruído).
3. **Garantia de continuidade:** respondeu a "e se a startup fechar".
4. **Escolher o cliente certo:** os segmentos "regulado" e "preso ao Atlassian" deram 0% em todas as versões. Tirá-los do alvo inicial (não do mercado para sempre) dobrou a taxa.

**O que ainda segura os 12 que passam:** confiança em fornecedor jovem / IA que já alucinou (8), construir em casa (2), qualidade dos testes (1), não sente a dor (1). Quase todos **aceitariam o piloto grátis**. O funil real é piloto → conversão, e a taxa de conversão do piloto é o número a medir em `launch.md`.

**Ressalvas:**
- **Mercado menor.** Ainda não se sabe quantas scale-ups brasileiras não reguladas, fora do Atlassian, com 20–200 devs existem. Para o ano 1 bastam 10 clientes, mas isso precisa ser verificado na lista de prospecção.
- **Compradores simulados tendem a ser agradáveis.** 40% é teto. O teste real (≥ 3 Fundadores pagos em ≤ 30 conversas) é o que conta.
- **A v6 mudou cliente-alvo e oferta juntos.** O ganho vem principalmente do cliente-alvo (v5 → v6 com quase a mesma oferta).


Versões anteriores (pitch, painel, customer) estão em `historico/`.

## The numbers

**O que mudou em relação à versão anterior:**
1. **IA do cliente (BYOK, como no Maestri).** A análise roda na assinatura (Claude, ChatGPT) ou na chave de API do próprio cliente. O custo de LLM da Esteira por cliente cai de R$ 440 para **R$ 0**.
2. **IA de desenvolvimento do fundador:** R$ 1.500 → **R$ 600/mês** (estimativa: uma assinatura tipo Claude Max). Os pilotos rodam na IA do cliente.
3. **Preço de R$ 2.500 para todos.** Os Clientes Fundadores ganham preço travado por 24 meses e entram no conselho de roadmap, em vez de 40% de desconto. É uma decisão de oferta; o painel v6 testou esse pitch.

**Leia antes da tabela:** a ferramenta escreve "$", mas os valores são **R$**. "a day" = **clientes ativos no mês**. Os custos fixos, a abertura e a rampa continuam sendo **estimativas** (`cfo-sources.md`). Não é aconselhamento financeiro ou tributário: um contador confere o Simples, o fator R e o pró-labore.

- **A margem.** Cada cliente deixa **R$ 2.125 de contribuição (85%)**. O break-even é de **5 clientes**. Com 10 clientes, a margem de lucro é de **48%**.
- **Ano 1:** lucro operacional de **+R$ 5.275** sobre R$ 137.500 de receita. Os meses 1–6 dão prejuízo; o resultado vira positivo a partir do 6º cliente (mês 8).
- **Caixa:** **R$ 66.050** antes de o negócio se pagar (abertura de R$ 31.500 + prejuízo acumulado até o mês 6). O investimento inicial **não volta no ano 1**: no mês 12 ainda faltam R$ 26.225.
- **A linha que mais pesa agora é a rampa (velocidade de vendas), não o custo.** O preço 10% menor leva o ano 1 a **−R$ 8.475**. Com 20% menos clientes, o ano 1 vai a **−R$ 18.100**. **A viabilidade depende de chegar a 10 clientes pagantes até o mês 12.**
- **Custo transferido ao cliente:** ~US$ 0,40 por story na IA dele (~R$ 450/mês para 200 stories). Não está no nosso P&L, mas entra na conta de ROI do comprador e precisa ser medido no piloto (objeção recorrente no painel).

**Três jeitos de ganhar folga** (rodados em versões anteriores ou nesta):
| alavanca | efeito |
|---|---|
| Pró-labore de R$ 6.000 → R$ 3.000 nos primeiros 12 meses | +R$ 36.000 no ano 1 (cálculo direto: 12 × R$ 3.000) |
| Preço R$ 3.000 a partir do 6º cliente (dentro da faixa do painel: 520–6.017) | testar com compradores reais antes de assumir |
| Plano Business R$ 5.500 (QA/Playwright) para 2–3 clientes | cada cliente Business soma R$ 3.000/mês de contribuição |

**Condições do board sobre dinheiro:**
- [x] *Custo de LLM compatível com o preço*: **atendido por design**. Zero para a Esteira (BYOK); o custo do cliente fica visível com teto.
- [x] *Preço e garantia que caibam na conta*: **atendido**. Contribuição de 85% com a reserva de garantia incluída.
- [ ] *CAC estimado*: **não atendido**. A venda é feita pelo fundador; falta dado real de conversão (`launch.md`).

---

## Unit economics: Esteira (SaaS B2B, Brasil). Unidade = 1 cliente pagante ativo no mês. Como days_per_month = 1, os campos *_per_day significam clientes ativos no mês. Preço R$ 2.500 para todos; Clientes Fundadores ganham preço travado por 24 meses em vez de desconto.

Every number below comes from the input file. Nothing is looked up or guessed.

### One cliente-mês

| line | per cliente-mês |
| --- | ---: |
| Price | $2,500.00 |
| LLM: zero, modelo BYOK (a IA roda na assinatura ou API do próprio cliente, como no Maestri) | -$0.00 |
| Infra por cliente: indexação, compute, storage (estimativa) | -$150.00 |
| Imposto sobre receita, Simples Nacional ~6% (estimativa, confirmar com contador) | -$120.00 |
| Cobrança via Asaas: Pix/boleto R$1,99 + NF R$0,49 por mês (asaas.com/precos-e-taxas) | -$5.00 |
| Reserva para a garantia de 85% (20% acionam x 3 meses / 12 meses de vida) | -$100.00 |
| **Contribution** (what each cliente-mês leaves to pay the fixed costs) | **$2,125.00** (85%) |

### The margin that matters

Fixed costs: $9,300 a month (Pró-labore do fundador (estimativa; 0 se bootstrap puro) $6,000, Infra base de cloud e ambientes (estimativa) $1,000, Ferramentas SaaS: GitHub, e-mail, CRM, domínio, monitoramento (estimativa) $1,200, Contabilidade (estimativa) $500, IA do fundador para desenvolvimento (estimativa: 1 assinatura tipo Claude Max ~US$100 x R$5,50); pilotos rodam na IA do cliente $600).

- **Break-even: 5 cliente-mêss a day.** Below that you lose money every month.
- **Profit margin at your plan** (10 a day): **48%** of every sale, after every cost.
- Capacity: 15 a day.

### Year 1, month by month

| month | cliente-mêss a day | revenue | profit | cumulative (after $31,500 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $0 | -$9,300 | -$40,800 |
| 2 | 0 | $0 | -$9,300 | -$50,100 |
| 3 | 1 | $2,500 | -$7,175 | -$57,275 |
| 4 | 2 | $5,000 | -$5,050 | -$62,325 |
| 5 | 3 | $7,500 | -$2,925 | -$65,250 |
| 6 | 4 | $10,000 | -$800 | -$66,050 |
| 7 | 5 | $12,500 | $1,325 | -$64,725 |
| 8 | 6 | $15,000 | $3,450 | -$61,275 |
| 9 | 7 | $17,500 | $5,575 | -$55,700 |
| 10 | 8 | $20,000 | $7,700 | -$48,000 |
| 11 | 9 | $22,500 | $9,825 | -$38,175 |
| 12 | 10 | $25,000 | $11,950 | -$26,225 |

- **Year 1 operating profit: $5,275** on $137,500 of revenue.
- After the $31,500 startup spend: -$26,225.
- Startup money earned back: not within year 1.
- Cash you need before it pays for itself: **$66,050**.

### What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 48% | 5 | $5,275 |
| Price -10% | 42% | 5 | -$8,475 |
| Volume -20% | 38% | 5 | -$18,100 |
| Unit costs +15% | 46% | 5 | $2,181 |

### Red flags

- The startup spend is not earned back within year 1.

## Marketing

> **Atualização 12/10/2026:** a versão viável do plano mudou três decisões (ver `offer.md` §7 e `cfo.md`). (1) **IA do cliente (BYOK):** a análise roda na assinatura ou API do cliente, no ambiente dele, e a Esteira não paga token; tudo o que este arquivo diz sobre custo de LLM da Esteira e Modo Cofre como opção deixou de valer. (2) **Clientes Fundadores pagam R$ 2.500** com preço travado por 24 meses, não R$ 1.500. (3) **Cliente-alvo inicial:** não reguladas e fora do ecossistema Atlassian. CAC máximo atualizado: R$ 2.125 × 12 ÷ 3 ≈ **R$ 8.500**.


Base: `panel/results.md` e `panel-v2/results.md` (20 compradores simulados, duas versões), `competitors.md`, `offer.md`, `pricing.md`, `cfo.md`. As citações do painel são pesquisa e **nunca** aparecem em anúncio como depoimento de cliente.

### O que a evidência diz

- **Quem compra:** early adopters de ferramentas de IA (3 de 3 compram nas duas versões), em scale-ups **não reguladas**. Dois deles compraram pela **dor de cobertura Playwright atrasada**, o outro pela **story que volta porque a regra já existia**.
- **Quem não compra agora:** reguladas (0%), presos ao Atlassian (esperam o Rovo), "constrói em casa", "já se decepcionou com IA". Não são o primeiro público.
- **Objeções a responder** (re-teste da oferta): startup sem SOC 2 nem referência; quem paga os tokens no Modo Cofre; "o Rovo vai fazer"; "monto em casa"; "não meço retrabalho".
- **Gap** (`competitors.md`): confiança verificável (arquivo/trecho + "não encontrei") para PM não técnico; stack Azure DevOps puro; Brasil/português.

### 1. Posicionamento

**A (recomendada)**
> Para Heads de Produto e CTOs de scale-ups brasileiras que já testam IA e veem stories voltarem do dev "porque a regra já existia de outro jeito", a Esteira é o revisor de spec que confronta cada story com o código real e mostra a prova (arquivo e trecho), diferente de assistentes de código feitos para o dev, que respondem com confiança sem mostrar de onde tiraram.

*Evidência:* as duas razões de compra foram retrabalho e Playwright; a objeção nº 1 durante o uso é a IA afirmar regra errada (P003, P019); a reclamação nº 1 dos concorrentes é contexto errado dito com confiança.

**B (pela dor de QA)**
> Para times com cobertura Playwright atrasada, a Esteira transforma cada user story em testes Playwright ancorados no código real, diferente de geradores que só leem o texto do ticket.

*Evidência:* 2 dos 3 compradores. **Risco:** é um campo lotado (QA Wolf, Autify, TestStory, os agentes do próprio Playwright). Usar como porta de entrada secundária, não como posicionamento.

**C (pelo stack)**
> Para empresas em Azure DevOps, a Esteira é a única ferramenta que confronta story e código com Azure Boards + Azure Repos, onde a integração do Copilot não chega.

*Evidência:* o Copilot com Azure Boards não suporta Azure Repos (`competitors.md`). **Mas** os 3 compradores Azure do painel passaram. Usar como mensagem de nicho em outbound, não como posicionamento principal.

**Recomendo A**, com B como hook de entrada para QA e C como segmentação de lista.

### 2. Canais

| canal | por que serve a este comprador | custo | como saber que funcionou | decisão |
|---|---|---|---|---|
| **Outbound do fundador no LinkedIn + e-mail** para Heads de Produto/CTOs de scale-ups não reguladas de 20–80 devs | O público é listável, B2B, compra com conversa; o fundador vende o piloto | tempo + ferramenta de prospecção (~R$ 300/mês, estimativa) | ≥ 5 conversas qualificadas/semana; ≥ 20% viram piloto | **COMEÇAR** |
| **Conteúdo "Story vs. Código" em repositórios open source**: o fundador pega uma issue real de um projeto open source conhecido e mostra a análise com arquivo/trecho, em post + vídeo curto no LinkedIn | Demonstra o produto **sem pedir acesso ao código de ninguém**, ataca a objeção nº 1 (confiança) e a nº 2 (alucinação) de uma vez | tempo | comentários de PMs/CTOs, pedidos de piloto via DM, ≥ 2 leads/semana | **COMEÇAR** |
| **Comunidades e meetups de produto e de QA/Playwright no Brasil** (falar, demonstrar ao vivo) | Early adopters frequentam; a demo ao vivo gera confiança que post não gera | inscrição/viagem (~R$ 1.500–2.500 por evento, estimativa) | leads com nome por evento; pilotos agendados em 2 semanas | **COMEÇAR** (1 por mês) |
| Mídia paga (LinkedIn Ads, Google) | B2B caro, ciclo longo; sem prova social ainda, vira custo alto por lead frio | alto | | **NÃO AGORA**: depois de 3 casos de uso |
| Reguladas (fintech/seguros) | 0% no painel; exigem SOC 2/pentest e referência | | | **NÃO AGORA**: depois do pentest e de 2 referências |
| Atlassian Marketplace / Azure Marketplace | Distribuição boa, mas exige app polido e revisão | médio | | **Mês 4+** |
| SEO / blog | Demora meses | baixo | | **NÃO AGORA** |

### 3. Campanha de 30 dias

**Abertura do programa de pilotos ("lançamento"): segunda, 01/02/2027.** Premissa: MVP (PM + 1 board + 1 provedor), Kit de Segurança e Modo Cofre (chave do cliente) prontos até 25/01. `/founder-launch` confirma a data. **Clientes Fundadores** (5 vagas a R$ 1.500/mês por 12 meses) até 31/03/2027 ou até preencher.

| data | canal | o que sai | mensagem / hook |
|---|---|---|---|
| seg 18/01 | LinkedIn (fundador) | Post de abertura: por que estou construindo isto | Hook 1 |
| ter 19/01 | Outbound | Montar lista: 150 Heads de Produto/CTOs, scale-ups não reguladas, 20–80 devs; marcar quem usa Azure DevOps | |
| qua 20/01 | LinkedIn | 1º "Story vs. Código" em repositório open source (carrossel) | Hook 2 |
| qui 21/01 | Outbound | 30 convites de conexão personalizados | |
| sex 22/01 | LinkedIn | Bastidor: como a ferramenta diz "não encontrei" | Hook 3 |
| seg 25/01 | E-mail | 1º e-mail para quem aceitou: convite para ver a demo em 20 min | Hook 4 |
| ter 26/01 | LinkedIn | Vídeo de 60 s: story → divergência → arquivo/trecho | Hook 2 (vídeo) |
| qua 27/01 | Outbound | 30 convites + follow-up dos de 21/01 | |
| qui 28/01 | LinkedIn | Post: o Kit de Segurança aberto (o que tem, o que ainda não tem: SOC 2) | Hook 5 |
| sex 29/01 | Comunidade | Pedir espaço de 15 min num meetup de produto ou QA de fevereiro | |
| **seg 01/02** | LinkedIn + e-mail | **Abertura do programa de pilotos + 5 vagas de Clientes Fundadores (até 31/03)** | Hook 6 |
| ter 02/02 | Outbound | Mensagem direta aos 20 mais engajados: oferecer o piloto | Hook 7 |
| qua 03/02 | LinkedIn | 2º "Story vs. Código" (outro repo, outra linguagem) | Hook 2 |
| qui 04/02 | Outbound | 30 convites (lote Azure DevOps) | Hook 8 |
| sex 05/02 | LinkedIn | Post sobre o custo de tokens no Modo Cofre: tabela estimada por tamanho de repo | Hook 9 |
| seg 08/02 | E-mail | Follow-up dos pilotos oferecidos | Hook 4 |
| ter 09/02 | LinkedIn | Post para QA: story → testes Playwright ancorados no código | Hook 10 |
| qua 10/02 | Outbound | 30 convites + follow-ups | |
| qui 11/02 | LinkedIn | Bastidor: o que aprendi nas 10 primeiras demos (sem citar nome de empresa sem permissão) | |
| sex 12/02 | LinkedIn | Post "Rovo, Copilot e Esteira: o que cada um faz pelo PM" (comparação justa, com links) | Hook 8 |
| seg 15/02 | E-mail | Lembrete: vagas de Fundador (quantas restam, número real) | Hook 6 |
| ter 16/02 | Meetup/comunidade | Demo ao vivo de 15 min, se conseguida | Hook 2 |
| qua 17/02 | LinkedIn | Fechamento do mês: números reais do programa (pilotos iniciados, % de afirmações confirmadas) | |

**Quando não houver novidade:** um novo "Story vs. Código" num repo open source; um erro que a ferramenta cometeu e como foi corrigido (honestidade gera confiança); um bastidor do Kit de Segurança; a pergunta da semana que um CTO fez na demo.

### 4. Dez hooks

Cada hook responde a uma objeção ou usa uma razão de compra do painel.

1. **"Duas stories voltaram do dev na última sprint porque a regra já existia. Estou construindo uma forma de o PM ver isso antes."** (razão de compra: retrabalho)
2. **(vídeo, 3 s)** "Colei esta issue de um projeto open source. Em 40 segundos: o que já existe, onde, e onde a issue erra." (confiança: demo sem acesso ao seu código)
3. **"A frase mais importante que uma IA pode dizer para um PM: 'não encontrei'."** (alucinação dita com confiança)
4. **(e-mail, assunto)** "20 minutos: sua story contra o seu código, com o arquivo e o trecho" (prova antes de compra)
5. **"Somos uma startup de um fundador. Por isso o seu código nunca fica com a gente."** (startup pequena / onde vai o código)
6. **"5 empresas. R$ 1.500/mês por 12 meses. Em troca: números reais. Até 31/03."** (urgência verdadeira)
7. **"Você não mede retrabalho hoje? O piloto mede para você: antes e depois, no seu próprio Jira."** (não consigo provar ROI)
8. **"Azure Boards + Azure Repos: onde a IA do GitHub não chega."** (stack Azure / "o Copilot já faz")
9. **"Quanto custa em tokens, de verdade: a tabela por tamanho de repositório."** (custo de tokens no Modo Cofre)
10. **"Sua cobertura de Playwright está atrasada? Cada story vira teste, ancorado no código que existe."** (razão de compra: QA)

### 5. Orçamento e números

**Orçamento de lançamento: R$ 5.000** (linha "Lançamento" de `numbers.json`).

| item | R$ |
|---|---:|
| Ferramenta de prospecção/e-mail (3 meses) | 900 |
| 2 eventos/meetups (inscrição + deslocamento) | 2.600 |
| Landing page + domínio + gravação de vídeos | 1.000 |
| Reserva | 500 |

**O máximo que dá para pagar por cliente (CAC):**
- No SaaS, "compras por comprador" vira **meses de vida**. O painel não mede isso. Uso a premissa de 12 meses de vida média de `cfo-sources.md` (estimativa).
- **Cenário-base** (`cfo.md`, revisado com preços reais de LLM e cobrança): contribuição de R$ 1.185 × 12 meses = R$ 14.220 de contribuição por cliente. Gastando no máximo 1/3 disso para adquirir, o **CAC máximo fica em ~R$ 4.740**.
- **Cenário recomendado** (Modo Cofre + R$ 2.500): contribuição de R$ 2.125 × 12 = R$ 25.500, e o **CAC máximo fica em ~R$ 8.500**.
- Hoje o CAC é quase só tempo do fundador (já dentro do pró-labore) mais ~R$ 500/mês de ferramentas e eventos. Mídia paga só faz sentido no cenário recomendado.

**Os três números da semana:**

| número | meta | sinal de "mude algo" |
|---|---|---|
| Conversas qualificadas (call com Head de Produto/CTO do perfil) | ≥ 5/semana | < 3 por 2 semanas: trocar a lista ou a mensagem de abertura |
| Pilotos iniciados (com acesso aprovado) | ≥ 1/semana a partir de 01/02 | 0 por 3 semanas: a barreira é segurança; apressar o pentest ou mirar empresas menores |
| % de afirmações confirmadas pelos devs nos pilotos | ≥ 85% | < 75%: parar a aquisição e consertar o produto antes de vender mais |

Regras: sem depoimentos inventados, sem logos de clientes sem autorização, sem "visto em". Comparações com Rovo/Copilot só com fatos públicos e links.

## Brand

Posicionamento (de `marketing.md`): **o revisor de spec que confronta cada story com o código real e mostra a prova (arquivo e trecho)**, para Heads de Produto e CTOs de scale-ups brasileiras que já testam IA. Os compradores compram pelo retrabalho evitado e pela cobertura de QA. A objeção nº 1 durante o uso é "a IA afirmar regra errada com confiança". **A marca tem que transmitir prova, não magia.**

Evitar parecer: Atlassian/Rovo (azul `#0052CC`, linguagem "teamwork"), GitHub Copilot (preto + "copilot"), Allstacks, Bito, Devin. Nada de robô, cérebro, faísca ou gradiente roxo de "IA".

### 1. Dez candidatos

| # | nome | estilo | o que diz | em voz alta / num ícone de 32 px | risco |
|---|---|---|---|---|---|
| 1 | **Esteira** | descritivo (atual) | linha de montagem, fluxo | fácil; difícil de representar | palavra genérica; .com e .com.br registrados; soa como produção/fábrica, não como prova |
| 2 | **Gabarito** | evocativo (PT) | a resposta certa contra a qual se confere | todo brasileiro entende "conferir o gabarito"; um "G" ou um ✓ | palavra comum, muito usada por apps de concurso/educação: risco de marca na classe 42; .com/.com.br registrados |
| 3 | **Lastro** | evocativo | o que sustenta uma afirmação | curto, forte | conotação financeira forte; .com, .com.br, .dev, .app e várias variantes registrados |
| 4 | **Rastro** | evocativo | rastreabilidade story → código | sonoro; ícone de pegada | conotação de rastreamento logístico/GPS; .com, .com.br, .dev registrados |
| 5 | **Fonte** | duplo sentido | código-fonte + fonte da afirmação | ótimo conceito | genérico demais, impossível de buscar/registrar |
| 6 | **Trecho** | descritivo | o trecho de código que prova | simples | genérico; soa pequeno |
| 7 | **Âncora** | evocativo | spec ancorada no código | acento complica domínio | muito usado; o "â" quebra URLs |
| 8 | **Specta** | inventado | spec + "inspecionar" | soa estrangeiro | .com e .com.br registrados; perto de "Spectra" (muitas marcas) |
| 9 | **Veraz** | inventado/arcaico | que diz a verdade | elegante | .com e .com.br registrados; pouco conhecido |
| 10 | **Cais** | lugar/metáfora | onde a story atraca no código | curto; ícone simples | metáfora exige explicação |

### 2. Três finalistas e as checagens

Resultados de RDAP público (Verisign para .com, Registro.br para .com.br, Google Registry para .dev/.app), consultados em **10/10/2026**. 404 = livre no momento da consulta; 200 = registrado. Conferi o método com um domínio inventado (deu 404).

| nome | .com | .com.br | .dev | .app | variantes livres encontradas |
|---|---|---|---|---|---|
| **Gabarito** | registrado | registrado | **livre** | registrado | **getgabarito.com, gabaritohq.com, usegabarito.com.br** |
| **Rastro** | registrado | registrado | registrado | registrado | **rastrohq.com** |
| **Lastro** | registrado | registrado | registrado | registrado | nenhuma das testadas (uselastro, getlastro, lastrohq .com; lastroai, lastroapp, uselastro .com.br) |

**Recomendo: Gabarito** (nome de produto; a empresa pode manter outro nome jurídico). É o único finalista com um bom conjunto de domínios livres, o conceito é imediato para um brasileiro ("confira a story contra o gabarito do código") e encaixa com o "mostra a prova". O risco é a marca, porque a palavra é comum no mercado de educação. Se a busca no INPI mostrar conflito nas classes 9/42, a segunda opção é **Rastro** (rastrohq.com).

**O que você precisa conferir (eu só consigo rodar buscas públicas; nada está reservado até você registrar):**
- **Marca, INPI (Brasil):** busca em https://busca.inpi.gov.br/pePI/ por "Gabarito" e "Rastro", **classes NCL 9** (software) e **42** (SaaS, desenvolvimento e análise de software). Se for vender fora: USPTO https://tmsearch.uspto.gov/ e EUIPO https://euipo.europa.eu/eSearch/ nas mesmas classes. **Um advogado de marcas confirma**; isto não é parecer jurídico.
- **Domínio:** registrar `gabarito.dev` + `usegabarito.com.br` (e `getgabarito.com`) assim que decidir; disponibilidade muda a qualquer momento.
- **Handles:** checar @gabarito / @usegabarito / @gabaritohq no LinkedIn (página de empresa, o canal principal), X, YouTube e Instagram. Não consegui checar handles por busca pública.
- **Confusão:** nenhum dos finalistas se parece com Allstacks, Bito, Rovo, Copilot, Devin, StackSpot ou Swimm.

### 3. Promessa, tagline e voz

**Promessa (o que o cliente pode esperar sempre):** *Toda afirmação vem com a prova no seu código, e quando não há prova, a gente diz.*

**Taglines:**
1. **"Sua story, conferida no código."** (recomendada; casa com Gabarito)
2. "Com a prova, ou não afirma."
3. "Antes da planning, o gabarito."

**Voz: três adjetivos**

| adjetivo | faça | não faça |
|---|---|---|
| **Preciso** | cite o arquivo, o número, a fonte | "revolucionário", "inteligente", "mágico" |
| **Franco** | diga o que não fazemos ("ainda não temos SOC 2") | esconder limitação, prometer 100% |
| **Calmo** | fale como um bom tech lead explicando ao PM | urgência falsa, exclamações, "não perca!" |

**Antes / depois** (linha de `pitch.md`):
- *Antes:* "Esteira, uma startup brasileira em fase inicial: uma esteira de agentes de IA que conecta o Jira ou Azure Boards aos seus repositórios e cruza cada user story com o código real."
- *Depois:* "Cole uma story. O Gabarito mostra o que já existe no seu código, em qual arquivo, e onde a story diverge. Quando não encontra, ele diz."

### 4. O visual (brief)

**Cores** (contraste WCAG calculado):

| nome | hex | função | contraste |
|---|---|---|---|
| **Tinta** | `#1B1F3B` | texto, fundo escuro, logo | sobre Papel **15,0:1** (AAA) |
| **Papel** | `#FAF7F0` | fundo principal (evoca documento, não "dashboard escuro de IA") | |
| **Marca-texto** | `#F2B705` | **destaque do trecho de código citado**, o elemento-assinatura. Só como fundo atrás de texto Tinta | Tinta sobre Marca-texto **8,85:1** (AAA) |
| *Confirmado* (semântica) | `#1E7F4F` | "afirmação confirmada" | sobre Papel **4,67:1** (AA texto normal); branco sobre ele **5,0:1** |
| *Divergência* (semântica) | `#B3261E` | "story diverge do código" | sobre Papel **6,1:1** (AA) |

O marca-texto amarelo **nunca** é usado para texto sobre fundo claro (contraste insuficiente), só como realce atrás de texto escuro.

**Tipografia** (as duas são gratuitas, licença SIL Open Font License, no Google Fonts):
- **Display: Space Grotesk** (títulos, logo provisório). https://fonts.google.com/specimen/Space+Grotesk
- **Texto: IBM Plex Sans**, e **IBM Plex Mono** para trechos de código. https://fonts.google.com/specimen/IBM+Plex+Sans

**Brief do logo**
- **Precisa dizer:** "conferido contra a fonte". Ideia: o "G" (ou a palavra) com um traço de marca-texto embaixo, como quem grifa a prova; ou um ✓ formado por um colchete de código.
- **Precisa funcionar:** favicon e ícone de app em 32 px (só o símbolo, Tinta sobre Marca-texto), avatar de página do LinkedIn, cabeçalho do one-pager em PDF, comentário dentro do Jira/Azure Boards (16 px).
- **Evitar:** robô, cérebro, faísca ✨, gradiente roxo/azul, qualquer coisa parecida com o losango da Atlassian ou o octocat.
- Se você tiver uma ferramenta de geração de imagem conectada, posso gerar **conceitos** (não um logo final) a partir deste brief.

**Os primeiros cinco pontos de contato**
1. **Homepage:** título "Sua story, conferida no código." + um GIF real de 10 s (story → divergência → trecho grifado em amarelo) num repositório open source. Botões: "Ver uma análise num repo público" e "Pedir o Kit de Segurança".
2. **"Embalagem" = o relatório de análise:** cada afirmação com selo *Confirmado / Divergente / Não encontrei* e o trecho grifado. Ele **é** o produto que o PM leva à planning.
3. **Confirmação de piloto (e-mail):** o que acontece em cada semana, quem precisa fazer o quê (a call de setup de 30 min), o Kit de Segurança anexado, o baseline de retrabalho que será medido.
4. **Primeiro post:** o hook 1 de `marketing.md` ("Duas stories voltaram do dev...") com o fundador falando, sem fotos de banco de imagem.
5. **Resposta à primeira reclamação** ("a ferramenta afirmou uma regra errada"): agradecer, mostrar o trecho que levou ao erro, explicar a correção e com que prazo, registrar o caso na métrica de acerto do piloto. Sem defensividade: é a promessa da marca sendo testada.

## Operations

> **Atualização 12/10/2026:** a versão viável do plano mudou três decisões (ver `offer.md` §7 e `cfo.md`). (1) **IA do cliente (BYOK):** a análise roda na assinatura ou API do cliente, no ambiente dele, e a Esteira não paga token; tudo o que este arquivo diz sobre custo de LLM da Esteira e Modo Cofre como opção deixou de valer. (2) **Clientes Fundadores pagam R$ 2.500** com preço travado por 24 meses, não R$ 1.500. (3) **Cliente-alvo inicial:** não reguladas e fora do ecossistema Atlassian. CAC máximo atualizado: R$ 2.125 × 12 ÷ 3 ≈ **R$ 8.500**.


Um fundador solo, um SaaS B2B, com 0 a 15 clientes no ano 1. A operação é: **vender pilotos, configurar, analisar, provar, cobrar, dar suporte e não vazar código.** Regras e preços mudam: confirme cada item com o fornecedor, o órgão ou um profissional. Isto não é aconselhamento jurídico.

### 1. O ciclo de cada dia

(👁 = o cliente vê)

1. **08:00, saúde do sistema:** alertas da noite, filas de análise, erros de integração (tokens expirados do Jira/Azure/GitHub), custo de LLM do dia anterior por cliente.
2. 👁 **08:30, suporte:** responder tickets e e-mails de pilotos e clientes (meta: resposta em até 4 h úteis).
3. 👁 **09:00, revisão de qualidade:** amostra de 5 análises do dia anterior. A afirmação tem trecho? O "não encontrei" apareceu quando devia? Registrar erros na planilha de acerto do piloto.
4. **10:00–13:00, produto:** construir/corrigir (bloco protegido de foco).
5. 👁 **14:00–16:00, vendas:** outbound (30 convites/dia em dias de campanha), demos, calls de setup de piloto (30 min).
6. 👁 **16:00, pilotos:** check-in com cada piloto ativo (mensagem curta: uso da semana, dúvidas, afirmações contestadas).
7. **17:00, conteúdo:** um post "Story vs. Código" ou bastidor (calendário de `marketing.md`).
8. **17:30, fechamento:** atualizar CRM (estágio de cada conta), métricas da semana, conferir que nenhum código de cliente ficou em log ou storage (ver SOP 5).

**Semanal (sexta):** os três números de `marketing.md`; custo de LLM por cliente vs. R$ 440 orçados; backups; atualização de dependências e alertas de segurança.
**Mensal:** emissão de NF e cobrança (dia 1), relatório de acerto e retrabalho para cada cliente, fechamento com o contador.

### 2. Fornecedores

| insumo (`numbers.json`) | opções | preço público / como obter | termos |
|---|---|---|---|
| **LLM** (R$ 440/cliente-mês) | **Anthropic API** (Sonnet 5.5 para análise, Haiku 5.5 para indexação barata); Azure OpenAI; AWS Bedrock | Sonnet 5.5: US$ 2 / US$ 10 por MTok, cache US$ 0,10; Haiku 5.5: US$ 0,10 / US$ 0,50; batch com 50% de desconto ([claude.com/pricing](https://claude.com/pricing)). Azure/Bedrock: tabela de cada nuvem | pré-pago/cartão em dólar (IOF + câmbio). **No Modo Cofre o cliente usa a conta dele** (Azure OpenAI, Bedrock ou Anthropic) |
| **Cloud** (infra por cliente R$ 150 + base R$ 1.000) | AWS sa-east-1 (São Paulo), Azure Brazil South, GCP southamerica-east1 | calculadora de preço de cada nuvem; **pedir créditos de startup** (programas para startups da AWS, Microsoft e Google) | pós-pago em dólar; hospedagem no Brasil atende à promessa da oferta |
| **Cobrança + NF** (R$ 5/cliente-mês) | **Asaas** (recomendado), Stripe Brasil, Iugu | Asaas: Pix/boleto R$ 1,99, NF R$ 0,49, cartão 2,99% + R$ 0,49 ([fonte](https://www.asaas.com/precos-e-taxas)). Stripe: cartão 3,99% + R$ 0,39, boleto R$ 3,45, Billing 0,7% ([fonte](https://stripe.com/br/pricing)) | B2B no Brasil prefere boleto/Pix com NF; o Asaas emite NF de serviço |
| **Contabilidade** (R$ 500) | contabilidade online (Contabilizei, Agilize, contabilidade.com) ou contador local com experiência em SaaS | R$ 189–899/mês para ME no Simples ([Agilize](https://agilize.com.br/artigos/?p=881), [contabilidade.com](https://contabilidade.com/blog/quanto-custa-a-contabilidade-online-em-2026-guia-de-precos-e-o-que-esta-incluso/)) | **cotação** (o preço varia com notas emitidas e pró-labore) |
| **Pentest** (R$ 15.000, abertura) | empresas brasileiras de segurança ofensiva / pentest como serviço | **só por cotação**: pedir a 2–3 com escopo "aplicação web + API + integrações OAuth" | prazo típico de algumas semanas; pedir relatório com carta de atestado para mostrar aos clientes |
| **Jurídico** (R$ 6.000) | advogado ou escritório de tecnologia/privacidade | **cotação**: DPA/LGPD, termos de uso, contrato SaaS, política de privacidade | pacote fechado |
| **Ferramentas** (R$ 1.200) | GitHub (código), Google Workspace (e-mail), CRM leve (HubSpot free / Pipedrive), Sentry/Grafana (monitoramento), Cal.com (agenda) | ver a página de preços de cada um; vários têm plano grátis no começo | |

**Perguntas abertas (só com cotação):** pentest, jurídico, contador, câmbio do dia, créditos de cloud aprovados.

### 3. Pessoas

**Só o fundador** no ano 1 (capacidade estimada em ~15 clientes: `numbers.json`).

| bloco semanal | mês 1–2 (sem clientes pagantes) | com 8–10 clientes |
|---|---|---|
| Produto | 30 h | 15 h |
| Vendas e pilotos | 12 h | 15 h |
| Suporte e qualidade | 2 h | 10 h |
| Conteúdo | 4 h | 3 h |
| Admin (financeiro, contador, segurança) | 2 h | 4 h |
| **Total** | ~50 h | ~47 h |

- **Pró-labore:** R$ 6.000/mês no modelo (estimativa; 0 em bootstrap puro). O pró-labore tem **INSS** e influencia o **fator R** do Simples; leve isso ao contador.
- **Primeira contratação** (quando houver mais de 10 clientes ou o pre-seed sair): um(a) engenheiro(a) para integrações e qualidade das análises, ou um(a) CS/pré-vendas técnico(a). Não está no modelo do ano 1.
- **Ponto único de falha:** o fundador. Ver o risco nº 2.

### 4. Rotinas (SOPs)

**SOP 1: Abertura de piloto (a call de 30 min)**
1. Antes: Kit de Segurança enviado e aprovado (DPA assinado, questionário respondido).
2. Escolher com o cliente **1 board + 1 repositório não crítico**.
3. Decidir o modo: padrão (LLM da Esteira) ou **Modo Cofre** (chave do cliente). Se for Cofre, mostrar a **estimativa de tokens por story** para o tamanho do repositório dele.
4. Alguém técnico do cliente instala o app/OAuth com **escopo somente leitura**. Conferir os escopos na tela.
5. Rodar o **baseline**: stories devolvidas/reabertas nos últimos 3 meses (combinar a definição com o cliente: reaberta, devolvida pelo QA, ou nova story derivada).
6. Rodar 3 stories ao vivo com o PM e mostrar o "não encontrei" quando aparecer.
7. Combinar: um dev do cliente confere 20 stories ao longo do piloto; check-in semanal; data do relatório final.

**SOP 2: A análise (o serviço principal)**
1. Receber a story (Jira/Azure Boards). 2. Indexar/atualizar só o repositório autorizado. 3. Gerar afirmações, **cada uma com arquivo + trecho**; sem evidência, marcar "não encontrei". 4. Gerar divergências e perguntas para o PM. 5. (Business) gerar testes Playwright e rodar contra o ambiente de teste do cliente, se houver. 6. Registrar tokens gastos e tempo. 7. Devolver ao card; **não guardar o código além do índice necessário** (no Cofre, nada fica conosco).

**SOP 3: Reclamação ("afirmou uma regra errada")**
1. Responder em até 4 h úteis: agradecer e pedir o link da análise. 2. Reproduzir e achar o trecho que levou ao erro. 3. Classificar: evidência errada / interpretação errada / deveria ter dito "não encontrei". 4. Registrar na planilha de acerto do cliente (conta para a garantia de 85%). 5. Corrigir e informar o prazo; devolver a análise corrigida. 6. Se for padrão recorrente, virar teste de regressão interno.

**SOP 4: Fechamento do mês e cobrança**
1. Dia 1: Asaas gera a cobrança (Pix/boleto) e a NF de serviço. 2. Enviar o relatório do mês (acerto, retrabalho, stories analisadas). 3. Dia 5: lembrete automático de vencimento. 4. Dia 10: contato pessoal com quem não pagou. 5. Conferir o custo de LLM por cliente contra a receita; se passar de 30% do preço, ver o limite de análises. 6. Enviar extratos ao contador.

**SOP 5: Segurança semanal (o que não pode falhar)**
1. Revisar os logs: nenhum trecho de código de cliente em log de aplicação. 2. Conferir a retenção (índices de clientes cancelados apagados em até 30 dias, conforme o DPA). 3. Rotacionar segredos vencidos; nenhum token de cliente em texto puro. 4. Atualizar dependências com vulnerabilidade crítica. 5. Testar a restauração de backup (mensal). 6. Registrar o que foi feito (evidência para o futuro SOC 2).

### 5. Ferramentas

| função | ferramenta | preço | por quê |
|---|---|---|---|
| Cobrança + NF | **Asaas** | R$ 1,99/Pix ou boleto + R$ 0,49/NF ([fonte](https://www.asaas.com/precos-e-taxas)) | B2B brasileiro paga em boleto/Pix com NF |
| Contabilidade | contabilidade online | R$ 189–899/mês ([fonte](https://agilize.com.br/artigos/?p=881)) | Simples, pró-labore, NF |
| CRM | HubSpot (grátis) ou Pipedrive | ver o site | funil de pilotos → clientes |
| Agenda | Cal.com / Google Calendar | grátis para começar | demos e calls de setup |
| Suporte | e-mail compartilhado + Slack Connect com pilotos | grátis | proximidade com early adopters |
| Monitoramento | Sentry + logs da cloud | plano grátis/de entrada | erros de integração |
| Métrica de acerto | planilha por cliente (depois, no produto) | grátis | base da garantia e dos casos de uso |

### 6. Registros, licenças e seguros (Brasil)

| item | por quê | onde confirmar |
|---|---|---|
| **CNPJ** (ME, provavelmente LTDA unipessoal) | faturar B2B, emitir NF | [gov.br/empresas-e-negocios](https://www.gov.br/empresas-e-negocios/pt-br) e Junta Comercial do estado |
| **Enquadramento no Simples Nacional** (Anexo III ou V, fator R) | define o imposto (6% estimado no modelo) | [Portal do Simples Nacional](https://www8.receita.fazenda.gov.br/SimplesNacional/) + contador |
| **Inscrição municipal / NFS-e** | nota fiscal de serviço e ISS | prefeitura do município da sede |
| **CNAE** de software/SaaS (ex.: licenciamento de software customizável / desenvolvimento) | o enquadramento depende do CNAE | contador |
| **LGPD**: DPA, política de privacidade, registro das operações, encarregado (DPO) | a Esteira é operadora dos dados dos clientes; o código pode conter dados pessoais | [ANPD](https://www.gov.br/anpd/pt-br) |
| **Marca "Gabarito" (ou alternativa)** no INPI, classes 9 e 42 | proteger o nome | [busca.inpi.gov.br](https://busca.inpi.gov.br/pePI/) |
| **Contrato SaaS + SLA + limite de responsabilidade** | clientes vão pedir | advogado |
| **Seguro de responsabilidade cibernética / E&O** | regulados e CTOs perguntam; reduz o risco pessoal | corretora (cotação) |

### 7. Registro de riscos

| # | risco | prob. | impacto | plano |
|---|---|---|---|---|
| 1 | **Segurança do cliente trava o piloto por semanas** | alta | alto | Kit de Segurança no 1º contato, pentest antes de fev/2027, começar por empresas não reguladas, Modo Cofre |
| 2 | **Fundador doente, esgotado ou indisponível** (ponto único de falha) | média | alto | documentar os SOPs, monitoramento com alertas, cláusula "sem lock-in" (tudo fica no Jira/repo do cliente), co-fundador ou 1ª contratação com o pre-seed |
| 3 | **Acerto abaixo de 85% num piloto** | média | alto | parar a aquisição e consertar (gatilho de `marketing.md`), "não encontrei" agressivo, revisão diária de amostras |
| 4 | **Custo de LLM acima do orçado** (monorepo grande) | média | médio | medir tokens por análise desde o 1º piloto, Haiku para indexação, cache, batch, limite de análises por plano, Modo Cofre |
| 5 | **Vazamento/incidente com código de cliente** | baixa | crítico | retenção mínima, nada em log, segredos rotacionados, pentest, plano de resposta a incidente (comunicação à ANPD e ao cliente), seguro cibernético |
| 6 | **Atlassian/GitHub lançam o recurso embutido** | alta | alto | focar em Azure DevOps + PM não técnico + evidência/"não encontrei", vender a prova (métrica de acerto), relacionamento com os Clientes Fundadores |
| 7 | **Mudança de API ou de permissões** do Jira, Azure DevOps ou GitHub | média | médio | testes de integração diários, alertas de token expirado, acompanhar os changelogs |
| 8 | **Inadimplência / atraso de pagamento B2B** | média | médio | boleto/Pix com lembretes automáticos, contato pessoal no dia 10, contrato anual com desconto |
| 9 | **Mês lento** (nenhum piloto vira contrato) | alta | médio | 60–100 conversas no funil, revisar a oferta, caixa com reserva de pelo menos 6 meses de custo fixo (~R$ 61 mil com pró-labore) |
| 10 | **Câmbio** (LLM e cloud em dólar) | média | baixo/médio | revisar o preço anualmente, Modo Cofre transfere o custo, créditos de startup |

**Nada mudou de forma que exija reprocessar além do que já foi feito:** o custo de LLM (R$ 880 → R$ 440) e a cobrança (R$ 40 → R$ 5) foram atualizados em `numbers.json` com preços públicos, e `cfo.md` já foi re-rodado.

## Launch plan

> **Atualização 12/10/2026:** a versão viável do plano mudou três decisões (ver `offer.md` §7 e `cfo.md`). (1) **IA do cliente (BYOK):** a análise roda na assinatura ou API do cliente, no ambiente dele, e a Esteira não paga token; tudo o que este arquivo diz sobre custo de LLM da Esteira e Modo Cofre como opção deixou de valer. (2) **Clientes Fundadores pagam R$ 2.500** com preço travado por 24 meses, não R$ 1.500. (3) **Cliente-alvo inicial:** não reguladas e fora do ecossistema Atlassian. CAC máximo atualizado: R$ 2.125 × 12 ÷ 3 ≈ **R$ 8.500**.


Hoje: **sáb 10/10/2026**. Data-alvo de abertura do programa de pilotos: **seg 01/02/2027** (a mesma de `marketing.md`). Responsável por tudo: **o fundador** (F), salvo indicação. Data mais cedo realista dado o que `ops.md` exige: MVP + Kit de Segurança + pentest. O pentest depende do MVP pronto e leva semanas.

### 1. Teste antes de gastar (out–dez/2026)

O painel simulado comprou a 15% (3 de 20), e isso é um teto. Antes de gastar os R$ 31.500 de abertura (pentest e jurídico são o grosso), testar com gente real, do jeito mais barato:

**Teste: "Clientes Fundadores" com carta de intenção paga**
1. **15–30 conversas de descoberta** com Heads de Produto/CTOs de scale-ups não reguladas (lista de `marketing.md`). Perguntar sobre a dor (stories devolvidas, cobertura de QA), quem aprova acesso ao código e o preço com e sem Modo Cofre.
2. **Dividir as demos em duas portas de entrada** (ver `offer.md` §6: o painel não separou as duas): metade começa pelo **refinamento do PM** (story vs. código), metade pelos **testes Playwright para o QA**. Anotar em qual delas cada Cliente Fundador fechou.
3. Em cada conversa, mostrar uma **análise "Story vs. Código" feita à mão** (com Claude/scripts) **num repositório open source** escolhido pela pessoa. Ninguém precisa abrir o próprio código.
4. Propor a vaga de **Cliente Fundador**: R$ 1.500/mês por 12 meses, piloto quando o MVP estiver pronto, **1º mês pago antecipado** (reembolsável se o piloto não começar até 31/03/2027), ou pelo menos uma carta de intenção assinada pelo decisor.

**Linha de sucesso (definida antes):** até **18/12/2026**, **≥ 3 Clientes Fundadores com o 1º mês pago** (ou 5 cartas de intenção assinadas pelo decisor) em ≤ 30 conversas.
- **Comparação com o painel:** 3 em 20 (15%) é o teto simulado; o teste real pede 3 em 30 (10%), um alvo abaixo do painel, de propósito.
- **Se der < 2 em 30:** não gastar com pentest e jurídico ainda. Voltar ao `/founder-offer` (talvez a entrada seja QA/Playwright, não o PM) ou ao `/founder-pricing`, e conversar com mais 15 pessoas antes de construir mais.
- **Se der ≥ 3:** seguir a contagem abaixo. Esses clientes são os primeiros pilotos e os primeiros casos de uso.

### 2. A contagem regressiva

★ = **caminho crítico** (se atrasar, a data de 01/02 atrasa).

| semana | o quê | resp. | prazo |
|---|---|---|---|
| **12–18/10** | Decidir o nome (busca no INPI classes 9/42 para Gabarito/Rastro); registrar `gabarito.dev` + `usegabarito.com.br` | F | 16/10 |
| | Montar a lista de 150 contas e começar as conversas de descoberta (teste) | F | 18/10 |
| | ★ Definir a arquitetura do MVP: 1 board (Jira **ou** Azure Boards) + 1 provedor, evidência arquivo/trecho, "não encontrei" | F | 18/10 |
| **19/10–01/11** | Abrir CNPJ (LTDA unipessoal/ME) e conta PJ; contratar contador (cotação de 2–3) | F + contador | 30/10 |
| | ★ MVP: indexação do repo + análise de story com evidência (protótipo interno) | F | 01/11 |
| | 10 conversas de descoberta + análises manuais em repos open source | F | 01/11 |
| **02–15/11** | ★ Cotar e contratar o jurídico: DPA/LGPD, termos, contrato SaaS, política de privacidade | F + advogado | 13/11 |
| | ★ MVP: integração de leitura com Jira/Azure Boards (OAuth somente leitura) | F | 15/11 |
| | Pedir créditos de startup (AWS/Microsoft/Google) | F | 15/11 |
| **16–29/11** | ★ MVP: medir os tokens por análise em 3 repos open source de tamanhos diferentes (vira a tabela de custo do Modo Cofre e valida os R$ 440 do CFO) | F | 22/11 |
| | Modo Cofre v1: a análise roda com a chave de LLM do cliente | F | 29/11 |
| | 10 conversas + proposta de Cliente Fundador | F | 29/11 |
| **30/11–13/12** | ★ Cotar o pentest (2–3 empresas), fechar o escopo e agendar para a 1ª quinzena de janeiro | F | 04/12 |
| | Kit de Segurança v1: questionário de fornecedor respondido, diagrama de dados, DPA | F | 13/12 |
| | Marca: logo provisório (brief de `brand.md`), landing page, página no LinkedIn | F | 13/12 |
| **14–18/12** | **Fechamento do teste:** contar Clientes Fundadores pagos/cartas → seguir ou voltar | F | **18/12** |
| | Asaas configurado (cobrança + NF de serviço) | F | 18/12 |
| **21/12–03/01** | MVP: o relatório do piloto (baseline de retrabalho + % de afirmações confirmadas) | F | 03/01 |
| | (recesso: deixar folga de uma semana no plano) | | |
| **04–17/01** | ★ **Pentest** + correção dos achados críticos/altos | empresa de pentest + F | 17/01 |
| | **Soft open:** 1 Cliente Fundador (o mais próximo) roda o piloto completo num repo não crítico | F + cliente | 17/01 |
| **18–31/01** | Calendário de `marketing.md` a partir de 18/01 (posts, outbound, e-mails) | F | diário |
| | ★ Corrigir o que o soft open mostrou; carta de atestado do pentest no Kit de Segurança | F | 29/01 |
| | Teste de ponta a ponta: setup → análise → relatório → cobrança | F | 30/01 |
| **seg 01/02** | **Abertura do programa de pilotos** | F | 01/02 |

**Caminho crítico:** arquitetura → MVP (indexação → integração → evidência) → medição de tokens → pentest → correções → abertura. Em paralelo e também crítico: jurídico → DPA → Kit de Segurança (sem ele, nenhum piloto passa pela segurança). **Se o MVP atrasar mais de 2 semanas, mover a abertura**; não pular o pentest.

### 3. O dia da abertura: seg 01/02/2027

| hora | o quê | canal | se algo quebrar (`ops.md`) |
|---|---|---|---|
| 07:30 | Checar sistema, filas, integrações, custo de LLM; demo de reserva gravada pronta | — | integração caída → usar a demo gravada no repo open source, corrigir à tarde |
| 08:30 | Post de abertura: hook 6 ("5 empresas. R$ 1.500/mês por 12 meses... até 31/03"), com o número **real** de vagas restantes | LinkedIn | — |
| 09:00 | E-mail para todos os contatos de descoberta e quem aceitou conexão | e-mail | — |
| 09:30–12:00 | Mensagens diretas aos 20 mais engajados oferecendo o piloto (hook 7) | LinkedIn DM | — |
| 12:00 | Responder todos os comentários e DMs | LinkedIn | — |
| 14:00–17:00 | Demos agendadas (blocos de 20 min) + calls de setup dos Clientes Fundadores | Meet/Zoom | pedido de segurança na call → enviar o Kit na hora |
| 17:00 | Check-in com os pilotos já ativos (soft open) | Slack Connect | reclamação de acerto → SOP 3 |
| 18:00 | Registrar no CRM: conversas, pilotos agendados, vagas restantes | CRM | — |

**Oferta do dia:** Clientes Fundadores, 5 vagas a R$ 1.500/mês por 12 meses, até 31/03/2027 ou até preencher. Preço cheio (R$ 2.500) público desde o início.

### 4. Os primeiros 30 dias (01/02–03/03/2027)

**Números semanais:**

| número | fonte | meta | gatilho de mudança |
|---|---|---|---|
| Conversas qualificadas | `marketing.md` | ≥ 5/semana | < 3 por 2 semanas → trocar a lista/abertura |
| Pilotos iniciados (acesso aprovado) | `marketing.md` | ≥ 1/semana | 0 por 3 semanas → a barreira é segurança: Kit + pentest na 1ª mensagem, mirar empresas menores |
| % de afirmações confirmadas pelos devs | `offer.md` | ≥ 85% | < 75% → **parar a aquisição** e consertar o produto |
| Clientes pagantes ativos vs. break-even | `cfo.md` | rumo a **9** (break-even do cenário-base) até out/2027 | rampa abaixo de +1/mês por 2 meses → rever preço/segmento |
| Custo de LLM por cliente-mês | `cfo.md` | ≤ R$ 440 | > R$ 600 → limite de análises, Haiku/cache, Modo Cofre |

**Revisões:**
- **Dia 7 (08/02):** Quantas demos viraram pedido de piloto? Qual objeção apareceu mais: segurança, Rovo, "monto em casa" ou preço? O soft open confirmou ≥ 85%?
- **Dia 14 (15/02):** Quantos pilotos têm acesso aprovado e quanto tempo levou a aprovação de segurança? O custo real de tokens por story bate com a tabela? Quem usa: o PM, o QA ou ninguém?
- **Dia 30 (03/03):** Quantos Clientes Fundadores pagos? O baseline de retrabalho caiu em algum piloto? A entrada certa é o PM (refinamento) ou o QA (Playwright), como sugeriu o painel? Seguir, mudar o segmento ou mudar a oferta? Atualizar `numbers.json` com os dados reais e re-rodar `/founder-cfo` e `/founder-plan`.

_The panel is simulated buyers and the numbers are projections from your inputs. Confirm demand with real customers and costs with real quotes before you spend. Not financial, legal or tax advice._
