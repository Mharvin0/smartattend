<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SecurityAlertService
{
    /**
     * Send a security alert email to the affected user and all Super Admins.
     */
    public static function notifyUserAndAdmins(
        string $subject,
        string $message,
        ?User $affectedUser = null,
        array $metadata = [],
        string $severity = AuditLog::SEVERITY_WARNING
    ): void {
        $recipients = self::buildRecipients($affectedUser);

        foreach ($recipients as $recipient) {
            try {
                // Prefer Brevo API (HTTPS) since SMTP is often blocked on hosts like Railway.
                $sentViaBrevo = BrevoEmailService::sendTextEmail(
                    (string) $recipient['email'],
                    (string) $recipient['name'],
                    $subject,
                    $message
                );

                if (! $sentViaBrevo) {
                    Mail::raw($message, static function ($mail) use ($recipient, $subject): void {
                        $mail
                            ->to($recipient['email'], $recipient['name'])
                            ->subject($subject);
                    });
                }
            } catch (Throwable $e) {
                report($e);
            }
        }

        try {
            AuditLogService::log(
                AuditLog::TYPE_SECURITY_ALERT,
                AuditLog::CATEGORY_SECURITY,
                $subject,
                AuditLog::STATUS_WARNING,
                $severity,
                $metadata
            );
        } catch (Throwable $e) {
            report($e);
        }
    }

    private static function buildRecipients(?User $affectedUser): array
    {
        $recipients = [];

        if ($affectedUser && !empty($affectedUser->email)) {
            $recipients[] = [
                'email' => (string) $affectedUser->email,
                'name' => (string) ($affectedUser->name ?? 'User'),
            ];
        }

        try {
            $superAdmins = User::role('Super Admin')->get(['name', 'email']);
            foreach ($superAdmins as $admin) {
                if (!empty($admin->email)) {
                    $recipients[] = [
                        'email' => (string) $admin->email,
                        'name' => (string) ($admin->name ?? 'Super Admin'),
                    ];
                }
            }
        } catch (Throwable $e) {
            report($e);
        }

        $unique = [];
        $seen = [];
        foreach ($recipients as $recipient) {
            $key = strtolower($recipient['email']);
            if (isset($seen[$key])) {
                continue;
            }
            $seen[$key] = true;
            $unique[] = $recipient;
        }

        return $unique;
    }
}

