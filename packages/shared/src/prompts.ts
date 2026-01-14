export type Prompt = {
  date: string;
  theme: string;
  emotion: string;
  form: string;
  constraint: string;
};

export const PROMPTS: Prompt[] = [
  {
    date: "2024-01-01",
    theme: "Утренний город",
    emotion: "надежда",
    form: "свободный стих",
    constraint: "упомяни звук"
  },
  {
    date: "2024-01-02",
    theme: "Письмо в бутылке",
    emotion: "тоска",
    form: "AABB",
    constraint: "каждая строка 8-10 слов"
  },
  {
    date: "2024-01-03",
    theme: "Тихая комната",
    emotion: "спокойствие",
    form: "ABAB",
    constraint: "без слов " + "\"я\""
  },
  {
    date: "2024-01-04",
    theme: "Случайный попутчик",
    emotion: "удивление",
    form: "свободный стих",
    constraint: "в конце строк повтори одно слово"
  },
  {
    date: "2024-01-05",
    theme: "Переезд",
    emotion: "смелость",
    form: "сонет-лайт",
    constraint: "14 строк максимум"
  },
  {
    date: "2024-01-06",
    theme: "Снегопад",
    emotion: "умиротворение",
    form: "хокку",
    constraint: "3 строки"
  },
  {
    date: "2024-01-07",
    theme: "Рыночная площадь",
    emotion: "оживление",
    form: "AABB",
    constraint: "используй запах"
  },
  {
    date: "2024-01-08",
    theme: "Стеклянный лифт",
    emotion: "волнение",
    form: "свободный стих",
    constraint: "включи один цвет"
  },
  {
    date: "2024-01-09",
    theme: "Старое фото",
    emotion: "ностальгия",
    form: "ABAB",
    constraint: "каждая строка начинается с глагола"
  },
  {
    date: "2024-01-10",
    theme: "Соль и ветер",
    emotion: "свобода",
    form: "свободный стих",
    constraint: "минимум 4 строки"
  },
  {
    date: "2024-01-11",
    theme: "Последний автобус",
    emotion: "усталость",
    form: "AABB",
    constraint: "используй звукопись"
  },
  {
    date: "2024-01-12",
    theme: "Лестничная клетка",
    emotion: "ожидание",
    form: "ABAB",
    constraint: "упомяни свет"
  },
  {
    date: "2024-01-13",
    theme: "Двор без людей",
    emotion: "тишина",
    form: "свободный стих",
    constraint: "каждая строка 6-8 слов"
  },
  {
    date: "2024-01-14",
    theme: "День, когда небо низко",
    emotion: "мягкая грусть",
    form: "сонет-лайт",
    constraint: "ровно 12 строк"
  },
  {
    date: "2024-01-15",
    theme: "Пахнет кофе",
    emotion: "уют",
    form: "свободный стих",
    constraint: "вставь слово " + "\"сейчас\""
  },
  {
    date: "2024-01-16",
    theme: "Билет в один конец",
    emotion: "решимость",
    form: "ABAB",
    constraint: "минимум 4 строки"
  },
  {
    date: "2024-01-17",
    theme: "Забытая песня",
    emotion: "меланхолия",
    form: "AABB",
    constraint: "используй вопрос"
  },
  {
    date: "2024-01-18",
    theme: "Сквозняк",
    emotion: "легкость",
    form: "свободный стих",
    constraint: "не используй запятые"
  },
  {
    date: "2024-01-19",
    theme: "Одинокое дерево",
    emotion: "стойкость",
    form: "ABAB",
    constraint: "упомяни землю"
  },
  {
    date: "2024-01-20",
    theme: "Пустой вокзал",
    emotion: "напряжение",
    form: "свободный стих",
    constraint: "каждая строка начинается с " + "\"и\""
  },
  {
    date: "2024-01-21",
    theme: "Теплый плед",
    emotion: "забота",
    form: "свободный стих",
    constraint: "упомяни текстуру"
  },
  {
    date: "2024-01-22",
    theme: "В тени моста",
    emotion: "тайна",
    form: "AABB",
    constraint: "минимум 4 строки"
  },
  {
    date: "2024-01-23",
    theme: "Почтовый ящик",
    emotion: "надежда",
    form: "ABAB",
    constraint: "каждая строка 7-9 слов"
  },
  {
    date: "2024-01-24",
    theme: "Лунный свет",
    emotion: "романтика",
    form: "хокку",
    constraint: "упомяни воду"
  },
  {
    date: "2024-01-25",
    theme: "Дорога домой",
    emotion: "радость",
    form: "свободный стих",
    constraint: "включи звук шагов"
  },
  {
    date: "2024-01-26",
    theme: "Маленькая победа",
    emotion: "гордость",
    form: "сонет-лайт",
    constraint: "10-12 строк"
  },
  {
    date: "2024-01-27",
    theme: "Закатный поезд",
    emotion: "мечтательность",
    form: "AABB",
    constraint: "каждая строка 8-10 слов"
  },
  {
    date: "2024-01-28",
    theme: "Запах дождя",
    emotion: "облегчение",
    form: "свободный стих",
    constraint: "используй 2 прилагательных"
  },
  {
    date: "2024-01-29",
    theme: "Камни у воды",
    emotion: "сосредоточенность",
    form: "ABAB",
    constraint: "упомяни звук"
  },
  {
    date: "2024-01-30",
    theme: "Тихое " + "\"да\"",
    emotion: "благодарность",
    form: "свободный стих",
    constraint: "минимум 4 строки"
  }
];
