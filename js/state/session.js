// dr-notif-backend не возвращает профиль пользователя (учётка одна,
// захардкожена в переменных окружения) — сессия здесь это просто флаг
// «валидная cookie есть или нет».

let authenticated = false;
const listeners = new Set();

export function isAuthenticated() {
  return authenticated;
}

export function setAuthenticated(value) {
  authenticated = value;
  for (const listener of listeners) listener(authenticated);
}

export function subscribeSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
