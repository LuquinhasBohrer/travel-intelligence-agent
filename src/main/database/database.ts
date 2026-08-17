import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';
import { AppSnapshot, LogEntry, TravelOffer, TripAnalytics, TripInput, TripView } from '../../shared/types';
import { calculateAnalytics } from '../services/analytics';

const schema = `
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY, raw_request TEXT NOT NULL, origin TEXT, destination TEXT,
  departure_date TEXT, return_date TEXT, date_hint TEXT, duration_days INTEGER,
  travelers INTEGER NOT NULL DEFAULT 1, budget_cents INTEGER, flexibility_days INTEGER NOT NULL DEFAULT 0,
  cabin_class TEXT NOT NULL DEFAULT 'economy', max_stops INTEGER, baggage TEXT,
  status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id TEXT NOT NULL, kind TEXT NOT NULL, provider TEXT NOT NULL,
  source_name TEXT NOT NULL, source_url TEXT, collected_at TEXT NOT NULL, price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL, title TEXT NOT NULL, details_json TEXT NOT NULL, verified_purchase_link INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(trip_id) REFERENCES trips(id)
);
CREATE TABLE IF NOT EXISTS price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id TEXT NOT NULL, offer_id INTEGER, captured_at TEXT NOT NULL,
  price_cents INTEGER NOT NULL, currency TEXT NOT NULL, FOREIGN KEY(trip_id) REFERENCES trips(id)
);
CREATE TABLE IF NOT EXISTS search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id TEXT NOT NULL, created_at TEXT NOT NULL,
  level TEXT NOT NULL, message TEXT NOT NULL, FOREIGN KEY(trip_id) REFERENCES trips(id)
);
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id TEXT NOT NULL, rule_type TEXT NOT NULL,
  threshold_cents INTEGER, enabled INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL,
  FOREIGN KEY(trip_id) REFERENCES trips(id)
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;

export class TravelDatabase {
  private db: any;
  private filePath: string;

  private constructor(db: any, filePath: string) { this.db = db; this.filePath = filePath; }

  static async open(dataDir: string): Promise<TravelDatabase> {
    fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, 'travel-agent.sqlite');
    const SQL = await initSqlJs({ locateFile: (file) => path.join(path.dirname(require.resolve('sql.js')), file) });
    const buffer = fs.existsSync(filePath) ? fs.readFileSync(filePath) : undefined;
    const db = buffer ? new SQL.Database(buffer) : new SQL.Database();
    const instance = new TravelDatabase(db, filePath);
    db.run(schema);
    instance.persist();
    return instance;
  }

  private persist() { fs.writeFileSync(this.filePath, Buffer.from(this.db.export())); }
  private run(sql: string, params: any[] = []) { const stmt = this.db.prepare(sql); stmt.bind(params); stmt.step(); stmt.free(); this.persist(); }
  private all<T = any>(sql: string, params: any[] = []): T[] { const stmt = this.db.prepare(sql); stmt.bind(params); const rows: T[] = []; while (stmt.step()) rows.push(stmt.getAsObject() as T); stmt.free(); return rows; }
  private one<T = any>(sql: string, params: any[] = []): T | undefined { return this.all<T>(sql, params)[0]; }

  createTrip(input: TripInput): string {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.run(`INSERT INTO trips (id, raw_request, origin, destination, departure_date, return_date, date_hint, duration_days, travelers, budget_cents, flexibility_days, cabin_class, max_stops, baggage, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`, [id, input.rawRequest, input.origin, input.destination, input.departureDate, input.returnDate, input.dateHint, input.durationDays, input.travelers, input.budgetCents, input.flexibilityDays, input.cabinClass, input.maxStops, input.baggage, now, now]);
    this.addLog(id, 'info', 'Viagem criada localmente.');
    return id;
  }

  getTripInput(id: string): TripInput | undefined {
    const row = this.one<any>('SELECT * FROM trips WHERE id = ?', [id]);
    if (!row) return undefined;
    return { rawRequest: row.raw_request, origin: row.origin, destination: row.destination, departureDate: row.departure_date, returnDate: row.return_date, dateHint: row.date_hint, durationDays: row.duration_days, travelers: row.travelers, budgetCents: row.budget_cents, flexibilityDays: row.flexibility_days, cabinClass: row.cabin_class, maxStops: row.max_stops, baggage: row.baggage };
  }

  touchTrip(id: string, status: 'draft' | 'monitoring' | 'paused') { this.run('UPDATE trips SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), id]); }
  deleteTrip(id: string) { this.run('DELETE FROM search_logs WHERE trip_id = ?', [id]); this.run('DELETE FROM price_history WHERE trip_id = ?', [id]); this.run('DELETE FROM offers WHERE trip_id = ?', [id]); this.run('DELETE FROM alerts WHERE trip_id = ?', [id]); this.run('DELETE FROM trips WHERE id = ?', [id]); }

  saveOffers(tripId: string, offers: TravelOffer[]) {
    for (const offer of offers) {
      this.run(`INSERT INTO offers (trip_id, kind, provider, source_name, source_url, collected_at, price_cents, currency, title, details_json, verified_purchase_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [tripId, offer.kind, offer.provider, offer.sourceName, offer.sourceUrl, offer.collectedAt, offer.priceCents, offer.currency, offer.title, JSON.stringify(offer.details), offer.verifiedPurchaseLink ? 1 : 0]);
      const row = this.one<any>('SELECT last_insert_rowid() AS id');
      this.run('INSERT INTO price_history (trip_id, offer_id, captured_at, price_cents, currency) VALUES (?, ?, ?, ?, ?)', [tripId, row?.id ?? null, offer.collectedAt, offer.priceCents, offer.currency]);
    }
  }

  addLog(tripId: string, level: LogEntry['level'], message: string) { this.run('INSERT INTO search_logs (trip_id, created_at, level, message) VALUES (?, ?, ?, ?)', [tripId, new Date().toISOString(), level, message]); }

  private getOffers(id: string): TravelOffer[] {
    return this.all<any>('SELECT * FROM offers WHERE trip_id = ? AND verified_purchase_link = 1 ORDER BY price_cents ASC', [id]).map((row) => ({ id: row.id, tripId: row.trip_id, kind: row.kind, provider: row.provider, sourceName: row.source_name, sourceUrl: row.source_url, collectedAt: row.collected_at, priceCents: row.price_cents, currency: row.currency, title: row.title, details: JSON.parse(row.details_json), verifiedPurchaseLink: Boolean(row.verified_purchase_link) }));
  }

  private getLogs(id: string): LogEntry[] { return this.all<any>('SELECT created_at, level, message FROM search_logs WHERE trip_id = ? ORDER BY id DESC LIMIT 12', [id]).map((row) => ({ createdAt: row.created_at, level: row.level, message: row.message })); }

  private view(row: any): TripView {
    const input: TripInput = { rawRequest: row.raw_request, origin: row.origin, destination: row.destination, departureDate: row.departure_date, returnDate: row.return_date, dateHint: row.date_hint, durationDays: row.duration_days, travelers: row.travelers, budgetCents: row.budget_cents, flexibilityDays: row.flexibility_days, cabinClass: row.cabin_class, maxStops: row.max_stops, baggage: row.baggage };
    const offers = this.getOffers(row.id);
    const history = this.all<any>('SELECT price_cents FROM price_history WHERE trip_id = ? ORDER BY captured_at ASC', [row.id]).map((item) => Number(item.price_cents));
    const analytics: TripAnalytics = calculateAnalytics(offers, history);
    return { ...input, id: row.id, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, analytics, offers, logs: this.getLogs(row.id) };
  }

  snapshot(providerStatus: AppSnapshot['providerStatus']): AppSnapshot { const trips = this.all<any>('SELECT * FROM trips ORDER BY updated_at DESC').map((row) => this.view(row)); return { trips, providerStatus }; }
}
