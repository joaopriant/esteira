# Buyer panel: Esteira: revisor de user story contra o código para PMs (SaaS B2B, Brasil)

**2 buy · 18 pass** (10% buy) out of 20 simulated buyers. Seed 677932, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

## By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| CTO ou VP de Engenharia em empresa de 50 a 200 devs (salário anual em R$) | 6 | 17%  (thin) |
| Head/Diretor(a) de Produto em scale-up de 20 a 80 devs (salário anual em R$) | 7 | 14%  (thin) |
| Engineering Manager ou Head de QA que influencia a compra, mas precisa de aprovação do CTO (salário anual em R$) | 4 | 0%  (thin) |
| Head de Produto em empresa regulada (fintech/seguros) com 80 a 200 devs, processo de compra com segurança e jurídico (salário anual em R$) | 3 | 0%  (thin) |

## By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Early adopter de ferramentas de IA | 3 | 33%  (thin) |
| Stack Microsoft (Azure DevOps) | 3 | 33%  (thin) |
| Já testou IA e se decepcionou | 4 | 0%  (thin) |
| Cuidadoso com orçamento | 2 | 0%  (thin) |
| Constrói internamente | 2 | 0%  (thin) |
| Segurança em primeiro lugar | 2 | 0%  (thin) |
| Preso ao ecossistema Atlassian | 4 | 0%  (thin) |

## By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $376,000 to $518,000 | 6 | 17%  (thin) |
| $518,000 and up | 8 | 12% |
| under $376,000 | 6 | 0%  (thin) |

## Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 10 | "Já paguei Copilot e ChatGPT Enterprise e vi alucinação; não assino nada antes de ver funcionando no nosso código. No máximo topo o piloto grátis, e mesmo isso passa pelo meu time de segurança, que levou 3 meses no último fornecedor, então nada de contrato este mês." (P001) · "Até toparia o piloto grátis, mas pagar agora não: minha dor hoje é cobertura de testes no QA, e isso eles dizem que não fazem. E uma ferramenta que fala para o PM o que o código faz, se errar uma regra de negócio, vira discussão na planning e queima a confiança do time em mim." (P002) |
| habit | 5 | "A dor é real, tive duas stories voltando na última sprint por isso, mas é exatamente o tipo de coisa que meu time monta em duas ou três semanas com Claude, MCP do Jira e do GitHub, dentro de casa. Não vejo por que pagar R$ 2.500 por mês a uma startup inicial pelo que vira um script interno." (P006) · "Tudo aqui roda em Jira e Confluence, e a minha aposta é que o Rovo vai fazer essa leitura de story contra código dentro do que já pagamos. Até ver o Rovo falhar nisso, não coloco mais um fornecedor com acesso ao repositório, ainda mais uma startup sem SOC 2. No máximo eu topo o piloto grátis para ter um número para mostrar ao board, mas isso não é compra." (P014) |
| need | 2 | "Minha dor hoje é cobertura de testes Playwright atrasada, e vocês mesmos dizem que geração de testes não faz parte do produto. Revisar story contra o código é dor do PM, não minha, e eu não vou pagar por uma ferramenta que meus PMs talvez nem abram depois da segunda semana." (P008) · "Meu problema hoje é cobertura de teste Playwright atrasada, e vocês mesmos dizem que geração de testes não faz parte do produto. É uma ferramenta pra PM; eu até toparia o piloto grátis por curiosidade, mas não vou levar ao CTO um gasto que não resolve a dor do meu time." (P009) |
| timing | 1 | "Acabei de fechar Jira e Copilot, o orçamento de ferramentas do ano está comprometido e não vou abrir mais uma linha de R$ 2.500/mês agora. Até toparia o piloto grátis, já que suporta Azure Boards e Azure Repos, mas pagar no primeiro mês não acontece." (P018) |

## Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 2 | "O board me cobra uso de IA e eficiência, e é raro ver algo que suporte Azure Boards + Azure Repos de primeira. R$ 2.500/mês é ruído no meu orçamento e o piloto grátis com baseline de stories reabertas me dá um número para levar ao board, então eu topo o piloto e provavelmente fecho como Cliente Fundador se os números aparecerem." (P010) · "Na última sprint perdi duas stories porque a regra já existia de outro jeito, e um piloto grátis de 30 dias com antes/depois medido no meu próprio Jira é exatamente o tipo de teste que eu topo na hora. R$ 2.500 por mês é troco perto do custo de uma story que volta; se os PMs usarem, eu pego o preço de Cliente Fundador." (P013) |

## What would flip a no

- Rodar o Modo Cofre com a nossa chave de LLM e ver no piloto os meus devs confirmando mais de 85% das afirmações e uma queda real nas stories reabertas, com os PMs usando sem eu precisar cobrar.
- Um piloto no nosso Jira que mostre queda real de stories reabertas, com os meus devs confirmando bem acima de 85% das afirmações, convertido em horas de dev economizadas por mês.
- Um piloto no nosso repositório em que os devs confirmem acima de 90% das afirmações em umas 20 stories reais e o número de stories reabertas caia de forma visível, mais o CTO aprovando o Modo Cofre com a nossa chave de LLM.
- Rodar o container dentro da nossa própria nuvem com a nossa chave de LLM, aprovado pelo nosso time de segurança, mais um caso real de uma scale-up brasileira parecida mostrando menos stories reabertas em horas de dev economizadas.
- Um piloto rodando 100% dentro da nossa nuvem com a nossa chave, aprovado pela segurança, mostrando em stories reais nossas que os devs confirmaram acima de 85% das afirmações, mais uma estimativa clara de custo de tokens por story no nosso repositório.
- Ver no piloto, no nosso próprio Jira, uma queda clara de stories devolvidas que o protótipo interno do meu time não conseguiu entregar, com o container rodando inteiramente na nossa nuvem.
- Um piloto rodando no container dentro da nossa nuvem com a nossa chave de LLM, aprovado pelo time de segurança, em que os meus devs confirmem pelo menos 85% das afirmações em stories reais nossas e o número de stories reabertas caia de forma visível.
- Se o piloto grátis mostrar, com os números do nosso próprio Jira, que as stories reabertas caíram de forma clara e que os PMs usaram toda semana sem eu precisar cobrar; aí eu pago, porque R$ 2.500 é troco. Gerar casos de teste a partir da story revisada também viraria o jogo.
- Se a análise de story contra o código gerasse critérios de aceite ou casos de teste que meu time pudesse virar em Playwright, e o piloto mostrasse que os PMs realmente usaram toda semana.
- O container rodando 100% dentro da nossa nuvem com a nossa chave de LLM, sem nenhum dado saindo, validado pelo nosso time de segurança num piloto, mais SOC 2 com data marcada ou uma referência de outra empresa regulada brasileira que já usa.
- Rodar o container dentro da nossa nuvem com a nossa chave do Bedrock, sem nenhum tráfego saindo, auditado pelo meu time de segurança, e um piloto em um repositório não crítico mostrando que faz o que o Rovo não faz.
- Um piloto no nosso Jira mostrando queda clara de stories reabertas, com o custo de tokens por story medido, e uma comparação lado a lado em que o Rovo não consegue fazer o mesmo.

Buyers say they would buy **1.0 times** in the first month on average.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.
