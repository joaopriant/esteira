# Segurança

A Esteira v1 não tem servidor. O código e o PAT ficam na máquina de quem usa.

## Reportar um problema

Este repositório é privado. Fale com o fundador direto. Não abra issue pública e não mande PAT, trecho de código da empresa ou story real no relato.

## O que já está decidido

- PAT no cofre de credenciais do Windows, nunca em arquivo de configuração.
- Escrita no Azure Boards só no clique de publicar ou comentar. Comentário não altera a descrição do card.
- A janela do Electron não tem Node. A lista de IPC é fechada.
- `git` e `claude` sobem sem shell, com argumentos separados.
- Afirmação sem arquivo e trecho, ou sem card conhecido, fica marcada como "sem prova".

O modelo de ameaças está em [docs/seguranca/modelo-de-ameacas.md](docs/seguranca/modelo-de-ameacas.md). A revisão da v1 está em [docs/seguranca/revisao-v1.md](docs/seguranca/revisao-v1.md).
