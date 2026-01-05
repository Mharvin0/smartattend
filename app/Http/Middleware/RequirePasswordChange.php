<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RequirePasswordChange
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            
            // Check if password needs to be changed (password_changed_at is null)
            // Allow access to the password change route itself
            if ($user->password_changed_at === null && !$request->routeIs('password.change.first-time') && !$request->routeIs('password.update.first-time')) {
                return redirect()->route('password.change.first-time');
            }
        }
        
        return $next($request);
    }
}
