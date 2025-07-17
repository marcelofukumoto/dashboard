/**
 * Finds the minimum coins needed for a given amount using the provided coin denominations.
 * @param coins - Array of coin denominations (positive integers)
 * @param amount - Target amount (non-negative integer)
 * @returns Array of coins used to make up the amount, or null if not possible
 *
 * Examples:
 * - coinChange([1,2,5], 11) => [5,5,1]
 * - coinChange([2], 3) => null
 * - coinChange([1], 0) => []
 */
export function coinChange(coins: number[], amount: number): number[] | null {
  if (amount === 0) return [];

  const dp = Array(amount + 1).fill(Infinity);
  const parent = Array(amount + 1).fill(-1);

  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;
        parent[i] = coin;
      }
    }
  }

  if (dp[amount] === Infinity) return null;

  const result: number[] = [];
  let current = amount;

  while (current > 0) {
    const coin = parent[current];

    result.push(coin);
    current -= coin;
  }

  return result.reverse();
}
