<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('prompts', function (Blueprint $table) {
            $table->string('date')->primary();
            $table->string('theme');
            $table->string('emotion');
            $table->string('form');
            $table->string('constraint');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prompts');
    }
};
