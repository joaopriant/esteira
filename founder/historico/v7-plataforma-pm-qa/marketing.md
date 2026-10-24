# Marketing: Esteira

> **Atualização 12/10/2026:** a versão viável do plano mudou três decisões (ver `offer.md` §7 e `cfo.md`). (1) **IA do cliente (BYOK):** a análise roda na assinatura ou API do cliente, no ambiente dele, e a Esteira não paga token; tudo o que este arquivo diz sobre custo de LLM da Esteira e Modo Cofre como opção deixou de valer. (2) **Clientes Fundadores pagam R$ 2.500** com preço travado por 24 meses, não R$ 1.500. (3) **Cliente-alvo inicial:** não reguladas e fora do ecossistema Atlassian. CAC máximo atualizado: R$ 2.125 × 12 ÷ 3 ≈ **R$ 8.500**.


Base: `panel/results.md` e `panel-v2/results.md` (20 compradores simulados, duas versões), `competitors.md`, `offer.md`, `pricing.md`, `cfo.md`. As citações do painel são pesquisa e **nunca** aparecem em anúncio como depoimento de cliente.

## O que a evidência diz

- **Quem compra:** early adopters de ferramentas de IA (3 de 3 compram nas duas versões), em scale-ups **não reguladas**. Dois deles compraram pela **dor de cobertura Playwright atrasada**, o outro pela **story que volta porque a regra já existia**.
- **Quem não compra agora:** reguladas (0%), presos ao Atlassian (esperam o Rovo), "constrói em casa", "já se decepcionou com IA". Não são o primeiro público.
- **Objeções a responder** (re-teste da oferta): startup sem SOC 2 nem referência; quem paga os tokens no Modo Cofre; "o Rovo vai fazer"; "monto em casa"; "não meço retrabalho".
- **Gap** (`competitors.md`): confiança verificável (arquivo/trecho + "não encontrei") para PM não técnico; stack Azure DevOps puro; Brasil/português.

## 1. Posicionamento

**A (recomendada)**
> Para Heads de Produto e CTOs de scale-ups brasileiras que já testam IA e veem stories voltarem do dev "porque a regra já existia de outro jeito", a Esteira é o revisor de spec que confronta cada story com o código real e mostra a prova (arquivo e trecho), diferente de assistentes de código feitos para o dev, que respondem com confiança sem mostrar de onde tiraram.

*Evidência:* as duas razões de compra foram retrabalho e Playwright; a objeção nº 1 durante o uso é a IA afirmar regra errada (P003, P019); a reclamação nº 1 dos concorrentes é contexto errado dito com confiança.

**B (pela dor de QA)**
> Para times com cobertura Playwright atrasada, a Esteira transforma cada user story em testes Playwright ancorados no código real, diferente de geradores que só leem o texto do ticket.

*Evidência:* 2 dos 3 compradores. **Risco:** é um campo lotado (QA Wolf, Autify, TestStory, os agentes do próprio Playwright). Usar como porta de entrada secundária, não como posicionamento.

**C (pelo stack)**
> Para empresas em Azure DevOps, a Esteira é a única ferramenta que confronta story e código com Azure Boards + Azure Repos, onde a integração do Copilot não chega.

*Evidência:* o Copilot com Azure Boards não suporta Azure Repos (`competitors.md`). **Mas** os 3 compradores Azure do painel passaram. Usar como mensagem de nicho em outbound, não como posicionamento principal.

**Recomendo A**, com B como hook de entrada para QA e C como segmentação de lista.

## 2. Canais

