// Форматирование даты рождения для отображения в таблицах: бэкенд отдаёт
// "YYYY-MM-DD" (см. dateLayout в dr-notif-backend/internal/httpapi/students.go),
// в интерфейсе показываем привычное "ДД.ММ.ГГГГ".
export function formatDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate || '');
  if (!match) return isoDate || '';
  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}
