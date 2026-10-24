# Pricing: Esteira

> **Atualização 12/10/2026:** a versão viável do plano mudou três decisões (ver `offer.md` §7 e `cfo.md`). (1) **IA do cliente (BYOK):** a análise roda na assinatura ou API do cliente, no ambiente dele, e a Esteira não paga token; tudo o que este arquivo diz sobre custo de LLM da Esteira e Modo Cofre como opção deixou de valer. (2) **Clientes Fundadores pagam R$ 2.500** com preço travado por 24 meses, não R$ 1.500. (3) **Cliente-alvo inicial:** não reguladas e fora do ecossistema Atlassian. CAC máximo atualizado: R$ 2.125 × 12 ÷ 3 ≈ **R$ 8.500**.


Todos os preços são em R$ por mês, por empresa. Base: 20 compradores simulados (`pricing-curve.md`), concorrentes (`competitors.md`) e, para a margem, o CFO (`/founder-cfo`, ainda pendente).

## O que os compradores disseram (Van Westendorp, 20 respostas simuladas)

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

## O que a concorrência cobra (preços públicos, em dólar)

Ver `competitors.md`. Mesma tarefa, comparada em base equivalente:

- **Por assento:** Rovo Dev US$ 20/dev/mês ([fonte](https://www.atlassian.com/software/rovo-dev/pricing)), Copilot Business/Enterprise US$ 19/39 por usuário ([fonte](https://getdx.com/blog/ai-coding-assistant-pricing/)), Copilot4DevOps a partir de US$ 30/usuário ([fonte](https://www.capterra.co.nz/software/1066066/copilot4devops)). Em um time de 50 devs + 5 PMs, um assento de US$ 20–39 para todos dá **US$ 1.100–2.150/mês**. Nenhum deles entrega o fluxo do PM contra o código.
- **Por uso / sob consulta:** Bito AI Architect, Devin, Swimm.
- **De graça agora:** Allstacks Product Studio (temporário). É o risco de preço mais direto.
- **QA gerenciado:** QA Wolf, ~US$ 4–10 mil/mês, segundo um concorrente.

**Leitura:** cobrar **por empresa, com preço fixo e previsível** diferencia contra a confusão de créditos e escala com o número de devs sem cobrar assento de dev. O que pesa contra é o custo de LLM em monorepos grandes (objeção levantada por 4 compradores). O preço por empresa precisa de um limite justo de uso (ver ladder).

## O que o negócio precisa

**Pendente.** Ainda não há `founder/numbers.json`. A variável que decide a margem é **o custo de LLM + infra por análise de story × stories analisadas por cliente por mês**, que ninguém mediu. O `/founder-cfo` vai rodar a margem nos três preços candidatos (R$ 2.500, R$ 3.900 e R$ 6.500) e este arquivo é atualizado se algum não fechar.

## 1. O preço

**Plano Time: R$ 2.500/mês por empresa** (anual) ou **R$ 2.900 no mensal**.

- Fica perto do 1º terço da faixa aceitável (550–7.000), acima do IPP (1.531) e longe do PME, o que deixa espaço para subir depois de ter prova.
- Para um time de 50 devs, fica na mesma ordem de grandeza do que um assento de IA de dev custa para todos, mas entrega algo que nenhum deles entrega ao PM.
- Comparado com o custo da dor que os compradores citaram ("menos que uma semana de um QA"; "duas stories voltaram na última sprint"), o valor é fácil de justificar *se* o piloto medir o retrabalho evitado.
- **Margem: a confirmar no `/founder-cfo`.** Se o custo de LLM por cliente passar de ~30% do preço, subir o plano de entrada ou reduzir o limite de análises.

## 2. A escada (good / better / best)

| plano | R$/mês | para quem | motivo para subir |
|---|---:|---|---|
| **Piloto** | grátis por 30 dias | qualquer empresa do perfil | 1 board + 1 repositório não crítico, relatório de acerto validado pelos devs |
| **Time** | 2.500 (anual) / 2.900 (mensal) | scale-up de 20–80 devs | refinamento PM contra o código, 1 gerenciador de tarefas + 1 provedor, até 10 PMs, ~300 análises de story/mês (limite a validar no CFO) |
| **Business** | 5.500 | 80–200 devs, ou quem precisa de QA | + geração de Playwright para QA, mapa para dev, múltiplos provedores, SSO, DPA/LGPD padrão, análises ampliadas |
| **Enterprise / Self-hosted** | a partir de 9.000 (sob proposta) | reguladas, "segurança em primeiro lugar" | roda na nuvem do cliente (VPC/Azure do cliente) com o LLM do próprio cliente, questionário de segurança, suporte dedicado. **É o degrau que derruba a objeção nº 1 do painel.** |

O Business fica abaixo do PME (6.998). O Enterprise fica acima da faixa geral, mas dentro do que o segmento regulado declarou (tetos de 12–20 mil). Testar com cuidado.

## 3. Oferta de abertura

**Programa "Clientes Fundadores": 5 vagas.** O plano Time ou Business sai com **40% de desconto por 12 meses** (Time a R$ 1.500/mês) em troca de: (a) um piloto com métricas de acerto e retrabalho medidas junto com o time do cliente; (b) autorização para virar caso de uso com números; (c) uma call de feedback por mês.

- **Termina** quando as 5 vagas forem preenchidas ou em **31/03/2027**, o que vier primeiro. Depois volta ao preço cheio, que já é público desde o primeiro dia (não é âncora falsa).
- Não ensina o mercado a esperar desconto: o desconto é troca por prova, não liquidação.

## 4. O que testar com compradores reais

1. **R$ 2.500 vs. R$ 3.900** no plano Time. Duas versões de landing page/one-pager mandadas para listas diferentes de Heads de Produto/CTOs (outbound), medindo agendamento de piloto e, ao fim do piloto, conversão em contrato. Ver `/founder-launch`.
2. **Por empresa vs. por PM** (ex.: R$ 450/PM/mês). Perguntar nas 10–15 primeiras conversas de descoberta qual formato passa mais fácil no orçamento e no procurement.
3. **Disposição a pagar pelo self-hosted.** Nas conversas com reguladas, perguntar o preço com e sem self-hosted e se ele é condição para fechar.

## 5. As objeções de preço do painel (literais)

Há poucas objeções de preço; quase todas são de confiança. As três que tocam em preço:

1. *"Acabei de fechar Jira e Copilot e não tenho como provar para o CFO que isso reduz retrabalho, porque hoje nem meço retrabalho. [...] pagar R$ 2.500 por mês sem número na mão eu não assino."* (P018)
2. *"Acabei de passar semanas renegociando Jira e Copilot; não vou levar ao CTO mais uma linha de R$ 30 mil por ano sem conseguir mostrar retorno."* (P016)
3. O custo de tokens num monorepo grande sob preço fixo: o comprador teme "análise rasa, aumento de preço depois ou a empresa ficar sem caixa" (P010, resumo do moderador).

**Resposta para o marketing:** o piloto entrega o número de retrabalho que o comprador não tem hoje (antes/depois), o preço é fixo com um limite claro de análises, e não há cobrança por token.
