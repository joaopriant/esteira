# Brief para o board: Esteira (nome provisório)

Escreva seu memo em português.

## A ideia, nas palavras do fundador (resumida)

Sistema de esteira de agentes de IA para times de produto e engenharia. A plataforma conecta duas fontes: um sistema de gestão de tarefas (Azure Boards, Jira ou similar) e um ou mais repositórios de código em qualquer provedor (GitHub, GitLab, Bitbucket, Azure Repos). O sistema puxa uma tarefa ou user story e cruza com a realidade do código existente, servindo três papéis de um mesmo fluxo:

- **PM:** esteira de refinamento. O PM cola uma user story; o sistema a confronta com o código, mostrando o que já está implementado, onde, e quais regras de negócio existem de verdade. Faz uma crítica iterativa, questionando premissas e apontando divergências, até a spec ficar refinada e bater com a realidade. Foco: o PM, mesmo sem maturidade técnica e sem abrir editor nem clonar repositório, consegue validar suas specs contra o que realmente existe.
- **Dev:** expõe o que já está implementado e como, servindo de mapa da base de código ligada àquela tarefa.
- **QA:** puxa a tarefa, consulta o código e a story e gera casos de teste automaticamente, escrevendo testes Playwright prontos para rodar, cobrindo regra de negócio e comportamento esperado.

**Arquitetura em três peças:** (1) o motor, que lê os repositórios e faz a análise; (2) a biblioteca de agentes, onde o usuário monta o próprio fluxo combinando agentes prontos como peças de Lego (ex.: explorador de repositório, confrontador de spec, crítico de regras); (3) a interface de entrada e saída, simples, onde cada papel cola sua tarefa e recebe o resultado sem ver nada técnico.

**Extensão futura (não é requisito da v1):** camada de inteligência regulatória: sobe-se a norma de um setor regulado e o sistema valida se story e código seguem a regulamentação. Módulo opcional para verticais como fintech ou aviação.

## Respostas do fundador a perguntas de esclarecimento

- **Cliente-alvo (quem assina e paga):** scale-ups e empresas médias de software no Brasil, cerca de 20 a 200 devs, com times de produto onde PMs têm pouca maturidade técnica.
- **Preço e modelo de cobrança:** ainda não definido.
- **Time e dinheiro:** fundador solo, bootstrap no início, buscando levantar pre-seed. Orçamento em dinheiro não informado.
- **Canal de aquisição:** não definido.

## O que ainda não se sabe (não invente)

Tamanho de mercado, preço, custo de aquisição de cliente, custo de LLM por tarefa analisada, concorrentes. Se seu lens precisar de algum desses números, marque como pergunta aberta.
