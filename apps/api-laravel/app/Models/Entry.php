<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Entry extends Model
{
    protected $fillable = [
        'user_telegram_id',
        'date',
        'text',
        'form',
        'mood',
        'tags',
        'favorite_line',
        'status'
    ];
}
