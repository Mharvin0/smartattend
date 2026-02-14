<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class BrevoEmailService
{
    /**
     * Send a plain-text transactional email via Brevo API (HTTPS).
     */
    public static function sendTextEmail(string $toEmail, string $toName, string $subject, string $textContent): bool
    {
        $apiKey = (string) config('services.brevo.api_key');
        $fromEmail = (string) config('services.brevo.sender_email');
        $fromName = (string) config('services.brevo.sender_name');

        if ($apiKey === '' || $fromEmail === '') {
            return false;
        }

        try {
            $response = Http::withHeaders([
                'api-key' => $apiKey,
                'accept' => 'application/json',
                'content-type' => 'application/json',
            ])
                ->timeout(15)
                ->post('https://api.brevo.com/v3/smtp/email', [
                    'sender' => [
                        'email' => $fromEmail,
                        'name' => $fromName !== '' ? $fromName : 'SmartAttend',
                    ],
                    'to' => [
                        [
                            'email' => $toEmail,
                            'name' => $toName !== '' ? $toName : $toEmail,
                        ],
                    ],
                    'subject' => $subject,
                    'textContent' => $textContent,
                ]);

            if ($response->successful()) {
                return true;
            }

            Log::warning('BrevoEmailService failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return false;
        } catch (Throwable $e) {
            Log::warning('BrevoEmailService exception', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
}

