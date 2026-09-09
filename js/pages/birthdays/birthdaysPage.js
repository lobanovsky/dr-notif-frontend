import { el } from '../../lib/dom.js';
import { renderTable } from '../../ui/table.js';
import { toast } from '../../ui/toast.js';
import { ApiError } from '../../api/client.js';
import * as studentsApi from '../../api/students.js';
import * as classesApi from '../../api/classes.js';
import * as adminApi from '../../api/admin.js';
import { studentFullName } from '../students/studentFields.js';
import { formatDate } from '../../lib/format.js';
import { daysUntilNextBirthday, formatDaysUntil } from '../../lib/birthdays.js';

function daysBadge(days) {
  const label = formatDaysUntil(days);
  if (days === 0) return el('span', { class: 'badge badge-success' }, label);
  if (days <= 2) return el('span', { class: 'badge badge-warning' }, label);
  return label;
}

export async function birthdaysPage(container) {
  const [students, classes] = await Promise.all([studentsApi.list(), classesApi.list()]);
  const classById = new Map(classes.map((c) => [c.id, c]));

  // Те же условия, что и в реальной рассылке (dr-notif-backend/internal/store/students.go,
  // UpcomingBirthdays) — заблокированный или отключивший уведомления ученик всё равно
  // не получит сообщение, поэтому в списке "ближайших" ему не место.
  const upcoming = students
    .filter((s) => !s.is_blocked && s.notifications_enabled)
    .map((s) => ({ ...s, daysUntil: daysUntilNextBirthday(s.birth_date) }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const tableContainer = el(
    'div',
    {},
    renderTable({
      columns: [
        { key: 'name', label: 'ФИО', render: (row) => el('a', { href: `/students/${row.id}/edit` }, studentFullName(row)) },
        { key: 'class', label: 'Класс', render: (row) => classById.get(row.class_id)?.name || '—' },
        { key: 'birth_date', label: 'Дата рождения', render: (row) => formatDate(row.birth_date) },
        { key: 'daysUntil', label: 'Когда', render: (row) => daysBadge(row.daysUntil) },
      ],
      rows: upcoming,
      emptyMessage: 'Нет учеников с включёнными уведомлениями',
    }),
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

  const header = el('div', { class: 'section-header' }, [el('h1', {}, 'Ближайшие дни рождения'), runCheckButton]);

  container.replaceChildren(el('div', { class: 'page' }, [header, tableContainer]));
}
