import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { studentValuesToPayload, studentFullName } from './studentFields.js';

describe('studentValuesToPayload', () => {
  test('coerces class_id to a number and trims names', () => {
    const payload = studentValuesToPayload({
      class_id: '3',
      last_name: ' Иванова ',
      first_name: ' Аня ',
      birth_date: '2015-04-23',
      notifications_enabled: true,
      comment: '',
    });
    assert.deepEqual(payload, {
      class_id: 3,
      last_name: 'Иванова',
      first_name: 'Аня',
      birth_date: '2015-04-23',
      notifications_enabled: true,
      comment: null,
    });
  });

  test('empty/whitespace-only comment becomes null, non-empty comment is trimmed', () => {
    assert.equal(
      studentValuesToPayload({ class_id: '1', last_name: 'A', first_name: 'B', birth_date: '2015-01-01', comment: '   ' }).comment,
      null,
    );
    assert.equal(
      studentValuesToPayload({ class_id: '1', last_name: 'A', first_name: 'B', birth_date: '2015-01-01', comment: ' LEGO ' }).comment,
      'LEGO',
    );
  });

  test('missing notifications_enabled coerces to false (checkbox default handled by emptyStudentFormValues, not here)', () => {
    assert.equal(
      studentValuesToPayload({ class_id: '1', last_name: 'A', first_name: 'B', birth_date: '2015-01-01' }).notifications_enabled,
      false,
    );
  });
});

describe('studentFullName', () => {
  test('joins last and first name', () => {
    assert.equal(studentFullName({ last_name: 'Иванова', first_name: 'Аня' }), 'Иванова Аня');
  });
});
