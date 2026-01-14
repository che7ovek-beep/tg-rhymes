import crypto from "crypto";
import type { AIRequest, AIResponse } from "@daily-verse/shared";

const hashSeed = (input: string): number => {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  return parseInt(hash.slice(0, 8), 16);
};

const pickFrom = (items: string[], seed: number, count: number): string[] => {
  const result: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const idx = (seed + i * 7) % items.length;
    result.push(items[idx]);
  }
  return result;
};

export const generateAI = (payload: AIRequest): AIResponse => {
  const seed = hashSeed(`${payload.mode}-${payload.text}-${payload.seed ?? ""}`);

  if (payload.mode === "continue") {
    const lines = [
      "и мысль опять качается, как лодка",
      "я слышу паузу, где прячется ответ",
      "вдох медленный, а дальше — только свет",
      "молчит окно, но шепчет мой чердак",
      "пусть слово станет жестом тишины",
      "на краешке строки дрожит тепло"
    ];
    return { items: pickFrom(lines, seed, 3) };
  }

  if (payload.mode === "rhymes") {
    const rhymes = [
      "огонь",
      "ладонь",
      "звень",
      "день",
      "тень",
      "камин",
      "туман",
      "дождь",
      "круж",
      "сон"
    ];
    return { items: pickFrom(rhymes, seed, 10) };
  }

  const before = payload.text.slice(0, 120) || "Твой текст";
  const after = `${before.replace(/\s+/g, " ").trim()}...`;
  return {
    items: ["мягкая правка готова"],
    diff: { before, after }
  };
};
