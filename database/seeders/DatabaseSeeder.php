<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
	public function run(): void
	{
		// NOTE:
		// Seeding should NOT destroy production data by default.
		// full reset for local demo/testing, set:
		//   SEED_DESTRUCTIVE=true
		// re-run `php artisan db:seed`.
		if (filter_var(env('SEED_DESTRUCTIVE', false), FILTER_VALIDATE_BOOL)) {
			$this->resetAcademicData();
			$this->resetUsers();
		}

		$superAdminRole = Role::firstOrCreate(['name' => 'Super Admin']);
		$adminRole = Role::firstOrCreate(['name' => 'Admin']);
		$csdlUserRole = Role::firstOrCreate(['name' => 'CSDL']);

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

		$superAdminRole->givePermissionTo(Permission::all());
		$adminRole->givePermissionTo(['view reports','export reports','capture attendance','import attendance','manage interventions']);
		$csdlUserRole->givePermissionTo(['view reports','track home visits']);

		// Demo users are optional and OFF by default. Enable with:
		//   SEED_DEMO_USERS=true
		if (filter_var(env('SEED_DEMO_USERS', false), FILTER_VALIDATE_BOOL)) {
			$admin = User::firstOrCreate(
				['email' => 'admin@smartattend.local'],
				[
					'name' => 'PedroHub Admin',
					'password' => Hash::make('password'),
					'password_changed_at' => null,
				]
			);
			$admin->syncRoles([$adminRole]);

			$csdlUser = User::firstOrCreate(
				['email' => 'csdl@smartattend.local'],
				[
					'name' => 'CSDL User',
					'password' => Hash::make('password'),
					'password_changed_at' => null,
				]
			);
			$csdlUser->syncRoles([$csdlUserRole]);
		}

		$this->call([
			DepartmentProgramSeeder::class,
			StudentSeeder::class,
			ManagementDataSeeder::class,
		]);
	}

	/**
	 * Clear existing users and related role/permission assignments so tests
	 * always start with a clean slate.
	 */
	private function resetUsers(): void
	{
		$this->disableForeignKeyChecks();

		foreach ([
			'model_has_roles',
			'model_has_permissions',
			'password_reset_tokens',
			'personal_access_tokens',
			'users',
		] as $table) {
			$this->truncateTableIfExists($table);
		}

		$this->enableForeignKeyChecks();
	}

	/**
	 * Clear student/section/subject/schedule data but leave departments/programs.
	 */
	private function resetAcademicData(): void
	{
		$this->disableForeignKeyChecks();

		foreach ([
			'weekly_summaries',
			'attendance_histories',
			'attendance_records',
			'interventions',
			'management_remarks',
			'teacher_sections',
			'schedules',
			'subjects',
			'students',
			'sections',
		] as $table) {
			$this->truncateTableIfExists($table);
		}

		$this->enableForeignKeyChecks();
	}

	private function disableForeignKeyChecks(): void
	{
		DB::statement('SET FOREIGN_KEY_CHECKS=0;');
	}

	private function enableForeignKeyChecks(): void
	{
		DB::statement('SET FOREIGN_KEY_CHECKS=1;');
	}

	private function truncateTableIfExists(string $table): void
	{
		if (Schema::hasTable($table)) {
			DB::table($table)->truncate();
		}
	}
}
