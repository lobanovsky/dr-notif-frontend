import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { daysUntilNextBirthday, formatDaysUntil } from './birthdays.js';

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

describe('daysUntilNextBirthday', () => {
  test('returns 0 when birthday is today', () => {
    const today = new Date(2026, 8, 8); // 8 сентября 2026 (месяцы в Date с 0)
    assert.equal(daysUntilNextBirthday('2010-09-08', today), 0);
  });

  test('returns the day count for a birthday later this year', () => {
    const today = new Date(2026, 8, 8);
    const birthday = new Date(2026, 8, 10);
    assert.equal(daysUntilNextBirthday('2012-09-10', today), daysBetween(today, birthday));
  });

  test('wraps to next year once this year\'s date has passed', () => {
    const today = new Date(2026, 8, 8);
    const nextOccurrence = new Date(2027, 0, 15);
    assert.equal(daysUntilNextBirthday('2011-01-15', today), daysBetween(today, nextOccurrence));
  });

  test('Feb 29 birthday counts as Mar 1 in a non-leap year', () => {
    const today = new Date(2026, 1, 25); // 2026 не високосный
    const marchFirst = new Date(2026, 2, 1);
    assert.equal(daysUntilNextBirthday('2000-02-29', today), daysBetween(today, marchFirst));
  });

  test('Feb 29 birthday stays on Feb 29 in a leap year', () => {
    const today = new Date(2028, 1, 25); // 2028 високосный
    const feb29 = new Date(2028, 1, 29);
    assert.equal(daysUntilNextBirthday('2000-02-29', today), daysBetween(today, feb29));
  });

  test('Feb 29 wrap into a non-leap next year lands on Mar 1', () => {
    const today = new Date(2028, 2, 5); // после 29 февраля 2028
    const marchFirst2029 = new Date(2029, 2, 1); // 2029 не високосный
    assert.equal(daysUntilNextBirthday('2000-02-29', today), daysBetween(today, marchFirst2029));
  });

  test('returns null for an unparseable date', () => {
    assert.equal(daysUntilNextBirthday('not-a-date', new Date(2026, 8, 8)), null);
  });
});

describe('formatDaysUntil', () => {
  test('special-cases today and tomorrow', () => {
    assert.equal(formatDaysUntil(0), 'сегодня');
    assert.equal(formatDaysUntil(1), 'завтра');
  });

  test('pluralizes "день/дня/дней" correctly', () => {
    assert.equal(formatDaysUntil(2), 'через 2 дня');
    assert.equal(formatDaysUntil(5), 'через 5 дней');
    assert.equal(formatDaysUntil(21), 'через 21 день');
    assert.equal(formatDaysUntil(11), 'через 11 дней');
  });
});
