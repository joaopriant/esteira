# Marca: Esteira (nome provisório)

Posicionamento (de `marketing.md`): **o revisor de spec que confronta cada story com o código real e mostra a prova (arquivo e trecho)**, para Heads de Produto e CTOs de scale-ups brasileiras que já testam IA. Os compradores compram pelo retrabalho evitado e pela cobertura de QA. A objeção nº 1 durante o uso é "a IA afirmar regra errada com confiança". **A marca tem que transmitir prova, não magia.**

Evitar parecer: Atlassian/Rovo (azul `#0052CC`, linguagem "teamwork"), GitHub Copilot (preto + "copilot"), Allstacks, Bito, Devin. Nada de robô, cérebro, faísca ou gradiente roxo de "IA".

## 1. Dez candidatos

| # | nome | estilo | o que diz | em voz alta / num ícone de 32 px | risco |
|---|---|---|---|---|---|
| 1 | **Esteira** | descritivo (atual) | linha de montagem, fluxo | fácil; difícil de representar | palavra genérica; .com e .com.br registrados; soa como produção/fábrica, não como prova |
| 2 | **Gabarito** | evocativo (PT) | a resposta certa contra a qual se confere | todo brasileiro entende "conferir o gabarito"; um "G" ou um ✓ | palavra comum, muito usada por apps de concurso/educação: risco de marca na classe 42; .com/.com.br registrados |
| 3 | **Lastro** | evocativo | o que sustenta uma afirmação | curto, forte | conotação financeira forte; .com, .com.br, .dev, .app e várias variantes registrados |
| 4 | **Rastro** | evocativo | rastreabilidade story → código | sonoro; ícone de pegada | conotação de rastreamento logístico/GPS; .com, .com.br, .dev registrados |
| 5 | **Fonte** | duplo sentido | código-fonte + fonte da afirmação | ótimo conceito | genérico demais, impossível de buscar/registrar |
| 6 | **Trecho** | descritivo | o trecho de código que prova | simples | genérico; soa pequeno |
| 7 | **Âncora** | evocativo | spec ancorada no código | acento complica domínio | muito usado; o "â" quebra URLs |
| 8 | **Specta** | inventado | spec + "inspecionar" | soa estrangeiro | .com e .com.br registrados; perto de "Spectra" (muitas marcas) |
| 9 | **Veraz** | inventado/arcaico | que diz a verdade | elegante | .com e .com.br registrados; pouco conhecido |
| 10 | **Cais** | lugar/metáfora | onde a story atraca no código | curto; ícone simples | metáfora exige explicação |

## 2. Três finalistas e as checagens

Resultados de RDAP público (Verisign para .com, Registro.br para .com.br, Google Registry para .dev/.app), consultados em **10/10/2026**. 404 = livre no momento da consulta; 200 = registrado. Conferi o método com um domínio inventado (deu 404).

| nome | .com | .com.br | .dev | .app | variantes livres encontradas |
|---|---|---|---|---|---|
| **Gabarito** | registrado | registrado | **livre** | registrado | **getgabarito.com, gabaritohq.com, usegabarito.com.br** |
| **Rastro** | registrado | registrado | registrado | registrado | **rastrohq.com** |
| **Lastro** | registrado | registrado | registrado | registrado | nenhuma das testadas (uselastro, getlastro, lastrohq .com; lastroai, lastroapp, uselastro .com.br) |

**Recomendo: Gabarito** (nome de produto; a empresa pode manter outro nome jurídico). É o único finalista com um bom conjunto de domínios livres, o conceito é imediato para um brasileiro ("confira a story contra o gabarito do código") e encaixa com o "mostra a prova". O risco é a marca, porque a palavra é comum no mercado de educação. Se a busca no INPI mostrar conflito nas classes 9/42, a segunda opção é **Rastro** (rastrohq.com).

**O que você precisa conferir (eu só consigo rodar buscas públicas; nada está reservado até você registrar):**
- **Marca, INPI (Brasil):** busca em https://busca.inpi.gov.br/pePI/ por "Gabarito" e "Rastro", **classes NCL 9** (software) e **42** (SaaS, desenvolvimento e análise de software). Se for vender fora: USPTO https://tmsearch.uspto.gov/ e EUIPO https://euipo.europa.eu/eSearch/ nas mesmas classes. **Um advogado de marcas confirma**; isto não é parecer jurídico.
- **Domínio:** registrar `gabarito.dev` + `usegabarito.com.br` (e `getgabarito.com`) assim que decidir; disponibilidade muda a qualquer momento.
- **Handles:** checar @gabarito / @usegabarito / @gabaritohq no LinkedIn (página de empresa, o canal principal), X, YouTube e Instagram. Não consegui checar handles por busca pública.
- **Confusão:** nenhum dos finalistas se parece com Allstacks, Bito, Rovo, Copilot, Devin, StackSpot ou Swimm.

