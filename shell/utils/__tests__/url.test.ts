import {
  addParam,
  addParams,
  removeParam,
  parseLinkHeader,
  isMaybeSecure,
  portMatch,
  parse,
  stringify,
  QueryParams,
} from '@shell/utils/url';

describe('addParam', () => {
  it('appends param to URL without query string', () => {
    expect(addParam('https://example.com', 'foo', 'bar')).toBe('https://example.com?foo=bar');
  });

  it('appends param to URL that already has a query string', () => {
    expect(addParam('https://example.com?a=1', 'b', '2')).toBe('https://example.com?a=1&b=2');
  });

  it('encodes special characters in key and value', () => {
    const result = addParam('https://example.com', 'my key', 'hello world');

    expect(result).toBe('https://example.com?my%20key=hello%20world');
  });

  it('supports array of values', () => {
    const result = addParam('https://example.com', 'tag', ['a', 'b']);

    expect(result).toBe('https://example.com?tag=a&tag=b');
  });

  it('adds key without value when val is null', () => {
    // null cast through the string[] path
    const result = addParam('https://example.com', 'flag', [null as unknown as string]);

    expect(result).toBe('https://example.com?flag');
  });

  it('handles empty string value', () => {
    expect(addParam('https://example.com', 'key', '')).toBe('https://example.com?key=');
  });
});

describe('addParams', () => {
  it('adds multiple params to a URL', () => {
    const result = addParams('https://example.com', { a: '1', b: '2' } as QueryParams);

    expect(result).toBe('https://example.com?a=1&b=2');
  });

  it('returns URL unchanged when params is empty object', () => {
    expect(addParams('https://example.com', {} as QueryParams)).toBe('https://example.com');
  });

  it('returns URL unchanged when params is null', () => {
    expect(addParams('https://example.com', null as unknown as QueryParams)).toBe('https://example.com');
  });
});

describe('parseLinkHeader', () => {
  it('parses a single rel link', () => {
    const header = '<https://example.com/page2>; rel="next"';

    expect(parseLinkHeader(header)).toStrictEqual({ next: 'https://example.com/page2' });
  });

  it('parses multiple rel links', () => {
    const header = '<https://example.com/page2>; rel="next", <https://example.com/page5>; rel="last"';

    expect(parseLinkHeader(header)).toStrictEqual({
      next: 'https://example.com/page2',
      last: 'https://example.com/page5',
    });
  });

  it('lowercases rel values', () => {
    const header = '<https://example.com>; rel="Next"';

    expect(parseLinkHeader(header)).toStrictEqual({ next: 'https://example.com' });
  });

  it('returns empty object for empty string', () => {
    expect(parseLinkHeader('')).toStrictEqual({});
  });

  it('returns empty object for malformed header', () => {
    expect(parseLinkHeader('not-a-valid-header')).toStrictEqual({});
  });
});

describe('portMatch', () => {
  it('returns true when port exactly matches an equals value', () => {
    expect(portMatch([443], [443], [])).toBe(true);
  });

  it('returns false when no ports are given', () => {
    expect(portMatch([], [443], ['443'])).toBe(false);
  });

  it('returns true when port string ends with suffix', () => {
    // e.g. port 8443 ends with "443"
    expect(portMatch([8443], [], ['443'])).toBe(true);
  });

  it('returns false when port equals the suffix exactly (not strictly "ends with" a different string)', () => {
    // 443 ends with "443" but must be a *different* string
    expect(portMatch([443], [], ['443'])).toBe(false);
  });

  it('returns false when port does not match any rule', () => {
    expect(portMatch([80], [443], ['443'])).toBe(false);
  });

  it('returns true for first matching port in array', () => {
    expect(portMatch([80, 443], [443], [])).toBe(true);
  });
});

describe('isMaybeSecure', () => {
  it('returns true for port 443', () => {
    expect(isMaybeSecure(443, 'http')).toBe(true);
  });

  it('returns true for port 8443', () => {
    expect(isMaybeSecure(8443, 'http')).toBe(true);
  });

  it('returns true when protocol is https regardless of port', () => {
    expect(isMaybeSecure(80, 'https')).toBe(true);
  });

  it('returns true when protocol is HTTPS (case-insensitive)', () => {
    expect(isMaybeSecure(80, 'HTTPS')).toBe(true);
  });

  it('returns false for non-secure port and http protocol', () => {
    expect(isMaybeSecure(80, 'http')).toBe(false);
  });
});

describe('parse', () => {
  it('parses a simple URL', () => {
    const result = parse('https://example.com/path?foo=bar#anchor');

    expect(result.protocol).toBe('https');
    expect(result.host).toBe('example.com');
    expect(result.path).toBe('/path');
    expect(result.query).toStrictEqual({ foo: 'bar' });
    expect(result.anchor).toBe('anchor');
  });

  it('parses a URL with port', () => {
    const result = parse('http://localhost:8080/api');

    expect(result.host).toBe('localhost');
    expect(result.port).toBe('8080');
  });

  it('parses multiple query params', () => {
    const result = parse('https://example.com?a=1&b=2');

    expect(result.query).toStrictEqual({ a: '1', b: '2' });
  });

  it('parses URL with no query string into empty query object', () => {
    const result = parse('https://example.com');

    expect(result.query).toStrictEqual({});
  });
});

describe('removeParam', () => {
  it('removes an existing query param', () => {
    const result = removeParam('https://example.com?a=1&b=2', 'a');

    expect(result).not.toContain('a=1');
    expect(result).toContain('b=2');
  });

  it('is a no-op when param does not exist', () => {
    const result = removeParam('https://example.com?a=1', 'missing');

    expect(result).toContain('a=1');
  });
});

describe('stringify', () => {
  it('rebuilds a parsed URL', () => {
    const parsed = parse('https://example.com/path?foo=bar');
    const result = stringify(parsed);

    expect(result).toContain('https://');
    expect(result).toContain('example.com');
    expect(result).toContain('/path');
    expect(result).toContain('foo=bar');
  });

  it('includes anchor when present', () => {
    const parsed = parse('https://example.com/path#section');
    const result = stringify(parsed);

    expect(result).toContain('#section');
  });

  it('includes user and password when present', () => {
    const parsed = parse('https://user:pass@example.com/');
    const result = stringify(parsed);

    expect(result).toContain('user:pass@');
  });
});
