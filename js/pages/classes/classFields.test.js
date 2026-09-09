import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { classValuesToPayload, classToFormValues } from './classFields.js';

describe('classValuesToPayload', () => {
  test('trims name and parses one chat ID per line', () => {
    assert.deepEqual(
      classValuesToPayload({ name: '  5А  ', telegram_chat_ids: '-1001234567890\n-1009876543210' }),
      { name: '5А', telegram_chat_ids: [-1001234567890, -1009876543210] },
    );
  });

  test('ignores blank lines', () => {
    assert.deepEqual(
      classValuesToPayload({ name: '5А', telegram_chat_ids: '-100\n\n  \n-200\n' }),
      { name: '5А', telegram_chat_ids: [-100, -200] },
    );
  });

  test('empty textarea produces an empty list (class not configured yet)', () => {
    assert.deepEqual(classValuesToPayload({ name: '5А', telegram_chat_ids: '' }), { name: '5А', telegram_chat_ids: [] });
  });

  test('throws a readable error for a non-numeric line', () => {
    assert.throws(
      () => classValuesToPayload({ name: '5А', telegram_chat_ids: '-100\nabc' }),
      /«abc»/,
    );
  });

  test('throws for a literal 0 (never a valid chat id)', () => {
    assert.throws(() => classValuesToPayload({ name: '5А', telegram_chat_ids: '0' }));
  });
});

describe('classToFormValues', () => {
  test('joins chat ids with newlines', () => {
    assert.deepEqual(classToFormValues({ name: '5А', telegram_chat_ids: [-100, -200] }), {
      name: '5А',
      telegram_chat_ids: '-100\n-200',
    });
  });

  test('handles a class with no chats configured', () => {
    assert.deepEqual(classToFormValues({ name: '5А', telegram_chat_ids: [] }), { name: '5А', telegram_chat_ids: '' });
  });
});
