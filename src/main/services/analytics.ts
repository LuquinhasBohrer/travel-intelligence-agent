import { TravelOffer, TripAnalytics } from '../../shared/types';

function sorted(values: number[]): number[] { return [...values].sort((a, b) => a - b); }
function median(values: number[]): number { const list = sorted(values); const middle = Math.floor(list.length / 2); return list.length % 2 ? list[middle] : Math.round((list[middle - 1] + list[middle]) / 2); }

export function calculateAnalytics(offers: TravelOffer[], historyPrices: number[]): TripAnalytics {
  const currentValues = offers.filter((offer) => offer.verifiedPurchaseLink).map((offer) => offer.priceCents).filter((price) => price > 0);
  const history = historyPrices.filter((price) => price > 0);
  const all = history.length ? history : currentValues;
  if (!all.length) return { currentPriceCents: null, averagePriceCents: null, medianPriceCents: null, minimumPriceCents: null, maximumPriceCents: null, historyCount: 0, purchaseIndex: null, classification: null, recommendation: null, trend: 'unknown' };
  const current = currentValues.length ? Math.min(...currentValues) : null;
  const average = Math.round(all.reduce((sum, value) => sum + value, 0) / all.length);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const med = median(all);
  let purchaseIndex: number | null = null;
  let classification: string | null = null;
  let recommendation: string | null = null;
  if (current !== null) {
    const relative = average > 0 ? (average - current) / average : 0;
    purchaseIndex = Math.max(0, Math.min(100, Math.round(50 + relative * 100)));
    if (purchaseIndex >= 86) { classification = 'OPORTUNIDADE EXCEPCIONAL'; recommendation = 'COMPRAR AGORA'; }
    else if (purchaseIndex >= 71) { classification = 'PREÇO MUITO BOM'; recommendation = 'COMPRAR SE AS CONDIÇÕES ATENDEREM'; }
    else if (purchaseIndex >= 51) { classification = 'BOM PREÇO'; recommendation = 'MONITORAR E COMPARAR'; }
    else if (purchaseIndex >= 31) { classification = 'PREÇO NORMAL'; recommendation = 'ESPERAR E MONITORAR'; }
    else { classification = 'PREÇO CARO'; recommendation = 'ESPERAR'; }
  }
  const trend = current === null || history.length < 2 ? 'unknown' : current < average * 0.97 ? 'down' : current > average * 1.03 ? 'up' : 'stable';
  return { currentPriceCents: current, averagePriceCents: average, medianPriceCents: med, minimumPriceCents: min, maximumPriceCents: max, historyCount: history.length, purchaseIndex, classification, recommendation, trend };
}