## 3. Promessa, tagline e voz

**Promessa (o que o cliente pode esperar sempre):** *Toda afirmação vem com a prova no seu código, e quando não há prova, a gente diz.*

**Taglines:**
1. **"Sua story, conferida no código."** (recomendada; casa com Gabarito)
2. "Com a prova, ou não afirma."
3. "Antes da planning, o gabarito."

**Voz: três adjetivos**

| adjetivo | faça | não faça |
|---|---|---|
| **Preciso** | cite o arquivo, o número, a fonte | "revolucionário", "inteligente", "mágico" |
| **Franco** | diga o que não fazemos ("ainda não temos SOC 2") | esconder limitação, prometer 100% |
| **Calmo** | fale como um bom tech lead explicando ao PM | urgência falsa, exclamações, "não perca!" |

**Antes / depois** (linha de `pitch.md`):
- *Antes:* "Esteira, uma startup brasileira em fase inicial: uma esteira de agentes de IA que conecta o Jira ou Azure Boards aos seus repositórios e cruza cada user story com o código real."
- *Depois:* "Cole uma story. O Gabarito mostra o que já existe no seu código, em qual arquivo, e onde a story diverge. Quando não encontra, ele diz."

## 4. O visual (brief)

**Cores** (contraste WCAG calculado):

| nome | hex | função | contraste |
|---|---|---|---|
| **Tinta** | `#1B1F3B` | texto, fundo escuro, logo | sobre Papel **15,0:1** (AAA) |
| **Papel** | `#FAF7F0` | fundo principal (evoca documento, não "dashboard escuro de IA") | |
| **Marca-texto** | `#F2B705` | **destaque do trecho de código citado**, o elemento-assinatura. Só como fundo atrás de texto Tinta | Tinta sobre Marca-texto **8,85:1** (AAA) |
| *Confirmado* (semântica) | `#1E7F4F` | "afirmação confirmada" | sobre Papel **4,67:1** (AA texto normal); branco sobre ele **5,0:1** |
| *Divergência* (semântica) | `#B3261E` | "story diverge do código" | sobre Papel **6,1:1** (AA) |

O marca-texto amarelo **nunca** é usado para texto sobre fundo claro (contraste insuficiente), só como realce atrás de texto escuro.

**Tipografia** (as duas são gratuitas, licença SIL Open Font License, no Google Fonts):
- **Display: Space Grotesk** (títulos, logo provisório). https://fonts.google.com/specimen/Space+Grotesk
- **Texto: IBM Plex Sans**, e **IBM Plex Mono** para trechos de código. https://fonts.google.com/specimen/IBM+Plex+Sans

**Brief do logo**
- **Precisa dizer:** "conferido contra a fonte". Ideia: o "G" (ou a palavra) com um traço de marca-texto embaixo, como quem grifa a prova; ou um ✓ formado por um colchete de código.
- **Precisa funcionar:** favicon e ícone de app em 32 px (só o símbolo, Tinta sobre Marca-texto), avatar de página do LinkedIn, cabeçalho do one-pager em PDF, comentário dentro do Jira/Azure Boards (16 px).
- **Evitar:** robô, cérebro, faísca ✨, gradiente roxo/azul, qualquer coisa parecida com o losango da Atlassian ou o octocat.
- Se você tiver uma ferramenta de geração de imagem conectada, posso gerar **conceitos** (não um logo final) a partir deste brief.

**Os primeiros cinco pontos de contato**
1. **Homepage:** título "Sua story, conferida no código." + um GIF real de 10 s (story → divergência → trecho grifado em amarelo) num repositório open source. Botões: "Ver uma análise num repo público" e "Pedir o Kit de Segurança".
2. **"Embalagem" = o relatório de análise:** cada afirmação com selo *Confirmado / Divergente / Não encontrei* e o trecho grifado. Ele **é** o produto que o PM leva à planning.
3. **Confirmação de piloto (e-mail):** o que acontece em cada semana, quem precisa fazer o quê (a call de setup de 30 min), o Kit de Segurança anexado, o baseline de retrabalho que será medido.
4. **Primeiro post:** o hook 1 de `marketing.md` ("Duas stories voltaram do dev...") com o fundador falando, sem fotos de banco de imagem.
5. **Resposta à primeira reclamação** ("a ferramenta afirmou uma regra errada"): agradecer, mostrar o trecho que levou ao erro, explicar a correção e com que prazo, registrar o caso na métrica de acerto do piloto. Sem defensividade: é a promessa da marca sendo testada.
