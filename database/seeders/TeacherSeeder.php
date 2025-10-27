<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        // Create Teacher role if it doesn't exist
        $teacherRole = Role::firstOrCreate(['name' => 'Teacher']);

        // Create teacher permissions if they don't exist
        $permissions = ['view reports', 'capture attendance'];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // Give permissions to teacher role
        $teacherRole->givePermissionTo($permissions);

        // Create teacher user if it doesn't exist
        $teacher = User::firstOrCreate(
            ['email' => 'teacher@smartattend.local'],
            [
                'name' => 'Teacher User',
                'password' => Hash::make('password'),
            ]
        );
        $teacher->syncRoles([$teacherRole]);

        $this->command->info('Teacher user created successfully!');
    }
}
