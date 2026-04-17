/**
 * Shared test utilities for validator tests.
 */

export function mockT(key: string, args?: Record<string, unknown>): string {
  if (args && Object.keys(args).length > 0) {
    return `${ key }:${ JSON.stringify(args) }`;
  }

  return key;
}

export function createMockGetters(): Record<string, unknown> {
  return { 'i18n/t': mockT };
}

export function createErrors(): string[] {
  return [];
}
