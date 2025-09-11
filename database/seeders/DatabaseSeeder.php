<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
	public function run(): void
	{
		$superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
		$adminRole = Role::firstOrCreate(['name' => 'Admin']);

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
		];
		foreach ($permissions as $perm) {
			Permission::firstOrCreate(['name' => $perm]);
		}

		$superAdminRole->givePermissionTo(Permission::all());
		$adminRole->givePermissionTo(['view reports','export reports','capture attendance','import attendance','manage interventions']);

		$super = User::firstOrCreate(
			['email' => 'superadmin@smartattend.local'],
			[
				'name' => 'Super Admin',
				'password' => Hash::make('password'),
			]
		);
		$super->syncRoles([$superAdminRole]);

		$admin = User::firstOrCreate(
			['email' => 'pedrohub@smartattend.local'],
			[
				'name' => 'PedroHub Admin',
				'password' => Hash::make('password'),
			]
		);
		$admin->syncRoles([$adminRole]);
	}
}
