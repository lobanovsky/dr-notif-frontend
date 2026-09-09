import { selectField, textField, dateField, checkboxField, textareaField } from '../../lib/fields.js';

export function studentFieldsFactory(classOptions) {
  return [
    selectField('class_id', 'Класс', classOptions, { required: true, placeholder: 'Выберите класс' }),
    textField('last_name', 'Фамилия', { required: true }),
    textField('first_name', 'Имя', { required: true }),
    dateField('birth_date', 'Дата рождения', { required: true }),
    checkboxField('notifications_enabled', 'Уведомления включены'),
    textareaField('comment', 'Что подарить', {
      rows: 3,
      help: 'Видно только в админке, никогда не попадает в текст Telegram-уведомления',
    }),
  ];
}

export const emptyStudentFormValues = { notifications_enabled: true };

export function studentFullName(s) {
  return `${s.last_name} ${s.first_name}`;
}

export function studentToFormValues(s) {
  return {
    class_id: String(s.class_id),
    last_name: s.last_name,
    first_name: s.first_name,
    birth_date: s.birth_date,
    notifications_enabled: s.notifications_enabled,
    comment: s.comment || '',
  };
}

export function studentValuesToPayload(values) {
  const comment = values.comment && values.comment.trim() !== '' ? values.comment.trim() : null;
  return {
    class_id: Number(values.class_id),
    last_name: values.last_name.trim(),
    first_name: values.first_name.trim(),
    birth_date: values.birth_date,
    notifications_enabled: !!values.notifications_enabled,
    comment,
  };
}
