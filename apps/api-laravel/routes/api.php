<?php

use App\Http\Middleware\BotServiceTokenMiddleware;
use App\Models\Entry;
use App\Models\Prompt;
use App\Models\ReminderLog;
use App\Models\User;
use App\Services\TelegramInitDataVerifier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use RuntimeException;

Route::post('/webapp/auth/verify', function (Request $request) {
    $initData = $request->header('x-telegram-init-data');
    $verifier = app(TelegramInitDataVerifier::class);
    try {
        $payload = $verifier->verify($initData);
    } catch (RuntimeException $exception) {
        return response()->json(['error' => $exception->getMessage()], 401);
    }

    $user = User::firstOrCreate(
        ['telegram_id' => $payload['user']['id']],
        [
            'timezone' => $payload['user']['timezone'] ?? 'Europe/Moscow',
            'language' => $payload['user']['language_code'] ?? 'ru',
            'daily_goal_lines' => 4,
            'timer_enabled' => true,
            'reminders_enabled' => true,
            'reminder_time' => '18:00',
            'reminder_days' => json_encode([1,2,3,4,5,6,0])
        ]
    );

    return response()->json([
        'user' => [
            'telegramId' => $user->telegram_id,
            'language' => $user->language,
            'timezone' => $user->timezone
        ],
        'settings' => [
            'dailyGoalLines' => $user->daily_goal_lines,
            'timerEnabled' => (bool) $user->timer_enabled,
            'timezone' => $user->timezone,
            'remindersEnabled' => (bool) $user->reminders_enabled,
            'reminderTime' => $user->reminder_time,
            'reminderDays' => json_decode($user->reminder_days, true) ?? []
        ]
    ]);
});

Route::middleware('webapp.init')->group(function () {
    Route::get('/today', function (Request $request) {
        $user = $request->attributes->get('telegramUser');
        $record = User::where('telegram_id', $user['id'])->firstOrFail();

        $today = Carbon::now($record->timezone)->format('Y-m-d');
        $prompt = Prompt::firstOrCreate(
            ['date' => $today],
            config('prompts.pick')($today)
        );

        $entry = Entry::where('user_telegram_id', $record->telegram_id)
            ->where('date', $today)
            ->first();

        $lines = $entry ? count(array_filter(preg_split("/\n+/", $entry->text))) : 0;

        return response()->json([
            'date' => $today,
            'prompt' => $prompt,
            'entry' => $entry ? [
                'status' => $entry->status,
                'text' => $entry->text,
                'form' => $entry->form,
                'mood' => $entry->mood,
                'favoriteLine' => $entry->favorite_line,
                'lines' => $lines
            ] : null,
            'dailyGoalLines' => $record->daily_goal_lines,
            'timerEnabled' => (bool) $record->timer_enabled
        ]);
    });

    Route::post('/draft', function (Request $request) {
        $user = $request->attributes->get('telegramUser');
        $record = User::where('telegram_id', $user['id'])->firstOrFail();
        $data = $request->validate([
            'date' => ['required', 'string'],
            'text' => ['required', 'string'],
            'form' => ['required', 'string'],
            'mood' => ['nullable', 'string'],
            'tags' => ['array']
        ]);

        $entry = Entry::updateOrCreate(
            ['user_telegram_id' => $record->telegram_id, 'date' => $data['date']],
            [
                'text' => $data['text'],
                'form' => $data['form'],
                'mood' => $data['mood'] ?? '',
                'tags' => json_encode($data['tags'] ?? []),
                'status' => 'draft'
            ]
        );

        return response()->json(['ok' => true, 'id' => $entry->id]);
    });

    Route::post('/finish', function (Request $request) {
        $user = $request->attributes->get('telegramUser');
        $record = User::where('telegram_id', $user['id'])->firstOrFail();
        $data = $request->validate([
            'date' => ['required', 'string'],
            'text' => ['required', 'string'],
            'form' => ['required', 'string'],
            'mood' => ['nullable', 'string'],
            'tags' => ['array'],
            'favoriteLine' => ['nullable', 'string']
        ]);

        $entry = Entry::updateOrCreate(
            ['user_telegram_id' => $record->telegram_id, 'date' => $data['date']],
            [
                'text' => $data['text'],
                'form' => $data['form'],
                'mood' => $data['mood'] ?? '',
                'tags' => json_encode($data['tags'] ?? []),
                'favorite_line' => $data['favoriteLine'] ?? null,
                'status' => 'done'
            ]
        );

        $compliment = strlen($data['text']) > 120
            ? 'Ты держишь фокус и развиваешь образ — это чувствуется.'
            : 'Есть ясный образ и тепло в строках — продолжай.';

        return response()->json(['ok' => true, 'id' => $entry->id, 'compliment' => $compliment]);
    });

    Route::get('/entries', function (Request $request) {
        $user = $request->attributes->get('telegramUser');
        $record = User::where('telegram_id', $user['id'])->firstOrFail();
        $query = $request->query('q');

        $entries = Entry::where('user_telegram_id', $record->telegram_id)
            ->when($query, fn ($q) => $q->where('text', 'like', "%{$query}%"))
            ->orderByDesc('date')
            ->get();

        return response()->json($entries->map(fn ($entry) => [
            'id' => $entry->id,
            'date' => $entry->date,
            'status' => $entry->status,
            'text' => $entry->text,
            'favoriteLine' => $entry->favorite_line
        ]));
    });

    Route::get('/entries/{date}', function (Request $request, string $date) {
        $user = $request->attributes->get('telegramUser');
        $record = User::where('telegram_id', $user['id'])->firstOrFail();
        $entry = Entry::where('user_telegram_id', $record->telegram_id)
            ->where('date', $date)
            ->firstOrFail();

        return response()->json([
            'date' => $entry->date,
            'text' => $entry->text,
            'form' => $entry->form,
            'mood' => $entry->mood,
            'tags' => json_decode($entry->tags, true) ?? [],
            'favoriteLine' => $entry->favorite_line,
            'status' => $entry->status
        ]);
    });

    Route::get('/settings', function (Request $request) {
        $user = $request->attributes->get('telegramUser');
        $record = User::where('telegram_id', $user['id'])->firstOrFail();

        return response()->json([
            'dailyGoalLines' => $record->daily_goal_lines,
            'timerEnabled' => (bool) $record->timer_enabled,
            'timezone' => $record->timezone,
            'remindersEnabled' => (bool) $record->reminders_enabled,
            'reminderTime' => $record->reminder_time,
            'reminderDays' => json_decode($record->reminder_days, true) ?? []
        ]);
    });

    Route::post('/settings', function (Request $request) {
        $user = $request->attributes->get('telegramUser');
        $record = User::where('telegram_id', $user['id'])->firstOrFail();
        $data = $request->validate([
            'dailyGoalLines' => ['required', 'integer', 'min:4'],
            'timerEnabled' => ['required', 'boolean'],
            'timezone' => ['required', 'string'],
            'remindersEnabled' => ['required', 'boolean'],
            'reminderTime' => ['required', 'string'],
            'reminderDays' => ['required', 'array']
        ]);

        $record->update([
            'daily_goal_lines' => $data['dailyGoalLines'],
            'timer_enabled' => $data['timerEnabled'],
            'timezone' => $data['timezone'],
            'reminders_enabled' => $data['remindersEnabled'],
            'reminder_time' => $data['reminderTime'],
            'reminder_days' => json_encode($data['reminderDays'])
        ]);

        return response()->json(['ok' => true]);
    });
});

