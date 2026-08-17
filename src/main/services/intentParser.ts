import { ParsedIntent } from '../../shared/types';

const monthNames: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, março: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12
};

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function parseMoney(text: string): number | null {
  const match = text.match(/(?:r\$\s*)?([\d.]+(?:,\d{1,2})?|\d+(?:\.\d{1,2})?)\s*(mil|k)?/i);
  if (!match) return null;
  let raw = match[1].replace(/\./g, '').replace(',', '.');
  let value = Number(raw);
  if (match[2]) value *= 1000;
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

function parseTravelers(text: string): number {
  const normalized = normalize(text);
  const wordMap: Record<string, number> = { uma: 1, um: 1, duas: 2, dois: 2, tres: 3, três: 3, quatro: 4, cinco: 5 };
  const numeric = text.match(/(?:para|com)\s+(\d+)\s*(?:pessoas?|passageiros?)/i);
  if (numeric) return Math.max(1, Number(numeric[1]));
  for (const [word, value] of Object.entries(wordMap)) {
    if (normalized.includes(`${normalize(word)} pessoas`) || normalized.includes(`${normalize(word)} passageiros`)) return value;
  }
  return 1;
}

function parseFlexibility(text: string): number {
  const match = text.match(/flexib(?:ilidade|ilidade)?\s+(?:de\s+)?(?:at[eé]\s+)?(\d+)\s*dias?/i) ?? text.match(/[±+]\s*(\d+)\s*dias?/i);
  return match ? Number(match[1]) : 0;
}

function parseDuration(text: string): number | null {
  const match = text.match(/(?:por|dur[aá]?[cç][aã]o|durando)\s+(?:aproximadamente\s+)?(\d+)\s*dias?/i);
  return match ? Number(match[1]) : null;
}

function toIsoDate(day: number, month: number, year: number): string | null {
  if (year < 2020 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseExactDate(text: string): string | null {
  const numeric = text.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/);
  if (numeric) return toIsoDate(Number(numeric[1]), Number(numeric[2]), Number(numeric[3]));
  const named = text.match(/\b(\d{1,2})\s+de\s+([a-zçãõ]+)(?:\s+de)?\s+(\d{4})\b/i);
  if (named) {
    const month = monthNames[normalize(named[2])];
    return month ? toIsoDate(Number(named[1]), month, Number(named[3])) : null;
  }
  return null;
}

function parseDateHint(text: string, exactDate: string | null): string | null {
  if (exactDate) return exactDate;
  const normalized = normalize(text);
  for (const [month, monthNumber] of Object.entries(monthNames)) {
    if (normalized.includes(month)) return String(monthNumber).padStart(2, '0');
  }
  return null;
}

function parseReturnDate(text: string): string | null {
  const returnText = text.match(/(?:volta|retorno|retornar|voltar)[^\d]{0,20}(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/i);
  if (!returnText) return null;
  const match = returnText[1].match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  return match ? toIsoDate(Number(match[1]), Number(match[2]), Number(match[3])) : null;
}

function parseRoute(text: string): { origin: string | null; destination: string | null } {
  const match = text.match(/\bde\s+(.+?)\s+para\s+(.+?)(?=,|\.|\s+(?:em|no|na|por|com|e\s+tenho|mas\s+so|mas\s+s[oó])\b|$)/i);
  if (!match) return { origin: null, destination: null };
  return { origin: match[1].trim(), destination: match[2].trim() };
}

export function parseIntent(rawRequest: string): ParsedIntent {
  const text = rawRequest.trim();
  const route = parseRoute(text);
  const departureDate = parseExactDate(text);
  const returnDate = parseReturnDate(text);
  const dateHint = parseDateHint(text, departureDate);
  const normalized = normalize(text);
  const budgetMatch = text.match(/(?:menos de|abaixo de|at[eé]\s+no\s+m[aá]ximo\s+de|or[cç]amento\s+de)\s+(?:r\$\s*)?[\d.,]+\s*(?:mil|k)?/i);
  const maxStopsMatch = text.match(/(?:no m[aá]ximo|at[eé])\s+(\d+)\s+escalas?/i);
  const baggage = /mala\s+despachada/i.test(text) ? '1 mala despachada' : /bagagem/i.test(text) ? 'bagagem a definir' : null;
  const missingFields: string[] = [];
  if (!route.origin) missingFields.push('origem');
  if (!route.destination) missingFields.push('destino');
  if (!dateHint) missingFields.push('período ou data');
  else if (!departureDate) missingFields.push('data completa para pesquisar');

  const confidence: ParsedIntent['confidence'] = missingFields.length === 0 ? 'alta' : missingFields.length === 1 ? 'média' : 'baixa';
  return {
    rawRequest: text,
    origin: route.origin,
    destination: route.destination,
    departureDate,
    returnDate,
    dateHint,
    durationDays: parseDuration(text),
    travelers: parseTravelers(text),
    budgetCents: budgetMatch ? parseMoney(budgetMatch[0]) : null,
    flexibilityDays: parseFlexibility(text),
    cabinClass: normalized.includes('executiva') ? 'business' : normalized.includes('premium') ? 'premium_economy' : 'economy',
    maxStops: maxStopsMatch ? Number(maxStopsMatch[1]) : null,
    baggage,
    missingFields,
    confidence
  };
}
