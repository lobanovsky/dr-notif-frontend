# dr-notif-frontend

Админка для [dr-notif-backend](../dr-notif-backend) — управление классами и учениками,
просмотр ближайших дней рождения, ручной запуск рассылки.

Написана на нативном JavaScript (ES-модули), без фреймворков и без шага сборки — статические
файлы отдаются напрямую. По стилю и структуре — как `trip-pip-frontend`.

## Стек

- Ванильный JS (ES-модули), без React/Vue/сборщиков
- Никакого рантайм-состояния на сервере — приложение полностью клиентское (SPA на History API)
- Аутентификация — HttpOnly cookie-сессия `dr_notif_session`, которую выставляет бэкенд
- В проде и в dev раздаётся через [Caddy](https://caddyserver.com/), который же
  проксирует `/admin/*` и `/healthz` на `dr-notif-backend` — единый origin для фронтенда
  и API нужен, потому что бэкенд не поддерживает CORS и держит сессию в HttpOnly cookie

## Структура проекта

```
index.html
css/                — tokens/base/layout/components (обычный CSS, без препроцессоров)
js/
  app.js            — точка входа: бутстрап сессии, переключение auth/shell роутеров
  router.js         — SPA-роутер на History API
  config.js         — apiBase (у бэкенда нет /api-префикса, поэтому пустой)
  api/              — тонкие обёртки над fetch по одному модулю на сущность бэкенда
  state/            — session.js (авторизован/нет), nav.js (программная навигация)
  lib/              — чистая логика без DOM/сети: даты, валидация, дни до ДР и т.д.
  ui/                — переиспользуемые компоненты: таблица, форма, модалка, toast
  pages/            — по папке на экран: login, shell, classes, students, birthdays
dev/Caddyfile       — локальный запуск (:3000 → бэкенд на 127.0.0.1:8080)
deploy/Caddyfile    — прод-конфиг (копируется в образ)
Dockerfile          — caddy:2.11-alpine, без сборки
docker-compose.yml  — сервис frontend, порт 8082, сеть dr-notif-network
```

## Переменные окружения

У самого приложения **нет рантайм-конфигурации** — это статические файлы, которые Caddy
просто раздаёт, никакой код в JS/Caddyfile не читает переменные окружения. Все переменные
ниже нужны только для **сборки и разворачивания** через Docker.

### Локальный запуск (`.env` не нужен)

Дев-сервер не требует никаких переменных окружения — только чтобы `dr-notif-backend` был
поднят на `127.0.0.1:8080` (см. его README):

```bash
caddy run --config dev/Caddyfile
```
Откройте `http://localhost:3000`.

### Через `docker compose` — обязательные переменные в `.env`

Пример — в [`.env.example`](.env.example).

| Переменная | Обязательна | Описание |
|---|---|---|
| **`DOCKER_USERNAME`** | да | Логин на Docker Hub — используется в `docker-compose.yml` для составления имени образа `${DOCKER_USERNAME}/dr-notif-frontend:${TAG}`. |
| **`TAG`** | да | Тег образа, который нужно запустить (например `latest` или `sha-<commit>`, публикуемый CI). |

```bash
docker network create dr-notif-network   # один раз, если сети ещё нет
cp .env.example .env                     # и подставить свои значения
docker compose up -d --build
```
`docker-compose.yml` не поднимает `dr-notif-backend` — он должен уже быть запущен и подключён
к сети `dr-notif-network`, чтобы Caddy внутри контейнера фронтенда мог достучаться до него по
имени контейнера (`dr-notif-backend:8080`, см. `deploy/Caddyfile`).

## CI/CD и деплой

`.github/workflows/build-and-deploy-frontend.yml`: на пуш в `master` — `npm test` → сборка и
публикация Docker-образа в Docker Hub → деплой по SSH на сервер с проверкой здоровья
(совпадение тега запущенного образа + `GET /healthz` через прокси Caddy → бэкенд) и
автоматическим откатом на предыдущую версию при неудаче — тот же паттерн, что в
`dr-notif-backend`.

### Секреты GitHub Actions

Настраиваются в `Settings → Secrets and variables → Actions` репозитория. Значения — те же,
что уже заведены для `dr-notif-backend` (тот же Docker Hub аккаунт и тот же сервер деплоя).

| Секрет | Описание |
|---|---|
| `DOCKER_USERNAME` | Логин на Docker Hub, куда публикуется образ. |
| `DOCKER_TOKEN` | Access-токен Docker Hub (не пароль) для `docker login` и публикации образа. |
| `DEPLOY_HOST_IP` | IP или домен продакшен-сервера. |
| `DEPLOY_HOST_USERNAME` | Пользователь для SSH-подключения к серверу деплоя. |
| `DEPLOY_HOST_KEY` | Приватный SSH-ключ для подключения к серверу деплоя. |
| `DEPLOY_HOST_PROJECT_PATH` | Путь на сервере, куда копируются `.env`/`docker-compose.yml` и откуда запускается `docker compose`. |

Своих секретов (`DATABASE_URL`, токенов и т.п.) у фронтенда нет — вся конфигурация с
чувствительными данными живёт в `dr-notif-backend`.

## Тесты

```bash
npm test
```
`node --test` по всем `*.test.js` — покрыта только чистая логика (роутер, api-клиент,
подсчёт дней до дня рождения с учётом 29 февраля, валидация форм), без DOM и без сети —
так же, как в `trip-pip-frontend`.
