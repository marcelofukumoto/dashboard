import { swapObject } from '../jsonswap';

describe('swapObject', () => {
  it('swaps primitive keys and values', () => {
    expect(swapObject({ a: 1, b: 2 })).toStrictEqual({ 1: 'a', 2: 'b' });
    expect(swapObject({ a: 'x', b: true })).toStrictEqual({ x: 'a', true: 'b' });
  });

  it('handles nested objects', () => {
    expect(swapObject({ a: { b: true } })).toStrictEqual({ a: { true: 'b' } });
    expect(swapObject({ a: { b: 1, c: 'z' } })).toStrictEqual({ a: { 1: 'b', z: 'c' } });
  });

  it('does not swap arrays or null', () => {
    expect(swapObject([1, 2, 3])).toStrictEqual([1, 2, 3]);
    expect(swapObject(null)).toBeNull();
  });
});
