import { TripInput, TravelOffer } from '../../shared/types';

export interface ProviderResult {
  status: 'success' | 'not_configured' | 'empty' | 'error';
  offers: TravelOffer[];
  message: string;
}

export interface SearchProvider {
  id: string;
  name: string;
  capabilities: string[];
  isConfigured(): boolean;
  search(input: TripInput): Promise<ProviderResult>;
}
