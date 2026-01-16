<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('entries', function (Blueprint $table) {
            $table->id();
            $table->string('user_telegram_id');
            $table->string('date');
            $table->longText('text');
            $table->string('form');
            $table->string('mood');
            $table->json('tags');
            $table->string('favorite_line')->nullable();
            $table->string('status');
            $table->timestamps();
            $table->unique(['user_telegram_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entries');
    }
};
