# Lens de Produto (Product)
Score: 5/10 | Vote: FUND IF

## O que é forte
- **Existe um momento mágico nítido escondido aqui.** Um PM sem maturidade técnica cola uma user story e, sem abrir editor nem clonar repositório, recebe de volta: "isso já existe, está aqui, e a regra de verdade é esta, não a que você escreveu". Esse momento cabe numa frase e resolve uma dor que o PM hoje só resolve interrompendo um dev.
- **A interface proposta está certa em espírito.** "Cada papel cola sua tarefa e recebe o resultado sem ver nada técnico" é começar pela experiência e trabalhar de trás para frente. É o instinto certo.
- **Ler a realidade do código é uma vantagem de experiência, não só de tecnologia.** Spec que bate com o código reduz retrabalho de ponta a ponta. Se o resultado for confiável, o valor aparece já no primeiro uso.

## O que mataria o negócio (top 3, o mais perigoso primeiro)
1. **Falta de foco: três produtos e uma plataforma ao mesmo tempo.** Refinamento para PM, mapa de código para dev, geração de Playwright para QA, uma biblioteca de agentes estilo Lego e, no horizonte, uma camada regulatória. Um fundador solo não consegue fazer cinco coisas brilhantemente. Pela lente de Produto, a biblioteca "monte seu fluxo" é o maior sinal de alerta: ela entrega ao cliente o trabalho de design que o produto deveria fazer por ele. O PM não técnico, que é o usuário central, nunca vai montar peças de Lego.
2. **Um único resultado errado destrói a confiança.** O PM não consegue verificar a resposta, e é justamente por isso que usa a ferramenta. Se o sistema afirmar com confiança que uma regra existe quando ela não existe, o PM leva o erro para a planning, o dev desmente, e o produto morre naquela reunião. A precisão da análise é a experiência inteira, não um detalhe técnico.
3. **As costuras entre sistemas.** Azure Boards, Jira, GitHub, GitLab, Bitbucket, Azure Repos: cada conector é uma costura onde a experiência quebra (permissões, monorepos, repositórios múltiplos por tarefa, credenciais que um PM não tem). Os primeiros cinco minutos podem ser "peça ao time de plataforma um token" em vez do momento mágico. Isso vai ser decidido por quem instala, não por quem usa.

## As perguntas que eu faria ao fundador
- Em uma frase: qual é a única coisa que a Esteira faz melhor do que qualquer alternativa?
- Descreva os primeiros cinco minutos do PM: quem conecta o repositório, quanto tempo leva até o primeiro resultado útil, e o que ele vê na tela?
- O que você corta da v1? Se a resposta não incluir a biblioteca de agentes e pelo menos dois dos três papéis, por quê?
- Como o produto diz "não sei" ou mostra o grau de confiança e a evidência (arquivo, linha) para que o PM confie sem precisar verificar?
- Qual é a taxa de acerto hoje, em repositórios reais de clientes de 20 a 200 devs, e quem mediu?
- Depois que a spec é refinada, onde ela vai parar? Volta para o Jira/Azure Boards sozinha ou o PM copia e cola? (Esse é o próximo ponto de costura.)
- Quanto custa em LLM analisar uma tarefa num repositório grande, e isso cabe na experiência (tempo de resposta) e no preço? Pergunta aberta: /founder-cfo e /founder-pricing.
- O PM é quem sente a dor, mas quem assina? Pergunta aberta: /founder-consumer.

## Se FUND IF: as condições
1. **A v1 é uma coisa só:** refinamento de spec para o PM, com um gerenciador de tarefas e um provedor de repositório. Mapa para dev, testes Playwright, biblioteca de agentes e camada regulatória saem do escopo até essa coisa ser excelente.
2. **Toda afirmação vem com evidência clicável** (arquivo e trecho de código) e um sinal explícito de incerteza. Nada de resposta confiante sem fonte.
3. **Um teste de precisão em 3 a 5 bases de código reais** de empresas do perfil-alvo, com PMs reais, mostrando que os devs concordam com o que a ferramenta afirmou na grande maioria dos casos (meta a ser definida com dados, não inventada).
4. **Primeiro resultado útil em minutos** depois da conexão, com o setup feito uma única vez por alguém técnico e invisível para o PM a partir daí.
