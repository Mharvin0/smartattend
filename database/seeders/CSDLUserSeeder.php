<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CSDLUserSeeder extends Seeder
{
    public function run(): void
    {
        $csdlUserRole = Role::firstOrCreate(['name' => 'CSDL']);

        $permissions = ['view reports', 'track student calls', 'track home visits'];
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        $csdlUserRole->givePermissionTo($permissions);

        $csdlUser = User::firstOrCreate(
            ['email' => 'csdl@smartattend.local'],
            [
                'name' => 'CSDL',
                'password' => Hash::make('password'),
            ]
        );
        $csdlUser->syncRoles([$csdlUserRole]);

        $this->command->info('CSDL created successfully!');
    }
}

