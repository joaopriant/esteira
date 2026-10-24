# ADR 0003 — Contrato entre blocos e formato da wiki

Data: 24/10/2026. Status: aceita. Autor: CTO. Revisão de fronteiras: Tech Lead.

## Contexto

O spec fixa a entrada (ideia, produto, menções) e a saída (story editável, achados, publicar). O meio é uma lista de blocos. Cada bloco devolve a story e os achados acumulados. Confronto só acrescenta achado. A wiki regenera só o que depende de arquivo que mudou, módulo a módulo, em segundo plano.

## Opções

1. **Cada bloco é um processo livre que reescreve o JSON inteiro da story.** Simples de chamar, fácil de um confronto apagar a story ou repetir achado já descartado.
2. **Contrato estreito, aplicado pelo app, não pelo modelo.** O modelo devolve JSON. O app decide o que entra.

## Decisão

Opção 2.

Entrada de um bloco:

- ideia central, produto, menções `@` já resolvidas
- story atual (título, corpo, descrição, critérios de aceite)
- achados acumulados, com o estado (pendente, aceito, descartado)
- contexto preparado pelo app: páginas da wiki já prontas, trechos de código, candidatos do backlog depois do pré-filtro

Saída pedida ao modelo:

- story (só o bloco de escrever pode mudá-la)
- achados novos, cada um com texto, tipo e evidência

O que o app faz com a saída:

- Bloco `escrever`: aceita a story nova. Achados desse bloco, se vierem, passam pela mesma regra de prova.
- Bloco `confrontar`: ignora mudança na story. Só anexa achados.
- Evidência do tipo arquivo: o trecho tem de aparecer, literal (espaço normalizado), num arquivo que o app leu. Senão o achado fica `sem prova`.
- Evidência do tipo card: o id tem de estar na lista que o app carregou do board. Senão `sem prova`.
- Tipo `nao-encontrei` com evidência `ausencia` não é fato e não leva carimbo de sem prova. É a frase "não encontrei".
- Achado cuja impressão (texto normalizado + tipo + prova) já existe como aceito ou descartado não volta.
- Aceitar um achado não publica nada. O app pede uma story ajustada, mostra o diff e só troca o texto quando o PM aprova.

Wiki em disco:

- `wiki/<produto>/index.json` lista módulos, estado (`pendente`, `gerando`, `pronto`, `erro`), arquivos e o hash SHA-256 de cada um.
- `wiki/<produto>/modulos/<id>.json` guarda o markdown e as afirmações.
- Um módulo é um diretório com código (por baixo de `src/` quando existe), ignorando `node_modules`, `.git`, `dist`, `bin` e `obj`.
- Regenera o módulo se o conjunto de arquivos ou algum hash mudou. A fila roda um módulo por vez. A wiki já pode ser lida enquanto os outros esperam.

Menções: `@nome` no texto da ideia. O recorte padrão é o produto da story mais os produtos de que ele depende (ligação direta, não a rede inteira). Se alguma menção resolve para repositório ou produto, a busca fica só nesses. Menção que não resolve vira aviso e não derruba a esteira.

Pré-filtro do backlog, antes da IA: projetos e áreas do produto (e dos ligados), itens fechados só nos últimos 12 meses, pontuação por palavra. O nome do produto sozinho não basta para entrar. No máximo 12 candidatos. O recorte grosso também vai na consulta WIQL, com teto de 500 itens mais recentemente alterados.

`shortcut: o teto de 500 é por projeto/área configurados; rever se um produto passar disso e o pré-filtro perder card relevante.`

## Consequências

- Um modelo que inventa arquivo não cria fato. O carimbo é local.
- Reordenar blocos não muda o contrato. Muda a ordem em que o app chama.
- Bloco `por clique` pausa a esteira. `automático` segue, também no reconfronto depois que o PM edita a story.
