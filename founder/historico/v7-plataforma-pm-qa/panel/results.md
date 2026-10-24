# Buyer panel: Esteira: revisor de user story contra o código para PMs (SaaS B2B, Brasil)

**7 buy · 13 pass** (35% buy) out of 20 simulated buyers. Seed 677932, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

## By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Head/Diretor(a) de Produto em scale-up de 20 a 80 devs (salário anual em R$) | 8 | 50% |
| CTO ou VP de Engenharia em empresa de 50 a 200 devs (salário anual em R$) | 7 | 43%  (thin) |
| Engineering Manager ou Head de QA que influencia a compra, mas precisa de aprovação do CTO (salário anual em R$) | 5 | 0%  (thin) |

## By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Early adopter de ferramentas de IA | 4 | 75%  (thin) |
| Stack Microsoft (Azure DevOps) | 4 | 75%  (thin) |
| Cuidadoso com orçamento | 3 | 33%  (thin) |
| Já testou IA e se decepcionou | 5 | 0%  (thin) |
| Constrói internamente | 2 | 0%  (thin) |
| Segurança em primeiro lugar | 2 | 0%  (thin) |

## By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $518,000 and up | 7 | 43%  (thin) |
| $329,000 to $518,000 | 7 | 43%  (thin) |
| under $329,000 | 6 | 17%  (thin) |

## Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 8 | "Já paguei Copilot e ChatGPT Enterprise e vi alucinação em produção; não assino nada com uma startup em fase inicial antes de ver funcionar no meu repositório. No máximo libero o piloto grátis num time pequeno, e isso não é compra." (P001) · "Já paguei Copilot e ChatGPT Enterprise e vi alucinação; não assino nada nem levo ao CTO antes de ver isso rodando no nosso repositório. Topo o piloto grátis de 30 dias, mas pagar no primeiro mês, não." (P003) |
| habit | 3 | "O fato de rodar no nosso ambiente com a nossa IA tira meu medo do código sair de casa, mas pelo mesmo motivo eu penso: então é um prompt bem feito com Jira e repositório via MCP, e meu time monta isso em uma ou duas sprints com Claude. Não pago R$ 2.500 por mês, para sempre, por algo que dá para construir aqui dentro." (P006) · "R$ 2.500 é troco pro meu orçamento, mas isso é basicamente um agente com MCP lendo Jira e repo usando a nossa própria IA; meu time de plataforma monta uma versão disso em duas sprints. Acabei de fechar Jira e Copilot, não vou pôr mais um fornecedor pequeno e de código fechado na cadeia por algo que dá pra construir em casa." (P016) |
| quality | 1 | "Rodar no nosso ambiente com a nossa IA e escrow resolve boa parte do meu medo de dar o código para uma startup de um fundador só, então eu até toparia o piloto grátis. Mas pagar R$ 2.500/mês todo mês, num trimestre em que estou cortando SaaS, só depois de ver em número que isso economiza horas de dev, e hoje isso é promessa." (P004) |
| need | 1 | "Pelo menos suporta Azure Boards e Azure Pipelines, o que já é raro, e R$ 2.500 não pesa no meu orçamento. Mas meu tech lead já cruza a story com o código no refinamento, e acabei de fechar o Copilot, então não vou abrir outra ferramenta e outro fornecedor para uma dor que eu não sinto." (P020) |

## Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 7 | "Entro no piloto grátis porque a cobertura de Playwright está atrasada e R$ 2.500 é menos que um dia de dev por mês; só sigo pagando se o antes/depois mostrar menos stories reabertas e horas de dev economizadas de verdade." (P002) · "A cobertura de Playwright do meu QA está atrasada e R$ 2.500 por mês é troco perto do custo de um dev; piloto grátis, roda no meu ambiente com a minha chave de IA, então entro no piloto sem pensar muito. Mas só sigo pagando se o time usar de verdade no primeiro mês." (P008) |

## What would flip a no

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
