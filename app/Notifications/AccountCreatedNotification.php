<?php

namespace App\Notifications;

use App\Notifications\Channels\BrevoChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountCreatedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $plainPassword,
        private readonly ?string $roleName = null,
        private readonly ?string $departmentName = null,
        private readonly ?string $optionalDepartmentName = null,
        private readonly ?string $programName = null,
        private readonly ?string $createdByName = null,
        private readonly ?string $createdByEmail = null,
        private readonly ?string $createdByRole = null,
    ) {}

    public function via(object $notifiable): array
    {
        // Prefer Brevo API (HTTPS/443) if configured; fallback to SMTP mailer.
        return env('BREVO_API_KEY') ? [BrevoChannel::class] : ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $loginUrl = url('/login');

        $mail = (new MailMessage)
            ->subject('Your SmartAttend account has been created')
            ->greeting('Hello ' . ($notifiable->name ?? 'there') . '!')
            ->line('An account has been created for you on SmartAttend.')
            ->line('Created by: ' . ($this->createdByName ?: 'System'))
            ->line($this->createdByEmail ? ('Creator Email: ' . $this->createdByEmail) : 'Creator Email: N/A')
            ->line($this->createdByRole ? ('Creator Role: ' . $this->createdByRole) : 'Creator Role: N/A')
            ->line('Here are your account details:')
            ->line('Email: ' . ($notifiable->email ?? 'N/A'));

        if (!empty($this->roleName)) {
            $mail->line('Role: ' . $this->roleName);
        }
        if (!empty($this->departmentName)) {
            $mail->line('Department: ' . $this->departmentName);
        }
        if (!empty($this->optionalDepartmentName)) {
            $mail->line('Optional Department: ' . $this->optionalDepartmentName);
        }
        if (!empty($this->programName)) {
            $mail->line('Program: ' . $this->programName);
        }

        $mail
            ->line('Temporary Password: ' . $this->plainPassword)
            ->action('Login to SmartAttend', $loginUrl)
            ->line('For your security, please change your password after logging in.');

        return $mail;
    }

    /**
     * Brevo API payload.
     * Docs: https://developers.brevo.com/docs/send-a-transactional-email
     */
    public function toBrevo(object $notifiable): array
    {
        $fromEmail = env('BREVO_SENDER_EMAIL', config('mail.from.address'));
        $fromName = env('BREVO_SENDER_NAME', config('mail.from.name', 'SmartAttend'));

        if (!$fromEmail) {
            throw new \RuntimeException('BREVO_SENDER_EMAIL or MAIL_FROM_ADDRESS must be set.');
        }

        $loginUrl = url('/login');

        $lines = [];
        $lines[] = 'Hello ' . ($notifiable->name ?? 'there') . '!';
        $lines[] = '';
        $lines[] = 'An account has been created for you on SmartAttend.';
        $lines[] = 'Created by: ' . ($this->createdByName ?: 'System');
        $lines[] = 'Creator Email: ' . ($this->createdByEmail ?: 'N/A');
        $lines[] = 'Creator Role: ' . ($this->createdByRole ?: 'N/A');
        $lines[] = '';
        $lines[] = 'Account Details:';
        $lines[] = 'Email: ' . ($notifiable->email ?? 'N/A');
        if (!empty($this->roleName)) $lines[] = 'Role: ' . $this->roleName;
        if (!empty($this->departmentName)) $lines[] = 'Department: ' . $this->departmentName;
        if (!empty($this->optionalDepartmentName)) $lines[] = 'Optional Department: ' . $this->optionalDepartmentName;
        if (!empty($this->programName)) $lines[] = 'Program: ' . $this->programName;
        $lines[] = '';
        $lines[] = 'Temporary Password: ' . $this->plainPassword;
        $lines[] = '';
        $lines[] = 'Login: ' . $loginUrl;
        $lines[] = 'For your security, please change your password after logging in.';

        $text = implode("\n", $lines);
        $html = nl2br(e($text));

        return [
            'sender' => [
                'name' => $fromName,
                'email' => $fromEmail,
            ],
            'to' => [
                [
                    'email' => $notifiable->email ?? '',
                    'name' => $notifiable->name ?? '',
                ],
            ],
            'subject' => 'Your SmartAttend account has been created',
            'htmlContent' => '<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5;">' . $html . '</div>',
            'textContent' => $text,
        ];
    }
}

