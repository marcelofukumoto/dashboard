import { coinChange } from '../coinchange';

describe('coinChange', () => {
  it('returns correct coins for amount', () => {
    expect(coinChange([1, 2, 5], 11)).toStrictEqual([5, 5, 1]); // Example 1
    expect(coinChange([2], 3)).toBeNull(); // Example 2
    expect(coinChange([1], 0)).toStrictEqual([]); // Example 3
    expect(coinChange([1, 2, 5], 0)).toStrictEqual([]);
    expect(coinChange([1], 2)).toStrictEqual([1, 1]);
  });

  it('returns null for impossible cases', () => {
    expect(coinChange([], 5)).toBeNull();
    expect(coinChange([2, 4], 3)).toBeNull();
  });
});
