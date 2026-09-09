import { createRouter } from './router.js';
import { onUnauthenticated, onGlobalError, ApiError } from './api/client.js';
import * as classesApi from './api/classes.js';
import { isAuthenticated, setAuthenticated } from './state/session.js';
import { setNavigate } from './state/nav.js';
import { renderLoginPage } from './pages/login/loginPage.js';
import { renderShell } from './pages/shell/shellLayout.js';
import { toast } from './ui/toast.js';
import { classesListPage } from './pages/classes/classesListPage.js';
import { studentsListPage } from './pages/students/studentsListPage.js';
import { newStudentPage, editStudentPage } from './pages/students/studentFormPage.js';
import { birthdaysPage } from './pages/birthdays/birthdaysPage.js';

const appRoot = document.getElementById('app');

const routes = [
  { pattern: '/', mount: birthdaysPage },
  { pattern: '/classes', mount: classesListPage },
  { pattern: '/students', mount: studentsListPage },
  // /new должен идти раньше /:id/edit — роутер отдаёт первый совпавший маршрут.
  { pattern: '/students/new', mount: newStudentPage },
  { pattern: '/students/:id/edit', mount: editStudentPage },
];

let router = null;
let shellCleanup = null;

function notifyGlobalError(error) {
  console.error('[dr-notif]', error);
  toast.error(error.message || 'Произошла ошибка. Повторите попытку позже.');
}
onGlobalError(notifyGlobalError);

function stopRouter() {
  if (router) {
    router.stop();
    router = null;
  }
}

function stopShell() {
  if (shellCleanup) {
    shellCleanup();
    shellCleanup = null;
  }
}

function showAuth() {
  stopRouter();
  stopShell();
  const authRoutes = [{ pattern: '/login', mount: (c) => renderLoginPage(c, { onSuccess: showShell }) }];
  router = createRouter(authRoutes, appRoot);
  router.notFound((c) => renderLoginPage(c, { onSuccess: showShell }));
  setNavigate(router.navigate);
  router.start();
}

function showShell() {
  stopRouter();
  stopShell();
  setAuthenticated(true);
  const { outlet, refreshNav, cleanup } = renderShell(appRoot, { onLogout: handleLoggedOut });
  shellCleanup = cleanup;
  router = createRouter(routes, outlet, { afterRender: refreshNav });
  setNavigate(router.navigate);
  router.start();
}

function handleLoggedOut() {
  setAuthenticated(false);
  showAuth();
}

// Срабатывает на любой 401, в т.ч. истечение сессии посреди работы. Во время
// самой формы логина isAuthenticated() ещё false, так что неверный пароль
// обрабатывает сама loginPage.js, а не этот путь.
onUnauthenticated(() => {
  if (isAuthenticated()) handleLoggedOut();
});

async function bootstrap() {
  // У dr-notif-backend нет отдельного эндпоинта проверки сессии — используем
  // GET /admin/classes, который оболочке всё равно нужен на старте (список
  // классов в форме ученика, фильтр в списке учеников): 200 = сессия жива,
  // 401 = нужен логин. Сознательный компромисс, не оверсайт.
  try {
    await classesApi.list();
    showShell();
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 401)) {
      notifyGlobalError(err);
    }
    showAuth();
  }
}

bootstrap();
