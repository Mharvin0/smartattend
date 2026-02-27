<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure the Super Admin role exists
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);

        // Target credentials for the primary Super Admin account.
        // These can be overridden via environment variables.
        $email = env('DEFAULT_SUPERADMIN_EMAIL', 'caramatmharvin@gmail.com');
        $name = env('DEFAULT_SUPERADMIN_NAME', 'Super Admin');
        $password = env('DEFAULT_SUPERADMIN_PASSWORD', 'chryse1802');

        // Prefer the existing Super Admin user if one already has the role
        $user = User::role('Super Admin')->first();

        // Fallback: try the original default email, if present
        if (! $user) {
            $user = User::where('email', 'superadmin@smartattend.local')->first();
        }

        if ($user) {
            // Update existing Super Admin to use the desired credentials
            $user->email = $email;
            $user->name = $name;
            $user->password = Hash::make($password);
            $user->password_changed_at = null; // force change on first login if app enforces it
            $user->save();
        } else {
            // If no Super Admin user exists at all, create one
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make($password),
                    'password_changed_at' => null,
                ]
            );
        }

        $user->syncRoles([$superAdminRole]);
    }

    public function down(): void
    {
        // No-op: we do NOT roll back Super Admin credential changes automatically.
    }
};

