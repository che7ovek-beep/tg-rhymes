import cron from "node-cron";
import fetch from "node-fetch";

const botToken = process.env.BOT_TOKEN;
const serviceToken = process.env.BOT_SERVICE_TOKEN;
const apiUrl = process.env.LARAVEL_API_URL || "http://api:8080";
const throttleMs = Number(process.env.WORKER_THROTTLE_MS || 350);

if (!botToken || !serviceToken) {
  throw new Error("BOT_TOKEN and BOT_SERVICE_TOKEN are required");
}

type ReminderDue = {
  telegramId: string;
  locale: string;
  deeplinkUrl: string;
  messageText: string;
  reminderKey: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

const sendTelegramMessage = async (payload: ReminderDue) => {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const body = {
    chat_id: payload.telegramId,
    text: payload.messageText,
    reply_markup: {
      inline_keyboard: [[{ text: "Открыть и написать 4 строки", url: payload.deeplinkUrl }]]
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorCode = data?.error_code ? String(data.error_code) : "unknown";
    const description = data?.description ? String(data.description) : "unknown";
    throw new Error(`${errorCode}:${description}`);
  }
};

const sendWithRetry = async (payload: ReminderDue) => {
  const retries = [1000, 2000, 4000];

  for (let attempt = 0; attempt <= retries.length; attempt += 1) {
    try {
      await sendTelegramMessage(payload);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown";
      const isRetryable = message.includes("429") || message.includes("5");
      if (attempt >= retries.length || !isRetryable) {
        return { ok: false, error: message };
      }
      await sleep(retries[attempt]);
    }
  }

  return { ok: false, error: "retry_failed" };
};

const processReminders = async () => {
  const due = await internalFetch<ReminderDue[]>("/internal/reminders/due");

  for (const reminder of due) {
    const result = await sendWithRetry(reminder);
    await internalFetch("/internal/reminders/report", {
      method: "POST",
      body: JSON.stringify({
        reminderKey: reminder.reminderKey,
        status: result.ok ? "ok" : "error",
        error_code: result.ok ? null : result.error,
        error_message: result.ok ? null : result.error
      })
    });
    await sleep(throttleMs);
  }
};

cron.schedule("* * * * *", async () => {
  try {
    await processReminders();
  } catch (error) {
    console.error("Worker error", error);
  }
});

console.log("Daily Verse worker started");
