import { el } from '../../lib/dom.js';
import { createForm } from '../../ui/form.js';
import { toast } from '../../ui/toast.js';
import { applyFormApiError } from '../../lib/apiErrors.js';
import { goTo } from '../../state/nav.js';
import * as studentsApi from '../../api/students.js';
import * as classesApi from '../../api/classes.js';
import { studentFieldsFactory, studentToFormValues, emptyStudentFormValues, studentValuesToPayload } from './studentFields.js';

export function newStudentPage(container) {
  return renderStudentForm(container, { mode: 'create' });
}

export function editStudentPage(container, params) {
  return renderStudentForm(container, { mode: 'edit', id: params.id });
}

async function renderStudentForm(container, { mode, id }) {
  const classes = await classesApi.list();
  const classOptions = classes.map((c) => ({ value: String(c.id), label: c.name }));

  let initialValues = emptyStudentFormValues;
  if (mode === 'edit') {
    initialValues = studentToFormValues(await studentsApi.get(id));
  }

  const form = createForm({
    fields: studentFieldsFactory(classOptions),
    initialValues,
    submitLabel: mode === 'edit' ? 'Сохранить' : 'Создать',
    onCancel: () => goTo('/students'),
    onSubmit: async (values) => {
      const payload = studentValuesToPayload(values);
      try {
        if (mode === 'edit') {
          await studentsApi.update(id, payload);
          toast.success('Сохранено');
        } else {
          await studentsApi.create(payload);
          toast.success('Ученик добавлен');
        }
        goTo('/students');
      } catch (err) {
        applyFormApiError(form, err, 'Не удалось сохранить ученика');
      }
    },
  });

  const header = el('h1', {}, mode === 'edit' ? 'Редактирование ученика' : 'Новый ученик');
  container.replaceChildren(el('div', { class: 'page' }, [header, form.element]));
}
