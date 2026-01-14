import { PrismaClient } from "@prisma/client";

export const calculateStreak = async (
  prisma: PrismaClient,
  userId: string
): Promise<{ current: number; best: number }> => {
  const entries = await prisma.entry.findMany({
    where: { userId, status: "done" },
    orderBy: { date: "desc" }
  });

  let current = 0;
  let best = 0;
  let lastDate: string | null = null;

  for (const entry of entries) {
    if (!lastDate) {
      current = 1;
      best = 1;
      lastDate = entry.date;
      continue;
    }

    const diffDays =
      (new Date(lastDate).getTime() - new Date(entry.date).getTime()) /
      (1000 * 60 * 60 * 24);

    if (Math.round(diffDays) === 1) {
      current += 1;
    } else {
      break;
    }

    best = Math.max(best, current);
    lastDate = entry.date;
  }

  const allEntries = await prisma.entry.findMany({
    where: { userId, status: "done" },
    orderBy: { date: "asc" }
  });

  let run = 0;
  let last: string | null = null;

  for (const entry of allEntries) {
    if (!last) {
      run = 1;
      best = Math.max(best, run);
      last = entry.date;
      continue;
    }

    const diffDays =
      (new Date(entry.date).getTime() - new Date(last).getTime()) /
      (1000 * 60 * 60 * 24);

    if (Math.round(diffDays) === 1) {
      run += 1;
    } else {
      run = 1;
    }

    best = Math.max(best, run);
    last = entry.date;
  }

  return { current, best };
};
