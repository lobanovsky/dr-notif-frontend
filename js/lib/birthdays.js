// Дублирует правило "29 февраля в невисокосный год считается 1 марта" из
// store.StudentStore.UpcomingBirthdays (dr-notif-backend/internal/store/students.go),
// но для другой задачи: там проверяют совпадение с сегодняшней датой, здесь
// считают количество дней до ближайшего наступления дня рождения.

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function birthdayOccursOn(month, day, year) {
  if (month === 2 && day === 29 && !isLeapYear(year)) {
    return new Date(year, 2, 1); // 1 марта
  }
  return new Date(year, month - 1, day);
}

// birthDateIso — "YYYY-MM-DD" (формат, в котором dr-notif-backend отдаёт birth_date).
// Возвращает целое число дней до ближайшего наступления дня рождения (0 — сегодня),
// или null, если birthDateIso не распознан.
export function daysUntilNextBirthday(birthDateIso, today = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDateIso || '');
  if (!match) return null;

  const month = Number(match[2]);
  const day = Number(match[3]);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  let candidate = birthdayOccursOn(month, day, start.getFullYear());
  if (candidate.getTime() < start.getTime()) {
    candidate = birthdayOccursOn(month, day, start.getFullYear() + 1);
  }
  return Math.round((candidate.getTime() - start.getTime()) / 86400000);
}

export function formatDaysUntil(days) {
  if (days === 0) return 'сегодня';
  if (days === 1) return 'завтра';
  return `через ${days} ${pluralizeDays(days)}`;
}

function pluralizeDays(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'дня';
  return 'дней';
}

export const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

// Раскладывает произвольные записи с датой рождения ("YYYY-MM-DD") по 12
// месяцам в календарном порядке (Январь → Декабрь), внутри месяца — по числу
// по возрастанию. getBirthDate достаёт ISO-дату из элемента (по умолчанию —
// item.birth_date). Разбор даты идёт напрямую из строки, а не через Date —
// не зависит от часового пояса и не ломается на самой ранней/поздней дате.
export function groupByMonth(items, getBirthDate = (item) => item.birth_date) {
  const groups = MONTH_NAMES.map((label, i) => ({ month: i + 1, label, entries: [] }));

  for (const item of items) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(getBirthDate(item) || '');
    if (!match) continue;
    const month = Number(match[2]);
    const day = Number(match[3]);
    groups[month - 1].entries.push({ item, day });
  }

  for (const group of groups) {
    group.entries.sort((a, b) => a.day - b.day);
  }

  return groups.map((g) => ({ month: g.month, label: g.label, items: g.entries.map((e) => e.item) }));
}

// Сезон по номеру месяца (1-12) — для декоративной раскраски карточек месяца
// на «Обзоре». Зима охватывает границу года (дек-янв-фев).
export function getSeason(month) {
  if (month === 12 || month === 1 || month === 2) return 'winter';
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  return 'autumn';
}

// Летние месяцы (июнь–август) — школа поздравляет таких учеников отдельно
// 3 сентября (см. dr-notif-backend/internal/scheduler, notifySummerBatch),
// т.к. в реальную дату ДР они на каникулах. month — число 1-12.
export function isSummerMonth(month) {
  return getSeason(month) === 'summer';
}

// Переставляет уже сгруппированные по месяцам записи (см. groupByMonth) так,
// чтобы первым шёл startMonth (1-12), а не всегда январь — используется на
// «Обзоре», чтобы первой показывалась карточка текущего месяца.
export function rotateToStartMonth(groups, startMonth) {
  const startIndex = groups.findIndex((g) => g.month === startMonth);
  if (startIndex <= 0) return groups;
  return [...groups.slice(startIndex), ...groups.slice(0, startIndex)];
}

// То же самое, но принимает дату рождения напрямую ("YYYY-MM-DD"), как её
// отдаёт API — удобно там, где нет отдельно посчитанного номера месяца.
export function isSummerBirthDate(birthDateIso) {
  const match = /^\d{4}-(\d{2})-\d{2}/.exec(birthDateIso || '');
  return match ? isSummerMonth(Number(match[1])) : false;
}
