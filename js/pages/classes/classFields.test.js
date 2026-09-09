import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { classValuesToPayload } from './classFields.js';

describe('classValuesToPayload', () => {
  test('trims name and coerces telegram_chat_id to a number', () => {
    assert.deepEqual(classValuesToPayload({ name: '  5А  ', telegram_chat_id: '-1001234567890' }), {
      name: '5А',
      telegram_chat_id: -1001234567890,
    });
  });
});
