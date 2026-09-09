import { el } from '../../lib/dom.js';
import { renderTable } from '../../ui/table.js';
import { confirmDialog } from '../../ui/confirmDialog.js';
import { toast } from '../../ui/toast.js';
import { ApiError } from '../../api/client.js';
import * as studentsApi from '../../api/students.js';
import * as classesApi from '../../api/classes.js';
import { studentFullName } from './studentFields.js';
import { formatDate } from '../../lib/format.js';
import { isSummerBirthDate, daysUntilNextBirthday } from '../../lib/birthdays.js';

export async function studentsListPage(container) {
  const [students, classes] = await Promise.all([studentsApi.list(), classesApi.list()]);
  const classById = new Map(classes.map((c) => [c.id, c]));

  let classFilter = '';
  let searchQuery = '';
  let sortBy = 'birthday';

  const tableContainer = el('div');

  function statusBadges(row) {
    const badges = [];
    if (row.is_blocked) badges.push(el('span', { class: 'badge badge-danger' }, 'Заблокирован'));
    if (!row.notifications_enabled) badges.push(el('span', { class: 'badge badge-neutral' }, 'Уведомления выкл.'));
    if (isSummerBirthDate(row.birth_date)) badges.push(el('span', { class: 'badge badge-warning' }, 'Летний ДР'));
    return badges.length > 0 ? el('span', {}, badges.map((b, i) => (i > 0 ? [' ', b] : b))) : '';
  }

  async function handleSendReminder(row) {
    const confirmed = await confirmDialog({
      title: 'Отправить тестовое уведомление?',
      message: `Во все чаты класса «${classById.get(row.class_id)?.name || '—'}» уйдёт настоящее сообщение в Telegram (помечено как тест) для проверки доставки для «${studentFullName(row)}». Продолжить?`,
      confirmLabel: 'Отправить',
    });
    if (!confirmed) return;

    try {
      const result = await studentsApi.sendReminder(row.id);
      const okCount = result.results.filter((r) => r.ok).length;
      const total = result.results.length;
      if (okCount === total) {
        toast.success(`Отправлено во все чаты (${total}): «${result.message}»`);
      } else {
        toast.error(`Доставлено в ${okCount} из ${total} чатов — проверьте настройки класса`);
      }
    } catch (err) {
      toast.error((err instanceof ApiError && err.message) || 'Не удалось отправить уведомление');
    }
  }

  async function handleToggleBlock(row) {
    const willBlock = !row.is_blocked;
    const confirmed = await confirmDialog({
      title: willBlock ? 'Заблокировать?' : 'Разблокировать?',
      message: `Точно ${willBlock ? 'заблокировать' : 'разблокировать'} «${studentFullName(row)}»? ${willBlock ? 'Уведомления о дне рождения ученика перестанут отправляться.' : ''}`,
      confirmLabel: willBlock ? 'Заблокировать' : 'Разблокировать',
      danger: willBlock,
    });
    if (!confirmed) return;

    try {
      const updated = willBlock ? await studentsApi.block(row.id) : await studentsApi.unblock(row.id);
      const index = students.findIndex((s) => s.id === row.id);
      if (index !== -1) students[index] = updated;
      toast.success(willBlock ? 'Заблокирован' : 'Разблокирован');
      renderRows();
    } catch (err) {
      toast.error((err instanceof ApiError && err.message) || 'Не удалось изменить статус');
    }
  }

  function filteredRows() {
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const matchesClass = !classFilter || String(s.class_id) === classFilter;
      const matchesSearch = !q || studentFullName(s).toLowerCase().includes(q);
      return matchesClass && matchesSearch;
    });
  }

  function sortRows(rows) {
    if (sortBy === 'name') {
      return [...rows].sort((a, b) => studentFullName(a).localeCompare(studentFullName(b), 'ru'));
    }
    return [...rows].sort((a, b) => daysUntilNextBirthday(a.birth_date) - daysUntilNextBirthday(b.birth_date));
  }

  function renderRows() {
    tableContainer.replaceChildren(
      renderTable({
        columns: [
          { key: 'name', label: 'ФИО', render: (row) => el('a', { href: `/students/${row.id}/edit` }, studentFullName(row)) },
          { key: 'class', label: 'Класс', render: (row) => classById.get(row.class_id)?.name || '—' },
          { key: 'birth_date', label: 'Дата рождения', render: (row) => formatDate(row.birth_date) },
          { key: 'status', label: 'Статус', render: statusBadges },
        ],
        rows: sortRows(filteredRows()),
        rowActions: (row) => el('span', { class: 'row-actions' }, [
          el('a', { href: `/students/${row.id}/edit`, class: 'btn btn-ghost' }, 'Изменить'),
          el('button', { type: 'button', class: 'btn btn-ghost', onclick: () => handleSendReminder(row) }, 'Отправить напоминание'),
          el('button', { type: 'button', class: 'btn btn-ghost', onclick: () => handleToggleBlock(row) }, row.is_blocked ? 'Разблокировать' : 'Заблокировать'),
        ]),
        emptyMessage: 'Ученики не найдены',
      }),
    );
  }

  const searchInput = el('input', { type: 'search', placeholder: 'Поиск по ФИО' });
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    renderRows();
  });

  const classSelect = el('select', {}, [
    el('option', { value: '' }, 'Все классы'),
    ...classes.map((c) => el('option', { value: String(c.id) }, c.name)),
  ]);
  classSelect.addEventListener('change', () => {
    classFilter = classSelect.value;
    renderRows();
  });

  const sortSelect = el('select', {}, [
    el('option', { value: 'birthday' }, 'Дата рождения'),
    el('option', { value: 'name' }, 'ФИО'),
  ]);
  sortSelect.addEventListener('change', () => {
    sortBy = sortSelect.value;
    renderRows();
  });

  const toolbar = el('div', { class: 'table-toolbar' }, [
    el('div', { class: 'field field--search' }, [el('label', {}, 'Поиск'), searchInput]),
    el('div', { class: 'field' }, [el('label', {}, 'Класс'), classSelect]),
    el('div', { class: 'field' }, [el('label', {}, 'Сортировка'), sortSelect]),
  ]);

  const header = el('div', { class: 'section-header' }, [
    el('h1', {}, 'Ученики'),
    el('a', { href: '/students/new', class: 'btn btn-primary' }, 'Добавить'),
  ]);

  container.replaceChildren(el('div', { class: 'page' }, [header, toolbar, tableContainer]));
  renderRows();
}
