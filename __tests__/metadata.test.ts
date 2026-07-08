import { describe, expect, it } from 'vitest';
import { parse } from '../src/metadata';

describe('parse', () => {
  it('空文字は空配列を返す', () => {
    expect(parse('')).toEqual([]);
  });

  it('空白のみは空配列を返す', () => {
    expect(parse('  \n  ')).toEqual([]);
  });

  it('1行の key: value をパースする', () => {
    expect(parse('Environment: production')).toEqual([
      { label: 'Environment', value: 'production' },
    ]);
  });

  it('URL 値は最初のコロンで分割され壊れない', () => {
    expect(parse('Deploy URL: https://myapp.example.com')).toEqual([
      { label: 'Deploy URL', value: 'https://myapp.example.com' },
    ]);
  });

  it('複数行をパースし空行はスキップする', () => {
    expect(parse('Deploy URL: https://myapp.example.com\n\nEnvironment: production\n')).toEqual([
      { label: 'Deploy URL', value: 'https://myapp.example.com' },
      { label: 'Environment', value: 'production' },
    ]);
  });

  it('key/value の前後空白は trim する', () => {
    expect(parse('  Environment :  production  ')).toEqual([
      { label: 'Environment', value: 'production' },
    ]);
  });

  it('コロンが無い行は Error を throw する', () => {
    expect(() => parse('invalid line')).toThrow(/Invalid metadata line/);
  });

  it('key が空の行は Error を throw する', () => {
    expect(() => parse(': value only')).toThrow(/Invalid metadata line/);
  });
});
