import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { daysUntilNextBirthday, formatDaysUntil, groupByMonth, MONTH_NAMES, isSummerMonth, isSummerBirthDate, getSeason, rotateToStartMonth } from './birthdays.js';

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

describe('groupByMonth', () => {
  test('returns 12 groups in calendar order, even when empty', () => {
    const groups = groupByMonth([]);
    assert.equal(groups.length, 12);
    assert.deepEqual(groups.map((g) => g.month), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    assert.deepEqual(groups.map((g) => g.label), MONTH_NAMES);
    assert.ok(groups.every((g) => g.items.length === 0));
  });

  test('places each item into its birth month', () => {
    const students = [
      { name: 'Аня', birth_date: '2015-09-08' },
      { name: 'Боря', birth_date: '2014-01-20' },
    ];
    const groups = groupByMonth(students);
    assert.deepEqual(groups[8].items.map((s) => s.name), ['Аня']); // сентябрь — индекс 8
    assert.deepEqual(groups[0].items.map((s) => s.name), ['Боря']); // январь — индекс 0
  });

  test('sorts items within a month by day ascending', () => {
    const students = [
      { name: 'Поздний', birth_date: '2015-03-28' },
      { name: 'Ранний', birth_date: '2014-03-02' },
      { name: 'Средний', birth_date: '2016-03-15' },
    ];
    const groups = groupByMonth(students);
    assert.deepEqual(groups[2].items.map((s) => s.name), ['Ранний', 'Средний', 'Поздний']);
  });

  test('skips items with an unparseable date', () => {
    const students = [{ name: 'Плохая дата', birth_date: 'not-a-date' }];
    const groups = groupByMonth(students);
    assert.ok(groups.every((g) => g.items.length === 0));
  });

  test('accepts a custom getBirthDate accessor', () => {
    const students = [{ name: 'Аня', dob: '2015-07-04' }];
    const groups = groupByMonth(students, (s) => s.dob);
    assert.deepEqual(groups[6].items.map((s) => s.name), ['Аня']); // июль — индекс 6
  });
});

describe('isSummerMonth', () => {
  test('июнь, июль, август — летние', () => {
    assert.equal(isSummerMonth(6), true);
    assert.equal(isSummerMonth(7), true);
    assert.equal(isSummerMonth(8), true);
  });

  test('остальные месяцы — нет', () => {
    assert.equal(isSummerMonth(5), false);
    assert.equal(isSummerMonth(9), false);
    assert.equal(isSummerMonth(1), false);
    assert.equal(isSummerMonth(12), false);
  });
});

describe('isSummerBirthDate', () => {
  test('распознаёт летнюю дату рождения', () => {
    assert.equal(isSummerBirthDate('2016-07-19'), true);
  });

  test('нелетняя дата — false', () => {
    assert.equal(isSummerBirthDate('2016-09-19'), false);
  });

  test('нераспознанная дата — false', () => {
    assert.equal(isSummerBirthDate('not-a-date'), false);
    assert.equal(isSummerBirthDate(''), false);
  });
});

describe('getSeason', () => {
  test('зима: декабрь, январь, февраль', () => {
    assert.equal(getSeason(12), 'winter');
    assert.equal(getSeason(1), 'winter');
    assert.equal(getSeason(2), 'winter');
  });

  test('весна: март-май', () => {
    assert.equal(getSeason(3), 'spring');
    assert.equal(getSeason(4), 'spring');
    assert.equal(getSeason(5), 'spring');
  });

  test('лето: июнь-август', () => {
    assert.equal(getSeason(6), 'summer');
    assert.equal(getSeason(7), 'summer');
    assert.equal(getSeason(8), 'summer');
  });

  test('осень: сентябрь-ноябрь', () => {
    assert.equal(getSeason(9), 'autumn');
    assert.equal(getSeason(10), 'autumn');
    assert.equal(getSeason(11), 'autumn');
  });
});

describe('rotateToStartMonth', () => {
  const groups = groupByMonth([]); // 12 пустых групп в порядке Январь..Декабрь

  test('текущий месяц становится первым', () => {
    const rotated = rotateToStartMonth(groups, 9);
    assert.deepEqual(rotated.map((g) => g.month), [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test('startMonth = 1 не меняет порядок', () => {
    const rotated = rotateToStartMonth(groups, 1);
    assert.deepEqual(rotated.map((g) => g.month), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  test('декабрь как первый месяц оборачивает конец года в начало', () => {
    const rotated = rotateToStartMonth(groups, 12);
    assert.deepEqual(rotated.map((g) => g.month), [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
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
