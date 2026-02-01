<?php

namespace App\Notifications;

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
        return ['mail'];
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
}

