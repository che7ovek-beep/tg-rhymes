export * from "./prompts";

export type UserSettings = {
  dailyGoalLines: number;
  timerEnabled: boolean;
  language: "ru" | "en";
  reminderTime: string;
  reminderDays: number[];
  timezone: string;
};

export type EntryStatus = "draft" | "done";

export type EntryForm =
  | "свободный стих"
  | "AABB"
  | "ABAB"
  | "хокку"
  | "сонет-лайт";

export type AIRequest = {
  text: string;
  mode: "continue" | "rhymes" | "soft-edit";
  seed?: string;
};

export type AIResponse = {
  items: string[];
  diff?: { before: string; after: string };
};

export const entryForms: EntryForm[] = [
  "свободный стих",
  "AABB",
  "ABAB",
  "хокку",
  "сонет-лайт"
];

export const defaultSettings: UserSettings = {
  dailyGoalLines: 4,
  timerEnabled: true,
  language: "ru",
  reminderTime: "18:00",
  reminderDays: [1, 2, 3, 4, 5, 6, 0],
  timezone: "Europe/Moscow"
};
