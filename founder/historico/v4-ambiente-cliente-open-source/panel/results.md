# Buyer panel: Esteira: revisor de user story contra o código para PMs (SaaS B2B, Brasil)

**4 buy · 16 pass** (20% buy) out of 20 simulated buyers. Seed 677932, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

## By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| CTO ou VP de Engenharia em empresa de 50 a 200 devs (salário anual em R$) | 6 | 33%  (thin) |
| Engineering Manager ou Head de QA que influencia a compra, mas precisa de aprovação do CTO (salário anual em R$) | 4 | 25%  (thin) |
| Head/Diretor(a) de Produto em scale-up de 20 a 80 devs (salário anual em R$) | 7 | 14%  (thin) |
| Head de Produto em empresa regulada (fintech/seguros) com 80 a 200 devs, processo de compra com segurança e jurídico (salário anual em R$) | 3 | 0%  (thin) |

## By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Early adopter de ferramentas de IA | 3 | 67%  (thin) |
| Cuidadoso com orçamento | 2 | 50%  (thin) |
| Stack Microsoft (Azure DevOps) | 3 | 33%  (thin) |
| Já testou IA e se decepcionou | 4 | 0%  (thin) |
| Constrói internamente | 2 | 0%  (thin) |
| Segurança em primeiro lugar | 2 | 0%  (thin) |
| Preso ao ecossistema Atlassian | 4 | 0%  (thin) |

## By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $518,000 and up | 8 | 25% |
| under $376,000 | 6 | 17%  (thin) |
| $376,000 to $518,000 | 6 | 17%  (thin) |

## Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| trust | 9 | "R$ 2.500 não é o problema, é troco perto do que já gastei com Copilot. O problema é que já paguei por IA que alucinou no nosso código, e uma startup em fase inicial que ninguém conhece não entra em contrato aqui antes de provar no nosso repositório, e isso não acontece em um mês com o meu time de segurança." (P001) · "Já paguei Copilot e ChatGPT Enterprise e vi alucinação. Não assino nada com uma startup em fase inicial antes de ver no nosso código. No máximo topo o piloto grátis, mas comprar agora não, e o CTO também não aprovaria." (P003) |
| habit | 5 | "Rodar no nosso ambiente com a nossa chave resolve meu medo de entregar o código, mas se o motor é open source e roda com a nossa LLM, meu time pega o motor, pluga um MCP do Jira e monta isso em duas sprints. Não vou pagar R$ 2.500 por mês por uma interface e um painel de uma startup de um fundador só." (P006) · "A dor é real, perdi stories na última sprint por regra duplicada, e rodar no nosso ambiente com motor open source tira boa parte do meu medo de código. Mas tudo aqui é Atlassian e minha aposta é que o Rovo cubra isso em alguns meses; não vou colocar outro app de fornecedor pequeno no fluxo agora, no máximo deixo alguém do time olhar o repositório open source." (P012) |
| other | 1 | "Eu entro no piloto grátis sem pensar duas vezes, mas não pago agora: o motor é open source e roda com a minha chave, então a parte que me interessa (gerar Playwright a partir da story e do código) um dev meu pluga no pipeline sem a licença. Os R$ 2.500 não pesam no orçamento; o que eu não vejo ainda é por que pagar pela camada de PM." (P008) |
| need | 1 | "Meus tech leads já confrontam a story com o código no refinamento, e eu acabei de renegociar Jira e Copilot; a aposta da casa é o Rovo cobrir isso dentro do Atlassian antes de eu colocar mais uma ferramenta avulsa de startup em fase inicial." (P020) |

## Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 4 | "Cobertura de Playwright atrasada é dor real aqui, e R$ 1.500 a 2.500 por mês é menos que um dia de um dev sênior; com piloto grátis rodando no nosso ambiente e baseline de retrabalho, eu topo testar e entro como Cliente Fundador se os números fecharem. Não pago nada antes de ver o antes/depois." (P002) · "Minha cobertura de Playwright está atrasada e um piloto grátis de 30 dias, rodando na nossa chave e no nosso ambiente, eu consigo aprovar com o CTO sem briga de segurança. Se o time usar, R$ 1.500 de fundador é troco perto do custo de um QA." (P009) |

## What would flip a no

- Um piloto no nosso repo de verdade em que os devs confirmem a grande maioria das afirmações e o baseline mostre queda real de stories reabertas, com o time de segurança aprovando rápido porque é open source e roda com a nossa chave.
- Um piloto de 30 dias no nosso repositório em que os devs confirmem a grande maioria das afirmações, quase nenhuma regra de negócio venha errada e caia de forma mensurável o número de stories reabertas em relação ao baseline. Com esses números eu levo ao CTO.
- Um piloto no nosso repositório que mostre queda clara de stories reabertas convertida em horas de dev economizadas por mês, valendo bem mais que R$ 3.000/mês, com os devs confirmando a maioria das afirmações.
- Um piloto de 30 dias no nosso próprio repositório, liberado pela segurança, mostrando queda real de stories reabertas, alta taxa de afirmações confirmadas pelos devs e o custo de LLM medido na nossa conta. Com isso eu levo para compra no trimestre seguinte.
- Um piloto no nosso repo que mostre as stories que voltaram caindo de verdade, com meus devs confirmando a maioria das afirmações, e um custo bem menor do que eu gastaria pondo um dev pra construir e manter isso internamente.
- Um piloto no nosso repositório em que os devs confirmem pelo menos 90% das afirmações e o baseline mostre queda clara de stories reabertas, com o time de segurança aprovando o código auditado.
- Ver no fim do piloto que os PMs usaram sozinhos, sem eu cobrar, e que os testes Playwright gerados entraram na suíte e passaram em CI sem retrabalho grande do QA. Aí eu pago, e no preço de fundador fecho na hora.
- Um cliente de fintech ou seguradora já em produção que eu possa ligar, mais um pacote de segurança pronto (DPA, respostas ao questionário de fornecedor, escopo exato das permissões no Jira) que encurte a homologação para semanas.
- Um piloto no nosso repositório em que meus devs confirmem as afirmações e o retrabalho caia de forma mensurável contra o baseline, junto com uma comparação lado a lado mostrando que o Rovo não faz o mesmo cruzamento story x código.
- Um piloto rodando no nosso repositório real mostrando custo de tokens por story dentro do teto e queda medida de stories reabertas, comparado lado a lado com o que o Rovo entrega hoje.
- Um piloto no nosso repositório principal em que os devs confirmem a maioria das afirmações e o baseline mostre queda real de stories reabertas, com segurança aprovando rápido por ser open source e rodar na nossa nuvem.
- Um piloto que mostre, com os nossos dados, queda clara de stories reabertas que eu consiga apresentar ao CTO, e que a interface/histórico economize mais tempo do que meu time gastaria montando e mantendo a versão interna.

Buyers say they would buy **1.0 times** in the first month on average.

20 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.
