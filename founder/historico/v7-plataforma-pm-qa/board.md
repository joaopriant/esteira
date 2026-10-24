# Board: Esteira (resumo do chair)

## Voto

**3 FUND IF, 0 FUND, 0 PASS.** Média: **4,7 / 10** (Ofertas 5, Monopólio 4, Produto 5).

Ninguém financia como está. Os três financiam a mesma versão menor.

## Riscos levantados por mais de um membro (os primeiros da fila)

1. **Escopo largo demais** (os três). PM + Dev + QA + biblioteca de agentes "Lego" + 4 provedores de repositório + módulo regulatório. Para Ofertas, isso dilui o resultado e vira comparação de funcionalidade. Para Monopólio, nenhuma frente chega a 10x. Para Produto, um fundador solo não faz cinco coisas brilhantemente, e a biblioteca Lego terceiriza para o cliente o design que o produto deveria fazer.
2. **Confiança/precisão** (Ofertas, Produto). O PM usa a ferramenta justamente porque não consegue verificar o código. Uma regra de negócio alucinada levada à planning mata o produto na reunião. Ainda não há piloto nem taxa de acerto medida.
3. **Acesso ao código como barreira de venda** (os três). Dar leitura a todos os repositórios e ao Jira/Azure Boards passa por segurança, jurídico e CTO. Isso alonga o ciclo, encarece o CAC e pode transformar os primeiros 5 minutos em "peça um token ao time de plataforma".
4. **Distribuição e CAC indefinidos** (Ofertas, Monopólio). Fundador solo, sem canal. Pergunta aberta: `/founder-consumer`, `/founder-cfo`.

## Onde o board discorda

- **A ameaça principal.** Para **Monopólio**, é virar um botão dentro das plataformas de repositório e de gestão de tarefas, que já têm os dois dados. Para **Ofertas**, é a falta de prova, não o concorrente. Para **Produto**, é a experiência quebrar nas costuras entre sistemas.
- **O que se constrói no longo prazo.** Monopólio quer um ativo acumulado por cliente (regras de negócio extraídas, histórico de specs) que gere custo de troca. Ofertas quer um stack de bônus (Dev e QA como bônus da oferta do PM). Produto quer cortar Dev e QA completamente até o refinamento ser excelente. *Ofertas mantém Dev/QA como bônus; Produto os tira da v1.* Fica para `/founder-offer` e o painel decidirem.
- **Regulação.** Monopólio vê a camada regulatória como a expansão certa depois do nicho. Os outros dois só pedem que ela fique fora da v1.

## Condições (checklist para o resto do pack)

- [ ] **V1 = um papel, uma promessa mensurável:** refinamento de spec para o PM, confrontado com o código, com um gerenciador de tarefas e um provedor de repositório. Biblioteca de agentes, regulação e (segundo Produto) Dev/QA ficam fora. *(os três; `/founder-offer`)*
- [ ] **Resultado em uma frase com um número** (ex.: redução de stories devolvidas pelo dev / de bugs de regra de negócio) e quem sente a dor mais forte vs. quem assina. *(Ofertas, Produto; `/founder-consumer`)*
- [ ] **Toda afirmação com evidência clicável** (arquivo, trecho) e sinal explícito de incerteza ("não sei"). *(Produto)*
- [ ] **3 a 5 pilotos reais** em empresas do perfil-alvo, com acesso aprovado por segurança, medindo taxa de acerto (devs concordam com o que a ferramenta afirmou) e impacto em retrabalho, virando caso de uso com números. Meta de acerto definida com dados. *(os três; `/founder-launch`)*
- [ ] **Barreira de segurança resolvida na oferta:** acesso só leitura, política de dados clara, instalação que o CTO aprove em uma reunião, feita uma vez por alguém técnico e invisível para o PM. *(Ofertas, Produto, Monopólio; `/founder-ops`)*
- [ ] **Primeiro resultado útil em minutos** após conectar. *(Produto, Ofertas)*
- [ ] **Custo de LLM por tarefa analisada** conhecido e compatível com preço e tempo de resposta. *(os três; `/founder-cfo`)*
- [ ] **Preço e garantia de piloto que caibam na conta.** *(Ofertas; `/founder-pricing`, `/founder-cfo`, `/founder-offer`)*
- [ ] **Mapa competitivo antes do pre-seed:** mostrar que nenhuma plataforma de repositório/tarefas já entrega isso ao PM e por que a Esteira segue na frente se uma lançar. *(Monopólio; `/founder-competitors`)*
- [ ] **Canal repetível para os 100 primeiros clientes** e CAC estimado. *(Monopólio, Ofertas; `/founder-marketing`, `/founder-cfo`)*
- [ ] **Ativo durável nomeado:** o que se acumula por cliente e vira custo de troca. *(Monopólio)*
- [ ] **Tamanho do mercado BR de 20–200 devs.** *(Ofertas; `/founder-competitors`)*

## A versão mais forte que o board enxerga

Não é a plataforma de agentes para três papéis que foi apresentada. É um **"revisor de spec contra o código" para PMs não técnicos**: o PM cola a story no Jira (ou Azure Boards), e em minutos recebe o que já existe, onde está (com link para o arquivo e o trecho), quais regras de negócio de fato rodam, onde a story diverge e o que a ferramenta não sabe afirmar, e a spec revisada volta para o card. Vendido ao Head de Produto/CTO com uma promessa medida em menos retrabalho por story divergente e provado em 3 a 5 pilotos com acesso só leitura. Com o tempo, as regras de negócio extraídas por cliente viram uma base viva do produto, o ativo que prende o cliente. O mapa para dev e os testes Playwright para QA viram expansão (ou bônus) depois que o refinamento for confiável, e a camada regulatória viria depois disso. É deliberadamente menor do que o pitch original.
