<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\AccountCreatedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class UserController extends Controller
{
	public function index()
	{
		// Exclude users with Teacher role - teachers are managed separately in the Teachers tab
		// Exclude Super Admin - they don't need to see themselves in the list
		// Exclude soft-deleted (deactivated) users - they are shown in the Deactivated tab
		$users = User::with(['roles:name', 'department', 'optionalDepartment'])
			->whereDoesntHave('roles', function($query) {
				$query->where('name', 'Teacher');
			})
			->whereDoesntHave('roles', function($query) {
				$query->where('name', 'Super Admin');
			})
			->whereNull('deleted_at') // Only show active users
			->orderBy('name')
			->get(['id','name','email','department_id','optional_department_id']);
		
		// Get deactivated users count (only Admin + CSDL can be deactivated)
		$deactivatedCount = User::with(['roles:name'])
			->whereDoesntHave('roles', function($query) {
				$query->where('name', 'Teacher');
			})
			->whereHas('roles', function ($query) {
				$query->whereIn('name', ['Admin', 'CSDL']);
			})
			->onlyTrashed()
			->count();
		
		return Inertia::render('Super/Users', [
			'users' => $users,
			'deactivatedCount' => $deactivatedCount,
			// Super Admin should not be creatable/promotable from the Users tab UI.
			'roles' => ['Admin','CSDL'],
			'departments' => \App\Models\Department::orderBy('name')->get(['id', 'name']),
		]);
	}
	
	public function getDeactivated()
	{
		// Get only soft-deleted (deactivated) users
		// Only Admin + CSDL can be deactivated/reactivated (Super Admin cannot be deactivated)
		$deactivatedUsers = User::with(['roles:name', 'department', 'optionalDepartment'])
			->whereDoesntHave('roles', function($query) {
				$query->where('name', 'Teacher');
			})
			->whereHas('roles', function ($query) {
				$query->whereIn('name', ['Admin', 'CSDL']);
			})
			->onlyTrashed()
			->orderBy('deleted_at', 'desc')
			->get(['id','name','email','department_id','optional_department_id','deleted_at']);
		
		return response()->json([
			'success' => true,
			'users' => $deactivatedUsers,
		]);
	}
	
	public function restore($id)
	{
		$user = User::onlyTrashed()->findOrFail($id);
		
		// Only Admin + CSDL can be reactivated
		if (!$user->hasAnyRole(['Admin', 'CSDL'])) {
			return back()->withErrors(['message' => 'Only Admin and CSDL users can be reactivated.']);
		}
		
		$user->restore();
		return back()->with('success', 'User reactivated successfully');
	}

	public function store(Request $request)
	{
		$validated = $request->validate([
			'name' => ['required','string','max:255'],
			'email' => ['required','email','max:255','unique:users,email'],
			// Only Admin and CSDL accounts can be created from this screen.
			'role' => ['required','in:Admin,CSDL'],
			'department_id' => ['nullable','exists:departments,id'],
			'optional_department_id' => ['nullable','exists:departments,id','different:department_id'],
		]);
		
		// Auto-generate password: {currentYear}{FullName} (without spaces)
		$currentYear = date('Y');
		$fullNameWithoutSpaces = str_replace(' ', '', $validated['name']);
		$generatedPassword = $currentYear . $fullNameWithoutSpaces;
		
		$user = User::create([
			'name' => $validated['name'],
			'email' => $validated['email'],
			'password' => Hash::make($generatedPassword),
			'password_changed_at' => null, // Force password change on first login
			'department_id' => $validated['department_id'] ?? null,
			'optional_department_id' => $validated['optional_department_id'] ?? null,
		]);
		$user->syncRoles([$validated['role']]);

		// Notify newly created user via email (do not block creation if mail fails)
		try {
			$user->load(['department', 'optionalDepartment', 'program']);
			$creator = auth()->user();
			$creatorRole = $creator?->roles?->first()?->name;
			$user->notify(new AccountCreatedNotification(
				$generatedPassword,
				$validated['role'],
				$user->department?->name,
				$user->optionalDepartment?->name,
				$user->program?->name,
				$creator?->name,
				$creator?->email,
				$creatorRole
			));
		} catch (\Throwable $e) {
			\Log::warning('AccountCreatedNotification failed to send', [
				'user_id' => $user->id,
				'email' => $user->email,
				'error' => $e->getMessage(),
			]);
		}

		return back()->with('success','User created');
	}

	public function update(Request $request, User $user)
	{
		$rules = [
			'name' => ['required','string','max:255'],
			'email' => ['required','email','max:255','unique:users,email,'.$user->id],
			'password' => ['nullable','string','min:6'],
			'department_id' => ['nullable','exists:departments,id'],
			'optional_department_id' => ['nullable','exists:departments,id','different:department_id'],
		];

		// Super Admin should not be promotable via this UI. If editing an existing Super Admin,
		// keep the role unchanged (allow only "Super Admin", and make it optional).
		if ($user->hasRole('Super Admin')) {
			$rules['role'] = ['sometimes', 'in:Super Admin'];
		} else {
			$rules['role'] = ['required', 'in:Admin,CSDL'];
		}

		$validated = $request->validate($rules);

		$user->name = $validated['name'];
		$user->email = $validated['email'];
		if (!empty($validated['password'])) {
			$user->password = Hash::make($validated['password']);
		}
		if (isset($validated['department_id'])) {
			$user->department_id = $validated['department_id'];
		}
		if (isset($validated['optional_department_id'])) {
			$user->optional_department_id = $validated['optional_department_id'];
		}
		$user->save();

		// Only sync role if it's allowed to change from this screen.
		if (! $user->hasRole('Super Admin')) {
			$user->syncRoles([$validated['role']]);
		}
		return back()->with('success','User updated');
	}

	public function destroy(User $user)
	{
		// Prevent deactivating users with Teacher role - they are managed in the Teachers tab
		if ($user->hasRole('Teacher')) {
			return back()->withErrors(['message' => 'Cannot deactivate Teacher users. Please manage teachers in the Teachers tab.']);
		}
		
		// Only Admin + CSDL can be deactivated (Super Admin cannot be deactivated)
		if (!$user->hasAnyRole(['Admin', 'CSDL'])) {
			return back()->withErrors(['message' => 'Only Admin and CSDL users can be deactivated. Super Admin users cannot be deactivated.']);
		}
		
		// Soft delete (deactivate) instead of hard delete
		$user->delete();
		return back()->with('success','User deactivated successfully');
	}

	/**
	 * Permanently delete a deactivated (soft-deleted) user.
	 * Only Admin + CSDL users can be permanently deleted.
	 */
	public function forceDestroy($id)
	{
		$user = User::onlyTrashed()->with('roles:name')->findOrFail($id);

		// Prevent deleting Super Admin (and any non-Admin/CSDL)
		if (! $user->hasAnyRole(['Admin', 'CSDL'])) {
			return back()->withErrors(['message' => 'Only Admin and CSDL users can be permanently deleted.']);
		}

		DB::transaction(function () use ($user) {
			// Clean up role/permission pivot records to avoid orphans
			DB::table('model_has_roles')
				->where('model_type', User::class)
				->where('model_id', $user->id)
				->delete();

			DB::table('model_has_permissions')
				->where('model_type', User::class)
				->where('model_id', $user->id)
				->delete();

			// Clean up auth tokens/reset tokens (best-effort)
			if (Schema::hasTable('personal_access_tokens')) {
				DB::table('personal_access_tokens')
					->where('tokenable_type', User::class)
					->where('tokenable_id', $user->id)
					->delete();
			}

			if (Schema::hasTable('password_reset_tokens')) {
				DB::table('password_reset_tokens')
					->where('email', $user->email)
					->delete();
			}

			$user->forceDelete();
		});

		return back()->with('success', 'User permanently deleted successfully');
	}
}
