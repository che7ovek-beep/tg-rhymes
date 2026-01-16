<?php

namespace App\Http\Middleware;

use App\Services\TelegramInitDataVerifier;
use Closure;
use Illuminate\Http\Request;
use RuntimeException;

class WebAppInitMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $initData = $request->header('x-telegram-init-data');
        $verifier = app(TelegramInitDataVerifier::class);
        try {
            $payload = $verifier->verify($initData);
            $request->attributes->set('telegramUser', $payload['user']);
        } catch (RuntimeException $exception) {
            return response()->json(['error' => $exception->getMessage()], 401);
        }

        return $next($request);
    }
}
