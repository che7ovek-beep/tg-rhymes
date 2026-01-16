<?php

namespace App\Services;

use RuntimeException;

class TelegramInitDataVerifier
{
    public function verify(?string $initData): array
    {
        if (!$initData) {
            throw new RuntimeException('initData missing');
        }

        parse_str($initData, $data);
        $hash = $data['hash'] ?? null;
        if (!$hash) {
            throw new RuntimeException('hash missing');
        }

        $filtered = $data;
        unset($filtered['hash']);
        ksort($filtered);
        $pairs = [];
        foreach ($filtered as $key => $value) {
            $pairs[] = $key . '=' . $value;
        }
        $checkData = implode("\n", $pairs);

        $secret = hash_hmac('sha256', env('BOT_TOKEN', ''), 'WebAppData', true);
        $signature = hash_hmac('sha256', $checkData, $secret);

        if (!hash_equals($signature, $hash)) {
            throw new RuntimeException('initData invalid');
        }

        $authDate = (int) ($data['auth_date'] ?? 0);
        if ($authDate && (time() - $authDate) > 60 * 60 * 24) {
            throw new RuntimeException('initData expired');
        }

        $user = json_decode($data['user'] ?? '{}', true);
        if (!isset($user['id'])) {
            throw new RuntimeException('user missing');
        }

        return [
            'user' => [
                'id' => (string) $user['id'],
                'first_name' => $user['first_name'] ?? null,
                'last_name' => $user['last_name'] ?? null,
                'username' => $user['username'] ?? null,
                'language_code' => $user['language_code'] ?? 'ru'
            ],
            'auth_date' => $authDate
        ];
    }
}
