export const countLines = (text: string): number => {
  return text.split(/\n+/).filter((line) => line.trim()).length;
};

export const countWords = (text: string): number => {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

export const estimateSyllables = (text: string): number => {
  const vowels = "аеёиоуыэюяaeiouy";
  return text
    .toLowerCase()
    .split("")
    .filter((char, index, arr) => {
      if (!vowels.includes(char)) return false;
      const prev = arr[index - 1];
      return !prev || !vowels.includes(prev);
    }).length;
};

export const extractRhymeHints = (text: string): string[] => {
  const endings = text
    .split(/\n+/)
    .map((line) => line.trim().split(/\s+/).pop())
    .filter(Boolean)
    .map((word) => word?.toLowerCase().replace(/[^\p{L}]+/gu, ""))
    .filter((word) => word && word.length > 2) as string[];

  const map = new Map<string, string[]>();
  endings.forEach((word) => {
    const key = word.slice(-2);
    const list = map.get(key) || [];
    list.push(word);
    map.set(key, list);
  });

  return [...map.values()]
    .filter((group) => group.length > 1)
    .map((group) => group.join(" — "));
};
