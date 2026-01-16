import { Telegraf } from "telegraf";
import fetch from "node-fetch";

const botToken = process.env.BOT_TOKEN;
const serviceToken = process.env.BOT_SERVICE_TOKEN;
const apiUrl = process.env.LARAVEL_API_URL || "http://api:8080";
const webhookUrl = process.env.BOT_WEBHOOK_URL;
const webhookPath = process.env.BOT_WEBHOOK_PATH || "/bot/webhook";

if (!botToken || !serviceToken) {
  throw new Error("BOT_TOKEN and BOT_SERVICE_TOKEN are required");
}

const bot = new Telegraf(botToken);

const internalFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${serviceToken}`,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Internal API error ${response.status}`);
  }

  return (await response.json()) as T;
};

const buildWebAppButton = (text: string, url: string) => ({
  reply_markup: {
    inline_keyboard: [[{ text, web_app: { url } }]]
  }
});

bot.start(async (ctx) => {
  const { url } = await internalFetch<{ url: string }>("/internal/bot/deeplink?target=home");
  await ctx.reply(
    "Привет! Daily Verse помогает писать 4 строки в день.",
    buildWebAppButton("Открыть Daily Verse", url)
  );
});

bot.command("today", async (ctx) => {
  const { url } = await internalFetch<{ url: string }>("/internal/bot/deeplink?target=today");
  await ctx.reply("Пора написать 4 строки.", buildWebAppButton("Write 4 lines", url));
});

bot.command("streak", async (ctx) => {
  const telegramId = String(ctx.from?.id || "");
  const data = await internalFetch<{ current: number; best: number }>(
    `/internal/users/${telegramId}/streak`
  );
  await ctx.reply(`Текущий стрик: ${data.current} · Лучший: ${data.best}`);
});

bot.command(["on", "off"], async (ctx) => {
  const telegramId = String(ctx.from?.id || "");
  const enabled = ctx.message?.text?.includes("/on") ?? false;
  await internalFetch(`/internal/users/${telegramId}/reminders`, {
    method: "POST",
    body: JSON.stringify({ remindersEnabled: enabled })
  });
  await ctx.reply(enabled ? "Напоминания включены." : "Напоминания выключены.");
});

if (webhookUrl) {
  bot.launch({
    webhook: {
      domain: webhookUrl,
      hookPath: webhookPath
    }
  });
} else {
  bot.launch();
}

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
