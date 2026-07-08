import { describe, expect, it } from 'vitest';
import { parse } from '../src/status';

describe('parse', () => {
  it.each(['success', 'failure', 'cancelled'] as const)('%s をそのまま返す', (status) => {
    expect(parse(status)).toBe(status);
  });

  it.each([
    ['Success', 'success'],
    ['FAILURE', 'failure'],
    ['Cancelled', 'cancelled'],
  ])('大文字混じり %s を小文字化して返す', (input, expected) => {
    expect(parse(input)).toBe(expected);
  });

  it('不正値は Invalid parameter を含む Error を throw する', () => {
    expect(() => parse('skipped')).toThrow(/Invalid parameter/);
  });
});
