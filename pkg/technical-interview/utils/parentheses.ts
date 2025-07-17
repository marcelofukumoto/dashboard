/**
 * Validates if parentheses are closed in the correct order
 * @param s - String containing only characters `(`, `)`, `[`, `]`, `{`, `}`
 * @returns true if all parentheses are properly closed, false otherwise
 *
 * Examples:
 * - Input: `()` -> Output: true
 * - Input: `{}[]()` -> Output: true
 * - Input: `(]` -> Output: false
 * - Input: `[()]` -> Output: true
 */
export function isValidParentheses(s: string): boolean {
  const stack: string[] = [];
  const mapping: Record<string, string> = {
    ')': '(',
    '}': '{',
    ']': '['
  };

  for (const char of s) {
    if (char in mapping) {
      if (stack.length === 0 || stack.pop() !== mapping[char]) {
        return false;
      }
    } else if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
    }
    // Ignore other characters
  }

  return stack.length === 0;
}
