import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { notificationKindLabel } from './notificationKinds.js';

describe('notificationKindLabel', () => {
  test('возвращает русскую подпись для известных видов', () => {
    assert.equal(notificationKindLabel('reminder_2d'), 'Напоминание за 2 дня');
    assert.equal(notificationKindLabel('birthday'), 'День рождения');
    assert.equal(notificationKindLabel('summer_greeting'), 'Летнее поздравление (3 сентября)');
    assert.equal(notificationKindLabel('manual'), 'Ручная тестовая отправка');
  });

  test('для неизвестного вида возвращает исходную строку', () => {
    assert.equal(notificationKindLabel('something_new'), 'something_new');
  });
});
