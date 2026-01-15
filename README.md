# Daily Verse — Telegram Mini App MVP

Daily Verse — мини-приложение в Telegram, которое помогает писать минимум 4 строки в день.

## Архитектура (monorepo)
- `apps/api-laravel` — Laravel API (PHP 8.2+, Eloquent, migrations)
- `apps/bot-node` — Telegram Bot (Node.js + TypeScript + Telegraf)
- `apps/bot-worker` — worker напоминаний (Node.js + TypeScript)
- `apps/webapp` — Telegram Mini App (React + Vite + TypeScript)
- `packages/shared` — shared types/consts

## Требования
- Docker + Docker Compose (для Laravel стека)
- Node.js 18+ (для локального запуска)
- PHP 8.2+ (если запускать Laravel вне Docker)

## Безопасность
- WebApp передаёт `initData` в заголовке `x-telegram-init-data`; Laravel проверяет подпись HMAC SHA-256 по `BOT_TOKEN` и извлекает `telegramId`.
- Между Node (bot/worker) и Laravel используется `BOT_SERVICE_TOKEN` через `Authorization: Bearer`.
- Все публичные endpoints защищены middleware в Laravel.

## Запуск через Docker Compose

```bash
cp apps/api-laravel/.env.example apps/api-laravel/.env
cp apps/bot-node/.env.example apps/bot-node/.env
cp apps/bot-worker/.env.example apps/bot-worker/.env
cp apps/webapp/.env.example apps/webapp/.env

docker compose up --build
```

После запуска:
- API доступен на `http://localhost:8080`
- WebApp на `http://localhost:5173`

### BotFather: создание бота
1. В `@BotFather` выполнить `/newbot`
2. Сохранить `BOT_TOKEN`
3. В `@BotFather` выполнить `/setdomain` и указать домен WebApp (например, `https://your-domain`)

### Webhook (bot-node)
Бот предпочитает webhook. Укажите:
- `BOT_WEBHOOK_URL=https://your-domain`
- `BOT_WEBHOOK_PATH=/bot/webhook`

Если webhook не задан, бот запустится в режиме long polling.

### Напоминания (worker)
Воркер делает `GET /internal/reminders/due`, отправляет сообщения в Telegram и репортит результат в `POST /internal/reminders/report`.
Логи напоминаний смотрите в таблице `reminder_logs`.

### Полезные команды
```bash
npm run dev:web
npm run dev:bot-node
npm run dev:worker
```

## Структура API
### Публичные (WebApp)
- `POST /api/webapp/auth/verify`
- `GET /api/today`
- `POST /api/draft`
- `POST /api/finish`
- `GET /api/entries`
- `GET /api/entries/{date}`
- `GET /api/settings`
- `POST /api/settings`

### Внутренние (Node bot/worker)
- `GET /internal/reminders/due`
- `POST /internal/reminders/report`
- `GET /internal/bot/deeplink`
- `GET /internal/users/{telegramId}/streak`
- `POST /internal/users/{telegramId}/reminders`