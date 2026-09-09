// Форматирование даты рождения для отображения в таблицах: бэкенд отдаёт
// "YYYY-MM-DD" (см. dateLayout в dr-notif-backend/internal/httpapi/students.go),
// в интерфейсе показываем привычное "ДД.ММ.ГГГГ".
export function formatDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate || '');
  if (!match) return isoDate || '';
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}

const RUSSIAN_MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

// Полная дата для шапки без зависящего от браузера суффикса «г.».
export function formatRussianDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  return `${date.getDate()} ${RUSSIAN_MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
}

// Для меток времени вида sent_at/created_at — RFC3339 от бэкенда (time.RFC3339
// в Go) — показываем "ДД.ММ.ГГГГ ЧЧ:ММ" в локальном времени браузера.
export function formatDateTime(isoDateTime) {
  if (!isoDateTime) return '';
  const date = new Date(isoDateTime);
  if (Number.isNaN(date.getTime())) return isoDateTime;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
