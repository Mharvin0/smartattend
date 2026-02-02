<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        // Create roles + permissions (safe to run multiple times)
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);

        $permissions = [
            'view reports',
            'export reports',
            'capture attendance',
            'import attendance',
            'manage interventions',
            'manage sections',
            'manage subjects',
            'manage schedules',
            'manage users',
            'track student calls',
            'track home visits',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // Super Admin gets all permissions
        $superAdminRole->givePermissionTo(Permission::all());

        // Ensure there is at least one Super Admin user (default/primary account).
        // This does NOT send any email notifications.
        $exists = User::role('Super Admin')->exists();
        if ($exists) {
            return;
        }

        $email = env('DEFAULT_SUPERADMIN_EMAIL', 'superadmin@smartattend.local');
        $name = env('DEFAULT_SUPERADMIN_NAME', 'Super Admin');
        $password = env('DEFAULT_SUPERADMIN_PASSWORD', 'ChangeMe123!');

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'password_changed_at' => null, // force change on first login
            ]
        );

        $user->syncRoles([$superAdminRole]);
    }

    public function down(): void
    {
        // Intentionally no-op:
        // We do not want migrations rollback to delete production Super Admin accounts.
    }
};

