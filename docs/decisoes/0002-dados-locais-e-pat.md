# ADR 0002 — Dados locais e o PAT

Data: 24/10/2026. Status: aceita. Autor: CTO.

## Contexto

Stories, wiki, fluxo, modelo e medições ficam na máquina. O PAT não pode aparecer em arquivo de configuração, em log ou na janela depois de gravado. No Windows o lugar certo é o cofre de credenciais. A seção 6 deixa o formato em aberto.

## Opções

1. **PAT num arquivo cifrado com uma chave também em disco.** A chave ao lado do segredo não é cofre.
2. **electron `safeStorage`.** Cifra com o sistema operacional, mas o resultado fica num arquivo nosso. Não é o Credential Manager.
3. **Cofre do sistema via `@napi-rs/keyring`.** No Windows, Credential Manager. No macOS, Keychain. No Linux, Secret Service. O app só guarda o nome da conta.

## Decisão

Opção 3. Serviço `Esteira`, conta `azure-devops:<url da organização>`. O `config.json` guarda a URL e nunca o token.

Os outros dados ficam em JSON, com escrita atômica (arquivo temporário e rename), no diretório de dados do usuário:

- Windows: `%APPDATA%\Esteira`
- Linux e macOS: `~/.local/share/esteira` (ou `XDG_DATA_HOME`)

Clones em `repos/` dentro desse diretório. Wiki em `wiki/<produto>/`. Stories em `stories/<id>.json`.

Nesta VM e nos testes o cofre é um mapa em memória. O adaptador real não cai para arquivo em claro se o cofre falhar: a conexão falha com uma mensagem, e o PAT não é gravado.

## Consequências

- Trocar de organização grava outro segredo. Desconectar apaga a conta do cofre.
- Quem copiar a pasta de dados não leva o PAT.
- No Linux sem Secret Service o app real não conecta. O modo falso não precisa de cofre. O notebook do fundador é Windows.