Route::middleware(BotServiceTokenMiddleware::class)->prefix('/internal')->group(function () {
    Route::get('/reminders/due', function () {
        $now = Carbon::now();
        $results = [];

        $users = User::where('reminders_enabled', true)->get();

        foreach ($users as $user) {
            $local = $now->copy()->setTimezone($user->timezone);
            $timeMatch = $local->format('H:i') === $user->reminder_time;
            $day = (int) $local->format('w');
            $days = json_decode($user->reminder_days, true) ?? [];

            if (!$timeMatch || !in_array($day, $days, true)) {
                continue;
            }

            $date = $local->format('Y-m-d');
            $entry = Entry::where('user_telegram_id', $user->telegram_id)
                ->where('date', $date)
                ->where('status', 'done')
                ->first();

            if ($entry) {
                continue;
            }

            $log = ReminderLog::firstOrCreate(
                ['user_telegram_id' => $user->telegram_id, 'date' => $date],
                [
                    'scheduled_at' => $local->toDateTimeString(),
                    'status' => 'pending'
                ]
            );

            if ($log->status !== 'pending') {
                continue;
            }

            $results[] = [
                'telegramId' => $user->telegram_id,
                'locale' => $user->language,
                'deeplinkUrl' => rtrim(config('app.webapp_url'), '/') . '/?startapp=today',
                'messageText' => 'Пара тихих строк для себя — всего 4 строки?',
                'reminderKey' => (string) $log->id
            ];
        }

        return response()->json($results);
    });

    Route::post('/reminders/report', function (Request $request) {
        $data = $request->validate([
            'reminderKey' => ['required', 'string'],
            'status' => ['required', 'string'],
            'error_code' => ['nullable', 'string'],
            'error_message' => ['nullable', 'string']
        ]);

        $log = ReminderLog::findOrFail($data['reminderKey']);
        if ($log->status !== 'pending') {
            return response()->json(['ok' => false, 'reason' => 'already_reported'], 409);
        }

        $log->update([
            'status' => $data['status'],
            'sent_at' => Carbon::now(),
            'error_code' => $data['error_code'],
            'error_message' => $data['error_message'] ? substr($data['error_message'], 0, 255) : null
        ]);

        User::where('telegram_id', $log->user_telegram_id)
            ->update(['last_reminded_at' => Carbon::now()]);

        return response()->json(['ok' => true]);
    });

    Route::get('/bot/deeplink', function (Request $request) {
        $target = $request->query('target', 'home');
        $base = rtrim(config('app.webapp_url'), '/');
        $url = $target === 'today' ? "$base/?startapp=today" : $base;

        return response()->json(['url' => $url]);
    });

    Route::get('/users/{telegramId}/streak', function (string $telegramId) {
        $entries = Entry::where('user_telegram_id', $telegramId)
            ->where('status', 'done')
            ->orderByDesc('date')
            ->get();

        $current = 0;
        $best = 0;
        $lastDate = null;

        foreach ($entries as $entry) {
            if (!$lastDate) {
                $current = 1;
                $best = 1;
                $lastDate = $entry->date;
                continue;
            }

            $diff = Carbon::parse($lastDate)->diffInDays(Carbon::parse($entry->date));
            if ($diff === 1) {
                $current += 1;
            } else {
                break;
            }
            $best = max($best, $current);
            $lastDate = $entry->date;
        }

        return response()->json(['current' => $current, 'best' => $best]);
    });

    Route::post('/users/{telegramId}/reminders', function (Request $request, string $telegramId) {
        $data = $request->validate([
            'remindersEnabled' => ['required', 'boolean']
        ]);

        $user = User::where('telegram_id', $telegramId)->firstOrFail();
        $user->update(['reminders_enabled' => $data['remindersEnabled']]);

        return response()->json(['ok' => true]);
    });
});
