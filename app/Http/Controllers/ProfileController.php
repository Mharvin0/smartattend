<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\BrevoEmailService;
use App\Services\AuditLogService;
use App\Services\SecurityAlertService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ProfileController extends Controller
{
    private const EMAIL_CHANGE_CODE_SESSION_KEY = 'profile.email_change_verification';
    private const EMAIL_CHANGE_CODE_TTL_MINUTES = 5;
    private const EMAIL_CHANGE_CODE_RESEND_COOLDOWN_SECONDS = 60;
    private const EMAIL_CHANGE_CODE_MAX_FAILED_ATTEMPTS = 5;

    private const SUPERADMIN_TRANSFER_CODE_SESSION_KEY = 'profile.superadmin_transfer_verification';
    private const SUPERADMIN_TRANSFER_CODE_TTL_MINUTES = 5;
    private const SUPERADMIN_TRANSFER_CODE_RESEND_COOLDOWN_SECONDS = 60;
    private const SUPERADMIN_TRANSFER_CODE_MAX_FAILED_ATTEMPTS = 5;

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'emailChangeCodeTtlMinutes' => self::EMAIL_CHANGE_CODE_TTL_MINUTES,
            'superAdminTransferCodeTtlMinutes' => self::SUPERADMIN_TRANSFER_CODE_TTL_MINUTES,
        ]);
    }

    /**
     * Send a one-time verification code to the CURRENT Super Admin email
     * to confirm transferring full account ownership (email + password access)
     * to a new email address.
     *
     * Unlike role transfer, this does NOT require the target email to already
     * exist as a user in the system.
     */
    public function sendSuperAdminTransferCode(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('Super Admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'new_superadmin_email' => ['required', 'email'],
        ]);

        $targetEmail = strtolower(trim((string) $validated['new_superadmin_email']));
        $currentEmail = strtolower((string) $user->email);

        if ($targetEmail === '' || $targetEmail === $currentEmail) {
            throw ValidationException::withMessages([
                'new_superadmin_email' => 'Please enter a different email address than the current Super Admin.',
            ]);
        }

        $existingPayload = (array) $request->session()->get(self::SUPERADMIN_TRANSFER_CODE_SESSION_KEY, []);
        $sentAt = (int) ($existingPayload['sent_at'] ?? 0);

        if ($sentAt > 0) {
            $cooldownEndsAt = $sentAt + self::SUPERADMIN_TRANSFER_CODE_RESEND_COOLDOWN_SECONDS;
            if (now()->timestamp < $cooldownEndsAt) {
                $remaining = $cooldownEndsAt - now()->timestamp;
                return Redirect::route('profile.edit')->with('status', "superadmin-transfer-code-cooldown:{$remaining}");
            }
        }

        $verificationCode = (string) random_int(100000, 999999);

        $request->session()->put(self::SUPERADMIN_TRANSFER_CODE_SESSION_KEY, [
            'hash' => hash('sha256', $verificationCode),
            'expires_at' => now()->addMinutes(self::SUPERADMIN_TRANSFER_CODE_TTL_MINUTES)->timestamp,
            'current_email' => $currentEmail,
            'target_email' => $targetEmail,
            'attempts' => 0,
            'sent_at' => now()->timestamp,
        ]);

        try {
            $subject = 'SmartAttend Super Admin transfer verification code';
            $body = "You requested to transfer Super Admin ownership.\n\n"
                . "Verification code: {$verificationCode}\n"
                . "Expires in " . self::SUPERADMIN_TRANSFER_CODE_TTL_MINUTES . " minutes.\n\n"
                . "If you did not request this, secure your account immediately.";

            $sentViaBrevo = BrevoEmailService::sendTextEmail(
                (string) $user->email,
                (string) $user->name,
                $subject,
                $body
            );

            if (! $sentViaBrevo) {
                Mail::raw($body, static function ($message) use ($user, $subject): void {
                    $message->to($user->email, $user->name)->subject($subject);
                });
            }
        } catch (Throwable $e) {
            report($e);
            return Redirect::route('profile.edit')->with('status', 'superadmin-transfer-code-send-failed');
        }

        return Redirect::route('profile.edit')->with('status', 'superadmin-transfer-code-sent');
    }

    /**
     * Confirm and execute Super Admin ownership transfer.
     *
     * In this flow we are NOT passing the role to a different user record.
     * Instead, we treat this as a full account ownership handoff:
     * - The CURRENT Super Admin account keeps its roles.
     * - The account's email is changed to the new owner email.
     * - A password reset link is sent to the NEW email so the new owner
     *   can set a password and log in to this same account.
     */
    public function confirmSuperAdminTransfer(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole('Super Admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'new_superadmin_email' => ['required', 'email'],
            'superadmin_transfer_code' => ['required', 'string'],
        ]);

        $targetEmail = strtolower(trim((string) $validated['new_superadmin_email']));
        $currentEmail = strtolower((string) $user->email);

        $this->assertSuperAdminTransferCodeIsValid($request, $currentEmail, $targetEmail);
        $request->session()->forget(self::SUPERADMIN_TRANSFER_CODE_SESSION_KEY);

        DB::transaction(function () use ($user, $targetEmail): void {
            $userId       = (int) $user->id;
            $previousEmail = (string) $user->email;

            // Hand off ownership by changing the Super Admin account's email
            // to the new owner email. Roles stay on this same account.
            $user->forceFill([
                'email' => $targetEmail,
                'email_verified_at' => null,
            ])->save();

            // Send the new owner a password reset link for THIS account.
            try {
                $token    = Password::broker()->createToken($user);
                $resetUrl = url(route('password.reset', ['token' => $token, 'email' => $user->email], false));

                $subject = 'You are now the SmartAttend Super Admin';
                $body    = "You now control the SmartAttend Super Admin account.\n\n"
                    . "To secure the account, please set a new password using this link:\n{$resetUrl}\n\n"
                    . "This reset does not require the previous password — you will set a new one.\n\n"
                    . "If you did not expect this, contact support immediately.";

                BrevoEmailService::sendTextEmail((string) $user->email, (string) $user->name, $subject, $body);
            } catch (Throwable $e) {
                report($e);
            }

            // Security alert (generic; do not include emails).
            try {
                SecurityAlertService::notifyUserAndAdmins(
                    'SmartAttend security alert: Super Admin ownership transferred',
                    "Super Admin ownership was transferred.\n\nIf you did not authorize this action, contact support immediately.",
                    $user,
                    [
                        'event'        => 'superadmin_ownership_transferred',
                        'from_user_id' => $userId,
                        'previous_email' => $previousEmail,
                        'new_email'      => $targetEmail,
                    ],
                    AuditLog::SEVERITY_CRITICAL
                );
            } catch (Throwable $e) {
                report($e);
            }
        });

        return Redirect::route('profile.edit')->with('status', 'superadmin-ownership-transferred');
    }

    /**
     * Send a one-time verification code to the current email.
     */
    public function sendEmailChangeCode(Request $request): RedirectResponse
    {
        $user = $request->user();
        $existingPayload = (array) $request->session()->get(self::EMAIL_CHANGE_CODE_SESSION_KEY, []);
        $sentAt = (int) ($existingPayload['sent_at'] ?? 0);

        if ($sentAt > 0) {
            $cooldownEndsAt = $sentAt + self::EMAIL_CHANGE_CODE_RESEND_COOLDOWN_SECONDS;
            if (now()->timestamp < $cooldownEndsAt) {
                $remaining = $cooldownEndsAt - now()->timestamp;
                return Redirect::route('profile.edit')->with('status', "email-change-code-cooldown:{$remaining}");
            }
        }

        $verificationCode = (string) random_int(100000, 999999);

        $request->session()->put(self::EMAIL_CHANGE_CODE_SESSION_KEY, [
            'hash' => hash('sha256', $verificationCode),
            'expires_at' => now()->addMinutes(self::EMAIL_CHANGE_CODE_TTL_MINUTES)->timestamp,
            'email' => strtolower((string) $user->email),
            'attempts' => 0,
            'sent_at' => now()->timestamp,
        ]);

        try {
            $subject = 'SmartAttend email change verification code';
            $body = "Your SmartAttend verification code is: {$verificationCode}\n\n"
                . "This code expires in " . self::EMAIL_CHANGE_CODE_TTL_MINUTES . " minutes.\n"
                . "If you did not request this, please secure your account immediately.";

            $sentViaBrevo = BrevoEmailService::sendTextEmail(
                (string) $user->email,
                (string) $user->name,
                $subject,
                $body
            );

            if (! $sentViaBrevo) {
                Mail::raw(
                    $body,
                    static function ($message) use ($user, $subject): void {
                        $message
                            ->to($user->email, $user->name)
                            ->subject($subject);
                    }
                );
            }
        } catch (Throwable $e) {
            report($e);
            return Redirect::route('profile.edit')->with('status', 'email-change-code-send-failed');
        }

        return Redirect::route('profile.edit')->with('status', 'email-change-code-sent');
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $newEmail = strtolower((string) $validated['email']);
        $currentEmail = strtolower((string) $user->email);
        $isChangingEmail = $newEmail !== $currentEmail;
        $previousEmail = (string) $user->email;

        if ($isChangingEmail) {
            $this->assertEmailChangeCodeIsValid($request, $currentEmail);
            $request->session()->forget(self::EMAIL_CHANGE_CODE_SESSION_KEY);
        }

        unset($validated['email_change_code']);
        $user->fill($validated);

        if ($isChangingEmail) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($isChangingEmail) {
            // Notify both addresses without exposing any replaced email in the message body.
            $this->sendEmailChangedNotice($previousEmail, (string) $user->name);
            $this->sendEmailChangedNotice((string) $user->email, (string) $user->name);

            SecurityAlertService::notifyUserAndAdmins(
                'SmartAttend security alert: Email changed',
                "Your SmartAttend account email was changed.\n\n"
                . "If this was not you, please reset your password immediately and contact support.",
                $user,
                ['event' => 'email_changed'],
                AuditLog::SEVERITY_WARNING
            );
        }

        return Redirect::route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    private function assertEmailChangeCodeIsValid(Request $request, string $expectedEmail): void
    {
        $submittedCode = (string) $request->input('email_change_code', '');
        $payload = (array) $request->session()->get(self::EMAIL_CHANGE_CODE_SESSION_KEY, []);

        if ($submittedCode === '') {
            throw ValidationException::withMessages([
                'email_change_code' => 'Verification code is required to change your email.',
            ]);
        }

        if (!preg_match('/^\d{6}$/', $submittedCode)) {
            throw ValidationException::withMessages([
                'email_change_code' => 'Verification code must be a 6-digit number.',
            ]);
        }

        if (
            empty($payload['hash'])
            || empty($payload['expires_at'])
            || empty($payload['email'])
            || strtolower((string) $payload['email']) !== strtolower($expectedEmail)
        ) {
            throw ValidationException::withMessages([
                'email_change_code' => 'Request a new verification code before changing your email.',
            ]);
        }

        if ((int) $payload['expires_at'] < now()->timestamp) {
            $request->session()->forget(self::EMAIL_CHANGE_CODE_SESSION_KEY);
            throw ValidationException::withMessages([
                'email_change_code' => 'Verification code expired. Request a new one and try again.',
            ]);
        }

        $attempts = (int) ($payload['attempts'] ?? 0);
        if ($attempts >= self::EMAIL_CHANGE_CODE_MAX_FAILED_ATTEMPTS) {
            $request->session()->forget(self::EMAIL_CHANGE_CODE_SESSION_KEY);
            throw ValidationException::withMessages([
                'email_change_code' => 'Too many failed attempts. Request a new verification code.',
            ]);
        }

        $submittedHash = hash('sha256', $submittedCode);
        if (!hash_equals((string) $payload['hash'], $submittedHash)) {
            $payload['attempts'] = $attempts + 1;
            $request->session()->put(self::EMAIL_CHANGE_CODE_SESSION_KEY, $payload);

            if ($payload['attempts'] >= self::EMAIL_CHANGE_CODE_MAX_FAILED_ATTEMPTS) {
                $request->session()->forget(self::EMAIL_CHANGE_CODE_SESSION_KEY);
                throw ValidationException::withMessages([
                    'email_change_code' => 'Too many failed attempts. Request a new verification code.',
                ]);
            }

            throw ValidationException::withMessages([
                'email_change_code' => 'Invalid verification code. Please try again.',
            ]);
        }
    }

    private function assertSuperAdminTransferCodeIsValid(Request $request, string $expectedCurrentEmail, string $expectedTargetEmail): void
    {
        $submittedCode = (string) $request->input('superadmin_transfer_code', '');
        $payload = (array) $request->session()->get(self::SUPERADMIN_TRANSFER_CODE_SESSION_KEY, []);

        if ($submittedCode === '') {
            throw ValidationException::withMessages([
                'superadmin_transfer_code' => 'Verification code is required to transfer Super Admin ownership.',
            ]);
        }

        if (!preg_match('/^\d{6}$/', $submittedCode)) {
            throw ValidationException::withMessages([
                'superadmin_transfer_code' => 'Verification code must be a 6-digit number.',
            ]);
        }

        $payloadCurrentEmail = strtolower((string) ($payload['current_email'] ?? ''));
        $payloadTargetEmail = strtolower((string) ($payload['target_email'] ?? ''));

        if (
            empty($payload['hash'])
            || empty($payload['expires_at'])
            || $payloadCurrentEmail === ''
            || $payloadTargetEmail === ''
            || $payloadCurrentEmail !== strtolower($expectedCurrentEmail)
            || $payloadTargetEmail !== strtolower($expectedTargetEmail)
        ) {
            throw ValidationException::withMessages([
                'superadmin_transfer_code' => 'Request a new transfer verification code and try again.',
            ]);
        }

        if ((int) $payload['expires_at'] < now()->timestamp) {
            $request->session()->forget(self::SUPERADMIN_TRANSFER_CODE_SESSION_KEY);
            throw ValidationException::withMessages([
                'superadmin_transfer_code' => 'Verification code expired. Request a new one and try again.',
            ]);
        }

        $attempts = (int) ($payload['attempts'] ?? 0);
        if ($attempts >= self::SUPERADMIN_TRANSFER_CODE_MAX_FAILED_ATTEMPTS) {
            $request->session()->forget(self::SUPERADMIN_TRANSFER_CODE_SESSION_KEY);
            throw ValidationException::withMessages([
                'superadmin_transfer_code' => 'Too many failed attempts. Request a new transfer verification code.',
            ]);
        }

        $submittedHash = hash('sha256', $submittedCode);
        if (!hash_equals((string) $payload['hash'], $submittedHash)) {
            $payload['attempts'] = $attempts + 1;
            $request->session()->put(self::SUPERADMIN_TRANSFER_CODE_SESSION_KEY, $payload);

            if ($payload['attempts'] >= self::SUPERADMIN_TRANSFER_CODE_MAX_FAILED_ATTEMPTS) {
                $request->session()->forget(self::SUPERADMIN_TRANSFER_CODE_SESSION_KEY);
                throw ValidationException::withMessages([
                    'superadmin_transfer_code' => 'Too many failed attempts. Request a new transfer verification code.',
                ]);
            }

            throw ValidationException::withMessages([
                'superadmin_transfer_code' => 'Invalid verification code. Please try again.',
            ]);
        }
    }

    private function sendEmailChangedNotice(string $recipientEmail, string $recipientName): void
    {
        try {
            $subject = 'SmartAttend account email change confirmation';
            $body = "This is a confirmation that your SmartAttend account email was changed.\n\n"
                . "If you did not perform this action, please reset your password immediately and contact support.";

            $sentViaBrevo = BrevoEmailService::sendTextEmail(
                $recipientEmail,
                $recipientName,
                $subject,
                $body
            );

            if (! $sentViaBrevo) {
                Mail::raw(
                    $body,
                    static function ($message) use ($recipientEmail, $recipientName, $subject): void {
                        $message
                            ->to($recipientEmail, $recipientName)
                            ->subject($subject);
                    }
                );
            }
        } catch (Throwable $e) {
            report($e);
        }
    }
}
