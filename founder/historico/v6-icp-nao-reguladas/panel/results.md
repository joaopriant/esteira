# Buyer panel: Esteira: revisor de user story contra o código para PMs (SaaS B2B, Brasil)

**8 buy · 12 pass** (40% buy) out of 20 simulated buyers. Seed 677932, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

## By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Head/Diretor(a) de Produto em scale-up de 20 a 80 devs (salário anual em R$) | 8 | 50% |
| CTO ou VP de Engenharia em empresa de 50 a 200 devs (salário anual em R$) | 7 | 43%  (thin) |
| Engineering Manager ou Head de QA que influencia a compra, mas precisa de aprovação do CTO (salário anual em R$) | 5 | 20%  (thin) |

## By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Early adopter de ferramentas de IA | 4 | 100%  (thin) |
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
| under $329,000 | 6 | 33%  (thin) |

## Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 8 | "Já paguei Copilot e ChatGPT Enterprise e vi alucinação em produção; não assino contrato com startup em fase inicial antes de ver isso acertar no meu próprio código. Talvez eu deixe um time rodar o piloto grátis, já que roda no nosso ambiente e o código é auditável, mas comprar agora, não." (P001) · "Eu toparia o piloto grátis, mas não assino nada no primeiro mês: R$ 2.500 mais uns R$ 450 de LLM é pouco perto do meu time, só que eu corto SaaS todo trimestre e preciso ver em horas de dev economizadas que vale. Startup em fase inicial, sem nenhum caso real ainda, entra como teste, não como compra." (P002) |
| habit | 2 | "O fato de rodar no nosso ambiente com o código aberto tira o meu medo de entregar o código-fonte, mas isso também mostra que é basicamente uma Action chamando o nosso LLM. Um dev meu monta isso em duas sprints com Claude e o MCP do Jira, e eu não pago R$ 30 mil por ano para uma startup de um fundador só." (P006) · "R$ 2.500 é troco pro meu orçamento, mas o que vocês descrevem é exatamente o tipo de coisa que meu time monta em duas ou três sprints com Claude, MCP do Jira e um workflow no GitHub Actions, e acabei de fechar Jira e Copilot, não quero mais um fornecedor agora. No máximo eu aceito o piloto grátis para ver o baseline de retrabalho, mas pagar no primeiro mês não." (P016) |
| quality | 1 | "Eu até topo o piloto grátis, mas não levo R$ 2.500 + uns R$ 450 de token pro CTO sem ver os testes Playwright gerados rodando verdes no nosso pipeline sem virar mais um lote de teste flaky pro meu time manter. No primeiro mês não pago nada; decido depois do piloto." (P009) |
| need | 1 | "Acabei de renegociar Jira e Copilot e meus tech leads já confrontam a story com o código no refinamento; não tenho uma dor de retrabalho medida que justifique mais uma ferramenta agora. Gostei de rodar no Azure Pipelines com a nossa chave de Azure OpenAI, mas isso só tira a objeção de segurança, não cria a necessidade." (P020) |

## Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 7 | "Meu medo era mandar código para uma startup de um fundador só, mas roda no nosso pipeline, com a nossa chave de IA, código aberto para auditoria e licença perpétua se fecharem, então esse bloqueio cai. O board me cobra eficiência e uso de IA, e um piloto grátis medindo stories reabertas é exatamente a prova que eu preciso; entro no piloto e só pago se o antes/depois mostrar horas de dev economizadas." (P004) · "Minha cobertura de Playwright está atrasada e R$ 2.500 é troco perto do custo de um QA; com piloto grátis, código aberto e rodando na nossa própria chave de IA, eu ligo isso na semana que vem. Mas assino só se o time estiver usando de verdade no fim do piloto, senão cancelo como cancelo metade do que testo." (P008) |
| convenience | 1 | "Piloto grátis de 30 dias, roda como GitHub Action com a nossa chave de LLM e o código é auditável, então não preciso esperar 3 meses de segurança pra testar; e como o resultado cai direto no card, o PM não tem que abrir mais uma ferramenta. Eu ligo o piloto essa semana e levo o antes/depois pro CTO." (P017) |

## What would flip a no

- Um piloto no nosso repositório real mostrando queda medida de stories reabertas e a maioria das afirmações confirmadas pelos meus devs, com os PMs usando sem eu precisar cobrar.
- O piloto de 30 dias no nosso repositório mostrar queda clara de stories reabertas contra o baseline e meus devs confirmando a grande maioria das afirmações, com poucos erros de regra de negócio.
- O piloto no nosso próprio código mostrar que os devs confirmaram quase todas as afirmações (acima de 90%), com 'não encontrei' quando não havia evidência, e queda mensurável de stories reabertas em relação ao baseline, em números que eu consiga mostrar ao CTO.
- Piloto no nosso repo real mostrando custo de token medido abaixo do teto e a maioria das afirmações confirmadas pelos meus devs, com o código aberto já revisado pelo nosso time de segurança.
- Um piloto em que o baseline mostre queda clara das stories devolvidas (algo como 30% ou mais) e uma taxa alta de afirmações confirmadas pelos devs, que o nosso protótipo interno não consiga igualar no mesmo período.
- Um piloto no nosso repositório em que os devs confirmem pelo menos 90% das afirmações, com o 'não encontrei' aparecendo quando deveria, e queda mensurável de stories reabertas contra o baseline dos 3 meses.
- Fim do piloto mostrando, no nosso repo, custo real por story perto do prometido e pelo menos uns 20 a 30 horas de QA/dev economizadas por mês com testes Playwright que o time aproveitou sem reescrever.
- Um piloto de 30 dias no nosso repositório mostrando queda clara de stories reabertas contra o baseline e afirmações confirmadas pelos devs, com o pacote de segurança pronto (DPA, questionário respondido, SBOM) para o CTO aprovar sem fricção.
- Um piloto de 30 dias no nosso repositório principal em que os devs confirmem a maioria das afirmações, o custo real de LLM fique perto do prometido com o teto funcionando, e a taxa de stories reabertas caia de forma mensurável contra o baseline.
- Um piloto no nosso repo principal em que meus devs confirmem a maioria das afirmações com arquivo e trecho, e uma queda mensurável de stories reabertas contra o baseline dos últimos 3 meses, com o time de segurança aprovando a Action em semanas, não em meses.
- O piloto mostrar, no meu próprio histórico, uma queda clara de stories reabertas (tipo 20% ou mais) com afirmações confirmadas pelos meus devs, e um protótipo interno nosso não chegar perto disso no mesmo período.
- Se o piloto grátis mostrar com nossos próprios números que uma fatia relevante das stories volta ou é reaberta por divergência com o código, e que os devs confirmam a maioria das afirmações.

Buyers say they would buy **1.0 times** in the first month on average.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.
