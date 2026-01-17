<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { apiFetch } from "../lib/api";
  import { countLines, countWords, estimateSyllables } from "../lib/text";
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

  let view: "today" | "editor" | "library" | "settings" = "today";
  let today: TodayResponse | null = null;
  let text = "";
  let form = entryForms[0];
  let promptLines: string[] = [];
  let compliment: string | null = null;
  let favoriteLine = "";
  let entries: EntrySummary[] = [];
  let search = "";
  let settings: SettingsPayload = {
    dailyGoalLines: 4,
    timerEnabled: true,
    timezone: "Europe/Moscow",
    remindersEnabled: true,
    reminderTime: "18:00",
    reminderDays: [1, 2, 3, 4, 5, 6, 0]
  };
  let timerOn = false;
  let timerLeft = 600;
  let debouncedText = "";
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let lineCount = 0;
  let wordCount = 0;
  let syllables = 0;

  const loadToday = async () => {
    const data = await apiFetch<TodayResponse>("/api/today");
    today = data;
    text = data.entry?.text || "";
    form = (data.entry?.form as (typeof entryForms)[number]) || entryForms[0];
    promptLines = [];
  };

  const loadEntries = async (query = "") => {
    const data = await apiFetch<EntrySummary[]>(
      `/api/entries${query ? `?q=${encodeURIComponent(query)}` : ""}`
    );
    entries = data;
  };

  const loadSettings = async () => {
    const data = await apiFetch<SettingsPayload>("/api/settings");
    settings = data;
  };

  onMount(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();

    const init = async () => {
      await apiFetch("/api/webapp/auth/verify", { method: "POST" });
      await loadToday();
      await loadEntries();
      await loadSettings();
    };
    init();
  });

  $: {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(() => {
      debouncedText = text;
    }, 1500);
  }

  $: if (today && debouncedText) {
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
  }

  $: if (timerOn) {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    timerInterval = setInterval(() => {
      if (timerLeft <= 0) {
        timerOn = false;
        return;
      }
      timerLeft -= 1;
    }, 1000);
  } else if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  $: lineCount = countLines(text);
  $: wordCount = countWords(text);
  $: syllables = estimateSyllables(text);

  const handleStart = () => {
    view = "editor";
    compliment = null;
  };

  const handlePromptBoost = () => {
    if (!today) return;
    const key = `pushCount-${today.date}`;
    const current = Number(localStorage.getItem(key) || "0");
    if (current >= 3) return;
    localStorage.setItem(key, String(current + 1));
    promptLines = starterLines.slice(0, current + 1);
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
    compliment = response.compliment;
    view = "today";
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

  onDestroy(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });
</script>

