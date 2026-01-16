<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class BotServiceTokenMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        if (!$token || $token !== env('BOT_SERVICE_TOKEN')) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        return $next($request);
    }
}
