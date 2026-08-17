import { TripInput } from '../../shared/types';
import { ProviderRegistry } from '../providers/registry';
import { TravelDatabase } from '../database/database';

export class AgentOrchestrator {
  constructor(private database: TravelDatabase, private providers: ProviderRegistry) {}

  async searchTrip(tripId: string): Promise<void> {
    const trip = this.database.getTripInput(tripId);
    if (!trip) throw new Error('Viagem não encontrada.');
    this.database.addLog(tripId, 'info', 'Iniciando pesquisa com separação entre dados reais e estimativas.');
    const results = await this.providers.searchAll(trip, (message, level = 'info') => this.database.addLog(tripId, level, message));
    const offers = results.flatMap((result) => result.offers).filter((offer) => offer.verifiedPurchaseLink && Boolean(offer.sourceUrl));
    if (offers.length) {
      this.database.saveOffers(tripId, offers);
      this.database.addLog(tripId, 'info', `${offers.length} oferta(s) validada(s), com fonte e URL verificáveis.`);
    } else {
      this.database.addLog(tripId, 'warning', 'Nenhuma oferta foi publicada. O aplicativo não inventa preços nem links ausentes.');
    }
    this.database.touchTrip(tripId, offers.length ? 'monitoring' : 'draft');
    this.database.addLog(tripId, 'info', 'Pesquisa finalizada.');
  }
}
