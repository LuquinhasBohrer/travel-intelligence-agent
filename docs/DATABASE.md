# Banco de dados local

O arquivo `travel-agent.sqlite` é criado no diretório de dados do usuário pelo processo principal. O schema atual contém `trips`, `offers`, `price_history`, `search_logs`, `alerts` e `settings`. As tabelas de ofertas e histórico são separadas: uma captura pode gerar uma oferta exibível e um ponto de série histórica.

## Regras

Preços são armazenados em centavos na unidade monetária retornada pelo provider. A moeda é preservada; nenhuma conversão cambial é feita silenciosamente. Cada oferta tem `collected_at`, `source_name`, `source_url`, `provider`, `details_json` e `verified_purchase_link`.

O banco é local-first e a UI não acessa o arquivo diretamente. Mutations passam por IPC e pelo processo principal. A migração deve ser versionada antes de alterar tabelas em versões distribuídas.