| canal | por que serve a este comprador | custo | como saber que funcionou | decisão |
|---|---|---|---|---|
| **Outbound do fundador no LinkedIn + e-mail** para Heads de Produto/CTOs de scale-ups não reguladas de 20–80 devs | O público é listável, B2B, compra com conversa; o fundador vende o piloto | tempo + ferramenta de prospecção (~R$ 300/mês, estimativa) | ≥ 5 conversas qualificadas/semana; ≥ 20% viram piloto | **COMEÇAR** |
| **Conteúdo "Story vs. Código" em repositórios open source**: o fundador pega uma issue real de um projeto open source conhecido e mostra a análise com arquivo/trecho, em post + vídeo curto no LinkedIn | Demonstra o produto **sem pedir acesso ao código de ninguém**, ataca a objeção nº 1 (confiança) e a nº 2 (alucinação) de uma vez | tempo | comentários de PMs/CTOs, pedidos de piloto via DM, ≥ 2 leads/semana | **COMEÇAR** |
| **Comunidades e meetups de produto e de QA/Playwright no Brasil** (falar, demonstrar ao vivo) | Early adopters frequentam; a demo ao vivo gera confiança que post não gera | inscrição/viagem (~R$ 1.500–2.500 por evento, estimativa) | leads com nome por evento; pilotos agendados em 2 semanas | **COMEÇAR** (1 por mês) |
| Mídia paga (LinkedIn Ads, Google) | B2B caro, ciclo longo; sem prova social ainda, vira custo alto por lead frio | alto | | **NÃO AGORA**: depois de 3 casos de uso |
| Reguladas (fintech/seguros) | 0% no painel; exigem SOC 2/pentest e referência | | | **NÃO AGORA**: depois do pentest e de 2 referências |
| Atlassian Marketplace / Azure Marketplace | Distribuição boa, mas exige app polido e revisão | médio | | **Mês 4+** |
| SEO / blog | Demora meses | baixo | | **NÃO AGORA** |

## 3. Campanha de 30 dias

**Abertura do programa de pilotos ("lançamento"): segunda, 01/02/2027.** Premissa: MVP (PM + 1 board + 1 provedor), Kit de Segurança e Modo Cofre (chave do cliente) prontos até 25/01. `/founder-launch` confirma a data. **Clientes Fundadores** (5 vagas a R$ 1.500/mês por 12 meses) até 31/03/2027 ou até preencher.

| data | canal | o que sai | mensagem / hook |
|---|---|---|---|
| seg 18/01 | LinkedIn (fundador) | Post de abertura: por que estou construindo isto | Hook 1 |
| ter 19/01 | Outbound | Montar lista: 150 Heads de Produto/CTOs, scale-ups não reguladas, 20–80 devs; marcar quem usa Azure DevOps | |
| qua 20/01 | LinkedIn | 1º "Story vs. Código" em repositório open source (carrossel) | Hook 2 |
| qui 21/01 | Outbound | 30 convites de conexão personalizados | |
| sex 22/01 | LinkedIn | Bastidor: como a ferramenta diz "não encontrei" | Hook 3 |
| seg 25/01 | E-mail | 1º e-mail para quem aceitou: convite para ver a demo em 20 min | Hook 4 |
| ter 26/01 | LinkedIn | Vídeo de 60 s: story → divergência → arquivo/trecho | Hook 2 (vídeo) |
| qua 27/01 | Outbound | 30 convites + follow-up dos de 21/01 | |
| qui 28/01 | LinkedIn | Post: o Kit de Segurança aberto (o que tem, o que ainda não tem: SOC 2) | Hook 5 |
| sex 29/01 | Comunidade | Pedir espaço de 15 min num meetup de produto ou QA de fevereiro | |
| **seg 01/02** | LinkedIn + e-mail | **Abertura do programa de pilotos + 5 vagas de Clientes Fundadores (até 31/03)** | Hook 6 |
| ter 02/02 | Outbound | Mensagem direta aos 20 mais engajados: oferecer o piloto | Hook 7 |
| qua 03/02 | LinkedIn | 2º "Story vs. Código" (outro repo, outra linguagem) | Hook 2 |
| qui 04/02 | Outbound | 30 convites (lote Azure DevOps) | Hook 8 |
| sex 05/02 | LinkedIn | Post sobre o custo de tokens no Modo Cofre: tabela estimada por tamanho de repo | Hook 9 |
| seg 08/02 | E-mail | Follow-up dos pilotos oferecidos | Hook 4 |
| ter 09/02 | LinkedIn | Post para QA: story → testes Playwright ancorados no código | Hook 10 |
| qua 10/02 | Outbound | 30 convites + follow-ups | |
| qui 11/02 | LinkedIn | Bastidor: o que aprendi nas 10 primeiras demos (sem citar nome de empresa sem permissão) | |
| sex 12/02 | LinkedIn | Post "Rovo, Copilot e Esteira: o que cada um faz pelo PM" (comparação justa, com links) | Hook 8 |
| seg 15/02 | E-mail | Lembrete: vagas de Fundador (quantas restam, número real) | Hook 6 |
| ter 16/02 | Meetup/comunidade | Demo ao vivo de 15 min, se conseguida | Hook 2 |
| qua 17/02 | LinkedIn | Fechamento do mês: números reais do programa (pilotos iniciados, % de afirmações confirmadas) | |

