<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;

class BrevoChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toBrevo')) {
            return;
        }

        $apiKey = env('BREVO_API_KEY');
        if (!$apiKey) {
            throw new \RuntimeException('BREVO_API_KEY is not set.');
        }

        $message = $notification->toBrevo($notifiable);

        $resp = Http::withHeaders([
            'accept' => 'application/json',
            'content-type' => 'application/json',
            'api-key' => $apiKey,
        ])->post('https://api.brevo.com/v3/smtp/email', $message);

        if (!$resp->successful()) {
            throw new \RuntimeException('Brevo API error: ' . $resp->status() . ' ' . $resp->body());
        }
    }
}

