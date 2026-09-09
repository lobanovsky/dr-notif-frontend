// Подписи для store.NotificationKind (dr-notif-backend/internal/store/notifications.go) —
// используется в истории уведомлений на странице ученика.
const LABELS = {
  reminder_2d: 'Напоминание за 2 дня',
  birthday: 'День рождения',
  summer_greeting: 'Летнее поздравление (3 сентября)',
  manual: 'Ручная тестовая отправка',
};

export function notificationKindLabel(kind) {
  return LABELS[kind] || kind;
}
