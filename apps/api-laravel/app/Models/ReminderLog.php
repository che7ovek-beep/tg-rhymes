<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReminderLog extends Model
{
    protected $fillable = [
        'user_telegram_id',
        'date',
        'scheduled_at',
        'sent_at',
        'status',
        'error_code',
        'error_message'
    ];
}
