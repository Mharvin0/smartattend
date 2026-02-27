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

        // Create or update the "second" Super Admin with your details
        $email = env('SECOND_SUPERADMIN_EMAIL', 'caramatmharvin@gmail.com');
        $name = env('SECOND_SUPERADMIN_NAME', 'Second Super Admin');
        $password = env('SECOND_SUPERADMIN_PASSWORD', 'Chryse1802');

        // Handle the case where a user with this email might already exist,
        // including soft-deleted rows, to avoid unique constraint violations.
        $user = User::withTrashed()->where('email', $email)->first();

        if ($user) {
            if (method_exists($user, 'restore') && $user->trashed()) {
                $user->restore();
            }

            $user->name = $name;
            $user->password = Hash::make($password);
            $user->password_changed_at = null;
            $user->save();
        } else {
            $user = User::create([
                'email' => $email,
                'name' => $name,
                'password' => Hash::make($password),
                'password_changed_at' => null,
            ]);
        }

        // Make sure this user has the Super Admin role
        $user->syncRoles([$superAdminRole]);
    }

    public function down(): void
    {
        // Intentionally no-op:
        // We do not automatically delete Super Admin accounts on rollback.
    }
};

