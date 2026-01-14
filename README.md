# Daily Verse — Telegram Mini App MVP

Daily Verse — мини-приложение в Telegram, которое помогает писать минимум 4 строки в день.

## Архитектура
- `apps/webapp` — Telegram Mini App (React + Vite + TypeScript)
- `apps/server` — API сервер (Fastify + TypeScript)
- `apps/bot` — Telegram Bot (Node.js + TypeScript)
- `packages/shared` — общие типы и 30 промптов

## Требования
- Node.js 18+
- npm 9+

## Быстрый старт

```bash
npm install
```

### 1) Создать бота в BotFather
1. `/newbot` → имя, username
2. Сохранить `BOT_TOKEN`

### 2) Настроить Web App URL
1. В BotFather `/setdomain` → указать URL вашего webapp (например, `https://your-domain`)
2. В `.env` указать `WEBAPP_URL` (тот же URL)

### 3) Настроить переменные окружения

Создайте `.env` файл для сервера `apps/server/.env`:

```bash
BOT_TOKEN=123456:ABCDEF
WEBAPP_URL=https://your-domain
DATABASE_URL="file:./prisma/dev.db"
PORT=4000
```

Для бота `apps/bot/.env`:

```bash
BOT_TOKEN=123456:ABCDEF
WEBAPP_URL=https://your-domain
SERVER_URL=http://localhost:4000
```

Для webapp `apps/webapp/.env`:

```bash
VITE_API_URL=http://localhost:4000
```

### 4) Prisma

```bash
cd apps/server
npx prisma generate
npx prisma migrate dev --name init
```

### 5) Запуск

```bash
npm run dev:server
npm run dev:bot
npm run dev:web
```

## Команды npm

- `npm run dev:web` — запуск webapp
- `npm run dev:server` — запуск API сервера
- `npm run dev:bot` — запуск бота

## Telegram initData
Mini App отправляет `initData` в заголовке `x-telegram-init-data`. Бэкенд строго проверяет подпись (HMAC SHA-256 по bot token) и извлекает `userId`. Никаких userId с фронта.

## Webhook или long polling
Бот настроен на long polling по умолчанию (`node-telegram-bot-api`). Если нужен webhook — переключите режим в `apps/bot/src/index.ts` и настройте публичный HTTPS URL.

## Команды бота
- `/start` — приветствие и кнопка “Открыть Daily Verse”
- `/today` — быстрый вход на “Сегодня”
- `/streak` — текущий и лучший стрик
- `/off` и `/on` — выключить/включить напоминания

## Cron-напоминания
Напоминания отправляет сервер через `node-cron`. Запускаются каждый минутный тик и проверяют:
- день недели
- локальное время пользователя
- завершил ли он запись сегодня

## Структура API
- `POST /api/auth/verify`
- `GET /api/today`
- `POST /api/draft`
- `POST /api/finish`
- `GET /api/entries`
- `GET /api/entries/:date`
- `GET /api/settings`
- `POST /api/settings`
- `POST /api/soft-skip`
- `GET /api/streak`
- `POST /api/ai/continue`
- `POST /api/ai/rhymes`
- `POST /api/ai/soft-edit`

## Замена AI
Мок AI находится в `apps/server/src/services/ai/generateAI.ts`. Он детерминированный и готов к замене на любой провайдер.
