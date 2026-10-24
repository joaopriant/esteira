# Lançamento: Esteira

> **Atualização 12/10/2026:** a versão viável do plano mudou três decisões (ver `offer.md` §7 e `cfo.md`). (1) **IA do cliente (BYOK):** a análise roda na assinatura ou API do cliente, no ambiente dele, e a Esteira não paga token; tudo o que este arquivo diz sobre custo de LLM da Esteira e Modo Cofre como opção deixou de valer. (2) **Clientes Fundadores pagam R$ 2.500** com preço travado por 24 meses, não R$ 1.500. (3) **Cliente-alvo inicial:** não reguladas e fora do ecossistema Atlassian. CAC máximo atualizado: R$ 2.125 × 12 ÷ 3 ≈ **R$ 8.500**.


Hoje: **sáb 10/10/2026**. Data-alvo de abertura do programa de pilotos: **seg 01/02/2027** (a mesma de `marketing.md`). Responsável por tudo: **o fundador** (F), salvo indicação. Data mais cedo realista dado o que `ops.md` exige: MVP + Kit de Segurança + pentest. O pentest depende do MVP pronto e leva semanas.

## 1. Teste antes de gastar (out–dez/2026)

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

## 2. A contagem regressiva

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

## 3. O dia da abertura: seg 01/02/2027

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

## 4. Os primeiros 30 dias (01/02–03/03/2027)

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
