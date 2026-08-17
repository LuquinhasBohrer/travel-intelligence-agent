import { TripInput } from '../../shared/types';
import { DuffelProvider } from './duffel';
import { ProviderResult, SearchProvider } from './types';

export class ProviderRegistry {
  private providers: SearchProvider[] = [new DuffelProvider()];
  listStatus() { return this.providers.map((provider) => ({ id: provider.id, name: provider.name, configured: provider.isConfigured(), capabilities: provider.capabilities, message: provider.isConfigured() ? 'Pronto para consulta.' : 'Aguardando credencial local.' })); }
  async searchAll(input: TripInput, log: (message: string, level?: 'info' | 'warning' | 'error') => void): Promise<ProviderResult[]> {
    const results: ProviderResult[] = [];
    for (const provider of this.providers) {
      log(`Consultando ${provider.name}.`);
      const result = await provider.search(input);
      results.push(result);
      if (result.status === 'error') log(result.message, 'error');
      else if (result.status === 'not_configured' || result.status === 'empty') log(result.message, 'warning');
      else log(result.message);
    }
    return results;
  }
}
