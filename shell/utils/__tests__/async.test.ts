import { waitFor, wait } from '@shell/utils/async';

describe('async utilities', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('wait', () => {
    it('resolves after the specified number of milliseconds', async() => {
      const promise = wait(1000);
      let resolved = false;

      promise.then(() => {
        resolved = true;
      });

      // Not yet resolved before advancing time
      expect(resolved).toBe(false);

      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // flush microtasks

      expect(resolved).toBe(true);
    });

    it('does not resolve before the timeout elapses', async() => {
      const promise = wait(500);
      let resolved = false;

      promise.then(() => {
        resolved = true;
      });

      jest.advanceTimersByTime(499);
      await Promise.resolve();

      expect(resolved).toBe(false);
    });

    it('resolves immediately for 0ms timeout', async() => {
      const promise = wait(0);
      let resolved = false;

      promise.then(() => {
        resolved = true;
      });

      jest.advanceTimersByTime(0);
      await Promise.resolve();

      expect(resolved).toBe(true);
    });
  });

  describe('waitFor', () => {
    it('resolves immediately if the condition is already true', async() => {
      const testFn = jest.fn().mockReturnValue(true);

      const promise = waitFor(testFn, 'already true');

      await Promise.resolve();

      // testFn should have been called on first check
      expect(testFn).toHaveBeenCalledWith();
      await expect(promise).resolves.toBeDefined();
    });

    it('resolves when the condition becomes true on a subsequent interval', async() => {
      let callCount = 0;
      const testFn = jest.fn().mockImplementation(() => {
        callCount++;

        return callCount >= 3;
      });

      const promise = waitFor(testFn, 'condition', 5000, 500);

      // Advance past 2 intervals — condition not met yet (callCount < 3)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();

      // Advance one more interval — condition met
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();

      await expect(promise).resolves.toBeDefined();
    });

    it('rejects with a message when the timeout expires', async() => {
      const testFn = jest.fn().mockReturnValue(false);

      const promise = waitFor(testFn, 'never true', 3000, 500);

      jest.advanceTimersByTime(3000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow('Failed waiting for: never true');
    });

    it('rejects with a generic message when no msg is provided and timeout expires', async() => {
      const testFn = jest.fn().mockReturnValue(false);

      const promise = waitFor(testFn, '', 3000, 500);

      jest.advanceTimersByTime(3000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow('waitFor timed out after 3 seconds');
    });
  });
});
