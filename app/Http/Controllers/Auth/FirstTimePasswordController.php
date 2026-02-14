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
use Inertia\Inertia;
use Inertia\Response;

class FirstTimePasswordController extends Controller
{
    /**
     * Display the first-time password change form.
     */
    public function show(): Response
    {
        $user = auth()->user();
        
        // If password has already been changed, redirect to dashboard
        if ($user->password_changed_at !== null) {
            return $this->redirectToDashboard();
        }
        
        return Inertia::render('Auth/ChangePasswordFirstTime');
    }

    /**
     * Handle the first-time password change request.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        
        // If password has already been changed, redirect to dashboard
        if ($user->password_changed_at !== null) {
            return $this->redirectToDashboard();
        }
        
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
            'password_changed_at' => now(),
        ]);

        AuditLogService::logSecurity(
            AuditLog::TYPE_PASSWORD_CHANGE,
            'First-time password change completed',
            AuditLog::SEVERITY_INFO
        );

        SecurityAlertService::notifyUserAndAdmins(
            'SmartAttend security alert: Password changed',
            "Your SmartAttend account password was changed successfully.\n\n"
            . "If this was not you, please reset your password immediately and contact support.",
            $user,
            ['event' => 'first_time_password_changed'],
            AuditLog::SEVERITY_WARNING
        );

        return $this->redirectToDashboard()->with('success', 'Password changed successfully. You can now access the system.');
    }

    /**
     * Redirect user to their appropriate dashboard based on role.
     */
    private function redirectToDashboard(): RedirectResponse
    {
        $user = auth()->user();
        
        if ($user->hasRole('Super Admin')) {
            return redirect()->route('super.dashboard');
        } elseif ($user->hasRole('Admin')) {
            return redirect()->route('admin.dashboard');
        } elseif ($user->hasRole('CSDL')) {
            return redirect()->route('csdl.dashboard');
        } else {
            return redirect('/');
        }
    }
}
