<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->string('telegram_id')->primary();
            $table->string('timezone');
            $table->string('language');
            $table->unsignedInteger('daily_goal_lines');
            $table->boolean('timer_enabled')->default(true);
            $table->boolean('reminders_enabled')->default(true);
            $table->string('reminder_time');
            $table->json('reminder_days');
            $table->timestamp('soft_skip_used_at')->nullable();
            $table->timestamp('last_reminded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
