<?php

namespace App\Http;

use App\Http\Middleware\WebAppInitMiddleware;
use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    protected $middlewareAliases = [
        'webapp.init' => WebAppInitMiddleware::class
    ];
}
