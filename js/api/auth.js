import { client } from './client.js';

export function login(username, password) {
  return client.post('/admin/login', { username, password });
}

export function logout() {
  return client.post('/admin/logout');
}
