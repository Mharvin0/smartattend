<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Services\BrevoEmailService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Auth\Notifications\ResetPassword;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'department_id',
        'optional_department_id',
        'program_id',
        'password_changed_at',
        'last_login_ip',
        'last_login_user_agent',
        'last_login_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'password_changed_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Get the sections assigned to this teacher.
     */
    public function sections(): BelongsToMany
    {
        return $this->belongsToMany(Section::class, 'teacher_sections', 'teacher_id', 'section_id')
                    ->withPivot('subject')
                    ->withTimestamps();
    }

    /**
     * Get the department that this user belongs to.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the optional second department that this user belongs to.
     */
    public function optionalDepartment()
    {
        return $this->belongsTo(Department::class, 'optional_department_id');
    }

    /**
     * Get all department IDs assigned to this user (primary and optional).
     */
    public function getAssignedDepartmentIds()
    {
        $departments = [];
        if ($this->department_id) {
            $departments[] = $this->department_id;
        }
        if ($this->optional_department_id) {
            $departments[] = $this->optional_department_id;
        }
        return $departments;
    }

    /**
     * Get the program that this user belongs to.
     */
    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    /**
     * Send the password reset notification (via Brevo API).
     *
     * This keeps password reset working in production environments where SMTP ports are blocked.
     */
    public function sendPasswordResetNotification($token): void
    {
        try {
            $resetUrl = url(route('password.reset', ['token' => $token, 'email' => $this->email], false));
            $subject = 'Reset your SmartAttend password';
            $body = "We received a request to reset your SmartAttend password.\n\n"
                . "Reset link:\n{$resetUrl}\n\n"
                . "If you did not request a password reset, you can ignore this email.";

            $sentViaBrevo = BrevoEmailService::sendTextEmail(
                (string) $this->email,
                (string) ($this->name ?? $this->email),
                $subject,
                $body
            );

            if ($sentViaBrevo) {
                return;
            }
        } catch (\Throwable $e) {
            report($e);
        }

        // Fallback to Laravel's default notification (may rely on SMTP).
        $this->notify(new ResetPassword($token));
    }
}
