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

        // Read second super admin credentials from env (with sensible defaults)
        $email = env('SECOND_SUPERADMIN_EMAIL', 'caramatmharvin@gmail.com');
        $name = env('SECOND_SUPERADMIN_NAME', 'Second Super Admin');
        $password = env('SECOND_SUPERADMIN_PASSWORD', 'Chryse1802');

        // Create or UPDATE the second super admin so credentials are always in sync with env
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'password_changed_at' => null,
            ]
        );

        $user->syncRoles([$superAdminRole]);
    }

    public function down(): void
    {
        // No automatic deletion of this account on rollback.
    }
};

