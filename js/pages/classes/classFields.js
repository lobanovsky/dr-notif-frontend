import { textField, numberField } from '../../lib/fields.js';

// Без min — telegram_chat_id групповых чатов отрицательный
// (вида -1001234567890).
export const classFields = [
  textField('name', 'Название класса', { required: true, placeholder: 'напр. 5А' }),
  numberField('telegram_chat_id', 'ID Telegram-чата', {
    required: true,
    help: 'ID родительского чата класса, обычно отрицательное число вида -1001234567890',
  }),
];

export function classToFormValues(row) {
  return { name: row.name, telegram_chat_id: row.telegram_chat_id };
}

export function classValuesToPayload(values) {
  return { name: values.name.trim(), telegram_chat_id: Number(values.telegram_chat_id) };
}
