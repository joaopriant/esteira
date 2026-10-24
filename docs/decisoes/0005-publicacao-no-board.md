# ADR 0005 — Publicar no Azure Boards

Data: 24/10/2026. Status: aceita. Autor: CTO.

## Contexto

Criar card ou comentar um card existente só com clique. Comentário não pode sobrescrever a descrição. O comentário menciona o responsável. O tipo padrão é User Story, com área e iteração configuráveis.

## Opções

1. **Atualizar o card com PATCH em `System.Description`.** Perde o texto que já está no board. O spec veta.
2. **Criar com os campos configurados. Atualizar só pela API de comentários.** A descrição que já existe permanece.

## Decisão

Opção 2, no adaptador e no serviço, não só na tela.

- Criar: `createWorkItem` com título, descrição, critérios de aceite, área e iteração. Campos configuráveis. Padrão: `System.Description` e `Microsoft.VSTS.Common.AcceptanceCriteria`, tipo `User Story`.
- Comentar: `addComment` no projeto e no id. O serviço de comentar não recebe descrição e não chama `updateWorkItem`.
- O texto do comentário traz a sugestão (a story e os achados aceitos) e menciona o responsável pelo nome. Se o card tiver o id de identidade, o texto inclui a menção HTML que o Boards entende (`data-vss-mention`).
- O botão Publicar é a única chamada. Aceitar um achado só altera a story local, depois do diff aprovado.
- O host do git e do Azure fica restrito a `dev.azure.com` e `*.visualstudio.com`. O PAT não vai no argumento do processo: o clone usa `http.extraheader` por variável de ambiente do filho, e essa variável não é logada.

## Consequências

- Um teste cobre que comentar não muda a descrição guardada no falso e que o método de atualizar campo não é chamado.
- A tela deixa explícito: "Nada é enviado ao Azure Boards até este clique. Comentar não altera a descrição do card."
