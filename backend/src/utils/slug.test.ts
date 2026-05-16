import { describe, expect, it } from 'vitest';

import { toCifraClubSlug } from './slug.js';

describe('toCifraClubSlug', () => {
  it('normalizes accents and punctuation for Cifra Club URLs', () => {
    expect(toCifraClubSlug('Mãezinha do Céu')).toBe('maezinha-do-ceu');
    expect(toCifraClubSlug('Irmã Kelly Patrícia')).toBe(
      'irma-kelly-patricia',
    );
  });
});