**Quando não houver novidade:** um novo "Story vs. Código" num repo open source; um erro que a ferramenta cometeu e como foi corrigido (honestidade gera confiança); um bastidor do Kit de Segurança; a pergunta da semana que um CTO fez na demo.

## 4. Dez hooks

Cada hook responde a uma objeção ou usa uma razão de compra do painel.

1. **"Duas stories voltaram do dev na última sprint porque a regra já existia. Estou construindo uma forma de o PM ver isso antes."** (razão de compra: retrabalho)
2. **(vídeo, 3 s)** "Colei esta issue de um projeto open source. Em 40 segundos: o que já existe, onde, e onde a issue erra." (confiança: demo sem acesso ao seu código)
3. **"A frase mais importante que uma IA pode dizer para um PM: 'não encontrei'."** (alucinação dita com confiança)
4. **(e-mail, assunto)** "20 minutos: sua story contra o seu código, com o arquivo e o trecho" (prova antes de compra)
5. **"Somos uma startup de um fundador. Por isso o seu código nunca fica com a gente."** (startup pequena / onde vai o código)
6. **"5 empresas. R$ 1.500/mês por 12 meses. Em troca: números reais. Até 31/03."** (urgência verdadeira)
7. **"Você não mede retrabalho hoje? O piloto mede para você: antes e depois, no seu próprio Jira."** (não consigo provar ROI)
8. **"Azure Boards + Azure Repos: onde a IA do GitHub não chega."** (stack Azure / "o Copilot já faz")
9. **"Quanto custa em tokens, de verdade: a tabela por tamanho de repositório."** (custo de tokens no Modo Cofre)
10. **"Sua cobertura de Playwright está atrasada? Cada story vira teste, ancorado no código que existe."** (razão de compra: QA)

## 5. Orçamento e números

**Orçamento de lançamento: R$ 5.000** (linha "Lançamento" de `numbers.json`).

| item | R$ |
|---|---:|
| Ferramenta de prospecção/e-mail (3 meses) | 900 |
| 2 eventos/meetups (inscrição + deslocamento) | 2.600 |
| Landing page + domínio + gravação de vídeos | 1.000 |
| Reserva | 500 |

**O máximo que dá para pagar por cliente (CAC):**
- No SaaS, "compras por comprador" vira **meses de vida**. O painel não mede isso. Uso a premissa de 12 meses de vida média de `cfo-sources.md` (estimativa).
- **Cenário-base** (`cfo.md`, revisado com preços reais de LLM e cobrança): contribuição de R$ 1.185 × 12 meses = R$ 14.220 de contribuição por cliente. Gastando no máximo 1/3 disso para adquirir, o **CAC máximo fica em ~R$ 4.740**.
- **Cenário recomendado** (Modo Cofre + R$ 2.500): contribuição de R$ 2.125 × 12 = R$ 25.500, e o **CAC máximo fica em ~R$ 8.500**.
- Hoje o CAC é quase só tempo do fundador (já dentro do pró-labore) mais ~R$ 500/mês de ferramentas e eventos. Mídia paga só faz sentido no cenário recomendado.

**Os três números da semana:**

| número | meta | sinal de "mude algo" |
|---|---|---|
| Conversas qualificadas (call com Head de Produto/CTO do perfil) | ≥ 5/semana | < 3 por 2 semanas: trocar a lista ou a mensagem de abertura |
| Pilotos iniciados (com acesso aprovado) | ≥ 1/semana a partir de 01/02 | 0 por 3 semanas: a barreira é segurança; apressar o pentest ou mirar empresas menores |
| % de afirmações confirmadas pelos devs nos pilotos | ≥ 85% | < 75%: parar a aquisição e consertar o produto antes de vender mais |

Regras: sem depoimentos inventados, sem logos de clientes sem autorização, sem "visto em". Comparações com Rovo/Copilot só com fatos públicos e links.
