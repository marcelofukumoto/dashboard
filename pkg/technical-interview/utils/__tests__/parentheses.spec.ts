import { isValidParentheses } from '../parentheses';

describe('isValidParentheses', () => {
  it('returns true for valid parentheses', () => {
    expect(isValidParentheses('()')).toBe(true); // Example 1
    expect(isValidParentheses('{}[]()')).toBe(true); // Example 2
    expect(isValidParentheses('[()]')).toBe(true); // Example 4
    expect(isValidParentheses('({[]})')).toBe(true);
  });

  it('returns false for invalid parentheses', () => {
    expect(isValidParentheses('(]')).toBe(false); // Example 3
    expect(isValidParentheses('([)]')).toBe(false);
    expect(isValidParentheses('(((')).toBe(false);
    expect(isValidParentheses(')(')).toBe(false);
  });

  it('returns true for empty string', () => {
    expect(isValidParentheses('')).toBe(true);
  });
});
