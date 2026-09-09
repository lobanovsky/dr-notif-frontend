import { el } from '../../lib/dom.js';
import { renderTable } from '../../ui/table.js';
import { createForm } from '../../ui/form.js';
import { openModal } from '../../ui/modal.js';
import { toast } from '../../ui/toast.js';
import { applyFormApiError } from '../../lib/apiErrors.js';
import * as classesApi from '../../api/classes.js';
import { classFields, classToFormValues, classValuesToPayload } from './classFields.js';

// Бэкенд не поддерживает удаление класса (у учеников есть FK на класс) —
// поэтому в отличие от referenceCrud-подхода trip-pip здесь нет действия
// "Удалить"/"Архивировать", только создание и редактирование.
export async function classesListPage(container) {
  const tableContainer = el('div');

  function openFormModal({ modalTitle, initialValues, submit }) {
    let modalHandle;
    const form = createForm({
      fields: classFields,
      initialValues,
      onCancel: () => modalHandle.close(),
      onSubmit: async (values) => {
        try {
          await submit(classValuesToPayload(values));
          modalHandle.close();
          await load();
        } catch (err) {
          applyFormApiError(form, err, 'Не удалось сохранить класс');
        }
      },
    });
    modalHandle = openModal({ title: modalTitle, content: form.element });
  }

  function openCreateModal() {
    openFormModal({
      modalTitle: 'Новый класс',
      initialValues: {},
      submit: async (payload) => {
        await classesApi.create(payload);
        toast.success('Класс создан');
      },
    });
  }

  function openEditModal(row) {
    openFormModal({
      modalTitle: 'Редактирование класса',
      initialValues: classToFormValues(row),
      submit: async (payload) => {
        await classesApi.update(row.id, payload);
        toast.success('Сохранено');
      },
    });
  }

  async function load() {
    const classes = await classesApi.list();
    tableContainer.replaceChildren(
      renderTable({
        columns: [
          { key: 'name', label: 'Класс' },
          { key: 'telegram_chat_id', label: 'ID Telegram-чата' },
        ],
        rows: classes,
        rowActions: (row) => el('span', { class: 'row-actions' }, [
          el('button', { type: 'button', class: 'btn btn-ghost', onclick: () => openEditModal(row) }, 'Изменить'),
        ]),
        emptyMessage: 'Классов пока нет',
      }),
    );
  }

  const header = el('div', { class: 'section-header' }, [
    el('h1', {}, 'Классы'),
    el('button', { type: 'button', class: 'btn btn-primary', onclick: openCreateModal }, 'Добавить'),
  ]);

  container.replaceChildren(el('div', { class: 'page' }, [header, tableContainer]));
  await load();
}
