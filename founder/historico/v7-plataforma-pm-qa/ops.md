# Operações: Esteira

> **Atualização 12/10/2026:** a versão viável do plano mudou três decisões (ver `offer.md` §7 e `cfo.md`). (1) **IA do cliente (BYOK):** a análise roda na assinatura ou API do cliente, no ambiente dele, e a Esteira não paga token; tudo o que este arquivo diz sobre custo de LLM da Esteira e Modo Cofre como opção deixou de valer. (2) **Clientes Fundadores pagam R$ 2.500** com preço travado por 24 meses, não R$ 1.500. (3) **Cliente-alvo inicial:** não reguladas e fora do ecossistema Atlassian. CAC máximo atualizado: R$ 2.125 × 12 ÷ 3 ≈ **R$ 8.500**.


Um fundador solo, um SaaS B2B, com 0 a 15 clientes no ano 1. A operação é: **vender pilotos, configurar, analisar, provar, cobrar, dar suporte e não vazar código.** Regras e preços mudam: confirme cada item com o fornecedor, o órgão ou um profissional. Isto não é aconselhamento jurídico.

## 1. O ciclo de cada dia

(👁 = o cliente vê)

1. **08:00, saúde do sistema:** alertas da noite, filas de análise, erros de integração (tokens expirados do Jira/Azure/GitHub), custo de LLM do dia anterior por cliente.
2. 👁 **08:30, suporte:** responder tickets e e-mails de pilotos e clientes (meta: resposta em até 4 h úteis).
3. 👁 **09:00, revisão de qualidade:** amostra de 5 análises do dia anterior. A afirmação tem trecho? O "não encontrei" apareceu quando devia? Registrar erros na planilha de acerto do piloto.
4. **10:00–13:00, produto:** construir/corrigir (bloco protegido de foco).
5. 👁 **14:00–16:00, vendas:** outbound (30 convites/dia em dias de campanha), demos, calls de setup de piloto (30 min).
6. 👁 **16:00, pilotos:** check-in com cada piloto ativo (mensagem curta: uso da semana, dúvidas, afirmações contestadas).
7. **17:00, conteúdo:** um post "Story vs. Código" ou bastidor (calendário de `marketing.md`).
8. **17:30, fechamento:** atualizar CRM (estágio de cada conta), métricas da semana, conferir que nenhum código de cliente ficou em log ou storage (ver SOP 5).

**Semanal (sexta):** os três números de `marketing.md`; custo de LLM por cliente vs. R$ 440 orçados; backups; atualização de dependências e alertas de segurança.
**Mensal:** emissão de NF e cobrança (dia 1), relatório de acerto e retrabalho para cada cliente, fechamento com o contador.

## 2. Fornecedores

