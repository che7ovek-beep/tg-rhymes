<?php

namespace Tests\Feature;

use App\Services\TelegramInitDataVerifier;
use PHPUnit\Framework\TestCase;

class TelegramInitDataVerifierTest extends TestCase
{
    private function buildInitData(array $payload, string $botToken): string
    {
        $data = $payload;
        $data['auth_date'] = $data['auth_date'] ?? time();
        $data['user'] = json_encode($data['user']);

        ksort($data);
        $pairs = [];
        foreach ($data as $key => $value) {
            $pairs[] = $key . '=' . $value;
        }
        $checkData = implode("\n", $pairs);

        $secret = hash_hmac('sha256', $botToken, 'WebAppData', true);
        $hash = hash_hmac('sha256', $checkData, $secret);
        $data['hash'] = $hash;

        return http_build_query($data);
    }

    public function test_valid_signature(): void
    {
        $botToken = 'test:token';
        putenv("BOT_TOKEN={$botToken}");
        $initData = $this->buildInitData([
            'user' => ['id' => 123, 'language_code' => 'ru']
        ], $botToken);

        $verifier = new TelegramInitDataVerifier();
        $payload = $verifier->verify($initData);

        $this->assertSame('123', $payload['user']['id']);
    }

    public function test_invalid_signature(): void
    {
        $botToken = 'test:token';
        putenv("BOT_TOKEN={$botToken}");
        $initData = $this->buildInitData([
            'user' => ['id' => 123, 'language_code' => 'ru']
        ], 'wrong-token');

        $this->expectExceptionMessage('initData invalid');
        $verifier = new TelegramInitDataVerifier();
        $verifier->verify($initData);
    }

    public function test_expired_auth_date(): void
    {
        $botToken = 'test:token';
        putenv("BOT_TOKEN={$botToken}");
        $initData = $this->buildInitData([
            'auth_date' => time() - 60 * 60 * 48,
            'user' => ['id' => 123, 'language_code' => 'ru']
        ], $botToken);

        $this->expectExceptionMessage('initData expired');
        $verifier = new TelegramInitDataVerifier();
        $verifier->verify($initData);
    }
}
