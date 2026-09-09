import { el } from '../../lib/dom.js';
import { renderTable } from '../../ui/table.js';
import { toast } from '../../ui/toast.js';
import { ApiError } from '../../api/client.js';
import * as studentsApi from '../../api/students.js';
import * as classesApi from '../../api/classes.js';
import * as adminApi from '../../api/admin.js';
import { studentFullName } from '../students/studentFields.js';
import { formatDate } from '../../lib/format.js';
import { daysUntilNextBirthday, formatDaysUntil, groupByMonth, isSummerMonth } from '../../lib/birthdays.js';

function daysBadge(days) {
  const label = formatDaysUntil(days);
  if (days === 0) return el('span', { class: 'badge badge-success' }, label);
  if (days <= 2) return el('span', { class: 'badge badge-warning' }, label);
  return label;
}

function dayOfMonth(birthDateIso) {
  return Number(birthDateIso.slice(8, 10));
}

function renderMonthCard(group, classById) {
  const items = group.items.length > 0
    ? el('ul', { class: 'month-card-list' }, group.items.map((s) => el('li', { class: 'month-card-item' }, [
      el('span', { class: 'month-card-day' }, String(dayOfMonth(s.birth_date)).padStart(2, '0')),
      el('a', { href: `/students/${s.id}/edit` }, studentFullName(s)),
      el('span', { class: 'month-card-class' }, classById.get(s.class_id)?.name || '—'),
      !s.notifications_enabled ? el('span', { class: 'badge badge-neutral' }, 'Без увед.') : null,
    ])))
    : el('p', { class: 'month-card-empty' }, 'Никого');

  // Летние месяцы подсвечиваем — их дни рождения поздравляются одним махом
  // 3 сентября (см. notifySummerBatch на бэкенде), а не в реальную дату.
  const cardClass = isSummerMonth(group.month) ? 'month-card month-card--summer' : 'month-card';

  return el('div', { class: cardClass }, [
    el('div', { class: 'month-card-header' }, [
      el('h3', {}, group.label),
      el('span', { class: 'month-card-count' }, String(group.items.length)),
    ]),
    items,
  ]);
}

export async function dashboardPage(container) {
  const [students, classes] = await Promise.all([studentsApi.list(), classesApi.list()]);
  const classById = new Map(classes.map((c) => [c.id, c]));

  // Те же условия, что и в реальной рассылке (dr-notif-backend/internal/store/students.go,
  // UpcomingBirthdays) — заблокированный или отключивший уведомления ученик всё равно
  // не получит сообщение, поэтому в списке "ближайших" ему не место.
  const upcoming = students
    .filter((s) => !s.is_blocked && s.notifications_enabled)
    .map((s) => ({ ...s, daysUntil: daysUntilNextBirthday(s.birth_date) }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const upcomingTable = renderTable({
    columns: [
      { key: 'name', label: 'ФИО', render: (row) => el('a', { href: `/students/${row.id}/edit` }, studentFullName(row)) },
      { key: 'class', label: 'Класс', render: (row) => classById.get(row.class_id)?.name || '—' },
      { key: 'birth_date', label: 'Дата рождения', render: (row) => formatDate(row.birth_date) },
      { key: 'daysUntil', label: 'Когда', render: (row) => daysBadge(row.daysUntil) },
    ],
    rows: upcoming,
    emptyMessage: 'Нет учеников с включёнными уведомлениями',
  });

  // Годовой обзор, в отличие от "ближайших", показывает всех активных
  // учеников независимо от notifications_enabled — это настройка "не слать
  // в Telegram", а не признак того, что ученика больше нет; для планирования
  // подарков/праздников админу нужен весь список. Заблокированных прячем.
  const activeStudents = students.filter((s) => !s.is_blocked);
  const monthGrid = el(
    'div',
    { class: 'month-grid' },
    groupByMonth(activeStudents).map((group) => renderMonthCard(group, classById)),
  );

  const runCheckButton = el(
    'button',
    {
      type: 'button',
      class: 'btn btn-primary',
      onclick: async () => {
        runCheckButton.disabled = true;
        try {
          await adminApi.runCheck();
          toast.success('Проверка запущена, уведомления разосланы');
        } catch (err) {
          toast.error((err instanceof ApiError && err.message) || 'Не удалось запустить проверку');
        } finally {
          runCheckButton.disabled = false;
        }
      },
    },
    'Запустить проверку вручную',
  );

  const upcomingHeader = el('div', { class: 'section-header' }, [el('h2', {}, 'Ближайшие дни рождения'), runCheckButton]);

  container.replaceChildren(
    el('div', { class: 'page' }, [
      el('h1', {}, 'Рабочий стол'),
      upcomingHeader,
      upcomingTable,
      el('h2', { class: 'dashboard-section-title' }, 'Дни рождения по месяцам'),
      el('p', { class: 'field-help' }, 'Летние месяцы (июнь–август) выделены: таких учеников школа поздравляет одним сообщением 3 сентября, а не в саму дату ДР.'),
      monthGrid,
    ]),
  );
}
