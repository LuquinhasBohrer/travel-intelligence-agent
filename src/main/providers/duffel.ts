import { TripInput, TravelOffer } from '../../shared/types';
import { ProviderResult, SearchProvider } from './types';

export class DuffelProvider implements SearchProvider {
  id = 'duffel';
  name = 'Duffel Flights API';
  capabilities = ['voos estruturados'];
  private token = process.env.DUFFEL_ACCESS_TOKEN ?? '';

  isConfigured(): boolean { return Boolean(this.token); }

  async search(input: TripInput): Promise<ProviderResult> {
    if (!this.isConfigured()) {
      return { status: 'not_configured', offers: [], message: 'Duffel não configurado: defina DUFFEL_ACCESS_TOKEN para habilitar a pesquisa de voos.' };
    }
    if (!input.origin || !input.destination || !input.departureDate) {
      return { status: 'empty', offers: [], message: 'A pesquisa precisa de origem, destino e data de ida em formato completo.' };
    }

    const slices = [{ origin: input.origin, destination: input.destination, departure_date: input.departureDate }];
    if (input.returnDate) slices.push({ origin: input.destination, destination: input.origin, departure_date: input.returnDate });
    const passengers = Array.from({ length: Math.max(1, input.travelers) }, () => ({ type: 'adult' }));
    try {
      const response = await fetch('https://api.duffel.com/air/offer_requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Duffel-Version': 'v2', 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { slices, passengers, cabin_class: input.cabinClass, return_offers: true } })
      });
      if (!response.ok) return { status: 'error', offers: [], message: `Duffel respondeu HTTP ${response.status}.` };
      const payload = await response.json() as any;
      const rawOffers = payload?.data?.offers ?? [];
      const offers: TravelOffer[] = rawOffers.map((offer: any) => {
        const price = Number.parseFloat(String(offer?.total_amount ?? '0'));
        const sourceUrl = typeof offer?.url === 'string' && /^https:\/\//i.test(offer.url) ? offer.url : null;
        return {
          kind: 'flight', provider: this.id, sourceName: this.name, sourceUrl,
          collectedAt: new Date().toISOString(), priceCents: Math.round(price * 100),
          currency: String(offer?.total_currency ?? 'BRL'),
          title: `${offer?.owner?.name ?? 'Companhia não informada'} — oferta ${offer?.id ?? 'sem identificador'}`,
          details: { id: offer?.id ?? null, owner: offer?.owner?.name ?? null, slices: offer?.slices ?? [], conditions: offer?.conditions ?? null },
          verifiedPurchaseLink: Boolean(sourceUrl)
        };
      }).filter((offer: TravelOffer) => offer.priceCents > 0);
      const linkable = offers.filter((offer) => offer.verifiedPurchaseLink);
      if (!linkable.length && offers.length) return { status: 'empty', offers: [], message: 'A fonte retornou ofertas reais, mas sem URL direta verificável de compra; elas não foram apresentadas.' };
      return { status: linkable.length ? 'success' : 'empty', offers: linkable, message: linkable.length ? `${linkable.length} oferta(s) com link verificável.` : 'Nenhuma oferta encontrada.' };
    } catch (error) {
      return { status: 'error', offers: [], message: `Falha ao consultar Duffel: ${error instanceof Error ? error.message : 'erro desconhecido'}.` };
    }
  }
}
