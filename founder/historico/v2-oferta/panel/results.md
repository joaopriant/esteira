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
| trust | 11 | "Preço não é o problema, R$ 2.500 é troco perto do que já gastei com Copilot. Mas é uma startup em fase inicial, sem SOC 2, pedindo acesso ao Jira e aos repositórios. Meu time de segurança levou 3 meses no último fornecedor, então este mês não tem compra, no máximo eu abro a conversa sobre um piloto." (P001) · "Eu aceitaria o piloto grátis num repositório, porque o risco é baixo e a medição de stories reabertas é exatamente a métrica que eu quero. Mas não assino nada pago este mês: uma startup sem SOC 2 e sem nenhum cliente de referência ainda precisa me provar, no meu código, que não vai inventar regra de negócio." (P002) |
| habit | 5 | "A dor é real, tive duas stories voltando na última sprint, mas isso é exatamente o tipo de coisa que meu time monta em algumas semanas com Claude, MCP do Jira e acesso ao repo. Não vejo por que pagar uma startup em fase inicial para algo que consigo construir e controlar dentro de casa." (P006) · "Tudo aqui roda em Jira, Confluence e Bitbucket, e a minha aposta é que o Rovo cubra isso nos próximos trimestres sem eu ter que aprovar mais um fornecedor. Talvez eu topasse o piloto grátis para ter um número para mostrar ao board, mas pagar agora, não." (P014) |
| timing | 1 | "Acabei de fechar orçamento de ferramentas com Jira e Copilot, então não pago nada novo este mês. O que me interessa é o piloto grátis: finalmente alguém suporta Azure Boards e Azure Repos e mede retrabalho por mim, mas pagar só depois de ver o antes/depois." (P018) |

## Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 3 | "Minha cobertura de Playwright está atrasada e R$ 1.500 a 2.500 por mês é troco perto do custo de um QA; piloto grátis de 30 dias com métrica no meu próprio Jira eu topo na hora. Mas assino só se o time de QA realmente usar os testes gerados no piloto, senão cancelo no primeiro mês como faço com tudo." (P008) · "Minha cobertura de Playwright está atrasada e o preço fixo sem cobrança por token responde exatamente a minha dúvida sobre base de código grande; piloto grátis de 30 dias eu topo na hora e R$ 2.500/mês passa fácil com o CTO se o antes/depois mostrar número." (P009) |

## What would flip a no

- Rodar o piloto num repo nosso, com o container dentro da nossa nuvem e a nossa chave de LLM, para a segurança aprovar rápido, e ver os devs confirmarem a maioria das afirmações com o número de stories reabertas caindo de verdade.
- Um piloto de 30 dias no nosso repositório em que os devs confirmem pelo menos 85% das afirmações e as stories reabertas caiam de forma mensurável, traduzido em horas de dev economizadas.
- O piloto de 30 dias mostrar no nosso proprio repo mais de 85% das afirmacoes confirmadas pelos devs e uma queda mensuravel nas stories reabertas, com o Modo Cofre rodando na nossa chave Azure OpenAI.
- Rodar o container dentro da nossa própria nuvem durante o piloto e ver no nosso Jira uma queda real de stories reabertas, com números que eu consiga levar ao board como horas de dev economizadas.
- Um piloto rodando dentro da nossa nuvem que mostre a taxa de afirmações confirmadas pelos meus devs acima de 85% e uma estimativa real do custo de tokens na nossa base, com o questionário de segurança aprovado pelo nosso time.
- Ver no piloto gratuito, rodando com a nossa chave e dentro da nossa nuvem, uma queda medida de stories reabertas que meu time claramente não conseguiria replicar internamente em um mês de trabalho.
- Um piloto que passe no nosso time de segurança rodando no container dentro da nossa nuvem e que termine com os devs confirmando acima de 85% das afirmações e uma queda mensurável de stories reabertas, com números que eu possa levar ao CTO e ao board.
- Um piloto no nosso Azure Boards + Azure Repos que mostre queda real nas stories reabertas, com a fatura de tokens da nossa Azure OpenAI medida e previsível durante o piloto.
- Um relatório SOC 2 Tipo I, ou pelo menos um pentest independente, mais uma referência de outra fintech ou seguradora brasileira que já rode o container dentro da própria nuvem, para o meu CISO falar direto com o CISO deles.
- O container rodando 100% dentro da nossa nuvem, sem nenhuma saída de código, validado pelo nosso time de segurança, mais um caso de outra empresa do nosso porte mostrando queda real de stories reabertas que o Rovo não conseguiu entregar.
- Um piloto que mostre uma queda clara de stories reabertas no nosso Jira junto com uma estimativa concreta de custo de tokens por story no nosso repo, e uma comparação lado a lado mostrando que o Rovo não faz o cruzamento com o código com evidência.
- Um piloto rodando no container dentro da nossa nuvem, com a nossa chave de LLM, que a segurança aprove rápido, e que mostre queda real de stories reabertas e acima de 85% de afirmações confirmadas pelos meus devs no nosso repositório.

Buyers say they would buy **1.0 times** in the first month on average.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.
