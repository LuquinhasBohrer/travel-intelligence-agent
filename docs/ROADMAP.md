# Roadmap

## Entregue no MVP 0.1

A aplicação desktop abre localmente, interpreta pedidos em português, salva viagens em SQLite, registra logs, exibe o dashboard e possui um contrato de provider real para voos. O fluxo é honesto quando não há credencial, quando faltam parâmetros ou quando uma resposta não contém URL verificável.

## Próximas fases

| Fase | Entrega | Critério de conclusão |
| --- | --- | --- |
| 0.2 | Datas completas e variantes ±N | Consultas exatas e alternativas são normalizadas sem inventar ano |
| 0.3 | Provider de hospedagem autorizado | Ofertas de hotel com cancelamento, taxas, comodidades e deeplink verificável |
| 0.4 | Normalização e deduplicação | A mesma oferta não aparece como múltiplos resultados |
| 0.5 | Histórico visual | Gráficos baseados somente em capturas locais |
| 0.6 | Analytics avançado | sazonalidade, percentis, antecedência e intervalo de confiança |
| 0.7 | Alertas desktop | regra de preço-alvo e percentil histórico com histórico de notificações |
| 0.8 | E-mail/SMS opcional | consentimento, segredo seguro, opt-out e provider autorizado |
| 0.9 | Monitoramento agendado | job local controlado pelo usuário, cache, retry e backoff |
| 1.0 | Distribuição | instalador Windows, assinatura, migrações e backup local |

A prioridade é transformar cada fase em software executável e auditável, em vez de adicionar telas demonstrativas sem fonte de dados.
