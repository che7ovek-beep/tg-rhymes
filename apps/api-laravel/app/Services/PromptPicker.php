<?php

namespace App\Services;

class PromptPicker
{
    public function pick(string $date): array
    {
        $prompts = config('prompts.items', []);
        if (count($prompts) === 0) {
            return ['date' => $date];
        }
        $parts = array_map('intval', explode('-', $date));
        $seed = array_sum($parts);
        $index = $seed % count($prompts);
        $prompt = $prompts[$index];

        return array_merge(['date' => $date], $prompt);
    }
}