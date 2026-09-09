import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from './format.js';

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
