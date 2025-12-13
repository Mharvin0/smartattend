<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if 'CSDL User' role exists
        $oldRole = DB::table('roles')->where('name', 'CSDL User')->first();
        $newRole = DB::table('roles')->where('name', 'CSDL')->first();
        
        if ($oldRole && !$newRole) {
            // Rename the role from 'CSDL User' to 'CSDL' in the roles table
            DB::table('roles')
                ->where('name', 'CSDL User')
                ->update(['name' => 'CSDL']);
        } elseif ($oldRole && $newRole) {
            // If both exist, migrate users from old role to new role, then delete old role
            $oldRoleId = $oldRole->id;
            $newRoleId = $newRole->id;
            
            // Get all users with the old role
            $usersWithOldRole = DB::table('model_has_roles')
                ->where('role_id', $oldRoleId)
                ->get();
            
            // Assign new role to users who had old role (if they don't already have it)
            foreach ($usersWithOldRole as $userRole) {
                $hasNewRole = DB::table('model_has_roles')
                    ->where('model_id', $userRole->model_id)
                    ->where('model_type', $userRole->model_type)
                    ->where('role_id', $newRoleId)
                    ->exists();
                
                if (!$hasNewRole) {
                    DB::table('model_has_roles')->insert([
                        'role_id' => $newRoleId,
                        'model_type' => $userRole->model_type,
                        'model_id' => $userRole->model_id,
                    ]);
                }
            }
            
            // Delete old role assignments
            DB::table('model_has_roles')->where('role_id', $oldRoleId)->delete();
            
            // Delete old role
            DB::table('roles')->where('id', $oldRoleId)->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rename the role back from 'CSDL' to 'CSDL User'
        DB::table('roles')
            ->where('name', 'CSDL')
            ->update(['name' => 'CSDL User']);
    }
};
