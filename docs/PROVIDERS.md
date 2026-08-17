# Providers e fontes

## Estado do MVP

O registro de providers contém um adaptador real para **Duffel Flights API**, ativado somente com `DUFFEL_ACCESS_TOKEN`. Sem essa variável, o aplicativo permanece plenamente utilizável para salvar viagens, interpretar pedidos e visualizar o estado local, mas não apresenta ofertas.

A [documentação oficial da Duffel](https://duffel.com/docs) descreve APIs de Flights e Stays. Antes de colocar uma oferta em tela, o adaptador exige preço positivo, moeda, fonte e URL HTTPS direta. Se a resposta não fornecer um link verificável de compra, o resultado é descartado e essa decisão aparece nos logs. Isso é deliberado: o app não transforma um identificador interno de API em um link de compra inventado.

A [documentação de desenvolvedores da Booking.com](https://developers.booking.com/) apresenta Demand API, Connectivity APIs e Metasearch Connect API, mas o acesso depende do produto e do processo de aprovação aplicável. Ela deve ser adicionada somente após validar credenciais, escopo de uso, links de atribuição e termos comerciais.

A página atual da [Amadeus for Developers](https://developers.amadeus.com/) informa que o portal self-service foi descontinuado em 17 de julho e que o portal atual é voltado a APIs Enterprise. Portanto, Amadeus não é tratada como integração self-service padrão neste MVP.

## Contrato

Todo provider deve implementar:

```ts
interface SearchProvider {
  id: string;
  name: string;
  capabilities: string[];
  isConfigured(): boolean;
  search(input: TripInput): Promise<ProviderResult>;
}
```

O adapter deve normalizar moeda, preço total, bagagem, escalas, duração, condições e URL. Deve aplicar timeout, rate limiting, retry/backoff e logs antes de ser habilitado em produção. A implementação não deve executar scraping indiscriminado; APIs oficiais e parcerias autorizadas têm prioridade.

## Próximos providers

O próximo ciclo deve incluir um provider de hospedagem com acesso aprovado e política clara de deeplink; depois, um provider de câmbio com fonte confiável e registro da cotação. A integração com mecanismos de busca deve ser tratada como descoberta, nunca como substituta automática de uma fonte de compra verificável.