<div class="app">
  <header class="app__header">
    <div>
      <h1>Daily Verse</h1>
      <p class="muted">Сегодня 4 строки — уже победа.</p>
    </div>
  </header>

  <nav class="tabs">
    <button class:active={view === "today"} on:click={() => (view = "today")}>Сегодня</button>
    <button class:active={view === "editor"} on:click={() => (view = "editor")}>Редактор</button>
    <button
      class:active={view === "library"}
      on:click={() => {
        view = "library";
        loadEntries(search);
      }}
    >
      Библиотека
    </button>
    <button class:active={view === "settings"} on:click={() => (view = "settings")}>Настройки</button>
  </nav>

  {#if view === "today" && today}
    <section class="card">
      <h2>Промпт дня</h2>
      <div class="prompt">
        <div><strong>Тема:</strong> {today.prompt.theme}</div>
        <div><strong>Эмоция:</strong> {today.prompt.emotion}</div>
        <div><strong>Форма:</strong> {today.prompt.form}</div>
        <div><strong>Ограничение:</strong> {today.prompt.constraint}</div>
      </div>

      <div class="progress">
        <span>Строк написано: {today.entry?.lines ?? 0}/{today.dailyGoalLines}</span>
        <button on:click={handleStart}>{today.entry ? "Продолжить" : "Начать"}</button>
      </div>

      <div class="timer">
        <label>
          <input
            type="checkbox"
            bind:checked={settings.timerEnabled}
            on:change={async () => {
              const next = { ...settings, timerEnabled: !settings.timerEnabled };
              settings = next;
              await apiFetch("/api/settings", {
                method: "POST",
                body: JSON.stringify(next)
              });
            }}
          />
          Таймер 10 минут
        </label>
        {#if settings.timerEnabled}
          <button
            on:click={() => {
              timerOn = !timerOn;
              timerLeft = 600;
            }}
          >
            {timerOn ? "Стоп" : "Старт"}
          </button>
        {/if}
        {#if timerOn}
          <span>{Math.floor(timerLeft / 60)}:{String(timerLeft % 60).padStart(2, "0")}</span>
        {/if}
      </div>

      <div class="push">
        <button on:click={handlePromptBoost}>Нужен толчок</button>
        {#if promptLines.length > 0}
          <ul>
            {#each promptLines as line}
              <li>{line}</li>
            {/each}
          </ul>
        {/if}
      </div>

      {#if compliment}
        <div class="compliment">{compliment}</div>
      {/if}
    </section>
  {/if}

  {#if view === "editor" && today}
    <section class="card">
      <h2>Редактор</h2>
      <div class="form-row">
        <label for="entry-form">Форма</label>
        <select id="entry-form" bind:value={form}>
          {#each entryForms as entryForm}
            <option value={entryForm}>{entryForm}</option>
          {/each}
        </select>
      </div>

      <textarea
        bind:value={text}
        placeholder="Напиши минимум 4 строки..."
        rows={10}
      ></textarea>

      <div class="stats">
        <span>Строки: {lineCount}</span>
        <span>Слова: {wordCount}</span>
        <span>Слоги: {syllables}</span>
      </div>

      <div class="finish">
        <label for="favorite-line">Любимая строка</label>
        <input
          id="favorite-line"
          bind:value={favoriteLine}
          placeholder="Выбери или напиши строку"
        />
        {#if text.split(/\n+/).filter((line) => line.trim()).length > 0}
          <div class="favorite-lines">
            {#each text.split(/\n+/).filter((line) => line.trim()) as line}
              <button on:click={() => (favoriteLine = line)}>{line}</button>
            {/each}
          </div>
        {/if}
        <button on:click={handleFinish}>Завершить</button>
      </div>
    </section>
  {/if}

  {#if view === "library"}
    <section class="card">
      <h2>Библиотека</h2>
      <input
        bind:value={search}
        on:input={(event) => {
          const value = (event.target as HTMLInputElement).value;
          search = value;
          loadEntries(value);
        }}
        placeholder="Поиск по тексту..."
      />
      <div class="library">
        {#each entries as entry (entry.id)}
          <div class="library-item">
            <div>
              <strong>{entry.date}</strong>
              <p>{entry.text.slice(0, 80)}...</p>
              {#if entry.favoriteLine}
                <em>Любимая строка: {entry.favoriteLine}</em>
              {/if}
            </div>
            <div class="library-actions">
              <button on:click={() => navigator.clipboard.writeText(entry.text)}>Копировать</button>
              <button on:click={() => handleExport(entry)}>Экспорт .txt</button>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#if view === "settings"}
    <section class="card">
      <h2>Настройки</h2>
      <div class="form-row">
        <label for="daily-goal">Цель строк</label>
        <select
          id="daily-goal"
          bind:value={settings.dailyGoalLines}
          on:change={(event) => {
            settings = {
              ...settings,
              dailyGoalLines: Number((event.target as HTMLSelectElement).value)
            };
          }}
        >
          <option value={4}>4</option>
          <option value={8}>8</option>
          <option value={14}>14</option>
        </select>
      </div>
      <div class="form-row">
        <label for="timer-enabled">Таймер</label>
        <input
          id="timer-enabled"
          type="checkbox"
          bind:checked={settings.timerEnabled}
          on:change={() => {
            settings = { ...settings, timerEnabled: !settings.timerEnabled };
          }}
        />
      </div>
      <div class="form-row">
        <label for="timezone">Таймзона</label>
        <input
          id="timezone"
          value={settings.timezone}
          on:input={(event) => {
            settings = { ...settings, timezone: (event.target as HTMLInputElement).value };
          }}
        />
      </div>
      <div class="form-row">
        <label for="reminders-enabled">Напоминания</label>
        <input
          id="reminders-enabled"
          type="checkbox"
          bind:checked={settings.remindersEnabled}
          on:change={() => {
            settings = { ...settings, remindersEnabled: !settings.remindersEnabled };
          }}
        />
      </div>
      <div class="form-row">
        <label for="reminder-time">Время напоминаний</label>
        <input
          id="reminder-time"
          type="time"
          value={settings.reminderTime}
          on:input={(event) => {
            settings = { ...settings, reminderTime: (event.target as HTMLInputElement).value };
          }}
        />
      </div>
      <div class="form-row">
        <label for="reminder-days">Дни недели</label>
        <input
          id="reminder-days"
          value={settings.reminderDays.join(",")}
          on:input={(event) => {
            const value = (event.target as HTMLInputElement).value;
            settings = {
              ...settings,
              reminderDays: value
                .split(",")
                .map((day) => Number(day.trim()))
                .filter((day) => !Number.isNaN(day))
            };
          }}
        />
        <span class="muted">0-Вс, 1-Пн ... 6-Сб</span>
      </div>
      <button on:click={handleSettingsSave}>Сохранить</button>
    </section>
  {/if}
</div>
