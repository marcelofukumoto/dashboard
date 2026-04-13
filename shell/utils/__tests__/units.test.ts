import {
  formatSi,
  parseSi,
  exponentNeeded,
  createMemoryFormat,
  createMemoryValues,
  UNITS,
  FRACTIONAL,
} from '@shell/utils/units';

describe('units', () => {
  describe('uNITS constant', () => {
    it('starts with empty string for the base unit', () => {
      expect(UNITS[0]).toStrictEqual('');
    });

    it('contains K, M, G, T in order', () => {
      expect(UNITS.slice(1, 5)).toStrictEqual(['K', 'M', 'G', 'T']);
    });
  });

  describe('fRACTIONAL constant', () => {
    it('starts with empty string for the base unit', () => {
      expect(FRACTIONAL[0]).toStrictEqual('');
    });

    it('contains m, u, n in order', () => {
      expect(FRACTIONAL.slice(1, 4)).toStrictEqual(['m', 'u', 'n']);
    });
  });

  describe('exponentNeeded', () => {
    it.each([
      [0, 1000, 0],
      [1, 1000, 0],
      [999, 1000, 0],
      [1000, 1000, 1],
      [1000000, 1000, 2],
      [1073741824, 1024, 3],
    ])('returns correct exponent for val=%s, increment=%s', (val, increment, expected) => {
      expect(exponentNeeded(val, increment)).toStrictEqual(expected);
    });

    it('uses default increment of 1000', () => {
      expect(exponentNeeded(1500)).toStrictEqual(1);
    });
  });

  describe('formatSi', () => {
    it('formats a plain number below increment with no suffix', () => {
      expect(formatSi(500)).toStrictEqual('500 ');
    });

    it('divides by 1000 to reach K', () => {
      expect(formatSi(1000)).toStrictEqual('1 K');
    });

    it('divides to reach M', () => {
      expect(formatSi(1000000)).toStrictEqual('1 M');
    });

    it('formats small values with up to 2 decimal places', () => {
      expect(formatSi(1500)).toStrictEqual('1.5 K');
    });

    it('appends suffix correctly', () => {
      // formatSi concatenates UNITS[exp] + suffix, so K + B = KB
      expect(formatSi(2048, {
        increment: 1024, suffix: 'B', firstSuffix: 'B'
      })).toStrictEqual('2 KB');
    });

    it('uses firstSuffix at exp=0', () => {
      expect(formatSi(512, {
        suffix: 'B', firstSuffix: 'B', increment: 1024
      })).toStrictEqual('512 B');
    });

    it('omits suffix when addSuffix is false', () => {
      expect(formatSi(1000, { addSuffix: false })).toStrictEqual('1');
    });

    it('omits space before suffix when addSuffixSpace is false', () => {
      expect(formatSi(1000, { addSuffixSpace: false })).toStrictEqual('1K');
    });

    it('respects maxExponent to prevent further division', () => {
      expect(formatSi(1000000, { maxExponent: 1 })).toStrictEqual('1000 K');
    });

    it('respects minExponent to force division even for small values', () => {
      const result = formatSi(500, { minExponent: 1 });

      expect(result).toStrictEqual('0.5 K');
    });

    it('respects startingExponent', () => {
      // Starting at exponent 1 means value is already in K
      expect(formatSi(1, { startingExponent: 1 })).toStrictEqual('1 K');
    });

    it('respects maxPrecision', () => {
      expect(formatSi(1500, { maxPrecision: 0 })).toStrictEqual('2 K');
    });

    it('returns 0 when canRoundToZero=false but exponentNeeded also yields 0', () => {
      // Very small values where exponentNeeded returns 0 still produce "0 "
      // because the recursive call uses canRoundToZero=true
      expect(formatSi(0.0001, { canRoundToZero: false })).toStrictEqual('0 ');
    });

    it('returns 0 for exact zero even when canRoundToZero=false', () => {
      expect(formatSi(0, { canRoundToZero: false })).toStrictEqual('0 ');
    });

    it('formats a value >= 10 without decimal places', () => {
      expect(formatSi(10000)).toStrictEqual('10 K');
    });

    it('handles negative maxExponent for fractional units', () => {
      // maxExponent < 0 triggers the FRACTIONAL path (multiply mode)
      const result = formatSi(0.001, { maxExponent: -1, increment: 1000 });

      expect(result).toStrictEqual('1 m');
    });
  });

  describe('parseSi', () => {
    it('returns NaN for empty string', () => {
      expect(parseSi('')).toStrictEqual(NaN);
    });

    it('returns NaN for null', () => {
      expect(parseSi(null as unknown as string)).toStrictEqual(NaN);
    });

    it('returns NaN for non-string input', () => {
      expect(parseSi(42 as unknown as string)).toStrictEqual(NaN);
    });

    it('parses a plain integer string', () => {
      expect(parseSi('1000')).toStrictEqual(1000);
    });

    it('parses a float string', () => {
      expect(parseSi('1.5')).toStrictEqual(1.5);
    });

    it('strips commas before parsing', () => {
      expect(parseSi('1,000')).toStrictEqual(1000);
    });

    it('parses K suffix (×1000)', () => {
      expect(parseSi('1K')).toStrictEqual(1000);
    });

    it('parses M suffix (×1000²)', () => {
      expect(parseSi('1M')).toStrictEqual(1000000);
    });

    it('parses G suffix (×1000³)', () => {
      expect(parseSi('2G')).toStrictEqual(2000000000);
    });

    it('parses Ki suffix (×1024)', () => {
      expect(parseSi('1Ki')).toStrictEqual(1024);
    });

    it('parses Mi suffix (×1024²)', () => {
      expect(parseSi('1Mi')).toStrictEqual(1048576);
    });

    it('parses lowercase m as milli (÷1000)', () => {
      expect(parseSi('1m')).toStrictEqual(0.001);
    });

    it('parses u as micro (÷1000²)', () => {
      expect(parseSi('1u')).toStrictEqual(0.000001);
    });

    it('treats unrecognized unit as raw number', () => {
      expect(parseSi('42x')).toStrictEqual(42);
    });

    it('treats m as Mega when allowFractional=false (since m.toUpperCase() = M)', () => {
      // FRACTIONAL.includes('m') = true AND UNITS.includes('M') = true
      // When allowFractional=false, the divide path is skipped and multiply wins
      expect(parseSi('1m', { allowFractional: false })).toStrictEqual(1000000);
    });

    it('respects explicit increment option', () => {
      expect(parseSi('1K', { increment: 1024 })).toStrictEqual(1024);
    });

    it('parses with surrounding whitespace in value', () => {
      // The regex strips trailing spaces; value "1 K" is valid
      expect(parseSi('1 K')).toStrictEqual(1000);
    });

    it('parses micro symbol (µ) as u', () => {
      // µ is char code 181
      expect(parseSi('1\u00B5')).toStrictEqual(0.000001);
    });
  });

  describe('createMemoryFormat', () => {
    it('returns an object with addSuffix=true', () => {
      expect(createMemoryFormat(512).addSuffix).toStrictEqual(true);
    });

    it('sets minExponent and maxExponent to the same value', () => {
      const fmt = createMemoryFormat(1073741824); // 1 GiB

      expect(fmt.minExponent).toStrictEqual(fmt.maxExponent);
    });

    it('computes correct exponent for 1 GiB (1024^3)', () => {
      const fmt = createMemoryFormat(1073741824);

      expect(fmt.minExponent).toStrictEqual(3);
    });

    it('computes exponent 0 for values under 1 KiB', () => {
      const fmt = createMemoryFormat(512);

      expect(fmt.minExponent).toStrictEqual(0);
    });

    it('uses iB as suffix', () => {
      expect(createMemoryFormat(1024).suffix).toStrictEqual('iB');
    });
  });

  describe('createMemoryValues', () => {
    it('returns zero total and useful when both arguments are falsy', () => {
      const result = createMemoryValues(null as unknown as string, null as unknown as string);

      expect(result.total).toStrictEqual(0);
      expect(result.useful).toStrictEqual(0);
    });

    it('returns "iB" units for byte-scale total (UNITS[0] is empty string)', () => {
      // exponentNeeded(512, 1024) = 0, so units = UNITS[0] + 'iB' = 'iB'
      const result = createMemoryValues('512', '256');

      expect(result.units).toStrictEqual('iB');
    });

    it('returns correct units for KiB-scale total', () => {
      const result = createMemoryValues('2048', '1024');

      expect(result.units).toStrictEqual('KiB');
    });

    it('returns correct units for GiB-scale total', () => {
      const result = createMemoryValues('4294967296', '2147483648'); // 4 GiB, 2 GiB

      expect(result.units).toStrictEqual('GiB');
    });

    it('rounds total to 2 decimal places', () => {
      // 1500 bytes → 1.46 KiB (1500/1024)
      const result = createMemoryValues('1500', '1500');

      expect(result.total).toStrictEqual(1.46);
    });

    it('returns useful as fraction of same unit as total', () => {
      const result = createMemoryValues('2048', '1024'); // 2 KiB total, 1 KiB useful

      expect(result.total).toStrictEqual(2);
      expect(result.useful).toStrictEqual(1);
    });

    it('accepts string representations with K suffix', () => {
      const result = createMemoryValues('4Ki', '2Ki');

      expect(result.total).toStrictEqual(4);
      expect(result.useful).toStrictEqual(2);
      expect(result.units).toStrictEqual('KiB');
    });
  });
});
