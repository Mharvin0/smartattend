<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
	public function index()
	{
		// Exclude users with Teacher role - teachers are managed separately in the Teachers tab
		// Exclude soft-deleted (deactivated) users - they are shown in the Deactivated tab
		$users = User::with(['roles:name', 'department', 'optionalDepartment'])
			->whereDoesntHave('roles', function($query) {
				$query->where('name', 'Teacher');
			})
			->whereNull('deleted_at') // Only show active users
			->orderBy('name')
			->get(['id','name','email','department_id','optional_department_id']);
		
		// Get deactivated users count
		$deactivatedCount = User::with(['roles:name'])
			->whereDoesntHave('roles', function($query) {
				$query->where('name', 'Teacher');
			})
			->onlyTrashed()
			->count();
		
		return Inertia::render('Super/Users', [
			'users' => $users,
			'deactivatedCount' => $deactivatedCount,
			'roles' => ['Super Admin','Admin','CSDL'],
			'departments' => \App\Models\Department::orderBy('name')->get(['id', 'name']),
		]);
	}
	
	public function getDeactivated()
	{
		// Get only soft-deleted (deactivated) users
		$deactivatedUsers = User::with(['roles:name', 'department', 'optionalDepartment'])
			->whereDoesntHave('roles', function($query) {
				$query->where('name', 'Teacher');
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
		$user->restore();
		return back()->with('success', 'User reactivated successfully');
	}

	public function store(Request $request)
	{
		$validated = $request->validate([
			'name' => ['required','string','max:255'],
			'email' => ['required','email','max:255','unique:users,email'],
			'role' => ['required','in:Super Admin,Admin,CSDL'],
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
		return back()->with('success','User created');
	}

	public function update(Request $request, User $user)
	{
		$validated = $request->validate([
			'name' => ['required','string','max:255'],
			'email' => ['required','email','max:255','unique:users,email,'.$user->id],
			'password' => ['nullable','string','min:6'],
			'role' => ['required','in:Super Admin,Admin,CSDL'],
			'department_id' => ['nullable','exists:departments,id'],
			'optional_department_id' => ['nullable','exists:departments,id','different:department_id'],
		]);
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
		$user->syncRoles([$validated['role']]);
		return back()->with('success','User updated');
	}

	public function destroy(User $user)
	{
		// Prevent deactivating users with Teacher role - they are managed in the Teachers tab
		if ($user->hasRole('Teacher')) {
			return back()->withErrors(['message' => 'Cannot deactivate Teacher users. Please manage teachers in the Teachers tab.']);
		}
		
		// Soft delete (deactivate) instead of hard delete
		$user->delete();
		return back()->with('success','User deactivated successfully');
	}
}
