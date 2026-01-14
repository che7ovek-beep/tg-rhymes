import Fastify from "fastify";
import cors from "@fastify/cors";
import { PrismaClient } from "@prisma/client";
import cron from "node-cron";
import fetch from "node-fetch";
import { z } from "zod";
import { defaultSettings, entryForms } from "@daily-verse/shared";
import { verifyInitData } from "./lib/telegram";
import {
  formatDateInTimezone,
  formatTimeInTimezone,
  getDayOfWeekInTimezone
} from "./lib/date";
import { getPromptForDate } from "./services/prompts";
import { generateAI } from "./services/ai/generateAI";
import { calculateStreak } from "./services/streak";

const prisma = new PrismaClient();

const app = Fastify({ logger: true });

app.register(cors, { origin: true });

app.get("/health", async () => ({ ok: true }));

app.register(
  async (instance) => {
    instance.addHook("preHandler", async (request, reply) => {
      const initData = request.headers["x-telegram-init-data"];
      const botToken = process.env.BOT_TOKEN;
      if (!botToken || typeof initData !== "string") {
        reply.code(401).send({ error: "initData missing" });
        return;
      }

      const verified = verifyInitData(initData, botToken);
      if (!verified) {
        reply.code(401).send({ error: "initData invalid" });
        return;
      }

      request.headers["x-user-id"] = verified.user.id;
      request.headers["x-user-language"] = verified.user.language_code || "ru";
    });

    instance.post("/auth/verify", async (request) => {
      const userId = String(request.headers["x-user-id"] || "");
      const language = String(request.headers["x-user-language"] || "ru");
      if (!userId) {
        return { ok: false };
      }

      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (!existing) {
        await prisma.user.create({
          data: {
            id: userId,
            timezone: defaultSettings.timezone,
            language,
            dailyGoalLines: defaultSettings.dailyGoalLines,
            timerEnabled: defaultSettings.timerEnabled,
            reminderTime: defaultSettings.reminderTime,
            reminderDays: JSON.stringify(defaultSettings.reminderDays),
            remindersEnabled: true
          }
        });
      }

      return { ok: true };
    });

    instance.get("/today", async (request) => {
      const userId = String(request.headers["x-user-id"] || "");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { error: "user not found" };
      }

      const today = formatDateInTimezone(new Date(), user.timezone);
      const prompt = await getPromptForDate(prisma, today);
      const entry = await prisma.entry.findUnique({
        where: { userId_date: { userId, date: today } }
      });

      const lines = entry?.text
        ? entry.text.split(/\n+/).filter((line) => line.trim()).length
        : 0;

      return {
        date: today,
        prompt,
        entry: entry
          ? {
              status: entry.status,
              text: entry.text,
              form: entry.form,
              mood: entry.mood,
              favoriteLine: entry.favoriteLine,
              lines
            }
          : null,
        dailyGoalLines: user.dailyGoalLines,
        timerEnabled: user.timerEnabled
      };
    });

    instance.post("/draft", async (request) => {
      const userId = String(request.headers["x-user-id"] || "");
      const schema = z.object({
        date: z.string(),
        text: z.string(),
        form: z.string(),
        mood: z.string().optional().default(""),
        tags: z.array(z.string()).optional().default([])
      });
      const payload = schema.parse(request.body);

      const entry = await prisma.entry.upsert({
        where: { userId_date: { userId, date: payload.date } },
        update: {
          text: payload.text,
          form: payload.form,
          mood: payload.mood,
          tags: JSON.stringify(payload.tags),
          status: "draft"
        },
        create: {
          userId,
          date: payload.date,
          text: payload.text,
          form: payload.form,
          mood: payload.mood,
          tags: JSON.stringify(payload.tags),
          status: "draft"
        }
      });

      return { ok: true, id: entry.id };
    });

    instance.post("/finish", async (request) => {
      const userId = String(request.headers["x-user-id"] || "");
      const schema = z.object({
        date: z.string(),
        text: z.string(),
        form: z.string(),
        mood: z.string().optional().default(""),
        tags: z.array(z.string()).optional().default([]),
        favoriteLine: z.string().optional()
      });
      const payload = schema.parse(request.body);

      const entry = await prisma.entry.upsert({
        where: { userId_date: { userId, date: payload.date } },
        update: {
          text: payload.text,
          form: payload.form,
          mood: payload.mood,
          tags: JSON.stringify(payload.tags),
          favoriteLine: payload.favoriteLine,
          status: "done"
        },
        create: {
          userId,
          date: payload.date,
          text: payload.text,
          form: payload.form,
          mood: payload.mood,
          tags: JSON.stringify(payload.tags),
          favoriteLine: payload.favoriteLine,
          status: "done"
        }
      });

      const compliment = payload.text.length > 120
        ? "Ты держишь фокус и развиваешь образ — это чувствуется."
        : "Есть ясный образ и тепло в строках — продолжай."

      return { ok: true, id: entry.id, compliment };
    });

    instance.get("/entries", async (request) => {
      const userId = String(request.headers["x-user-id"] || "");
      const { q } = request.query as { q?: string };
      const entries = await prisma.entry.findMany({
        where: {
          userId,
          ...(q
            ? {
                text: {
                  contains: q,
                  mode: "insensitive"
                }
              }
            : {})
        },
        orderBy: { date: "desc" }
      });

      return entries.map((entry) => ({
        id: entry.id,
        date: entry.date,
        status: entry.status,
        text: entry.text,
        favoriteLine: entry.favoriteLine
      }));
    });

    instance.get("/entries/:date", async (request) => {
      const userId = String(request.headers["x-user-id"] || "");
      const { date } = request.params as { date: string };
      const entry = await prisma.entry.findUnique({
        where: { userId_date: { userId, date } }
      });
      if (!entry) {
        return { error: "not found" };
      }
      return {
        date: entry.date,
        text: entry.text,
        form: entry.form,
        mood: entry.mood,
        tags: JSON.parse(entry.tags || "[]"),
        favoriteLine: entry.favoriteLine,
        status: entry.status
      };
    });

    instance.post("/settings", async (request) => {
      const userId = String(request.headers["x-user-id"] || "");
      const schema = z.object({
        dailyGoalLines: z.number().min(4),
        timerEnabled: z.boolean(),
        language: z.enum(["ru", "en"]),
        reminderTime: z.string(),
        reminderDays: z.array(z.number()),
        timezone: z.string()
      });
      const payload = schema.parse(request.body);

      await prisma.user.update({
        where: { id: userId },
        data: {
          dailyGoalLines: payload.dailyGoalLines,
          timerEnabled: payload.timerEnabled,
          language: payload.language,
          reminderTime: payload.reminderTime,
          reminderDays: JSON.stringify(payload.reminderDays),
          timezone: payload.timezone
        }
      });

      return { ok: true };
    });

    instance.get("/settings", async (request) => {
      const userId = String(request.headers["x-user-id"] || "");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { error: "user not found" };
      }
      return {
        dailyGoalLines: user.dailyGoalLines,
        timerEnabled: user.timerEnabled,
        language: user.language,
        reminderTime: user.reminderTime,
        reminderDays: JSON.parse(user.reminderDays || "[]"),
        timezone: user.timezone
      };
    });

    instance.post("/soft-skip", async (request) => {
      const userId = String(request.headers["x-user-id"] || "");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return { ok: false };
      }

      const lastUsed = user.softSkipUsedAt;
      if (lastUsed) {
        const diffDays =
          (new Date().getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
          return { ok: false, reason: "already_used" };
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: { softSkipUsedAt: new Date() }
      });
      return { ok: true };
    });

    instance.get("/streak", async (request) => {
      const userId = String(request.headers["x-user-id"] || "");
      const streak = await calculateStreak(prisma, userId);
      return streak;
    });

    instance.post("/ai/continue", async (request) => {
      const schema = z.object({ text: z.string() });
      const payload = schema.parse(request.body);
      return generateAI({ text: payload.text, mode: "continue" });
    });

    instance.post("/ai/rhymes", async (request) => {
      const schema = z.object({ text: z.string() });
      const payload = schema.parse(request.body);
      return generateAI({ text: payload.text, mode: "rhymes" });
    });

    instance.post("/ai/soft-edit", async (request) => {
      const schema = z.object({ text: z.string() });
      const payload = schema.parse(request.body);
      return generateAI({ text: payload.text, mode: "soft-edit" });
    });
  },
  { prefix: "/api" }
);

