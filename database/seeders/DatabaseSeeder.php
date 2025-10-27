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
		$teacherRole = Role::firstOrCreate(['name' => 'Teacher']);

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
		$teacherRole->givePermissionTo(['view reports','capture attendance']);

		$super = User::firstOrCreate(
			['email' => 'superadmin@smartattend.local'],
			[
				'name' => 'Super Admin',
				'password' => Hash::make('password'),
			]
		);
		$super->syncRoles([$superAdminRole]);

		$admin = User::firstOrCreate(
			['email' => 'admin@smartattend.local'],
			[
				'name' => 'PedroHub Admin',
				'password' => Hash::make('password'),
			]
		);
		$admin->syncRoles([$adminRole]);

		$teacher = User::firstOrCreate(
			['email' => 'teacher@smartattend.local'],
			[
				'name' => 'Teacher 1',
				'password' => Hash::make('password'),
			]
		);
		$teacher->syncRoles([$teacherRole]);

		// Seed sample data
		$this->call([
			DepartmentProgramSeeder::class,
			StudentSeeder::class,
		]);
	}
}
