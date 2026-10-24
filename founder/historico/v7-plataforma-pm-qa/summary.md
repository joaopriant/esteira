# Resumo

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
