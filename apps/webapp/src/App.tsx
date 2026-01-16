import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "./lib/api";
import { countLines, countWords, estimateSyllables } from "./lib/text";
import { entryForms } from "@daily-verse/shared";

const starterLines = [
  "Сегодня я начинаю с тишины,",
  "Город дышит медленнее, чем обычно,",
  "Я ищу слово, которое теплое, как свет."
];

type Prompt = {
  date: string;
  theme: string;
  emotion: string;
  form: string;
  constraint: string;
};

type TodayResponse = {
  date: string;
  prompt: Prompt;
  entry: {
    status: string;
    text: string;
    form: string;
    mood: string;
    favoriteLine?: string;
    lines: number;
  } | null;
  dailyGoalLines: number;
  timerEnabled: boolean;
};

type EntrySummary = {
  id: string;
  date: string;
  status: string;
  text: string;
  favoriteLine?: string;
};

type SettingsPayload = {
  dailyGoalLines: number;
  timerEnabled: boolean;
  timezone: string;
  remindersEnabled: boolean;
  reminderTime: string;
  reminderDays: number[];
};

const useDebounce = (value: string, delay = 1500): string => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

const App: React.FC = () => {
  const [view, setView] = useState<"today" | "editor" | "library" | "settings">("today");
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [text, setText] = useState("");
  const [form, setForm] = useState(entryForms[0]);
  const [promptLines, setPromptLines] = useState<string[]>([]);
  const [compliment, setCompliment] = useState<string | null>(null);
  const [favoriteLine, setFavoriteLine] = useState("");
  const [entries, setEntries] = useState<EntrySummary[]>([]);
  const [search, setSearch] = useState("");
  const [settings, setSettings] = useState<SettingsPayload>({
    dailyGoalLines: 4,
    timerEnabled: true,
    timezone: "Europe/Moscow",
    remindersEnabled: true,
    reminderTime: "18:00",
    reminderDays: [1, 2, 3, 4, 5, 6, 0]
  });
  const [timerOn, setTimerOn] = useState(false);
  const [timerLeft, setTimerLeft] = useState(600);

  const debouncedText = useDebounce(text);

  const loadToday = async () => {
    const data = await apiFetch<TodayResponse>("/api/today");
    setToday(data);
    setText(data.entry?.text || "");
    setForm((data.entry?.form as (typeof entryForms)[number]) || entryForms[0]);
    setPromptLines([]);
  };

  const loadEntries = async (query = "") => {
    const data = await apiFetch<EntrySummary[]>(
      `/api/entries${query ? `?q=${encodeURIComponent(query)}` : ""}`
    );
    setEntries(data);
  };

  const loadSettings = async () => {
    const data = await apiFetch<SettingsPayload>("/api/settings");
    setSettings(data);
  };

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();

    const init = async () => {
      await apiFetch("/api/webapp/auth/verify", { method: "POST" });
      await loadToday();
      await loadEntries();
      await loadSettings();
    };
    init();
  }, []);

  useEffect(() => {
    if (!today) return;
    if (!debouncedText) return;

    apiFetch("/api/draft", {
      method: "POST",
      body: JSON.stringify({
        date: today.date,
        text: debouncedText,
        form,
        mood: today.prompt.emotion,
        tags: [today.prompt.theme]
      })
    }).catch(() => undefined);
  }, [debouncedText, form, today]);

  useEffect(() => {
    if (!timerOn) return;
    if (timerLeft <= 0) return;
    const tick = setInterval(() => {
      setTimerLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(tick);
  }, [timerOn, timerLeft]);

  const lineCount = useMemo(() => countLines(text), [text]);
  const wordCount = useMemo(() => countWords(text), [text]);
  const syllables = useMemo(() => estimateSyllables(text), [text]);

  const handleStart = () => {
    setView("editor");
    setCompliment(null);
  };

  const handlePromptBoost = () => {
    if (!today) return;
    const key = `pushCount-${today.date}`;
    const current = Number(localStorage.getItem(key) || "0");
    if (current >= 3) return;
    localStorage.setItem(key, String(current + 1));
    setPromptLines(starterLines.slice(0, current + 1));
  };

  const handleFinish = async () => {
    if (!today) return;
    const response = await apiFetch<{ ok: boolean; compliment: string }>("/api/finish", {
      method: "POST",
      body: JSON.stringify({
        date: today.date,
        text,
        form,
        mood: today.prompt.emotion,
        tags: [today.prompt.theme],
        favoriteLine
      })
    });
    setCompliment(response.compliment);
    setView("today");
    await loadToday();
    await loadEntries();
  };

  const handleSettingsSave = async () => {
    await apiFetch("/api/settings", {
      method: "POST",
      body: JSON.stringify(settings)
    });
    await loadToday();
  };

  const handleExport = (entry: EntrySummary) => {
    const blob = new Blob([entry.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-verse-${entry.date}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Daily Verse</h1>
          <p className="muted">Сегодня 4 строки — уже победа.</p>
        </div>
      </header>

      <nav className="tabs">
        <button className={view === "today" ? "active" : ""} onClick={() => setView("today")}>Сегодня</button>
        <button className={view === "editor" ? "active" : ""} onClick={() => setView("editor")}>Редактор</button>
        <button className={view === "library" ? "active" : ""} onClick={() => { setView("library"); loadEntries(search); }}>Библиотека</button>
        <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}>Настройки</button>
      </nav>

      {view === "today" && today && (
        <section className="card">
          <h2>Промпт дня</h2>
          <div className="prompt">
            <div><strong>Тема:</strong> {today.prompt.theme}</div>
            <div><strong>Эмоция:</strong> {today.prompt.emotion}</div>
            <div><strong>Форма:</strong> {today.prompt.form}</div>
            <div><strong>Ограничение:</strong> {today.prompt.constraint}</div>
          </div>

          <div className="progress">
            <span>Строк написано: {today.entry?.lines ?? 0}/{today.dailyGoalLines}</span>
            <button onClick={handleStart}>{today.entry ? "Продолжить" : "Начать"}</button>
          </div>

          <div className="timer">
            <label>
              <input
                type="checkbox"
                checked={settings.timerEnabled}
                onChange={async () => {
                  const next = { ...settings, timerEnabled: !settings.timerEnabled };
                  setSettings(next);
                  await apiFetch("/api/settings", {
                    method: "POST",
                    body: JSON.stringify(next)
                  });
                }}
              />
              Таймер 10 минут
            </label>
            {settings.timerEnabled && (
              <button
                onClick={() => {
                  setTimerOn((prev) => !prev);
                  setTimerLeft(600);
                }}
              >
                {timerOn ? "Стоп" : "Старт"}
              </button>
            )}
            {timerOn && <span>{Math.floor(timerLeft / 60)}:{String(timerLeft % 60).padStart(2, "0")}</span>}
          </div>

          <div className="push">
            <button onClick={handlePromptBoost}>Нужен толчок</button>
            {promptLines.length > 0 && (
              <ul>
                {promptLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>

          {compliment && <div className="compliment">{compliment}</div>}
        </section>
      )}

      {view === "editor" && today && (
        <section className="card">
          <h2>Редактор</h2>
          <div className="form-row">
            <label>Форма</label>
            <select value={form} onChange={(event) => setForm(event.target.value)}>
              {entryForms.map((entryForm) => (
                <option key={entryForm} value={entryForm}>
                  {entryForm}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Напиши минимум 4 строки..."
            rows={10}
          />

          <div className="stats">
            <span>Строки: {lineCount}</span>
            <span>Слова: {wordCount}</span>
            <span>Слоги: {syllables}</span>
          </div>

          <div className="finish">
            <label>Любимая строка</label>
            <input
              value={favoriteLine}
              onChange={(event) => setFavoriteLine(event.target.value)}
              placeholder="Выбери или напиши строку"
            />
            {text.split(/\n+/).filter((line) => line.trim()).length > 0 && (
              <div className="favorite-lines">
                {text
                  .split(/\n+/)
                  .filter((line) => line.trim())
                  .map((line) => (
                    <button key={line} onClick={() => setFavoriteLine(line)}>
                      {line}
                    </button>
                  ))}
              </div>
            )}
            <button onClick={handleFinish}>Завершить</button>
          </div>
        </section>
      )}

      {view === "library" && (
        <section className="card">
          <h2>Библиотека</h2>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              loadEntries(event.target.value);
            }}
            placeholder="Поиск по тексту..."
          />
          <div className="library">
            {entries.map((entry) => (
              <div key={entry.id} className="library-item">
                <div>
                  <strong>{entry.date}</strong>
                  <p>{entry.text.slice(0, 80)}...</p>
                  {entry.favoriteLine && <em>Любимая строка: {entry.favoriteLine}</em>}
                </div>
                <div className="library-actions">
                  <button onClick={() => navigator.clipboard.writeText(entry.text)}>Копировать</button>
                  <button onClick={() => handleExport(entry)}>Экспорт .txt</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {view === "settings" && (
        <section className="card">
          <h2>Настройки</h2>
          <div className="form-row">
            <label>Цель строк</label>
            <select
              value={settings.dailyGoalLines}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, dailyGoalLines: Number(event.target.value) }))
              }
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={14}>14</option>
            </select>
          </div>
          <div className="form-row">
            <label>Таймер</label>
            <input
              type="checkbox"
              checked={settings.timerEnabled}
              onChange={() => setSettings((prev) => ({ ...prev, timerEnabled: !prev.timerEnabled }))}
            />
          </div>
          <div className="form-row">
            <label>Таймзона</label>
            <input
              value={settings.timezone}
              onChange={(event) => setSettings((prev) => ({ ...prev, timezone: event.target.value }))}
            />
          </div>
          <div className="form-row">
            <label>Напоминания</label>
            <input
              type="checkbox"
              checked={settings.remindersEnabled}
              onChange={() =>
                setSettings((prev) => ({ ...prev, remindersEnabled: !prev.remindersEnabled }))
              }
            />
          </div>
          <div className="form-row">
            <label>Время напоминаний</label>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(event) => setSettings((prev) => ({ ...prev, reminderTime: event.target.value }))}
            />
          </div>
          <div className="form-row">
            <label>Дни недели</label>
            <input
              value={settings.reminderDays.join(",")}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  reminderDays: event.target.value
                    .split(",")
                    .map((day) => Number(day.trim()))
                    .filter((day) => !Number.isNaN(day))
                }))
              }
            />
            <span className="muted">0-Вс, 1-Пн ... 6-Сб</span>
          </div>
          <button onClick={handleSettingsSave}>Сохранить</button>
        </section>
      )}
    </div>
  );
};

export default App;
