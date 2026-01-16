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