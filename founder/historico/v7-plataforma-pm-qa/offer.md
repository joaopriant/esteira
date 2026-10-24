# Oferta: Esteira

Método: lens de Ofertas (resumo do framework de *$100M Offers*; ver `founder-board/lenses.md`). Insumos: `panel/results.md` (v1), `board.md`, `competitors.md`, `pricing.md`. Os custos são estimativas qualitativas: ainda não há `numbers.json`, e o `/founder-cfo` valida.

## 1. Lista de problemas (nas palavras do comprador)

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

## 2. Soluções, pontuadas e cortadas

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

## 3. O stack

**Nome da oferta: "Piloto Spec à Prova de Código"**

- **Núcleo:** a story confrontada com o código real, com cada afirmação ligada ao arquivo e ao trecho, e "não encontrei" quando não há evidência. Para o dev, o mapa da tarefa; para o QA, testes Playwright.
- **Bônus 1, Modo Cofre** (mata "onde vai o meu código"): roda com a chave de LLM da empresa, sem armazenar código, hospedado no Brasil. Container na nuvem do cliente no plano Enterprise.
- **Bônus 2, Kit de Segurança no primeiro contato** (mata "segurança leva 3 meses"): DPA/LGPD assinável, questionário de fornecedor respondido, diagrama de dados. Diz com honestidade: "ainda não temos SOC 2".
- **Bônus 3, Baseline de Retrabalho** (mata "não consigo provar ROI"): antes do piloto, medimos as stories que voltaram ou foram reabertas nos últimos 3 meses; no fim, entregamos o antes/depois.
- **Bônus 4, Sem lock-in** (mata "e se a empresa fechar"): tudo que é gerado fica no Jira e no repositório do cliente.
- **Garantia:** nos primeiros 90 dias pagos, se os devs confirmarem menos de 85% das afirmações em uma amostra de 20 stories, devolvemos os 3 meses. **Custo a modelar no CFO.** Se 20% dos clientes acionarem a garantia, o custo é 3 meses de receita × 20% ≈ 0,6 mês de receita por cliente adquirido.
- **Urgência verdadeira:** Clientes Fundadores, 5 vagas a R$ 1.500/mês por 12 meses em troca de caso de uso. Termina com as 5 vagas preenchidas ou em 31/03/2027.

## 4. Equação de valor (antes → depois)

| elemento | v1 | v2 | o que moveu |
|---|---:|---:|---|
| Resultado dos sonhos (spec que bate com o código, menos retrabalho) | 7 | 8 | Baseline de Retrabalho torna o resultado mensurável |
| Probabilidade percebida | 3 | 5 | Evidência arquivo/trecho, garantia de 85%, baseline. **Continua baixa:** sem SOC 2, sem cliente de referência |
| Tempo até o resultado | 4 | 5 | Kit de Segurança encurta a aprovação; setup em call. A aprovação de segurança segue em semanas |
| Esforço e sacrifício | 3 | 5 | Modo Cofre e sem lock-in reduzem o risco percebido; o processo de fornecedor continua pesado |

## 5. Re-teste (mesma seed 677932, os mesmos 20 compradores)

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

## 6. Teste "só PM" (11/10/2026, mesma seed 677932)

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

## 7. Busca de viabilidade (11–12/10/2026)

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
