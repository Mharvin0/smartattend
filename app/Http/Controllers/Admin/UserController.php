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
		$users = User::with('roles:name')->orderBy('name')->get(['id','name','email']);
		return Inertia::render('Super/Users', [
			'users' => $users,
			'roles' => ['Super Admin','Admin','CSDL'],
		]);
	}

	public function store(Request $request)
	{
		$validated = $request->validate([
			'name' => ['required','string','max:255'],
			'email' => ['required','email','max:255','unique:users,email'],
			'password' => ['required','string','min:6'],
			'role' => ['required','in:Super Admin,Admin,CSDL'],
		]);
		$user = User::create([
			'name' => $validated['name'],
			'email' => $validated['email'],
			'password' => Hash::make($validated['password']),
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
		]);
		$user->name = $validated['name'];
		$user->email = $validated['email'];
		if (!empty($validated['password'])) {
			$user->password = Hash::make($validated['password']);
		}
		$user->save();
		$user->syncRoles([$validated['role']]);
		return back()->with('success','User updated');
	}

	public function destroy(User $user)
	{
		$user->delete();
		return back()->with('success','User deleted');
	}
}
