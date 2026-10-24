# Nota do CFO: Esteira (versão viável, 12/10/2026)

**O que mudou em relação à versão anterior:**
1. **IA do cliente (BYOK, como no Maestri).** A análise roda na assinatura (Claude, ChatGPT) ou na chave de API do próprio cliente. O custo de LLM da Esteira por cliente cai de R$ 440 para **R$ 0**.
2. **IA de desenvolvimento do fundador:** R$ 1.500 → **R$ 600/mês** (estimativa: uma assinatura tipo Claude Max). Os pilotos rodam na IA do cliente.
3. **Preço de R$ 2.500 para todos.** Os Clientes Fundadores ganham preço travado por 24 meses e entram no conselho de roadmap, em vez de 40% de desconto. É uma decisão de oferta; o painel v6 testou esse pitch.

**Leia antes da tabela:** a ferramenta escreve "$", mas os valores são **R$**. "a day" = **clientes ativos no mês**. Os custos fixos, a abertura e a rampa continuam sendo **estimativas** (`cfo-sources.md`). Não é aconselhamento financeiro ou tributário: um contador confere o Simples, o fator R e o pró-labore.

- **A margem.** Cada cliente deixa **R$ 2.125 de contribuição (85%)**. O break-even é de **5 clientes**. Com 10 clientes, a margem de lucro é de **48%**.
- **Ano 1:** lucro operacional de **+R$ 5.275** sobre R$ 137.500 de receita. Os meses 1–6 dão prejuízo; o resultado vira positivo a partir do 6º cliente (mês 8).
- **Caixa:** **R$ 66.050** antes de o negócio se pagar (abertura de R$ 31.500 + prejuízo acumulado até o mês 6). O investimento inicial **não volta no ano 1**: no mês 12 ainda faltam R$ 26.225.
- **A linha que mais pesa agora é a rampa (velocidade de vendas), não o custo.** O preço 10% menor leva o ano 1 a **−R$ 8.475**. Com 20% menos clientes, o ano 1 vai a **−R$ 18.100**. **A viabilidade depende de chegar a 10 clientes pagantes até o mês 12.**
- **Custo transferido ao cliente:** ~US$ 0,40 por story na IA dele (~R$ 450/mês para 200 stories). Não está no nosso P&L, mas entra na conta de ROI do comprador e precisa ser medido no piloto (objeção recorrente no painel).

**Três jeitos de ganhar folga** (rodados em versões anteriores ou nesta):
| alavanca | efeito |
|---|---|
| Pró-labore de R$ 6.000 → R$ 3.000 nos primeiros 12 meses | +R$ 36.000 no ano 1 (cálculo direto: 12 × R$ 3.000) |
| Preço R$ 3.000 a partir do 6º cliente (dentro da faixa do painel: 520–6.017) | testar com compradores reais antes de assumir |
| Plano Business R$ 5.500 (QA/Playwright) para 2–3 clientes | cada cliente Business soma R$ 3.000/mês de contribuição |

**Condições do board sobre dinheiro:**
- [x] *Custo de LLM compatível com o preço*: **atendido por design**. Zero para a Esteira (BYOK); o custo do cliente fica visível com teto.
- [x] *Preço e garantia que caibam na conta*: **atendido**. Contribuição de 85% com a reserva de garantia incluída.
- [ ] *CAC estimado*: **não atendido**. A venda é feita pelo fundador; falta dado real de conversão (`launch.md`).

---

# Unit economics: Esteira (SaaS B2B, Brasil). Unidade = 1 cliente pagante ativo no mês. Como days_per_month = 1, os campos *_per_day significam clientes ativos no mês. Preço R$ 2.500 para todos; Clientes Fundadores ganham preço travado por 24 meses em vez de desconto.

Every number below comes from the input file. Nothing is looked up or guessed.

## One cliente-mês

| line | per cliente-mês |
| --- | ---: |
| Price | $2,500.00 |
| LLM: zero, modelo BYOK (a IA roda na assinatura ou API do próprio cliente, como no Maestri) | -$0.00 |
| Infra por cliente: indexação, compute, storage (estimativa) | -$150.00 |
| Imposto sobre receita, Simples Nacional ~6% (estimativa, confirmar com contador) | -$120.00 |
| Cobrança via Asaas: Pix/boleto R$1,99 + NF R$0,49 por mês (asaas.com/precos-e-taxas) | -$5.00 |
| Reserva para a garantia de 85% (20% acionam x 3 meses / 12 meses de vida) | -$100.00 |
| **Contribution** (what each cliente-mês leaves to pay the fixed costs) | **$2,125.00** (85%) |

## The margin that matters

Fixed costs: $9,300 a month (Pró-labore do fundador (estimativa; 0 se bootstrap puro) $6,000, Infra base de cloud e ambientes (estimativa) $1,000, Ferramentas SaaS: GitHub, e-mail, CRM, domínio, monitoramento (estimativa) $1,200, Contabilidade (estimativa) $500, IA do fundador para desenvolvimento (estimativa: 1 assinatura tipo Claude Max ~US$100 x R$5,50); pilotos rodam na IA do cliente $600).

- **Break-even: 5 cliente-mêss a day.** Below that you lose money every month.
- **Profit margin at your plan** (10 a day): **48%** of every sale, after every cost.
- Capacity: 15 a day.

## Year 1, month by month

| month | cliente-mêss a day | revenue | profit | cumulative (after $31,500 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $0 | -$9,300 | -$40,800 |
| 2 | 0 | $0 | -$9,300 | -$50,100 |
| 3 | 1 | $2,500 | -$7,175 | -$57,275 |
| 4 | 2 | $5,000 | -$5,050 | -$62,325 |
| 5 | 3 | $7,500 | -$2,925 | -$65,250 |
| 6 | 4 | $10,000 | -$800 | -$66,050 |
| 7 | 5 | $12,500 | $1,325 | -$64,725 |
| 8 | 6 | $15,000 | $3,450 | -$61,275 |
| 9 | 7 | $17,500 | $5,575 | -$55,700 |
| 10 | 8 | $20,000 | $7,700 | -$48,000 |
| 11 | 9 | $22,500 | $9,825 | -$38,175 |
| 12 | 10 | $25,000 | $11,950 | -$26,225 |

- **Year 1 operating profit: $5,275** on $137,500 of revenue.
- After the $31,500 startup spend: -$26,225.
- Startup money earned back: not within year 1.
- Cash you need before it pays for itself: **$66,050**.

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 48% | 5 | $5,275 |
| Price -10% | 42% | 5 | -$8,475 |
| Volume -20% | 38% | 5 | -$18,100 |
| Unit costs +15% | 46% | 5 | $2,181 |

## Red flags

- The startup spend is not earned back within year 1.
