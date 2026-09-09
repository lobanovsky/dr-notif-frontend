import { el } from '../../lib/dom.js';
import { logout as apiLogout } from '../../api/auth.js';

const NAV_ITEMS = [
  { href: '/', label: 'Дни рождения' },
  { href: '/students', label: 'Ученики' },
  { href: '/classes', label: 'Классы' },
];

// Рендерит постоянный каркас (шапка + нав) и возвращает <main>, в который
// роутер монтирует текущую страницу.
export function renderShell(container, { onLogout } = {}) {
  const navId = 'main-navigation';
  const nav = el(
    'nav',
    { class: 'shell-nav', id: navId, 'aria-label': 'Основная навигация' },
    NAV_ITEMS.map((item) => el('a', { href: item.href, class: 'shell-nav-link' }, item.label)),
  );

  const navBackdrop = el('div', {
    class: 'shell-nav-backdrop',
    'aria-hidden': 'true',
    onclick: () => setNavOpen(false),
  });

  const menuButton = el(
    'button',
    {
      type: 'button',
      class: 'shell-menu-button',
      'aria-label': 'Открыть меню',
      'aria-controls': navId,
      'aria-expanded': 'false',
      onclick: () => setNavOpen(!shell.classList.contains('shell--nav-open')),
    },
    [el('span', { 'aria-hidden': 'true' }, '☰')],
  );

  const logoutButton = el(
    'button',
    {
      type: 'button',
      class: 'btn btn-ghost',
      onclick: async () => {
        logoutButton.disabled = true;
        try {
          await apiLogout();
        } catch {
          // даже если запрос разлогинивания не удался, выходим локально —
          // cookie всё равно HttpOnly и клиент не может её перепроверить.
        } finally {
          onLogout?.();
        }
      },
    },
    'Выйти',
  );

  const header = el('header', { class: 'shell-header' }, [
    menuButton,
    el('div', { class: 'shell-brand' }, 'dr-notif'),
    el('div', { class: 'shell-header-spacer' }),
    logoutButton,
  ]);

  const main = el('main', { class: 'shell-main' });
  const shell = el('div', { class: 'shell' }, [header, nav, navBackdrop, main]);

  function setNavOpen(open) {
    shell.classList.toggle('shell--nav-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (open) nav.querySelector('a')?.focus();
  }

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setNavOpen(false);
  });
  shell.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setNavOpen(false);
  });

  container.replaceChildren(shell);
  updateActiveNav(nav);

  // Роутер вызывает refreshNav() после каждого перехода (см. app.js), т.к.
  // навигация внутри приложения идёт через pushState, а не popstate.
  return {
    outlet: main,
    refreshNav: () => {
      setNavOpen(false);
      updateActiveNav(nav);
    },
    cleanup: () => {},
  };
}

function updateActiveNav(nav) {
  const path = window.location.pathname;
  for (const link of nav.querySelectorAll('a')) {
    const href = link.getAttribute('href');
    const isActive = href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
    link.classList.toggle('active', isActive);
  }
}
