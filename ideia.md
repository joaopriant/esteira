Sistema de esteira de agentes de IA para times de produto e engenharia.

A ideia central é uma plataforma que conecta duas fontes: um sistema de gestão de tarefas, como Azure Boards, Jira ou similar, e um ou mais repositórios de código, em qualquer provedor, como GitHub, GitLab, Bitbucket ou Azure Repos. A partir disso, o sistema puxa uma tarefa ou user story e cruza com a realidade do código existente, servindo três papéis diferentes de um mesmo fluxo.

Para o PM, funciona como uma esteira de refinamento. O PM cola uma user story, e o sistema confronta ela com o código, mostrando o que já está implementado, onde, e quais regras de negócio existem de verdade. Então faz uma crítica iterativa, questionando premissas e apontando divergências, até a spec ficar refinada e bater com a realidade. O foco é que o PM, mesmo sem maturidade técnica e sem abrir editor de código ou clonar repositório, consiga validar suas specs contra o que realmente existe no sistema.

Para o desenvolvedor, o sistema expõe o que já está implementado e como, servindo de mapa da base de código ligada àquela tarefa.

Para o QA, o sistema puxa a tarefa, consulta o código e a user story, e gera casos de teste automaticamente, escrevendo testes em Playwright prontos para rodar, cobrindo tanto a regra de negócio quanto o comportamento esperado.

A arquitetura tem três peças. A primeira é o motor, que lê os repositórios e faz a análise. A segunda é a biblioteca de agentes, onde o usuário monta o próprio fluxo combinando agentes prontos como peças de Lego, por exemplo um explorador de repositório, um confrontador de spec e um crítico de regras. A terceira é a interface de entrada e saída, simples, onde cada papel cola sua tarefa e recebe o resultado sem precisar ver nada técnico.

Como extensão futura, e não como requisito da primeira versão, o sistema pode ganhar uma camada de inteligência regulatória, em que se sobe a norma de um setor regulado e o sistema passa a validar também se a user story e o código seguem a regulamentação vigente. Isso fica como módulo opcional para verticais reguladas, como fintech ou aviação.
sd