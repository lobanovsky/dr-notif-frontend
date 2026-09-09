import { client } from './client.js';

export function runCheck() {
  return client.post('/admin/run-check');
}
