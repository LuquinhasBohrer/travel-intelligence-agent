import { describe, expect, it } from 'vitest';
import { parseIntent } from '../src/main/services/intentParser';

describe('parseIntent', () => {
  it('interpreta uma solicitação completa em português', () => {
    const result = parseIntent('Quero viajar de Porto Alegre para Santiago em dezembro, por aproximadamente 7 dias, para duas pessoas. Quero gastar menos de R$ 5 mil e tenho flexibilidade de até 3 dias.');
    expect(result.origin).toBe('Porto Alegre');
    expect(result.destination).toBe('Santiago');
    expect(result.travelers).toBe(2);
    expect(result.durationDays).toBe(7);
    expect(result.budgetCents).toBe(500000);
    expect(result.flexibilityDays).toBe(3);
    expect(result.missingFields).toEqual([]);
  });

  it('não inventa período quando ele não foi informado', () => {
    const result = parseIntent('Encontre um hotel barato em Gramado.');
    expect(result.dateHint).toBeNull();
    expect(result.missingFields).toContain('origem');
    expect(result.missingFields).toContain('período ou data');
  });
});
