import { el } from '../../lib/dom.js';
import { formatRussianDate } from '../../lib/format.js';
import { logout as apiLogout } from '../../api/auth.js';
import { config } from '../../config.js';

const NAV_ITEMS = [
  { href: '/', label: 'Обзор', icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
  { href: '/students', label: 'Ученики', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>' },
  { href: '/classes', label: 'Классы', icon: '<path d="M3 21h18M6 21V10l6-4 6 4v11M9 21v-6h6v6M9 11h.01M15 11h.01"/>' },
];

function navIcon(item) {
  return el('svg', {
    class: 'shell-nav-icon',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    html: item.icon,
  });
}

function localDateIso(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Рендерит постоянный каркас (шапка + нав) и возвращает <main>, в который
// роутер монтирует текущую страницу.
export function renderShell(container, { onLogout } = {}) {
  const navId = 'main-navigation';
  const nav = el(
    'nav',
    { class: 'shell-nav', id: navId, 'aria-label': 'Основная навигация' },
    NAV_ITEMS.map((item) => el('a', { href: item.href, class: 'shell-nav-link' }, [navIcon(item), item.label])),
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

  const currentDate = el('time', { class: 'shell-date', 'aria-label': 'Текущая дата' });
  let dateTimer = null;

  function updateCurrentDate() {
    const now = new Date();
    currentDate.textContent = formatRussianDate(now);
    currentDate.setAttribute('datetime', localDateIso(now));

    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    dateTimer = window.setTimeout(updateCurrentDate, tomorrow.getTime() - now.getTime() + 1000);
  }
  updateCurrentDate();

  const header = el('header', { class: 'shell-header' }, [
    menuButton,
    el('div', { class: 'shell-brand' }, [
      el('div', { class: 'shell-brand-name' }, config.appName),
      currentDate,
    ]),
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
    cleanup: () => window.clearTimeout(dateTimer),
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
