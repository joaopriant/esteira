# Fontes dos números (`numbers.json`)

Nenhum número veio de cotação, fatura ou contrato do fundador. **Todos são estimativas**, com o raciocínio abaixo. Substitua-os assim que tiver valores reais.

| número | valor (R$) | tipo | raciocínio / o que fazer |
|---|---:|---|---|
| Preço médio | 2.000/cliente-mês | derivado | 5 Clientes Fundadores a 1.500 + 5 a 2.500 (`pricing.md`, `offer.md`) |
| LLM por cliente | 440/mês | **preço público + volume estimado** | Preço: Sonnet 5.5 a US$ 2/MTok de entrada, US$ 10/MTok de saída, US$ 0,10/MTok de cache read ([claude.com/pricing](https://claude.com/pricing), 10/10/2026). Volume estimado: ~400 mil tokens de entrada por análise (70% em cache) + ~10 mil de saída ≈ US$ 0,37, arredondado para US$ 0,40; × ~200 análises/mês × R$ 5,50/US$. **Medir no piloto:** tokens por análise, por tamanho de repo. Zero no Modo Cofre. (Antes de `/founder-ops` era R$ 880, com US$ 0,80/análise chutado) |
| Infra por cliente | 150/mês | estimativa | indexação, compute de análise, storage, vetor; validar com a fatura da cloud no piloto |
| Imposto sobre receita | 120/mês (6%) | estimativa | alíquota inicial do Simples Nacional para serviços de software com fator R favorável; pode chegar a 15,5% (Anexo V). **Confirmar com contador** |
| Taxa de cobrança | 5/mês | preço público | Asaas: Pix/boleto R$ 1,99 por cobrança recebida + nota fiscal R$ 0,49 ([asaas.com/precos-e-taxas](https://www.asaas.com/precos-e-taxas), 10/10/2026). Cartão seria 2,99% + R$ 0,49. Stripe BR: cartão 3,99% + R$ 0,39, boleto R$ 3,45 ([stripe.com/br/pricing](https://stripe.com/br/pricing)) |
| Contabilidade (referência) | 500/mês | faixa pública | contabilidade online para ME no Simples: R$ 199–899/mês ([Agilize](https://agilize.com.br/artigos/?p=881)); a partir de R$ 189/mês ([contabilidade.com](https://contabilidade.com/blog/quanto-custa-a-contabilidade-online-em-2026-guia-de-precos-e-o-que-esta-incluso/)). Pedir cotação |
| Reserva da garantia | 100/mês | estimativa | 20% dos clientes acionam × 3 meses de reembolso ÷ 12 meses de vida média = 5% do preço |
| Pró-labore | 6.000/mês | estimativa | mínimo para um fundador solo se manter; 0 em bootstrap puro (cenário rodado) |
| Infra base | 1.000/mês | estimativa | ambientes de produção e staging, banco, logs |
| Ferramentas SaaS | 1.200/mês | estimativa | GitHub, e-mail, CRM, domínio, monitoramento, assinatura de design |
| Contabilidade | 500/mês | estimativa | contador para empresa no Simples |
| LLM de dev e pilotos | 1.500/mês | estimativa | desenvolvimento + análises dos pilotos grátis |
| Abertura de CNPJ | 1.500 | estimativa | |
| Jurídico (DPA/LGPD, termos) | 6.000 | estimativa | cotar com advogado de tecnologia |
| Pentest independente | 15.000 | estimativa | pedido por 2 compradores regulados no re-teste; cotar com 2–3 empresas |
| LLM/infra do MVP | 4.000 | estimativa | |
| Lançamento | 5.000 | estimativa | landing, materiais, presença em 1–2 eventos/meetups |
| Câmbio | 5,50 R$/US$ | **estimativa** | conferir a cotação do dia; o custo de LLM é cobrado em dólar |
| Capacidade | 15 clientes | estimativa | onboarding + suporte de um fundador solo |
| Rampa | 0,0,1…10 | estimativa | ver nota do CFO em `cfo.md` |
| SOC 2 | não incluído | | fora do ano 1; virou objeção nº 1 no re-teste da oferta. Orçar antes de atacar os regulados |
