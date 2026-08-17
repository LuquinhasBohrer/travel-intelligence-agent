# Travel Intelligence Agent

Aplicativo desktop **local-first** para pesquisar, comparar e acompanhar oportunidades de viagem sem inventar preços, disponibilidade ou links. Este repositório público contém o MVP inicial e a arquitetura preparada para providers reais.

> O aplicativo diferencia explicitamente **dado real**, **histórico local**, **estimativa** e **recomendação**. Uma oferta só é exibida quando há fonte e URL HTTPS verificáveis.

## Estado atual

O MVP já possui interface desktop baseada em Electron, React e TypeScript; banco SQLite local via `sql.js`; interpretação inicial de pedidos em linguagem natural; persistência de viagens; logs transparentes; arquitetura de providers; cálculo de índice de compra sobre dados efetivamente coletados; e tratamento explícito de provider ausente ou sem link verificável.

A integração de voos está preparada para Duffel, mas permanece desativada até que o usuário configure sua própria credencial em ambiente local. O app não usa dados mockados como se fossem ofertas reais. A integração de hotéis, câmbio, notificações e monitoramento em segundo plano está documentada no roadmap e ainda não está implementada.

## Executar no Windows

Requisitos: Node.js 20 ou superior e npm. Na pasta do projeto:

```bash
npm install
npm run dev
```

Para uma execução sem o servidor de desenvolvimento:

```bash
npm run build
npm start
```

Para validação:

```bash
npm run typecheck
npm test
```

## Provider de voos

Copie `.env.example` para `.env` e configure `DUFFEL_ACCESS_TOKEN` somente com uma credencial própria e autorizada. A aplicação não envia dados pessoais; apenas os parâmetros de pesquisa necessários. Como a publicação de uma oferta exige URL direta verificável, o MVP descarta ofertas retornadas sem link de compra e registra essa decisão nos logs.

## Estrutura

```text
src/main/              Processo Electron, banco, providers e orquestração
src/renderer/          Interface React
src/shared/            Tipos compartilhados
src/main/database/     Persistência SQLite local
src/main/providers/    Adaptadores de fontes externas
src/main/services/     Parser, analytics e agente
 docs/                 Arquitetura, segurança, providers e roadmap
 tests/                Testes automatizados
```

## Princípios

O projeto é intencionalmente incremental. Nenhuma integração deve contornar termos de uso, limites de requisição ou controles de segurança de um provedor. Segredos ficam fora do repositório, e links encurtados ou não verificáveis não podem aparecer como oportunidades de compra.

Consulte [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/PROVIDERS.md`](docs/PROVIDERS.md), [`docs/SECURITY.md`](docs/SECURITY.md) e [`docs/ROADMAP.md`](docs/ROADMAP.md) antes de adicionar uma nova integração.