app.post("/api/bot/streak", async (request, reply) => {
  const botToken = process.env.BOT_TOKEN;
  const header = request.headers["x-bot-token"];
  if (!botToken || header !== botToken) {
    reply.code(401).send({ error: "unauthorized" });
    return;
  }

  const schema = z.object({ userId: z.string() });
  const payload = schema.parse(request.body);
  const streak = await calculateStreak(prisma, payload.userId);
  return streak;
});

app.post("/api/bot/reminders", async (request, reply) => {
  const botToken = process.env.BOT_TOKEN;
  const header = request.headers["x-bot-token"];
  if (!botToken || header !== botToken) {
    reply.code(401).send({ error: "unauthorized" });
    return;
  }

  const schema = z.object({ userId: z.string(), enabled: z.boolean() });
  const payload = schema.parse(request.body);
  await prisma.user.update({
    where: { id: payload.userId },
    data: { remindersEnabled: payload.enabled }
  });
  return { ok: true };
});

const sendReminder = async (telegramId: string, text: string, url: string) => {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) {
    return;
  }
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: telegramId,
      text,
      reply_markup: {
        inline_keyboard: [[{ text: "Открыть и написать 4 строки", url }]]
      }
    })
  });
};

cron.schedule("* * * * *", async () => {
  const users = await prisma.user.findMany({ where: { remindersEnabled: true } });
  for (const user of users) {
    const now = new Date();
    const time = formatTimeInTimezone(now, user.timezone);
    const day = getDayOfWeekInTimezone(now, user.timezone);
    const reminderDays = JSON.parse(user.reminderDays || "[]") as number[];

    if (!reminderDays.includes(day) || time !== user.reminderTime) {
      continue;
    }

    const today = formatDateInTimezone(now, user.timezone);
    const entry = await prisma.entry.findUnique({
      where: { userId_date: { userId: user.id, date: today } }
    });
    if (entry?.status === "done") {
      continue;
    }

    const url = `${process.env.WEBAPP_URL || ""}?startapp=today`;
    await sendReminder(
      user.id,
      "Пара тихих строк для себя — всего 4 строки?",
      url
    );
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT || 4000);
    await app.listen({ port, host: "0.0.0.0" });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
