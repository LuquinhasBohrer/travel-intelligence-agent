# Arquitetura

## Decisão

A primeira versão usa **Electron + React + TypeScript** para entregar uma interface desktop moderna no Windows sem separar artificialmente a UI do computador do usuário. O processo principal mantém o acesso a SQLite e às credenciais; o renderer não possui acesso direto ao sistema de arquivos, Node.js ou tokens.

A persistência usa `sql.js`, um SQLite compilado para WebAssembly, gravado como arquivo local. Essa escolha evita dependência nativa durante o primeiro ciclo de distribuição; a camada `TravelDatabase` mantém uma fronteira clara para uma futura troca por `better-sqlite3` ou outro driver nativo caso o volume de dados exija.

## Fluxo

```text
React Renderer
    ↓ IPC seguro via preload
Electron Main Process
    ↓
AgentOrchestrator
    ├── Intent Parser
    ├── ProviderRegistry → Providers autorizados
    ├── Normalização e validação
    ├── Analytics Engine
    └── Rule Engine / alertas futuros
    ↓
SQLite local
```

## Regras de fronteira

O renderer só recebe DTOs serializáveis. A lista de providers não pode escrever diretamente na UI. O orchestrator é responsável por registrar cada etapa. Ofertas sem URL HTTPS verificável não são encaminhadas para a lista apresentada ao usuário, mesmo que o provider tenha retornado um preço.

## Alternativas avaliadas

| Abordagem | Vantagens | Limitações | Decisão |
| --- | --- | --- | --- |
| Electron + React + TypeScript | Ecossistema maduro, UI web reutilizável, integração simples com APIs e Windows | Consumo de memória maior | Escolhida para o MVP |
| Tauri + React + Rust | Binário menor e menor consumo | Mais complexidade inicial, cadeia Rust e IPC adicional | Avaliar após validar o domínio |
| Python + Qt | Bom para analytics e protótipos locais | Distribuição e UI multiplataforma menos uniforme para este produto | Não escolhida agora |

## Dados e níveis de certeza

O sistema deve conservar a origem e a hora de coleta. Dados externos são `DADO REAL`; registros persistidos de pesquisas anteriores são `HISTÓRICO`; cálculos estatísticos são `ESTIMATIVA`; projeções temporais futuras são `PREVISÃO`; e a decisão textual do motor é `RECOMENDAÇÃO`. Nenhuma dessas categorias pode preencher silenciosamente outra.
