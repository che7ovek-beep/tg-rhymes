<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $primaryKey = 'telegram_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'telegram_id',
        'timezone',
        'language',
        'daily_goal_lines',
        'timer_enabled',
        'reminders_enabled',
        'reminder_time',
        'reminder_days',
        'soft_skip_used_at',
        'last_reminded_at'
    ];
}
