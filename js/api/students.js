import { client } from './client.js';

export function list(classId) {
  return client.get('/admin/students', { query: classId ? { class_id: classId } : undefined });
}

export function get(id) {
  return client.get(`/admin/students/${id}`);
}

export function create(payload) {
  return client.post('/admin/students', payload);
}

export function update(id, payload) {
  return client.patch(`/admin/students/${id}`, payload);
}

export function block(id) {
  return client.post(`/admin/students/${id}/block`);
}

export function unblock(id) {
  return client.post(`/admin/students/${id}/unblock`);
}

export function sendReminder(id) {
  return client.post(`/admin/students/${id}/send-reminder`);
}

export function notifications(id) {
  return client.get(`/admin/students/${id}/notifications`);
}
