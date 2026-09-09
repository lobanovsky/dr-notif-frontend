import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatDateTime } from './format.js';

describe('formatDate', () => {
  test('converts YYYY-MM-DD to DD.MM.YYYY', () => {
    assert.equal(formatDate('2015-04-23'), '23.04.2015');
  });

  test('passes through unparseable input unchanged', () => {
    assert.equal(formatDate('not-a-date'), 'not-a-date');
  });

  test('handles empty/undefined input', () => {
    assert.equal(formatDate(''), '');
    assert.equal(formatDate(undefined), '');
  });
});

describe('formatDateTime', () => {
  test('formats a local (no offset) ISO timestamp as DD.MM.YYYY HH:MM', () => {
    // Без "Z"/смещения — Date интерпретирует строку как локальное время, так что
    // и запись, и чтение компонентов используют одну и ту же таймзону теста.
    assert.equal(formatDateTime('2026-09-08T09:05:00'), '08.09.2026 09:05');
  });

  test('pads single-digit day/month/hour/minute', () => {
    assert.equal(formatDateTime('2026-01-02T03:04:00'), '02.01.2026 03:04');
  });

  test('handles empty input', () => {
    assert.equal(formatDateTime(''), '');
    assert.equal(formatDateTime(undefined), '');
  });

  test('passes through an unparseable timestamp unchanged', () => {
    assert.equal(formatDateTime('not-a-timestamp'), 'not-a-timestamp');
  });
});
