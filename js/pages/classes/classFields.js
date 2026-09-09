import { textField, textareaField } from '../../lib/fields.js';

// telegram_chat_ids вводится по одному ID на строку — ui/form.js не умеет
// multi-value поля, а ради единственного такого поля во всём приложении
// заводить это в общий движок форм не стоит (см. classesListPage.js, где
// строки парсятся/валидируются вручную перед отправкой).
export const classFields = [
  textField('name', 'Название класса', { required: true, placeholder: 'напр. 5А' }),
  textareaField('telegram_chat_ids', 'ID Telegram-чатов', {
    rows: 3,
    help: 'По одному ID на строку. Обычно отрицательное число вида -1001234567890. Можно оставить пустым, пока чат не создан.',
  }),
];

export function classToFormValues(row) {
  return { name: row.name, telegram_chat_ids: (row.telegram_chat_ids || []).join('\n') };
}

// Бросает Error с понятным текстом, если хоть одна строка — не число;
// вызывающий код (classesListPage.js) ловит её и показывает как ошибку поля,
// не отправляя запрос с заведомо невалидными данными.
export function classValuesToPayload(values) {
  const lines = (values.telegram_chat_ids || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const ids = lines.map((line) => {
    const id = Number(line);
    if (!Number.isInteger(id) || id === 0) {
      throw new Error(`«${line}» — не похоже на ID чата (целое число, не 0)`);
    }
    return id;
  });

  return { name: values.name.trim(), telegram_chat_ids: ids };
}
