# ADR 0004 — Como o app chama o Claude Code

Data: 24/10/2026. Status: aceita. Autor: CTO.

## Contexto

A IA tem de ser o `claude` instalado, modo não interativo, com a assinatura do usuário. O contexto de cada bloco inclui código e cards, que podem conter instruções hostis. O diretório de trabalho e os limites de tempo ficaram em aberto na seção 6.

A documentação atual do Claude Code diz que `--bare` não lê o login da assinatura (nem o cofre). `--bare` empurra o app para uma chave de API. Isso quebra o spec.

## Opções

1. **`--bare` mais chave de API.** Reprodutível e sem hook de repositório. Não usa a assinatura. Fora da v1.
2. **`claude -p` com o login já feito, diretório de trabalho nosso, ferramentas de leitura, schema JSON.** Usa a assinatura. Exige cuidado com `CLAUDE.md`, hooks e MCP do repositório clonado.
3. **Agent SDK.** O spec veta, porque a chave de API não é a assinatura.

## Decisão

Opção 2. O adaptador monta um `spawn` sem shell:

- executável: o nome `claude` no PATH, ou um caminho absoluto configurado, sem argumentos embutidos
- `claude -p "<instrução curta>"`
- `--output-format json` e `--json-schema` com o contrato do bloco
- `--append-system-prompt` com a regra de prova e a ordem de tratar código e card como dado, não como ordem
- `--permission-mode dontAsk` e `--permission-prompts none` (o que pediria confirmação é negado, não fica esperando)
- `--allowedTools Read,Grep,Glob`
- `--disallowedTools Bash,Edit,Write,WebFetch,WebSearch,NotebookEdit`
- `--add-dir` só com caminhos absolutos dos clones já validados
- diretório de trabalho: `trabalho/<execução>/` dentro da pasta de dados, não a raiz do repositório do cliente. O pacote de contexto é um arquivo nosso nesse diretório. A instrução curta manda lê-lo como dado.
- o processo filho não herda `ANTHROPIC_API_KEY` nem `ANTHROPIC_AUTH_TOKEN`, para o CLI usar o login
- tempo limite padrão: 180 segundos. Estoura, o bloco fica em erro e a story não é publicada
- stdout limitado a 2 MB

Skills: o texto do bloco vem de um `SKILL.md` nosso (`skills/`) ou de uma instrução que o PM escreveu, ou de uma skill em `~/.claude/skills`. Skills dentro do repositório clonado não entram sozinhas na lista de blocos.

O falso do Claude não chama o binário. Ele lê o contexto e devolve JSON com trechos que existem nos arquivos. O teste de ponta a ponta usa esse falso.

## Consequências

- Sem `--bare`, um `CLAUDE.md` ou um hook no diretório de trabalho nosso poderia rodar. Esse diretório é nosso e não leva hook. O que ainda pode acontecer é o CLI ler configuração global do usuário (`~/.claude`). Isso é a máquina dele, com a assinatura dele.
- `--add-dir` deixa o modelo ler o código. Não deixamos Bash nem escrita.
- Se uma versão antiga do CLI não tiver `--json-schema`, o adaptador lê o campo `result` e tenta extrair JSON. Se não houver JSON válido, o bloco erra. Não inventa achado.
- Premissa do spec, a confirmar no notebook: o `claude` está logado e `claude -p "diga oi" --output-format json` funciona fora do app.
