import {
  suppressContextMenu,
  isAlternate,
  isMore,
  isRange,
  alternateKey,
  alternateLabel,
  moreKey,
  moreLabel,
  rangeKey,
  rangeLabel,
} from '@shell/utils/platform';

describe('suppressContextMenu', () => {
  it('returns true when ctrlKey is pressed and button is 2', () => {
    expect(suppressContextMenu({ ctrlKey: true, button: 2 } as MouseEvent)).toBe(true);
  });

  it('returns false when ctrlKey is false', () => {
    expect(suppressContextMenu({ ctrlKey: false, button: 2 } as MouseEvent)).toBe(false);
  });

  it('returns false when button is not 2', () => {
    expect(suppressContextMenu({ ctrlKey: true, button: 0 } as MouseEvent)).toBe(false);
  });

  it('returns false when neither ctrlKey nor button 2', () => {
    expect(suppressContextMenu({ ctrlKey: false, button: 0 } as MouseEvent)).toBe(false);
  });
});

// version() uses a module-level `userAgent` constant captured at import time,
// so re-importing after overriding navigator.userAgent is required.
describe('version', () => {
  const originalUserAgent = window.navigator.userAgent;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value:        originalUserAgent,
      configurable: true,
      writable:     true,
    });
  });

  const setUserAgent = (ua: string) => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value:        ua,
      configurable: true,
      writable:     true,
    });
  };

  it('returns parsed version when Version/ is present with leading whitespace', async() => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Version/14.0 Mobile/15E148 Safari/604.1');
    const { version: ver } = await import('@shell/utils/platform');

    expect(ver()).toStrictEqual(14);
  });

  it('returns a float for minor versions', async() => {
    setUserAgent('AppleWebKit/605.1.15 Version/13.1.2 Safari/605.1.15');
    const { version: ver } = await import('@shell/utils/platform');

    expect(ver()).toStrictEqual(13.1);
  });

  it('returns null when Version/ is absent', async() => {
    setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/91.0.4472.114 Safari/537.36');
    const { version: ver } = await import('@shell/utils/platform');

    expect(ver()).toBeNull();
  });

  it('returns null for empty userAgent', async() => {
    setUserAgent('');
    const { version: ver } = await import('@shell/utils/platform');

    expect(ver()).toBeNull();
  });
});

describe('isAlternate', () => {
  it('returns true when the alternateKey is set on the event', () => {
    expect(isAlternate({ [alternateKey]: true } as unknown as KeyboardEvent)).toBe(true);
  });

  it('returns false when the alternateKey is not set on the event', () => {
    expect(isAlternate({ [alternateKey]: false } as unknown as KeyboardEvent)).toBe(false);
  });
});

describe('isMore', () => {
  it('returns true when the moreKey is set on the event', () => {
    expect(isMore({ [moreKey]: true } as unknown as KeyboardEvent)).toBe(true);
  });

  it('returns false when the moreKey is not set on the event', () => {
    expect(isMore({ [moreKey]: false } as unknown as KeyboardEvent)).toBe(false);
  });
});

describe('isRange', () => {
  it('returns true when the rangeKey is set on the event', () => {
    expect(isRange({ [rangeKey]: true } as unknown as KeyboardEvent)).toBe(true);
  });

  it('returns false when the rangeKey is not set on the event', () => {
    expect(isRange({ [rangeKey]: false } as unknown as KeyboardEvent)).toBe(false);
  });
});

describe('key labels', () => {
  it('moreKey equals alternateKey', () => {
    expect(moreKey).toStrictEqual(alternateKey);
  });

  it('moreLabel equals alternateLabel', () => {
    expect(moreLabel).toStrictEqual(alternateLabel);
  });

  it('rangeKey is shiftKey', () => {
    expect(rangeKey).toStrictEqual('shiftKey');
  });

  it('rangeLabel is Shift', () => {
    expect(rangeLabel).toStrictEqual('Shift');
  });
});
