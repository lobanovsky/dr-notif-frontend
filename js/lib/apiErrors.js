import { ApiError } from '../api/client.js';

// dr-notif-backend всегда возвращает плоский {"error": "строка"} — полей формы
// в ответе нет, поэтому единственное, что тут можно сделать — показать
// сообщение в общем баннере формы.
export function applyFormApiError(form, err, fallbackMessage = 'Не удалось сохранить') {
  form.setGeneralError((err instanceof ApiError && err.message) || fallbackMessage);
}
