export type TripStatus = 'draft' | 'monitoring' | 'paused';

export interface TripInput {
  rawRequest: string;
  origin: string | null;
  destination: string | null;
  departureDate: string | null;
  returnDate: string | null;
  dateHint: string | null;
  durationDays: number | null;
  travelers: number;
  budgetCents: number | null;
  flexibilityDays: number;
  cabinClass: string;
  maxStops: number | null;
  baggage: string | null;
}

export interface ParsedIntent extends TripInput {
  missingFields: string[];
  confidence: 'alta' | 'média' | 'baixa';
}

export interface TravelOffer {
  id?: number;
  tripId?: string;
  kind: 'flight' | 'hotel' | 'combined';
  provider: string;
  sourceName: string;
  sourceUrl: string | null;
  collectedAt: string;
  priceCents: number;
  currency: string;
  title: string;
  details: Record<string, unknown>;
  verifiedPurchaseLink: boolean;
}

export interface LogEntry {
  createdAt: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface TripAnalytics {
  currentPriceCents: number | null;
  averagePriceCents: number | null;
  medianPriceCents: number | null;
  minimumPriceCents: number | null;
  maximumPriceCents: number | null;
  historyCount: number;
  purchaseIndex: number | null;
  classification: string | null;
  recommendation: string | null;
  trend: 'up' | 'down' | 'stable' | 'unknown';
}

export interface TripView extends TripInput {
  id: string;
  status: TripStatus;
  createdAt: string;
  updatedAt: string;
  analytics: TripAnalytics;
  offers: TravelOffer[];
  logs: LogEntry[];
}

export interface AppSnapshot {
  trips: TripView[];
  providerStatus: { id: string; name: string; configured: boolean; capabilities: string[]; message: string }[];
}
