import {
  allHash, allHashSettled, eachLimit, deferred, setPromiseResult,
} from '../promise';

describe('allHash', () => {
  describe('resolves hash of promises', () => {
    it('resolves empty hash to empty object', async() => {
      const result = await allHash({});

      expect(result).toStrictEqual({});
    });

    it('resolves single promise with correct key', async() => {
      const result = await allHash({ foo: Promise.resolve(42) });

      expect(result).toStrictEqual({ foo: 42 });
    });

    it('resolves multiple promises preserving all keys', async() => {
      const result = await allHash({
        a: Promise.resolve(1),
        b: Promise.resolve('hello'),
        c: Promise.resolve(true),
      });

      expect(result).toStrictEqual({
        a: 1, b: 'hello', c: true
      });
    });

    it('rejects when any promise rejects', async() => {
      await expect(allHash({
        a: Promise.resolve(1),
        b: Promise.reject(new Error('fail')),
      })).rejects.toThrow('fail');
    });

    it('preserves key order in result', async() => {
      const hash = {
        first:  Promise.resolve('one'),
        second: Promise.resolve('two'),
        third:  Promise.resolve('three'),
      };

      const result = await allHash(hash);

      expect(result).toStrictEqual({
        first: 'one', second: 'two', third: 'three'
      });
    });

    it('resolves with non-promise values (synchronous values wrapped)', async() => {
      const result = await allHash({ x: Promise.resolve(null) });

      expect(result).toStrictEqual({ x: null });
    });
  });
});

describe('allHashSettled', () => {
  describe('settles all promises regardless of outcome', () => {
    it('settles empty hash to empty object', async() => {
      const result = await allHashSettled({});

      expect(result).toStrictEqual({});
    });

    it('returns fulfilled result for resolved promise', async() => {
      const result = await allHashSettled({ foo: Promise.resolve(99) });

      expect(result).toStrictEqual({ foo: { status: 'fulfilled', value: 99 } });
    });

    it('returns rejected result for rejected promise', async() => {
      const error = new Error('oops');
      const result = await allHashSettled({ bar: Promise.reject(error) });

      expect(result).toStrictEqual({ bar: { status: 'rejected', reason: error } });
    });

    it('handles mix of resolved and rejected promises', async() => {
      const error = new Error('bad');
      const result = await allHashSettled({
        ok:  Promise.resolve('good'),
        err: Promise.reject(error),
      });

      expect(result).toStrictEqual({
        ok:  { status: 'fulfilled', value: 'good' },
        err: { status: 'rejected', reason: error },
      });
    });

    it('does not reject even when all promises reject', async() => {
      const e1 = new Error('e1');
      const e2 = new Error('e2');

      await expect(allHashSettled({
        a: Promise.reject(e1),
        b: Promise.reject(e2),
      })).resolves.toStrictEqual({
        a: { status: 'rejected', reason: e1 },
        b: { status: 'rejected', reason: e2 },
      });
    });
  });
});

describe('eachLimit', () => {
  describe('processes all items', () => {
    it('processes empty array and resolves to empty array', async() => {
      const result = await eachLimit([], 2, async(item: number) => item * 2);

      expect(result).toStrictEqual([]);
    });

    it('processes all items and returns results in order', async() => {
      const result = await eachLimit([1, 2, 3], 2, async(item: number) => item * 10);

      expect(result).toStrictEqual([10, 20, 30]);
    });

    it('works with limit of 1 (sequential processing)', async() => {
      const order: number[] = [];
      const items = [1, 2, 3, 4];

      await eachLimit(items, 1, async(item: number) => {
        order.push(item);

        return item;
      });

      expect(order).toStrictEqual([1, 2, 3, 4]);
    });

    it('works with limit larger than items length', async() => {
      const result = await eachLimit([10, 20], 100, async(item: number) => item + 1);

      expect(result).toStrictEqual([11, 21]);
    });

    it('preserves result index order regardless of completion order', async() => {
      const delays = [30, 10, 20];

      const result = await eachLimit(delays, 3, (delay: number) => {
        return new Promise<number>((resolve) => setTimeout(() => resolve(delay), delay));
      });

      expect(result).toStrictEqual([30, 10, 20]);
    });
  });

  describe('respects concurrency limit', () => {
    it('runs at most `limit` concurrent tasks', async() => {
      let concurrent = 0;
      let maxConcurrent = 0;
      const limit = 2;

      await eachLimit([1, 2, 3, 4, 5], limit, async(item: number) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((resolve) => setTimeout(resolve, 10));
        concurrent--;

        return item;
      });

      expect(maxConcurrent).toBeLessThanOrEqual(limit);
    });
  });

  describe('error handling', () => {
    it('rejects when iterator rejects', async() => {
      const error = new Error('iterator failed');
      const mockIterator = jest.fn()
        .mockResolvedValueOnce(1)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(3);

      await expect(eachLimit([1, 2, 3], 2, mockIterator)).rejects.toBe(error);
    });

    it('stops processing after first failure', async() => {
      const limit = 1;
      const error = new Error('stop');
      const mockIterator = jest.fn()
        .mockResolvedValueOnce(1)
        .mockRejectedValueOnce(error);

      await expect(eachLimit([1, 2, 3], limit, mockIterator)).rejects.toBe(error);

      // with limit=1 (sequential), the 3rd item is never processed after 2nd fails
      expect(mockIterator).not.toHaveBeenCalledWith(3, 2);
    });
  });
});

describe('deferred', () => {
  describe('creates deferred promise', () => {
    it('returns object with promise, resolve, and reject', () => {
      const d = deferred('test');

      expect(d.promise).toBeInstanceOf(Promise);
      expect(typeof d.resolve).toBe('function');
      expect(typeof d.reject).toBe('function');
    });

    it('resolves the promise when resolve is called', async() => {
      const d = deferred('test');

      d.resolve('success');
      await expect(d.promise).resolves.toBe('success');
    });

    it('rejects the promise when reject is called', async() => {
      const d = deferred('test');
      const error = new Error('failure');

      d.reject(error);
      await expect(d.promise).rejects.toBe(error);
    });

    it('resolves with undefined when called with no argument', async() => {
      const d = deferred('test');

      d.resolve(undefined);
      await expect(d.promise).resolves.toBeUndefined();
    });
  });
});

describe('setPromiseResult', () => {
  describe('applies promise result to object property', () => {
    it('sets resolved value on object key', async() => {
      const obj: Record<string, unknown> = {};

      setPromiseResult(Promise.resolve('value'), obj, 'key', 'test operation');

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(obj.key).toBe('value');
    });

    it('does not throw when promise rejects (swallows error)', async() => {
      const obj: Record<string, unknown> = {};
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      setPromiseResult(Promise.reject(new Error('fail')), obj, 'key', 'failing op');

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(obj.key).toBeUndefined();
      spy.mockRestore();
    });

    it('emits console.warn on rejection', async() => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const obj: Record<string, unknown> = {};

      setPromiseResult(Promise.reject(new Error('warn me')), obj, 'result', 'label');

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(warnSpy).toHaveBeenCalledWith('Failed to: ', 'label', expect.any(Error));
      warnSpy.mockRestore();
    });
  });
});
