import type { Prompt } from "@daily-verse/shared";
import { PROMPTS } from "@daily-verse/shared";
import { PrismaClient } from "@prisma/client";

const pickPrompt = (date: string): Prompt => {
  const dayIndex = Math.abs(
    date.split("-").reduce((acc, part) => acc + Number(part || 0), 0)
  );
  const prompt = PROMPTS[dayIndex % PROMPTS.length];
  return { ...prompt, date };
};

export const getPromptForDate = async (
  prisma: PrismaClient,
  date: string
): Promise<Prompt> => {
  const cached = await prisma.prompt.findUnique({ where: { date } });
  if (cached) {
    return {
      date: cached.date,
      theme: cached.theme,
      emotion: cached.emotion,
      form: cached.form,
      constraint: cached.constraint
    };
  }

  const prompt = pickPrompt(date);
  await prisma.prompt.create({
    data: {
      date: prompt.date,
      theme: prompt.theme,
      emotion: prompt.emotion,
      form: prompt.form,
      constraint: prompt.constraint
    }
  });
  return prompt;
};
