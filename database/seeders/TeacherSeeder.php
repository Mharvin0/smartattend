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
        $teacherRole = Role::firstOrCreate(['name' => 'Teacher']);

        $permissions = ['view reports', 'capture attendance'];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        $teacherRole->givePermissionTo($permissions);

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
