import { el } from '../lib/dom.js';

// Простая stateless-таблица: страницы сами держат массив данных и вызывают
// renderTable() заново при его изменении. Без пагинации/сортировки — у
// dr-notif-backend нет limit/offset/sort в GET-эндпоинтах, а объём данных
// (ученики одной школы) не требует их эмулировать на клиенте.
//
// columns: [{key, label, render?(row) -> Node|string}]
export function renderTable({ columns, rows, rowActions, getRowKey = (row) => row.id, emptyMessage = 'Ничего не найдено' }) {
  if (!rows || rows.length === 0) {
    return el('div', { class: 'data-table-wrap' }, el('div', { class: 'table-status' }, emptyMessage));
  }

  const thead = el('thead', {}, el('tr', {}, [
    ...columns.map((c) => el('th', {}, c.label)),
    rowActions ? el('th', { class: 'col-actions' }) : null,
  ]));
  const tbody = el('tbody', {}, rows.map((row) => el('tr', { 'data-row-key': String(getRowKey(row)) }, [
    ...columns.map((c) => el('td', {}, c.render ? c.render(row) : row[c.key])),
    rowActions ? el('td', { class: 'col-actions' }, rowActions(row)) : null,
  ])));

  return el('div', { class: 'data-table-wrap' }, el('table', { class: 'data-table' }, [thead, tbody]));
}
