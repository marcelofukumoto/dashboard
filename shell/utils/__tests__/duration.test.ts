import { toMilliseconds, toSeconds } from '@shell/utils/duration';

describe('toMilliseconds', () => {
  it.each([
    ['100ms', 100],
    ['1s', 1000],
    ['1m', 60_000],
    ['1h', 3_600_000],
    ['1d', 86_400_000],
    ['1w', 604_800_000],
    ['1y', 31_536_000_000],
  ])('converts "%s" to %d ms', (input, expected) => {
    expect(toMilliseconds(input)).toBe(expected);
  });

  it('sums multiple units', () => {
    expect(toMilliseconds('1h30m')).toBe(5_400_000);
  });

  it('sums all units together', () => {
    const expected = 1 * 1000 + 1 * 60_000 + 1 * 3_600_000 + 1 * 86_400_000;

    expect(toMilliseconds('1d1h1m1s')).toBe(expected);
  });

  it('returns 0 for empty string', () => {
    expect(toMilliseconds('')).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(toMilliseconds(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(toMilliseconds(undefined)).toBe(0);
  });

  it('returns 0 for a non-matching string', () => {
    expect(toMilliseconds('invalid')).toBe(0);
  });

  it('handles numeric input (coerced to string)', () => {
    // toMilliseconds coerces to string via `${input}`, which won't match DURATION_REGEX for raw numbers
    expect(toMilliseconds(1000 as unknown as string)).toBe(0);
  });

  it('handles large composite values', () => {
    expect(toMilliseconds('1y1w1d1h1m1s1ms')).toBeGreaterThan(0);
  });
});

describe('toSeconds', () => {
  it('converts "1m" to 60 seconds', () => {
    expect(toSeconds('1m')).toBe(60);
  });

  it('floors fractional seconds', () => {
    expect(toSeconds('1500ms')).toBe(1);
  });

  it('returns 0 for empty string', () => {
    expect(toSeconds('')).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(toSeconds(null)).toBe(0);
  });

  it.each([
    ['1s', 1],
    ['1h', 3600],
    ['1d', 86400],
  ])('converts "%s" to %d seconds', (input, expected) => {
    expect(toSeconds(input)).toBe(expected);
  });
});
