import { describe, expect, it } from 'vitest';
import { parseIntent } from '../src/main/services/intentParser';

describe('parseIntent', () => {
  it('interpreta uma solicitação completa em português com data exata', () => {
    const result = parseIntent('Quero viajar de Porto Alegre para Santiago em 15/12/2026, por aproximadamente 7 dias, para duas pessoas. Tenho flexibilidade de até 3 dias e orçamento de R$ 4.500.');
    expect(result.origin).toBe('Porto Alegre');
    expect(result.destination).toBe('Santiago');
    expect(result.departureDate).toBe('2026-12-15');
    expect(result.dateHint).toBe('2026-12-15');
    expect(result.travelers).toBe(2);
    expect(result.durationDays).toBe(7);
    expect(result.flexibilityDays).toBe(3);
    expect(result.budgetCents).toBe(450000);
    expect(result.missingFields).toEqual([]);
  });

  it('não inventa uma data pesquisável quando o usuário informa apenas o mês', () => {
    const result = parseIntent('Quero viajar de Porto Alegre para Santiago em dezembro, por 7 dias.');
    expect(result.dateHint).toBe('12');
    expect(result.departureDate).toBeNull();
    expect(result.missingFields).toContain('data completa para pesquisar');
  });

  it('aceita data escrita por extenso quando o ano foi informado', () => {
    const result = parseIntent('De São Paulo para Lisboa em 8 de março de 2027 para duas pessoas.');
    expect(result.departureDate).toBe('2027-03-08');
    expect(result.origin).toBe('São Paulo');
    expect(result.destination).toBe('Lisboa');
  });
});
