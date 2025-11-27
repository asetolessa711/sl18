/**
 * Tests for utility functions used across the project
 */
import { describe, it, expect } from 'vitest';

/**
 * Simple CSV parser - minimal implementation for validation
 * Mirrors the parseCSV function from scripts/validation/personas_sync.js
 */
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];
  const header = lines.shift()!.split(',');
  return lines.map((line) => {
    const parts = line.split(',');
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      obj[h] = parts[i] !== undefined ? parts[i] : '';
    });
    return obj;
  });
}

describe('parseCSV', () => {
  it('parses simple CSV correctly', () => {
    const csv = `name,value,code
Alice,100,A
Bob,200,B`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'Alice', value: '100', code: 'A' });
    expect(result[1]).toEqual({ name: 'Bob', value: '200', code: 'B' });
  });

  it('handles empty CSV', () => {
    const csv = '';
    const result = parseCSV(csv);
    expect(result).toHaveLength(0);
  });

  it('handles header-only CSV', () => {
    const csv = 'name,value,code';
    const result = parseCSV(csv);
    expect(result).toHaveLength(0);
  });

  it('handles missing values', () => {
    const csv = `name,value,code
Alice,,A`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'Alice', value: '', code: 'A' });
  });

  it('handles extra columns gracefully', () => {
    const csv = `name,value
Alice,100,extra`;

    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'Alice', value: '100' });
  });

  it('handles Windows line endings', () => {
    const csv = 'name,value\r\nAlice,100\r\nBob,200';

    const result = parseCSV(csv);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'Alice', value: '100' });
    expect(result[1]).toEqual({ name: 'Bob', value: '200' });
  });
});

/**
 * Escape formula value for Airtable queries
 * Mirrors the escapeFormulaValue function from backend server.ts
 */
function escapeFormulaValue(value: string): string {
  return value.replace(/'/g, "''");
}

describe('escapeFormulaValue', () => {
  it('escapes single quotes', () => {
    expect(escapeFormulaValue("O'Brien")).toBe("O''Brien");
  });

  it('escapes multiple single quotes', () => {
    expect(escapeFormulaValue("It's John's")).toBe("It''s John''s");
  });

  it('returns unchanged string without quotes', () => {
    expect(escapeFormulaValue('Hello World')).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(escapeFormulaValue('')).toBe('');
  });
});

/**
 * Normalize query string values
 * Mirrors the normalizeQueryString function from backend server.ts
 */
function normalizeQueryString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

describe('normalizeQueryString', () => {
  it('returns trimmed string', () => {
    expect(normalizeQueryString('  hello  ')).toBe('hello');
  });

  it('returns undefined for empty string', () => {
    expect(normalizeQueryString('')).toBeUndefined();
  });

  it('returns undefined for whitespace-only string', () => {
    expect(normalizeQueryString('   ')).toBeUndefined();
  });

  it('returns undefined for non-string values', () => {
    expect(normalizeQueryString(null)).toBeUndefined();
    expect(normalizeQueryString(undefined)).toBeUndefined();
    expect(normalizeQueryString(123)).toBeUndefined();
    expect(normalizeQueryString({})).toBeUndefined();
  });
});
