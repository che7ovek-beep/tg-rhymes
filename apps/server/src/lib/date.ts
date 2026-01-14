export const formatDateInTimezone = (date: Date, timeZone: string): string => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
};

export const formatTimeInTimezone = (date: Date, timeZone: string): string => {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
};

export const getDayOfWeekInTimezone = (date: Date, timeZone: string): number => {
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short"
  }).format(date);

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return map[day] ?? 0;
};