| insumo (`numbers.json`) | opções | preço público / como obter | termos |
|---|---|---|---|
| **LLM** (R$ 440/cliente-mês) | **Anthropic API** (Sonnet 5.5 para análise, Haiku 5.5 para indexação barata); Azure OpenAI; AWS Bedrock | Sonnet 5.5: US$ 2 / US$ 10 por MTok, cache US$ 0,10; Haiku 5.5: US$ 0,10 / US$ 0,50; batch com 50% de desconto ([claude.com/pricing](https://claude.com/pricing)). Azure/Bedrock: tabela de cada nuvem | pré-pago/cartão em dólar (IOF + câmbio). **No Modo Cofre o cliente usa a conta dele** (Azure OpenAI, Bedrock ou Anthropic) |
| **Cloud** (infra por cliente R$ 150 + base R$ 1.000) | AWS sa-east-1 (São Paulo), Azure Brazil South, GCP southamerica-east1 | calculadora de preço de cada nuvem; **pedir créditos de startup** (programas para startups da AWS, Microsoft e Google) | pós-pago em dólar; hospedagem no Brasil atende à promessa da oferta |
| **Cobrança + NF** (R$ 5/cliente-mês) | **Asaas** (recomendado), Stripe Brasil, Iugu | Asaas: Pix/boleto R$ 1,99, NF R$ 0,49, cartão 2,99% + R$ 0,49 ([fonte](https://www.asaas.com/precos-e-taxas)). Stripe: cartão 3,99% + R$ 0,39, boleto R$ 3,45, Billing 0,7% ([fonte](https://stripe.com/br/pricing)) | B2B no Brasil prefere boleto/Pix com NF; o Asaas emite NF de serviço |
| **Contabilidade** (R$ 500) | contabilidade online (Contabilizei, Agilize, contabilidade.com) ou contador local com experiência em SaaS | R$ 189–899/mês para ME no Simples ([Agilize](https://agilize.com.br/artigos/?p=881), [contabilidade.com](https://contabilidade.com/blog/quanto-custa-a-contabilidade-online-em-2026-guia-de-precos-e-o-que-esta-incluso/)) | **cotação** (o preço varia com notas emitidas e pró-labore) |
| **Pentest** (R$ 15.000, abertura) | empresas brasileiras de segurança ofensiva / pentest como serviço | **só por cotação**: pedir a 2–3 com escopo "aplicação web + API + integrações OAuth" | prazo típico de algumas semanas; pedir relatório com carta de atestado para mostrar aos clientes |
| **Jurídico** (R$ 6.000) | advogado ou escritório de tecnologia/privacidade | **cotação**: DPA/LGPD, termos de uso, contrato SaaS, política de privacidade | pacote fechado |
| **Ferramentas** (R$ 1.200) | GitHub (código), Google Workspace (e-mail), CRM leve (HubSpot free / Pipedrive), Sentry/Grafana (monitoramento), Cal.com (agenda) | ver a página de preços de cada um; vários têm plano grátis no começo | |

**Perguntas abertas (só com cotação):** pentest, jurídico, contador, câmbio do dia, créditos de cloud aprovados.

## 3. Pessoas

**Só o fundador** no ano 1 (capacidade estimada em ~15 clientes: `numbers.json`).

| bloco semanal | mês 1–2 (sem clientes pagantes) | com 8–10 clientes |
|---|---|---|
| Produto | 30 h | 15 h |
| Vendas e pilotos | 12 h | 15 h |
| Suporte e qualidade | 2 h | 10 h |
| Conteúdo | 4 h | 3 h |
| Admin (financeiro, contador, segurança) | 2 h | 4 h |
| **Total** | ~50 h | ~47 h |

- **Pró-labore:** R$ 6.000/mês no modelo (estimativa; 0 em bootstrap puro). O pró-labore tem **INSS** e influencia o **fator R** do Simples; leve isso ao contador.
- **Primeira contratação** (quando houver mais de 10 clientes ou o pre-seed sair): um(a) engenheiro(a) para integrações e qualidade das análises, ou um(a) CS/pré-vendas técnico(a). Não está no modelo do ano 1.
- **Ponto único de falha:** o fundador. Ver o risco nº 2.

## 4. Rotinas (SOPs)

**SOP 1: Abertura de piloto (a call de 30 min)**
1. Antes: Kit de Segurança enviado e aprovado (DPA assinado, questionário respondido).
2. Escolher com o cliente **1 board + 1 repositório não crítico**.
3. Decidir o modo: padrão (LLM da Esteira) ou **Modo Cofre** (chave do cliente). Se for Cofre, mostrar a **estimativa de tokens por story** para o tamanho do repositório dele.
4. Alguém técnico do cliente instala o app/OAuth com **escopo somente leitura**. Conferir os escopos na tela.
5. Rodar o **baseline**: stories devolvidas/reabertas nos últimos 3 meses (combinar a definição com o cliente: reaberta, devolvida pelo QA, ou nova story derivada).
6. Rodar 3 stories ao vivo com o PM e mostrar o "não encontrei" quando aparecer.
7. Combinar: um dev do cliente confere 20 stories ao longo do piloto; check-in semanal; data do relatório final.

**SOP 2: A análise (o serviço principal)**
1. Receber a story (Jira/Azure Boards). 2. Indexar/atualizar só o repositório autorizado. 3. Gerar afirmações, **cada uma com arquivo + trecho**; sem evidência, marcar "não encontrei". 4. Gerar divergências e perguntas para o PM. 5. (Business) gerar testes Playwright e rodar contra o ambiente de teste do cliente, se houver. 6. Registrar tokens gastos e tempo. 7. Devolver ao card; **não guardar o código além do índice necessário** (no Cofre, nada fica conosco).

**SOP 3: Reclamação ("afirmou uma regra errada")**
1. Responder em até 4 h úteis: agradecer e pedir o link da análise. 2. Reproduzir e achar o trecho que levou ao erro. 3. Classificar: evidência errada / interpretação errada / deveria ter dito "não encontrei". 4. Registrar na planilha de acerto do cliente (conta para a garantia de 85%). 5. Corrigir e informar o prazo; devolver a análise corrigida. 6. Se for padrão recorrente, virar teste de regressão interno.

**SOP 4: Fechamento do mês e cobrança**
1. Dia 1: Asaas gera a cobrança (Pix/boleto) e a NF de serviço. 2. Enviar o relatório do mês (acerto, retrabalho, stories analisadas). 3. Dia 5: lembrete automático de vencimento. 4. Dia 10: contato pessoal com quem não pagou. 5. Conferir o custo de LLM por cliente contra a receita; se passar de 30% do preço, ver o limite de análises. 6. Enviar extratos ao contador.

**SOP 5: Segurança semanal (o que não pode falhar)**
1. Revisar os logs: nenhum trecho de código de cliente em log de aplicação. 2. Conferir a retenção (índices de clientes cancelados apagados em até 30 dias, conforme o DPA). 3. Rotacionar segredos vencidos; nenhum token de cliente em texto puro. 4. Atualizar dependências com vulnerabilidade crítica. 5. Testar a restauração de backup (mensal). 6. Registrar o que foi feito (evidência para o futuro SOC 2).

## 5. Ferramentas

| função | ferramenta | preço | por quê |
|---|---|---|---|
| Cobrança + NF | **Asaas** | R$ 1,99/Pix ou boleto + R$ 0,49/NF ([fonte](https://www.asaas.com/precos-e-taxas)) | B2B brasileiro paga em boleto/Pix com NF |
| Contabilidade | contabilidade online | R$ 189–899/mês ([fonte](https://agilize.com.br/artigos/?p=881)) | Simples, pró-labore, NF |
| CRM | HubSpot (grátis) ou Pipedrive | ver o site | funil de pilotos → clientes |
| Agenda | Cal.com / Google Calendar | grátis para começar | demos e calls de setup |
| Suporte | e-mail compartilhado + Slack Connect com pilotos | grátis | proximidade com early adopters |
| Monitoramento | Sentry + logs da cloud | plano grátis/de entrada | erros de integração |
| Métrica de acerto | planilha por cliente (depois, no produto) | grátis | base da garantia e dos casos de uso |

## 6. Registros, licenças e seguros (Brasil)

| item | por quê | onde confirmar |
|---|---|---|
| **CNPJ** (ME, provavelmente LTDA unipessoal) | faturar B2B, emitir NF | [gov.br/empresas-e-negocios](https://www.gov.br/empresas-e-negocios/pt-br) e Junta Comercial do estado |
| **Enquadramento no Simples Nacional** (Anexo III ou V, fator R) | define o imposto (6% estimado no modelo) | [Portal do Simples Nacional](https://www8.receita.fazenda.gov.br/SimplesNacional/) + contador |
| **Inscrição municipal / NFS-e** | nota fiscal de serviço e ISS | prefeitura do município da sede |
| **CNAE** de software/SaaS (ex.: licenciamento de software customizável / desenvolvimento) | o enquadramento depende do CNAE | contador |
| **LGPD**: DPA, política de privacidade, registro das operações, encarregado (DPO) | a Esteira é operadora dos dados dos clientes; o código pode conter dados pessoais | [ANPD](https://www.gov.br/anpd/pt-br) |
| **Marca "Gabarito" (ou alternativa)** no INPI, classes 9 e 42 | proteger o nome | [busca.inpi.gov.br](https://busca.inpi.gov.br/pePI/) |
| **Contrato SaaS + SLA + limite de responsabilidade** | clientes vão pedir | advogado |
| **Seguro de responsabilidade cibernética / E&O** | regulados e CTOs perguntam; reduz o risco pessoal | corretora (cotação) |

## 7. Registro de riscos

| # | risco | prob. | impacto | plano |
|---|---|---|---|---|
| 1 | **Segurança do cliente trava o piloto por semanas** | alta | alto | Kit de Segurança no 1º contato, pentest antes de fev/2027, começar por empresas não reguladas, Modo Cofre |
| 2 | **Fundador doente, esgotado ou indisponível** (ponto único de falha) | média | alto | documentar os SOPs, monitoramento com alertas, cláusula "sem lock-in" (tudo fica no Jira/repo do cliente), co-fundador ou 1ª contratação com o pre-seed |
| 3 | **Acerto abaixo de 85% num piloto** | média | alto | parar a aquisição e consertar (gatilho de `marketing.md`), "não encontrei" agressivo, revisão diária de amostras |
| 4 | **Custo de LLM acima do orçado** (monorepo grande) | média | médio | medir tokens por análise desde o 1º piloto, Haiku para indexação, cache, batch, limite de análises por plano, Modo Cofre |
| 5 | **Vazamento/incidente com código de cliente** | baixa | crítico | retenção mínima, nada em log, segredos rotacionados, pentest, plano de resposta a incidente (comunicação à ANPD e ao cliente), seguro cibernético |
| 6 | **Atlassian/GitHub lançam o recurso embutido** | alta | alto | focar em Azure DevOps + PM não técnico + evidência/"não encontrei", vender a prova (métrica de acerto), relacionamento com os Clientes Fundadores |
| 7 | **Mudança de API ou de permissões** do Jira, Azure DevOps ou GitHub | média | médio | testes de integração diários, alertas de token expirado, acompanhar os changelogs |
| 8 | **Inadimplência / atraso de pagamento B2B** | média | médio | boleto/Pix com lembretes automáticos, contato pessoal no dia 10, contrato anual com desconto |
| 9 | **Mês lento** (nenhum piloto vira contrato) | alta | médio | 60–100 conversas no funil, revisar a oferta, caixa com reserva de pelo menos 6 meses de custo fixo (~R$ 61 mil com pró-labore) |
| 10 | **Câmbio** (LLM e cloud em dólar) | média | baixo/médio | revisar o preço anualmente, Modo Cofre transfere o custo, créditos de startup |

**Nada mudou de forma que exija reprocessar além do que já foi feito:** o custo de LLM (R$ 880 → R$ 440) e a cobrança (R$ 40 → R$ 5) foram atualizados em `numbers.json` com preços públicos, e `cfo.md` já foi re-rodado.
