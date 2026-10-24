# Buyer panel: Esteira: revisor de user story contra o código para PMs (SaaS B2B, Brasil)

**3 buy · 17 pass** (15% buy) out of 20 simulated buyers. Seed 677932, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

## By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Engineering Manager ou Head de QA que influencia a compra, mas precisa de aprovação do CTO (salário anual em R$) | 4 | 25%  (thin) |
| CTO ou VP de Engenharia em empresa de 50 a 200 devs (salário anual em R$) | 6 | 17%  (thin) |
| Head/Diretor(a) de Produto em scale-up de 20 a 80 devs (salário anual em R$) | 7 | 14%  (thin) |
| Head de Produto em empresa regulada (fintech/seguros) com 80 a 200 devs, processo de compra com segurança e jurídico (salário anual em R$) | 3 | 0%  (thin) |

## By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Early adopter de ferramentas de IA | 3 | 100%  (thin) |
| Já testou IA e se decepcionou | 4 | 0%  (thin) |
| Cuidadoso com orçamento | 2 | 0%  (thin) |
| Constrói internamente | 2 | 0%  (thin) |
| Segurança em primeiro lugar | 2 | 0%  (thin) |
| Stack Microsoft (Azure DevOps) | 3 | 0%  (thin) |
| Preso ao ecossistema Atlassian | 4 | 0%  (thin) |

## By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| under $376,000 | 6 | 17%  (thin) |
| $376,000 to $518,000 | 6 | 17%  (thin) |
| $518,000 and up | 8 | 12% |

## Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 13 | "O preço é irrelevante pro meu orçamento; o problema é dar acesso de leitura a todos os nossos repositórios pra uma startup de fundador solo. Meu time de segurança levou 3 meses no último fornecedor e não vai aprovar isso em um mês, nem pro piloto, e eu já paguei por IA que alucinou no nosso código." (P001) · "R$ 2.500 is cheap next to what a dev costs me, so price isn't the issue. But I'm not giving a solo-founder startup read access to all our repos, and I'm not letting an AI hand my PMs business rules nobody has checked, not this quarter." (P002) |
| habit | 3 | "Tudo aqui roda em Jira, Confluence e Bitbucket, e a minha aposta para o board é o Rovo, que já está no contrato e lê o mesmo contexto. Não vou colocar uma ferramenta avulsa de um fundador solo no meio do fluxo antes de ver o que a Atlassian entrega nos próximos meses." (P014) · "Explorador de repositório, confrontador de spec e gerador de Playwright a partir da story é exatamente o tipo de coisa que meu time monta com Claude e um MCP do Jira e do GitHub em duas sprints, sem depender de uma startup de um fundador só. E acabei de passar semanas renegociando Jira e Copilot; não vou levar ao CTO mais uma linha de R$ 30 mil por ano sem conseguir mostrar retorno." (P016) |
| need | 1 | "Acabei de fechar Jira e Copilot e não tenho como provar para o CFO que isso reduz retrabalho, porque hoje nem meço retrabalho. Talvez rode o piloto grátis por curiosidade, mas pagar R$ 2.500 por mês sem número na mão eu não assino." (P018) |

## Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 3 | "Minha cobertura Playwright está atrasada e R$ 2.500 por mês é menos que uma semana de um QA meu, então eu topo o piloto de 30 dias sem pensar muito. Mas só assino se, no fim do piloto, o QA estiver de fato rodando os testes gerados e os PMs usando sem eu cobrar." (P008) · "Minha cobertura de Playwright está atrasada e R$ 2.500 por mês custa menos que uma fração de um QA; eu entro no piloto de 30 dias na semana que vem. Mas só viro assinatura se o time de QA realmente rodar os testes gerados sem reescrever metade, senão cancelo como cancelo tudo que ninguém usa." (P009) |

## What would flip a no

- Uma opção de rodar dentro da nossa infraestrutura (self-hosted ou na nossa nuvem, sem o código sair) mais um piloto onde ele mostre, em stories reais nossas, que acerta as regras de negócio sem alucinar.
- A pilot on one repo where every business rule it states points to the exact file and line, checked by my tech lead, with at least 90% correct, plus a clear security answer (where the code is processed, retention, SOC 2 or equivalent) and Playwright tests my QA actually merges without rewriting.
- Um piloto no nosso próprio código em que cada regra afirmada vem com arquivo e linha citados, e meus devs conferem pelo menos 20 stories sem achar alucinação, mais um documento de segurança decente para o CTO aprovar.
- Opção de rodar dentro da nossa própria nuvem (self-hosted ou na nossa conta de LLM) com o código nunca saindo do nosso ambiente, mais um contrato com DPA/LGPD e um piloto que meça horas economizadas em refinamento e QA.
- Uma opção self-hosted/on-premise (ou na nossa própria nuvem com nossa chave de LLM) que o código nunca saia do nosso ambiente, mais um questionário de segurança respondido e uma referência de outra empresa regulada que já rodou o piloto.
- Rodar self-hosted dentro da nossa nuvem, com nosso próprio endpoint de LLM, sem o código sair do nosso ambiente, e o piloto provando que pega regra duplicada que meu protótipo interno não pega.
- Um pacote de segurança pronto (DPA, questionário respondido, dados hospedados no Brasil sem retenção nem uso do código para treino, de preferência opção self-hosted) mais cada regra apontando o trecho exato do código como evidência, para eu conseguir levar ao CTO um piloto num repositório não crítico.
- A pilot on our biggest Azure Repos repo that shows real, accurate story-to-code mapping, plus a clear answer on data handling (no training on our code, Brazil or Azure hosting, an LGPD DPA) and on token limits at scale.
- Uma opção self-hosted rodando dentro da nossa nuvem, com o código nunca saindo do nosso ambiente e um LLM que nós escolhemos, mais um pacote de segurança pronto (DPA, pentest, respostas ao questionário de fornecedor) que o nosso time aprove.
- Opção de rodar dentro da nossa nuvem/VPC sem o código sair do nosso ambiente, com contrato e DPA sérios e algum sinal de continuidade (sócio, investimento ou referência de outro CTO que eu conheça).
- Um piloto no nosso maior repositório mostrando, lado a lado com o Rovo, que a confrontação story vs código e os testes Playwright saem certos e economizam horas medidas, com custo de tokens previsível incluso no preço e garantias de segurança por escrito (sem retenção de código, SOC 2 ou equivalente).
- Opção de rodar dentro da nossa própria nuvem (sem o código sair do nosso ambiente), com documentação de segurança pronta (SOC 2 ou equivalente, DPA, LGPD) que encurte a aprovação, e um piloto que me entregue um antes/depois de retrabalho medido em stories reais.

Buyers say they would buy **1.0 times** in the first month on average.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.
