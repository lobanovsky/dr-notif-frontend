import { client } from './client.js';

// GET /admin/classes возвращает JSON null (не []), когда строк нет —
// известная особенность store.ClassStore.List; нормализуем здесь один раз.
export function list() {
  return client.get('/admin/classes').then((rows) => rows || []);
}

export function create(payload) {
  return client.post('/admin/classes', payload);
}

export function update(id, payload) {
  return client.patch(`/admin/classes/${id}`, payload);
}
