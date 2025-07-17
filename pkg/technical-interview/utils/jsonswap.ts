/**
 * Swaps primitive keys and values in a JSON object.
 * @param obj - The input object to swap
 * @returns A new object with primitive keys and values swapped
 *
 * Examples:
 * - swapObject({ a: 1, b: 2 }) => { '1': 'a', '2': 'b' }
 * - swapObject({ a: { b: true } }) => { a: { 'true': 'b' } }
 */
export function swapObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const result: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[String(value)] = key;
    } else {
      result[key] = swapObject(value);
    }
  }

  return result;
}
