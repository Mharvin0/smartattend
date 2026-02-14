<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\AuditLogService;
use App\Services\SecurityAlertService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
            'password_changed_at' => now(),
        ]);

        AuditLogService::logSecurity(
            AuditLog::TYPE_PASSWORD_CHANGE,
            'User password changed successfully',
            AuditLog::SEVERITY_INFO
        );

        SecurityAlertService::notifyUserAndAdmins(
            'SmartAttend security alert: Password changed',
            "Your SmartAttend account password was changed successfully.\n\n"
            . "If this was not you, please reset your password immediately and contact support.",
            $request->user(),
            ['event' => 'password_changed'],
            AuditLog::SEVERITY_WARNING
        );

        return back();
    }
}
