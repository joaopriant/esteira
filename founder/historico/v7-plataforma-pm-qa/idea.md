# Esteira (nome provisório)

- **O que é:** uma plataforma SaaS de agentes de IA que conecta o sistema de tarefas (Azure Boards, Jira ou similar) aos repositórios de código (GitHub, GitLab, Bitbucket, Azure Repos) e confronta cada user story com o código real, servindo PM, dev e QA num mesmo fluxo.
- **Para quem:** scale-ups e empresas médias de software no Brasil, com cerca de 20 a 200 devs, times de produto com PMs de baixa maturidade técnica e QAs que escrevem testes. Quem assina e paga: liderança de produto/engenharia (Head de Produto, CTO, VP Eng).
- **O que vende, a que preço:**
  - Para o PM: esteira de refinamento. Cola a user story; o sistema mostra o que já existe no código, onde, quais regras de negócio existem de verdade, e critica a spec iterativamente até bater com a realidade, sem o PM abrir editor ou clonar repositório.
  - Para o dev: mapa da base de código ligada àquela tarefa (o que já está implementado e como).
  - Para o QA: gera casos de teste a partir da tarefa + código + story e escreve testes Playwright prontos para rodar.
  - Arquitetura: (1) motor que lê e analisa os repositórios; (2) biblioteca de agentes montáveis "como Lego" (explorador de repositório, confrontador de spec, crítico de regras); (3) interface simples de entrada/saída por papel.
  - **Preço: R$ 2.500/mês por empresa** (licença; a IA é do cliente). Clientes Fundadores: preço travado por 24 meses.
- **Modelo de IA (definido em 12/10/2026):** BYOK. A IA roda na assinatura (Claude, ChatGPT) ou na chave de API do próprio cliente, como no Maestri. A Esteira não revende IA nem paga token. Entrega como GitHub Action / tarefa de Azure Pipelines / container no ambiente do cliente; o código não passa pelos servidores da Esteira.
- **Cliente-alvo inicial (definido em 12/10/2026):** scale-ups e empresas médias **não reguladas**, em Azure DevOps ou Jira + GitHub/GitLab, fora do ecossistema Atlassian para IA. Reguladas e Atlassian-dependentes ficam para depois de pentest, referências e SOC 2.
- **Onde e como:** online, SaaS B2B, mercado brasileiro primeiro. Canal de aquisição ainda não definido. Entregue via web conectada por integrações (OAuth/apps) às ferramentas de tarefas e repositórios do cliente.
- **Orçamento e restrições:** fundador solo, bootstrap no início, com intenção de levantar pre-seed. Orçamento em dinheiro não informado. Fora do escopo da v1: camada de inteligência regulatória (subir a norma de um setor regulado e validar story/código contra ela), prevista como módulo opcional futuro para verticais como fintech e aviação.
