import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";

const botToken = process.env.BOT_TOKEN;
const webappUrl = process.env.WEBAPP_URL;
const serverUrl = process.env.SERVER_URL || "http://localhost:4000";

if (!botToken || !webappUrl) {
  throw new Error("BOT_TOKEN and WEBAPP_URL are required");
}

const bot = new TelegramBot(botToken, { polling: true });

const getStartKeyboard = (deepLink = "") => ({
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "Открыть Daily Verse",
          url: deepLink ? `${webappUrl}?startapp=${deepLink}` : webappUrl
        }
      ]
    ]
  }
});

bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "Привет! Daily Verse помогает писать 4 строки в день. Начнем?",
    getStartKeyboard()
  );
});

bot.onText(/\/today/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    "Вот твой быстрый вход на сегодня:",
    getStartKeyboard("today")
  );
});

bot.onText(/\/streak/, async (msg) => {
  const response = await fetch(`${serverUrl}/api/bot/streak`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-bot-token": botToken
    },
    body: JSON.stringify({ userId: String(msg.from?.id || "") })
  });
  const data = (await response.json()) as { current?: number; best?: number };
  await bot.sendMessage(
    msg.chat.id,
    `Текущий стрик: ${data.current ?? 0} · Лучший: ${data.best ?? 0}`
  );
});

bot.onText(/\/(off|on)/, async (msg, match) => {
  const enabled = match?.[1] === "on";
  await fetch(`${serverUrl}/api/bot/reminders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-bot-token": botToken
    },
    body: JSON.stringify({ userId: String(msg.from?.id || ""), enabled })
  });

  await bot.sendMessage(
    msg.chat.id,
    enabled ? "Напоминания включены." : "Напоминания выключены."
  );
});
